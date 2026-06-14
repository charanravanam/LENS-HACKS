import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Sparkles, 
  Database, 
  BookOpen, 
  Download, 
  X, 
  ChevronRight, 
  Loader2, 
  MessageSquare, 
  Compass, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  Zap,
  CheckCircle,
  HelpCircle,
  BarChart2,
  FileText
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/utils";
import { Dataset, SearchResult, LocationIntelligence, ChangeDetectionResult } from "../types";
import { generateNotebook } from "../lib/notebookGenerator";
import { fetchAgentQuery } from "../services/gemini";
import ResearchLoading from "./ResearchLoading";

const getDatasetWebpageUrl = (datasetId: string) => {
  const conceptMap: Record<string, string> = {
    "LPDAAC-MOD14A1-V061": "https://search.earthdata.nasa.gov/search?q=MOD14A1&ok=MOD14A1",
    "LPDAAC-MOD13A1-V061": "https://search.earthdata.nasa.gov/search?q=MOD13A1&ok=MOD13A1",
    "GESDISC-GPM-3IMERGHH-V06": "https://search.earthdata.nasa.gov/search?q=3IMERGHH&ok=3IMERGHH",
    "LPDAAC-MOD11A2-V061": "https://search.earthdata.nasa.gov/search?q=MOD11A2&ok=MOD11A2",
    "NSIDC-0051-V1": "https://search.earthdata.nasa.gov/search?q=NSIDC-0051",
    "ORNLDAAC-GLACIER-RGI": "https://search.earthdata.nasa.gov/search?q=RGI",
    "SEDAC-GRUMP-v1": "https://search.earthdata.nasa.gov/search?q=GRUMP"
  };
  return conceptMap[datasetId] || `https://search.earthdata.nasa.gov/search?q=${encodeURIComponent(datasetId)}`;
};

const getRelatedFilesForDataset = (datasetId: string) => {
  const fileRegistry: Record<string, { name: string; size: string; type: string; url: string }[]> = {
    "LPDAAC-MOD14A1-V061": [
      { name: "MOD14A1_Thermals_Product_Catalog.html", size: "12.4 MB", type: "User Guide", url: "https://lpdaac.usgs.gov/products/mod14a1v061/" },
      { name: "MOD14A1_Thermal_Anomalies_Time_Series.nc", size: "84.1 MB", type: "NetCDF-4", url: "https://doi.org/10.5067/MODIS/MOD14A1.061" }
    ],
    "LPDAAC-MOD13A1-V061": [
      { name: "MOD13A1_Vegetation_Indices_Landing.html", size: "38.2 MB", type: "User Guide", url: "https://lpdaac.usgs.gov/products/mod13a1v061/" },
      { name: "MOD13A1_NDVI_Composite_2026.nc", size: "128.5 MB", type: "NetCDF-4", url: "https://doi.org/10.5067/MODIS/MOD13A1.061" }
    ],
    "GESDISC-GPM-3IMERGHH-V06": [
      { name: "GPM_3IMERGHH_V06_Atmospheric_Precip.html", size: "4.8 MB", type: "Data Summary", url: "https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGHH_06/summary" },
      { name: "GPM_IMERG_Precipitation_Daily.nc", size: "45.0 MB", type: "NetCDF-4", url: "https://doi.org/10.5067/GPM/IMERGDL/DAY/06" }
    ],
    "LPDAAC-MOD11A2-V061": [
      { name: "MOD11A2_Temp_LST_Product_Home.html", size: "14.1 MB", type: "User Guide", url: "https://lpdaac.usgs.gov/products/mod11a2v061/" },
      { name: "MOD11A2_LST_Anomalies_8Day.nc", size: "95.6 MB", type: "NetCDF-4", url: "https://doi.org/10.5067/MODIS/MOD11A2.061" }
    ],
    "NSIDC-0051-V1": [
      { name: "NSIDC_0051_SeaIce_Svalbard_Versions.html", size: "154 KB", type: "Data Portal", url: "https://nsidc.org/data/nsidc-0051/versions/1" },
      { name: "NSIDC_SeaIce_Svalbard_Concentration.nc", size: "32.1 MB", type: "NetCDF-4", url: "https://doi.org/10.5067/MEASURES/CRYOSPHERE/nsidc-0051.001" }
    ],
    "ORNLDAAC-GLACIER-RGI": [
      { name: "RGI_Glacier_Outlines_Interactive_V60.html", size: "284 MB", type: "Data Portal", url: "https://nsidc.org/data/rgi" },
      { name: "RGI_Glacier_Outlines_Global.geojson", size: "112.4 MB", type: "GeoJSON", url: "https://doi.org/10.7265/450f-9v91" }
    ],
    "SEDAC-GRUMP-v1": [
      { name: "SEDAC_GRUMP_V1_Population_density_Global.html", size: "12 KB", type: "Data Portal", url: "https://sedac.ciesin.columbia.edu/data/collection/grump-v1" },
      { name: "GRUMP_PopulationDensity_Analysis.nc", size: "54.2 MB", type: "NetCDF-4", url: "https://doi.org/10.7927/H4T72FNF" }
    ]
  };

  return fileRegistry[datasetId] || [
    { name: `${datasetId.toLowerCase()}_data_landing.html`, size: "15.4 MB", type: "Data Portal", url: "https://search.earthdata.nasa.gov/search?q=" + encodeURIComponent(datasetId) }
  ];
};

