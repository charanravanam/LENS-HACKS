/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Map from "./components/Map";
import { analyzeQuery, fetchActiveEvents } from "./services/gemini";
import { SearchResult, MapLayer } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { Globe, Info, X, Check, Activity, MapPin } from "lucide-react";

const INITIAL_LAYERS: MapLayer[] = [
  {
    id: 'precipitation',
    name: 'Precipitation (GPM)',
    visible: false,
    type: 'raster',
    url: '/api/nasa/gibs/GPM_3IMERGHH_Precipitation_Amount/default/{TIME}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png',
    description: 'Global Precipitation Measurement (GPM) hourly precipitation amount.'
  },
  {
    id: 'wildfire',
    name: 'Wildfire Hotspots',
    visible: false,
    type: 'raster',
    url: '/api/nasa/gibs/MODIS_Terra_Thermal_Anomalies_Day/default/{TIME}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png',
    description: 'Active fire detections from MODIS Terra satellite.'
  },
  {
    id: 'vegetation',
    name: 'Vegetation Index (NDVI)',
    visible: false,
    type: 'raster',
    url: '/api/nasa/gibs/MODIS_Terra_L3_NDVI_Monthly/default/{TIME}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png',
    description: 'Normalized Difference Vegetation Index (NDVI) from MODIS.'
  },
  {
    id: 'glacier-boundaries',
    name: 'Glacier Boundaries',
    visible: false,
    type: 'geojson',
    url: 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json', // Placeholder for glacier geojson
    description: 'RGI Glacier boundaries for the Himalayan region.'
  },
  {
    id: 'temp-anomalies',
    name: 'Temperature Anomalies',
    visible: false,
    type: 'raster',
    url: '/api/nasa/gibs/MODIS_Terra_L3_Land_Surface_Temp_8Day_Day/default/{TIME}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png',
    description: 'Land surface temperature anomalies.',
    timeEnabled: true
  }
];

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [layers, setLayers] = useState<MapLayer[]>(INITIAL_LAYERS);
  const [activeEvents, setActiveEvents] = useState<any[]>([]);
  const [projection, setProjection] = useState<'globe' | 'mercator'>('globe');
  const [showStreetView, setShowStreetView] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 20]);

  useEffect(() => {
    const loadEvents = async () => {
      const events = await fetchActiveEvents();
      setActiveEvents(events);
    };
    loadEvents();
  }, []);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setShowWelcome(false);
    try {
      const data = await analyzeQuery(query);
      setResults(data);

      // Auto-enable layers for Himalayan/Glacier searches
      if (query.toLowerCase().includes('himalaya') || query.toLowerCase().includes('glacier')) {
        setLayers(prev => prev.map(l => {
          if (['glacier-boundaries', 'temp-anomalies'].includes(l.id)) {
            return { ...l, visible: true };
          }
          return l;
        }));
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLayer = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0A0A0A] font-sans">
      {/* Main Map Area */}
      <main className="absolute inset-0 z-0">
        <Map 
          activeLayers={layers.filter(l => l.visible)} 
          projection={projection}
          targetLocation={results?.location}
          activeEvents={activeEvents}
          onMove={(center) => setMapCenter(center)}
        />
      </main>

      {/* Floating Sidebar / Search Bar (Top Left) */}
      <div className="absolute top-6 left-6 z-30 pointer-events-auto">
        <Sidebar 
          onSearch={handleSearch} 
          isLoading={isLoading} 
          results={results} 
        />
      </div>

      {/* Welcome Overlay */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="absolute inset-0 z-20 flex items-center justify-center p-8 bg-black/40 backdrop-blur-sm"
            >
              <div className="max-w-2xl w-full bg-[#1A1A1A] border border-white/10 rounded-2xl p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-600" />
                
                <button 
                  onClick={() => setShowWelcome(false)}
                  className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center shrink-0 border border-blue-500/30">
                    <Info className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Welcome to EarthLens AI</h2>
                    <p className="text-white/60 leading-relaxed mb-8">
                      The intelligent discovery platform for NASA Earth Science data. 
                      Instead of searching through thousands of datasets manually, 
                      simply describe the natural event you want to study.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-6 mb-10">
                      <div className="space-y-2">
                        <h4 className="text-xs font-mono text-blue-400 uppercase tracking-widest">Semantic Discovery</h4>
                        <p className="text-xs text-white/40">Maps natural language to scientific environmental signals.</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xs font-mono text-blue-400 uppercase tracking-widest">Research Ready</h4>
                        <p className="text-xs text-white/40">Generates analysis-ready pipelines and dataset previews.</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setShowWelcome(false)}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_30px_rgba(37,99,235,0.2)]"
                    >
                      Start Exploring
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Map Controls Overlay (Top Right) */}
        <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-3">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded-lg flex flex-col gap-2">
            <button 
              onClick={() => setProjection(prev => prev === 'globe' ? 'mercator' : 'globe')}
              className={cn(
                "p-2 rounded transition-colors",
                projection === 'globe' ? "bg-blue-600 text-white" : "text-white/60 hover:text-white hover:bg-white/10"
              )}
              title={projection === 'globe' ? "Switch to 2D View" : "Switch to Globe View"}
            >
              <Globe className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowStreetView(true)}
              className="p-2 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
              title="Open Street View"
            >
              <MapPin className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Street View Modal */}
        <AnimatePresence>
          {showStreetView && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-black/60 backdrop-blur-md"
            >
              <div className="relative w-full h-full max-w-5xl bg-[#1A1A1A] rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#1A1A1A]">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    <h3 className="text-sm font-semibold text-white">Ground Level Observation (Street View)</h3>
                  </div>
                  <button 
                    onClick={() => setShowStreetView(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 bg-black">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/streetview?key=${process.env.GOOGLE_MAPS_API_KEY}&location=${results?.location?.lat || mapCenter[1]},${results?.location?.lng || mapCenter[0]}&heading=0&pitch=0&fov=90`}
                  />
                </div>
                <div className="p-3 bg-[#1A1A1A] border-t border-white/10 text-[10px] text-white/30 font-mono text-center uppercase tracking-widest">
                  Powered by Google Maps Platform
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data Status (Bottom Right - Shifted up to avoid Mapbox controls) */}
        <div className="absolute bottom-24 right-6 z-10">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-[#141414] bg-blue-500/20 flex items-center justify-center overflow-hidden">
                  <img src={`https://picsum.photos/seed/nasa${i}/24/24`} alt="Source" className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">6,000+ NASA Datasets Indexed</span>
          </div>
        </div>
    </div>
  );
}

import { cn } from "./lib/utils";
