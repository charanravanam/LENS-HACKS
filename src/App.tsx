/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Map from "./components/Map";
import { 
  analyzeQuery, 
  fetchActiveEvents, 
  analyzeLocation, 
  fetchLocationIntelligence, 
  fetchChangeDetection 
} from "./services/gemini";
import { 
  SearchResult, 
  MapLayer, 
  LocationIntelligence, 
  ChangeDetectionResult 
} from "./types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Globe, 
  X, 
  Activity, 
  MapPin, 
  LayoutDashboard, 
  TrendingUp, 
  Database,
  Radio,
  Cpu,
  ShieldCheck,
  AlertOctagon,
  Sparkles
} from "lucide-react";
import { cn } from "./lib/utils";

const INITIAL_LAYERS: MapLayer[] = [
  {
    id: 'precipitation',
    name: 'Precipitation (GPM)',
    visible: false,
    type: 'raster',
    url: '/api/nasa/gibs/GPM_3IMERGHH_Precipitation_Amount/default/{TIME}/GoogleMapsCompatible_Level5/{z}/{y}/{x}.png',
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
    id: 'temp-anomalies',
    name: 'Temperature Anomalies',
    visible: false,
    type: 'raster',
    url: '/api/nasa/gibs/MODIS_Terra_L3_Land_Surface_Temp_8Day_Day/default/{TIME}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png',
    description: 'Land surface temperature anomalies.',
    timeEnabled: true
  }
];