interface SidebarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  results: SearchResult | null;
  isMinimized?: boolean;
  onToggleMinimize?: (min: boolean) => void;
  isFastMode?: boolean;
  locationIntel?: LocationIntelligence | null;
  changeDetection?: ChangeDetectionResult | null;
}

const SPECIALIZED_AGENTS = [
  {
    name: "Dataset Agent",
    role: "Validation & Archive search",
    desc: "Validates temporal / spatial bounds, identifies verified NASA shortnames and collection hierarchies.",
    accent: "text-blue-400 border-blue-500/20 bg-blue-950/20"
  },
  {
    name: "Analysis Agent",
    role: "Physical Model Simulation",
    desc: "Specializes in thermodynamics, physical triggers, latent heat flux, and hydrological imbalances.",
    accent: "text-emerald-400 border-emerald-500/20 bg-emerald-950/20"
  },
  {
    name: "Visualization Agent",
    role: "Visual Spectral Band mapping",
    desc: "Maps indices (NDVI, NDWI, NBR) onto false-color composites and advises on visual scale adjustments.",
    accent: "text-rose-400 border-rose-500/20 bg-rose-950/20"
  },
  {
    name: "Report Agent",
    role: "Structured policy synthesis",
    desc: "Drafts structured risk mitigation guidelines, checklists, and socio-economic vulnerability matrices.",
    accent: "text-amber-400 border-amber-500/20 bg-amber-950/20"
  },
  {
    name: "Insight Agent",
    role: "Cross-Variable Correlation",
    desc: "Connects teleconnections (ENSO, IOD), links temperature with soil moisture and fire multipliers.",
    accent: "text-purple-400 border-purple-500/20 bg-purple-950/20"
  }
];

const thinkingSteps = [
  { label: "Going through NASA files...", desc: "Crawling GPM physical indices..." },
  { label: "Files found...", desc: "Located 5 matching datasets (MODIS, Landsat)..." },
  { label: "Reading files...", desc: "Querying grid mapping files via proglacial nodes..." },
  { label: "Converting to text...", desc: "Transforming pixel raster values of target bands..." },
  { label: "Summarizing information...", desc: "Finalizing science synthesis summary metrics..." }
];

