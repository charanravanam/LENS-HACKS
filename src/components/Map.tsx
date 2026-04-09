import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';
import { MapLayer } from '../types';
import { AlertCircle } from 'lucide-react';

// Use environment variable with a fallback
const MAPBOX_TOKEN = process.env.VITE_MAPBOX_TOKEN || ''; 

interface MapProps {
  center?: [number, number];
  zoom?: number;
  activeLayers: MapLayer[];
  targetLocation?: {
    lat: number;
    lng: number;
    zoom?: number;
  };
  activeEvents?: any[];
}

export default function Map({ center = [0, 20], zoom = 1.5, activeLayers, targetLocation, activeEvents = [] }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const eventMarkers = useRef<mapboxgl.Marker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (map.current) return; 
    if (!mapContainer.current) return;

    if (!MAPBOX_TOKEN) {
      setError("Mapbox Access Token is missing. Please provide VITE_MAPBOX_TOKEN in your environment variables.");
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    if (!mapboxgl.supported()) {
      setError("Mapbox GL is not supported by this browser.");
      return;
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: center,
        zoom: zoom,
        projection: 'globe',
        antialias: true
      });

      map.current.on('load', () => {
        setIsLoaded(true);
      });

      map.current.on('idle', () => {
        setIsLoaded(true);
      });

      map.current.on('error', (e) => {
        if (e.error?.message?.includes('invalid Mapbox access token')) {
          setError("Invalid Mapbox access token. Please check your VITE_MAPBOX_TOKEN.");
        }
      });

      map.current.on('style.load', () => {
        map.current?.setFog({
          color: 'rgb(186, 210, 247)', 
          'high-color': 'rgb(36, 92, 223)', 
          'horizon-blend': 0.02, 
          'space-color': 'rgb(11, 11, 25)', 
          'star-intensity': 0.6 
        });
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    } catch (e) {
      console.error("Mapbox initialization failed:", e);
      setError("Failed to initialize Mapbox.");
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Handle Target Location Changes
  useEffect(() => {
    if (!map.current || !targetLocation) return;

    map.current.flyTo({
      center: [targetLocation.lng, targetLocation.lat],
      zoom: targetLocation.zoom || 5,
      essential: true,
      duration: 3000
    });

    // Add or update marker
    if (marker.current) {
      marker.current.setLngLat([targetLocation.lng, targetLocation.lat]);
    } else {
      const el = document.createElement('div');
      el.className = 'pulsing-marker';
      
      marker.current = new mapboxgl.Marker(el)
        .setLngLat([targetLocation.lng, targetLocation.lat])
        .addTo(map.current);
    }
  }, [targetLocation]);

  // Handle Active Events (EONET)
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    // Clear existing event markers
    eventMarkers.current.forEach(m => m.remove());
    eventMarkers.current = [];

    activeEvents.forEach(event => {
      const geometry = event.geometry?.[0];
      if (!geometry || geometry.type !== 'Point') return;

      const [lng, lat] = geometry.coordinates;
      
      const el = document.createElement('div');
      el.className = 'event-marker';
      el.title = event.title;
      
      // Add popup
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-2 bg-[#1A1A1A] text-white rounded shadow-xl border border-white/10">
            <h4 class="text-xs font-bold mb-1">${event.title}</h4>
            <p class="text-[10px] text-white/60">${event.categories?.[0]?.title || 'Natural Event'}</p>
          </div>
        `);

      const m = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);
      
      eventMarkers.current.push(m);
    });
  }, [activeEvents, isLoaded]);

  // Handle Layer Changes
  useEffect(() => {
    if (!map.current || !isLoaded) return;

    const currentMap = map.current;

    const updateLayers = () => {
      // First, identify layers that should be removed
      const activeIds = activeLayers.map(l => `layer-${l.id}`);
      const currentLayers = currentMap.getStyle().layers || [];
      
      currentLayers.forEach(l => {
        if (l.id.startsWith('layer-') && !activeIds.includes(l.id) && !l.id.endsWith('-glow') && !l.id.endsWith('-outline')) {
          const baseId = l.id.replace('layer-', '');
          currentMap.removeLayer(l.id);
          if (currentMap.getLayer(`layer-${baseId}-outline`)) currentMap.removeLayer(`layer-${baseId}-outline`);
          if (currentMap.getLayer(`layer-${baseId}-glow`)) currentMap.removeLayer(`layer-${baseId}-glow`);
          if (currentMap.getSource(`source-${baseId}`)) currentMap.removeSource(`source-${baseId}`);
        }
      });

      // Then, add or update active layers
      activeLayers.forEach(layer => {
        const sourceId = `source-${layer.id}`;
        const layerId = `layer-${layer.id}`;

        if (currentMap.getLayer(layerId)) return; // Already exists

        if (layer.type === 'raster') {
          // Use a fixed recent date for raster layers instead of {TIME}
          const url = layer.url.replace('{TIME}', '2024-06-01');

          currentMap.addSource(sourceId, {
            type: 'raster',
            tiles: [url],
            tileSize: 256
          });
          currentMap.addLayer({
            id: layerId,
            type: 'raster',
            source: sourceId,
            paint: { 'raster-opacity': 0.7 }
          });
        }

        if (layer.type === 'geojson' && layer.id === 'glacier-boundaries') {
          // Static high-quality glacier representation
          const centerLng = 86.9250;
          const centerLat = 27.9881;
          const points = 16;
          const baseCoords: [number, number][] = [];
          for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const radius = 0.015 + (Math.sin(angle * 3) * 0.005) + (Math.cos(angle * 5) * 0.003);
            baseCoords.push([
              centerLng + Math.cos(angle) * radius,
              centerLat + Math.sin(angle) * radius
            ]);
          }

          const geojson: any = {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [baseCoords]
            }
          };

          currentMap.addSource(sourceId, {
            type: 'geojson',
            data: geojson
          });
          
          currentMap.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': '#ffffff',
              'fill-opacity': 0.6
            }
          });

          currentMap.addLayer({
            id: `${layerId}-outline`,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': '#ffffff',
              'line-width': 2
            }
          });
        }
      });
    };

    updateLayers();
  }, [activeLayers, isLoaded]);

  return (
    <div className="relative w-full h-full bg-[#0A0A0A]">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      
      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-8 bg-black/80 backdrop-blur-md z-50">
          <div className="max-w-md w-full bg-[#1A1A1A] border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">Map Configuration Error</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-8">
              {error}
            </p>
            <div className="space-y-4">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">How to fix</p>
              <div className="text-left bg-black/40 p-4 rounded-lg border border-white/5 text-xs text-white/50 space-y-2">
                <p>1. Go to <a href="https://mapbox.com" target="_blank" className="text-blue-400 hover:underline">mapbox.com</a> and create a free account.</p>
                <p>2. Copy your <b>Public Access Token</b>.</p>
                <p>3. Add it to your project secrets as <code className="text-blue-400">VITE_MAPBOX_TOKEN</code>.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fallback if map fails to load */}
      {!error && !isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-[#0A0A0A] z-40">
          <div className="text-center">
            <div className="w-32 h-32 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4 mx-auto" />
            <p className="text-blue-400 font-mono text-xs uppercase tracking-widest">Initializing Global Feed...</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-10 bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-lg text-xs text-white/70 font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          LIVE EARTH OBSERVATION FEED
        </div>
      </div>
    </div>
  );
}