const PREBUILT_COORDS: Record<string, { lat: number; lng: number }> = {
  himalaya: { lat: 27.9881, lng: 86.9250 },
  amazon: { lat: -3.4653, lng: -62.2159 },
  arctic: { lat: 75.0000, lng: -40.0000 },
  india: { lat: 19.0760, lng: 72.8777 }
};

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFastMode, setIsFastMode] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [layers, setLayers] = useState<MapLayer[]>(INITIAL_LAYERS);
  const [activeEvents, setActiveEvents] = useState<any[]>([]);
  const [projection, setProjection] = useState<'globe' | 'mercator'>('globe');
  const [showStreetView, setShowStreetView] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 20]);
  const [targetLocation, setTargetLocation] = useState<{lat: number; lng: number; zoom?: number} | null>(null);
  const [isRotating, setIsRotating] = useState(true);

  // Advanced Copilot metrics
  const [locationIntel, setLocationIntel] = useState<LocationIntelligence | null>(null);
  const [changeDetection, setChangeDetection] = useState<ChangeDetectionResult | null>(null);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  // Dashboard drawer visual toggler
  const [showDashboard, setShowDashboard] = useState(true);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      const events = await fetchActiveEvents();
      setActiveEvents(events);
    };
    loadEvents();
  }, []);

  // Set default layers depending on research context
  const autoConfigureLayersForTopic = (query: string) => {
    const q = query.toLowerCase();
    setLayers(prev => prev.map(l => {
      if (q.includes("glacier") || q.includes("himalaya") || q.includes("ice") || q.includes("cold") || q.includes("arctic")) {
        return { ...l, visible: ["glacier-boundaries", "temp-anomalies"].includes(l.id) };
      }
      if (q.includes("deforestation") || q.includes("amazon") || q.includes("forest") || q.includes("vegetation") || q.includes("ndvi")) {
        return { ...l, visible: ["vegetation", "temp-anomalies"].includes(l.id) };
      }
      if (q.includes("fire") || q.includes("smoke") || q.includes("burning") || q.includes("wildfire")) {
        return { ...l, visible: ["wildfire", "temp-anomalies"].includes(l.id) };
      }
      if (q.includes("drought") || q.includes("water") || q.includes("rain") || q.includes("precipitation") || q.includes("flood")) {
        return { ...l, visible: ["precipitation", "vegetation"].includes(l.id) };
      }
      return l;
    }));
  };

  const handleSearch = async (query: string) => {
    setIsSidebarMinimized(false);
    setIsFastMode(false);
    setIsLoading(true);
    setShowWelcome(false);
    setResults(null);
    setLocationIntel(null);
    setChangeDetection(null);
    setActiveDemo(null);
    setIsRotating(false);
    setShowDashboard(true);
    
    try {
      const data = await analyzeQuery(query);
      setResults(data);
      autoConfigureLayersForTopic(query);

      if (data.location) {
        const lat = data.location.lat;
        const lng = data.location.lng;
        setTargetLocation({ lat, lng, zoom: 6 });
        setCoordinates({ lat, lng });

        // Concurrent pre-fetches for location insights and historical timeline
        const [intelResult, changeResult] = await Promise.all([
          fetchLocationIntelligence(lat, lng),
          fetchChangeDetection(lat, lng)
        ]);

        setLocationIntel(intelResult);
        setChangeDetection(changeResult);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setIsSidebarMinimized(false);
    setIsFastMode(true);
    setIsLoading(true);
    setShowWelcome(false);
    setResults(null);
    setLocationIntel(null);
    setChangeDetection(null);
    setActiveDemo(null);
    setTargetLocation({ lat, lng, zoom: 8 });
    setCoordinates({ lat, lng });
    setIsRotating(false);
    setShowDashboard(true);

    try {
      const start = Date.now();
      // Direct concurrent fetches with fast parameter enabled
      const [searchData, intelResult, changeResult] = await Promise.all([
        analyzeLocation(lat, lng, true),
        fetchLocationIntelligence(lat, lng, true),
        fetchChangeDetection(lat, lng, true)
      ]);

      // Enforce physical uplink handshake window baseline of 1.5s
      const elapsed = Date.now() - start;
      const minDuration = 1500;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }

      setResults(searchData);
      setLocationIntel(intelResult);
      setChangeDetection(changeResult);

      // Auto toggle layers based on active risks
      const maxRisk = Object.entries(intelResult.riskIndicators).reduce(
        (a, b) => b[1] > a[1] ? b : a
      );
      setLayers(prev => prev.map(l => {
        if (maxRisk[0] === "wildfire") return { ...l, visible: l.id === "wildfire" };
        if (maxRisk[0] === "deforestation") return { ...l, visible: l.id === "vegetation" };
        if (maxRisk[0] === "waterStress") return { ...l, visible: l.id === "precipitation" };
        if (maxRisk[0] === "warming") return { ...l, visible: l.id === "temp-anomalies" };
        return l;
      }));
    } catch (error) {
      console.error("Location analysis failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunDemo = async (demoId: string) => {
    const coords = PREBUILT_COORDS[demoId];
    if (!coords) return;

    setIsSidebarMinimized(false);
    setIsFastMode(true);
    setIsLoading(true);
    setShowWelcome(false);
    setActiveDemo(demoId);
    setResults(null);
    setLocationIntel(null);
    setChangeDetection(null);
    setTargetLocation({ lat: coords.lat, lng: coords.lng, zoom: 6 });
    setCoordinates(coords);
    setIsRotating(false);
    setShowDashboard(true);

    try {
      const start = Date.now();
      autoConfigureLayersForTopic(demoId);
      
      const [searchData, intelResult, changeResult] = await Promise.all([
        analyzeQuery(`Holographic assessment of ${demoId} environmental changes`, true),
        fetchLocationIntelligence(coords.lat, coords.lng, true),
        fetchChangeDetection(coords.lat, coords.lng, true)
      ]);

      const elapsed = Date.now() - start;
      const minDuration = 1500;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }

      setResults(searchData);
      setLocationIntel(intelResult);
      setChangeDetection(changeResult);
    } catch (error) {
      console.error("Demo target run failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLayer = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#07070a] font-sans text-white/90">
      
      {/* Background Satellite Map Canvas */}
      <main className="absolute inset-0 z-0">
        <Map 
          activeLayers={layers.filter(l => l.visible)} 
          projection={projection}
          targetLocation={targetLocation}
          activeEvents={activeEvents}
          onMove={(center) => setMapCenter(center)}
          onClick={handleMapClick}
          rotationEnabled={isRotating}
        />
      </main>

      {/* Top Banner Ribbon: Mission Alert & Status Feed */}
      <div className="absolute top-4 left-[416px] right-[100px] z-20 pointer-events-none hidden lg:flex items-center justify-between bg-black/70 backdrop-blur-md px-4 py-2 border border-white/5 rounded-full select-none">
        <div className="flex items-center gap-3">
          <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span className="text-[9px] font-mono tracking-wider font-bold">
            SATELLITE STATUS FEED:
          </span>
          <span className="text-[10px] text-emerald-400 font-mono tracking-tight animate-pulse flex items-center gap-1.5 leading-none">
            ● SYSTEM_ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-4 text-[9px] font-mono text-white/40">
          <span>ORBITAL ANGLE: {mapCenter[0].toFixed(2)}°E, {mapCenter[1].toFixed(2)}°N</span>
          <span>SENSERS INDEXED: 6,104</span>
        </div>
      </div>

      {/* Floating Left Panel: AI Control Sidebar */}
      <div className="absolute top-6 left-6 bottom-6 z-30 pointer-events-auto flex flex-col justify-start">
        <Sidebar 
          onSearch={handleSearch} 
          isLoading={isLoading} 
          results={results} 
          isMinimized={isSidebarMinimized}
          onToggleMinimize={setIsSidebarMinimized}
          isFastMode={isFastMode}
          locationIntel={locationIntel}
          changeDetection={changeDetection}
        />
      </div>

      {/* Floating Toggle Controls Overlay & Layer Managers (Top Right) */}
      <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-3 pointer-events-auto">
        
        {/* Main Controls card */}
        <div className="bg-black/85 backdrop-blur-xl border border-white/10 p-2.5 rounded-2xl flex flex-col gap-2.5 shadow-2xl">
          <button 
            onClick={() => setProjection(prev => prev === 'globe' ? 'mercator' : 'globe')}
            className={cn(
              "p-2.5 rounded-xl transition-all border border-white/5 cursor-pointer",
              projection === 'globe' ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]" : "text-white/60 hover:text-white hover:bg-white/10"
            )}
            title={projection === 'globe' ? "Switch to 2D View" : "Switch to Globe View"}
          >
            <Globe className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowStreetView(true)}
            className="p-2.5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-white/60 hover:text-white cursor-pointer"
            title="Open Street View"
          >
            <MapPin className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Ground Observation Street View Modal overlay */}
      <AnimatePresence>
        {showStreetView && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-black/60 backdrop-blur-md"
          >
            <div className="relative w-full h-full max-w-5xl bg-[#121212] rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col">
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#121212]">
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
                  src={`https://www.google.com/maps/embed/v1/streetview?key=${process.env.GOOGLE_MAPS_API_KEY}&location=${coordinates?.lat || results?.location?.lat || mapCenter[1]},${coordinates?.lng || results?.location?.lng || mapCenter[0]}&heading=0&pitch=0&fov=90`}
                />
              </div>
              <div className="p-3 bg-[#121212] border-t border-white/10 text-[10px] text-white/30 font-mono text-center uppercase tracking-widest">
                Powered by Google Maps Platform
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Welcome Onboarding Screen */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/65 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 1.05 }}
              className="max-w-2xl w-full bg-[#121212] border border-white/10 rounded-2xl p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
              
              <button 
                onClick={() => setShowWelcome(false)}
                className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center shrink-0 border border-blue-500/30">
                  <LayoutDashboard className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white mb-2 tracking-tight">EarthLens AI</h2>
                  <h3 className="text-xs font-mono tracking-widest uppercase text-blue-400 mb-6 font-bold">
                    AI Earth & Space Research Copilot
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-8">
                    An intelligent AI scientist that investigates planetary shifts. Describe any geographic environmental event to cross-examine multiple NASA satellite variables, run automated change detection timeline scans, locate thermal anomalies, and compile publication-grade research reports.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-6 mb-10">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-mono text-blue-400 uppercase tracking-widest font-black flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 animate-pulse" /> Multimodal Fusion
                      </h4>
                      <p className="text-xs text-white/40">Synchronizes temperatures, indices, precipitation models across timeline variables.</p>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-mono text-blue-400 uppercase tracking-widest font-black flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5" /> High-Fidelity Prebuilts
                      </h4>
                      <p className="text-xs text-white/40">Preconfigured investigation target nodes mapping critical ecological risk matrices.</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowWelcome(false)}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] tracking-wide uppercase font-mono text-xs cursor-pointer"
                  >
                    Deploy Intelligence Copilot
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