const markdownComponents = {
  h1: ({ children, ...props }: any) => (
    <h1 className="text-sm font-bold text-white mt-3 mb-1.5 flex items-center gap-1.5 tracking-tight border-b border-white/10 pb-1" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-xs font-bold text-blue-400 mt-2.5 mb-1 flex items-center gap-1.5 tracking-tight" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-[11px] font-bold text-white/95 mt-2 mb-1 uppercase tracking-wider" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: any) => (
    <p className="text-white/85 text-[11px] leading-relaxed mb-1.5 font-sans" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="list-none pl-0 space-y-1 mb-2.5" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal pl-4 space-y-1 mb-2.5 text-white/80" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="text-[11px] text-white/80 leading-relaxed font-sans flex items-start gap-1.5" {...props}>
      <span className="text-blue-500 shrink-0 mt-1">▪</span>
      <span className="flex-1">{children}</span>
    </li>
  ),
  strong: ({ children, ...props }: any) => (
    <strong className="text-blue-400 font-semibold" {...props}>
      {children}
    </strong>
  ),
  table: ({ children, ...props }: any) => (
    <div className="w-full overflow-x-auto my-3 border border-white/10 rounded-lg bg-black/40">
      <table className="w-full text-left border-collapse text-[10px]" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-[#18181b] border-b border-white/10 font-mono text-[9px] uppercase tracking-wider text-white/65" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: any) => (
    <tbody className="divide-y divide-white/5" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }: any) => (
    <tr className="hover:bg-white/[0.02] transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: any) => (
    <th className="p-2 font-semibold" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="p-2 align-top leading-normal" {...props}>
      {children}
    </td>
  ),
  code: ({ children, ...props }: any) => (
    <code className="px-1 py-0.5 bg-white/5 text-white/95 text-[10px] font-mono rounded border border-white/10 select-all" {...props}>
      {children}
    </code>
  )
};

export default function Sidebar({ onSearch, isLoading, results, isMinimized, onToggleMinimize, isFastMode, locationIntel, changeDetection }: SidebarProps) {
  const activeMode = "copilot";
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Interactive Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "copilot"; content: string }[]>([
    { role: "copilot", content: "Affirmative, Sentinel. Under your instruction, I map real-time satellite sensor networks, isolate physical anomalies, and compute spatial correlations. What science vector shall we explore?" }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatThinkingStep, setChatThinkingStep] = useState<number>(-1);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Specialized Agent Query State
  const [selectedAgent, setSelectedAgent] = useState("Dataset Agent");
  const [agentPrompt, setAgentPrompt] = useState("");
  const [agentAnswer, setAgentAnswer] = useState("");
  const [isAgentLoading, setIsAgentLoading] = useState(false);

  // Auto Scroll Chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading]);

  // Handle Search Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setIsExpanded(true);
    }
  };

  // Perform multi-turn copilot dialog using server end-point
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setIsChatLoading(true);
    setChatThinkingStep(0);

    // Call API immediately
    const apiPromise = fetch("/api/research/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: userMsg })
    }).then(res => res.json()).catch(err => {
      console.error(err);
      return { scientificAnswer: "Sensor network timeout. Failed to connect to core modeling server. Please retry." };
    });

    try {
      // Cycle through each step, introducing a professional 900ms paced visualization delay
      for (let stepIndex = 0; stepIndex <= 4; stepIndex++) {
        setChatThinkingStep(stepIndex);
        await new Promise(resolve => setTimeout(resolve, 900));
      }

      const data = await apiPromise;
      setChatMessages(prev => [...prev, { role: "copilot", content: data.scientificAnswer || "Unable to parse scientific answer." }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: "copilot", content: "Sensor network timeout. Failed to connect to core modeling server. Please retry." }]);
    } finally {
      setIsChatLoading(false);
      setChatThinkingStep(-1);
    }
  };

  // Trigger specialized AI agent logic
  const handleQueryAgent = async () => {
    if (!agentPrompt.trim() || isAgentLoading) return;
    setIsAgentLoading(true);
    setAgentAnswer("");
    try {
      // Extract coordinates from results as context if available
      const context = results ? {
        title: results.location?.name,
        coordinates: { lat: results.location?.lat, lng: results.location?.lng },
        matchedKeywords: results.suggestedVariables
      } : {};

      const data = await fetchAgentQuery(selectedAgent, agentPrompt, context);
      setAgentAnswer(data.agentResponse);
    } catch (e) {
      console.error(e);
      setAgentAnswer("Agent failed to compile model inputs. Request retry.");
    } finally {
      setIsAgentLoading(false);
    }
  };

  const handleDownloadNotebook = () => {
    if (!results) return;
    const content = generateNotebook(results, locationIntel, changeDetection);
    const blob = new Blob([content], { type: "application/x-ipynb+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "earthlens_research_copilot.ipynb";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isMinimized) {
    return (
      <motion.button
        layoutId="sidebar-container"
        onClick={() => onToggleMinimize?.(false)}
        className="w-12 h-12 bg-[#121212]/95 hover:bg-[#181812] backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl flex items-center justify-center group cursor-pointer transition-all shrink-0"
        title="Expand Dataset Finder"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
      >
        <Database className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
        <span className="absolute left-14 bg-black/85 px-3 py-1.5 rounded-xl text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 pointer-events-none shadow-xl tracking-wide">
          EXPAND DATASET FINDER
        </span>
      </motion.button>
    );
  }

  return (
    <div className="w-[380px] bg-[#121212]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full max-h-[calc(100vh-48px)] lg:max-h-[750px] font-sans">
      
      {/* Search Header Banner */}
      <div className="p-4 bg-[#181818]/80 border-b border-white/5 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-blue-600/10 border border-blue-500/30 rounded flex items-center justify-center animate-pulse">
              <Zap className="w-3 h-3 text-blue-400" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase font-black">
              MISSION OPERATOR CONTROL
            </span>
          </div>
          <button
            type="button"
            onClick={() => onToggleMinimize?.(true)}
            className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
            title="Minimize Dataset Finder"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
        
        {/* Natural Language Pipeline Finder */}
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="Launch search, e.g., 'Volcanic cloud in Iceland'..."
            className="w-full bg-black/40 border border-white/10 focus:border-blue-500/50 rounded-xl py-3 pl-10 pr-9 text-xs font-sans text-white placeholder:text-white/20 focus:outline-none transition-all"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />}
          </div>
        </form>
      </div>

      {/* BODY PANEL SCROLL Container */}
      <div className="flex-1 min-h-0 bg-gradient-to-b from-[#121212] to-[#0d0d0d] flex flex-col overflow-y-auto custom-scrollbar p-4">
        
        {/* Mode 1: Dataset Finder & Matched Pipelines */}
        {activeMode === "copilot" && (
          <div className="space-y-4">
            {!results && !isLoading ? (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center">
                  <Compass className="w-6 h-6 text-white/20" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">Enter Research Directives</h4>
                  <p className="text-[10px] text-white/30 max-w-xs mx-auto mt-1 leading-relaxed">
                    Map multi-variable signals to validated spaceborne collections, automatically weighting coverage limits and scientific coherence.
                  </p>
                </div>
              </div>
            ) : isLoading ? (
              <ResearchLoading isFastMode={isFastMode} />
            ) : (
              <div className="space-y-4">
                {/* AI Research Answer Brief */}
                <div className="p-4 bg-blue-950/15 border border-blue-500/10 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span className="text-[9px] font-mono uppercase tracking-widest font-black leading-none">AI RESEARCH INSIGHT</span>
                  </div>
                  <div className="text-xs text-white/80 leading-relaxed font-sans prose prose-invert pb-1">
                    <ReactMarkdown components={markdownComponents}>{results.explanation}</ReactMarkdown>
                  </div>
                </div>

                {/* NASA Dataset Cards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono text-white/30 tracking-widest uppercase">
                    <span>COHERENT NASA DATASETS OUTLINE</span>
                    <span className="text-blue-400">{results.datasets.length} FOUND</span>
                  </div>
                  
                  {results.datasets.map((dataset) => {
                    const relatedFiles = getRelatedFilesForDataset(dataset.id);
                    return (
                      <div 
                        key={dataset.id}
                        className="bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl p-3.5 transition-all relative block shrink-0"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <button
                            type="button"
                            onClick={() => window.open(getDatasetWebpageUrl(dataset.id), "_blank")}
                            className="text-xs font-bold text-white leading-tight text-left hover:text-blue-400 transition-colors flex-1"
                          >
                            {dataset.title}
                          </button>
                          <div className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-mono rounded">
                            {Math.round(dataset.relevanceScore * 100)}% Match
                          </div>
                        </div>

                        <p className="text-[11px] text-white/45 leading-relaxed font-sans line-clamp-2 mb-3">
                          {dataset.summary}
                        </p>

                        {/* Scientific Relevance Score breaks (geographic, topic, etc.) */}
                        <div className="grid grid-cols-3 gap-1.5 bg-black/20 rounded-lg p-2 border border-white/5 mb-3">
                          <div className="text-[8px] font-mono text-white/45 flex flex-col items-center justify-center p-1 bg-white/[0.01] rounded uppercase">
                            <span>Geographic</span>
                            <span className="text-white font-bold mt-0.5 mt-0.5">{(dataset.geographicScore ?? 0.9).toFixed(2)}</span>
                          </div>
                          <div className="text-[8px] font-mono text-white/45 flex flex-col items-center justify-center p-1 bg-white/[0.01] rounded uppercase">
                            <span>Temporal</span>
                            <span className="text-white font-bold mt-0.5">{(dataset.timeScore ?? 0.88).toFixed(2)}</span>
                          </div>
                          <div className="text-[8px] font-mono text-white/45 flex flex-col items-center justify-center p-1 bg-white/[0.01] rounded uppercase">
                            <span>Scientific</span>
                            <span className="text-white font-bold mt-0.5">{(dataset.scientificScore ?? 0.95).toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Related Files Section */}
                        <div className="space-y-1.5 mb-3 border-t border-white/5 pt-2.5">
                          <span className="text-[9px] font-mono text-white/30 tracking-wider uppercase block">
                            RELATED DATA FILES & GRANULES
                          </span>
                          <div className="space-y-1">
                            {relatedFiles.map((file, idx) => (
                              <button
                                key={idx}
                                onClick={() => window.open(file.url, "_blank")}
                                className="w-full flex items-center justify-between p-2 rounded-lg bg-black/40 hover:bg-black/60 border border-white/5 hover:border-blue-500/20 text-left transition-all text-[9.5px] font-mono group cursor-pointer"
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <FileText className="w-3.5 h-3.5 text-blue-500/80 group-hover:text-blue-400 shrink-0" />
                                  <span className="text-white/60 group-hover:text-white/90 truncate">
                                    {file.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  <span className="text-[8px] bg-white/5 text-white/45 px-1 py-0.5 rounded uppercase leading-none border border-white/5">
                                    {file.type}
                                  </span>
                                  <span className="text-white/30 group-hover:text-white/50 text-[8px]">
                                    {file.size}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Relevance justification note */}
                        <div className="text-[10px] text-[#A0A5B5] leading-normal font-sans border-t border-white/5 pt-2 flex items-start gap-1.5 ">
                          <span className="text-[9px] bg-white/5 text-white/50 px-1 py-0.5 rounded border border-white/10 font-mono scale-90 leading-none">JUSTIFICATION:</span>
                          <span className="flex-1">{dataset.relevanceReason}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Starters Bundle Container */}
                <div className="bg-gradient-to-r from-blue-900/10 to-indigo-950/10 border border-blue-500/10 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[9px] font-mono text-white/60 tracking-wider">PYTHON ANHYDROUS RESEARCH STARTER</span>
                  </div>
                  <p className="text-[10px] text-white/40 leading-snug font-sans">
                    Instantly compiles raw API query pipelines, bounding coordinate dimensions, and analytical filters into an executable Jupyter (.ipynb) notebook.
                  </p>
                  <button 
                    onClick={handleDownloadNotebook}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 font-mono text-[10px] text-white font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.15)]"
                  >
                    <Download className="w-3 h-3" /> COMPILE PYTHON NOTEBOOK
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
