import { Search, Globe, Database, BookOpen, Download, ChevronRight, Loader2, Sparkles, Map as MapIcon, Layers, X, ChevronLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/utils";
import { Dataset, SearchResult } from "../types";
import { generateNotebook } from "../lib/notebookGenerator";

interface SidebarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  results: SearchResult | null;
}

export default function Sidebar({ onSearch, isLoading, results }: SidebarProps) {
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setIsExpanded(true);
      setIsCollapsed(false);
    }
  };

  const handleDownloadNotebook = () => {
    if (!results) return;
    const content = generateNotebook(results);
    const blob = new Blob([content], { type: "application/x-ipynb+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "earthlens_research_starter.ipynb";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isCollapsed) {
    return (
      <button 
        onClick={() => setIsCollapsed(false)}
        className="w-12 h-12 bg-[#1A1A1A]/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
      >
        <PanelLeftOpen className="w-5 h-5" />
      </button>
    );
  }

  return (
    <motion.div 
      initial={false}
      animate={{ 
        width: isExpanded || results ? 400 : 360,
        height: isExpanded || results ? "auto" : 56
      }}
      className={cn(
        "bg-[#1A1A1A]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all",
        !results && !isExpanded && "shiny-border"
      )}
    >
      {/* Search Bar (Always Visible) */}
      <div className="p-2 flex items-center gap-2">
        <button 
          onClick={() => setIsCollapsed(true)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/30 hover:text-white"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
        <form onSubmit={handleSubmit} className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="Search Earth events..."
            className="w-full bg-transparent border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none text-white placeholder:text-white/20"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
            {(isExpanded || results) && (
              <button 
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  // Optional: clear results if needed, but usually we just want to collapse
                }}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white/30 hover:text-white" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Results / Content (Dropdown) */}
      <AnimatePresence>
        {(isExpanded || results) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 max-h-[70vh] overflow-y-auto custom-scrollbar"
          >
            {!results && !isLoading ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-white/20" />
                </div>
                <h3 className="text-white text-sm font-medium mb-1">Ready for Discovery</h3>
                <p className="text-xs text-white/40 leading-relaxed mb-6">
                  Describe a natural event to generate a curated dataset pipeline.
                </p>
                
                <div className="space-y-2 text-left">
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-2">Suggestions</p>
                  {["Wildfire smoke in California", "Glacier melting in Himalayas", "Volcanic ash air quality"].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setQuery(q); onSearch(q); setIsExpanded(true); }}
                      className="w-full p-2.5 bg-white/5 border border-white/5 rounded-lg text-xs text-white/60 hover:bg-white/10 hover:border-white/20 transition-all text-left flex items-center justify-between group"
                    >
                      {q}
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            ) : isLoading ? (
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="h-3 w-1/3 bg-white/5 rounded animate-pulse" />
                  <div className="h-16 w-full bg-white/5 rounded animate-pulse" />
                </div>
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-24 w-full bg-white/5 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-8">
                {/* AI Explanation */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <h2 className="text-[10px] font-mono uppercase tracking-widest text-white/40">AI Analysis</h2>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none text-white/70 leading-relaxed text-xs">
                    <ReactMarkdown>{results?.explanation || ""}</ReactMarkdown>
                  </div>
                </section>

                {/* Recommended Datasets */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-400" />
                      <h2 className="text-[10px] font-mono uppercase tracking-widest text-white/40">Curated Datasets</h2>
                    </div>
                    <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">
                      {results?.datasets.length} FOUND
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {results?.datasets.map((dataset) => (
                      <DatasetCard key={dataset.id} dataset={dataset} />
                    ))}
                  </div>
                </section>

                {/* Research Starter Pack */}
                <section className="bg-blue-600/5 border border-blue-500/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <h2 className="text-[10px] font-mono uppercase tracking-widest text-white/40">Starter Pack</h2>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 bg-black/40 rounded-lg border border-white/5">
                      <div className="flex items-center gap-3">
                        <Download className="w-3.5 h-3.5 text-white/40" />
                        <span className="text-xs text-white/80">Python Notebook</span>
                      </div>
                      <button 
                        onClick={handleDownloadNotebook}
                        className="text-[9px] font-mono text-blue-400 hover:text-blue-300"
                      >
                        GENERATE
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-black/40 rounded-lg border border-white/5">
                      <div className="flex items-center gap-3">
                        <Layers className="w-3.5 h-3.5 text-white/40" />
                        <span className="text-xs text-white/80">API Endpoints</span>
                      </div>
                      <button className="text-[9px] font-mono text-blue-400 hover:text-blue-300">COPY</button>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DatasetCard({ dataset }: { dataset: Dataset }) {
  const openDataset = () => {
    const link = dataset.links?.find(l => l.rel === "enclosure" || l.rel === "self")?.href || dataset.links?.[0]?.href;
    if (link) {
      window.open(link, "_blank");
    }
  };

  return (
    <div 
      onClick={openDataset}
      className="group bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.08] hover:border-white/20 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
          {dataset.title}
        </h3>
        <div className="text-[10px] font-mono text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
          {Math.round(dataset.relevanceScore * 100)}%
        </div>
      </div>
      
      <p className="text-xs text-white/40 line-clamp-2 mb-4 leading-relaxed">
        {dataset.summary}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {dataset.variables.map((v) => (
          <span key={v} className="text-[9px] font-mono bg-white/5 text-white/60 px-2 py-0.5 rounded border border-white/10 uppercase tracking-tighter">
            {v}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          <MapIcon className="w-3 h-3 text-white/30" />
          <span className="text-[10px] text-white/30 uppercase tracking-widest">Preview Available</span>
        </div>
        <button className="p-1.5 bg-white/5 rounded hover:bg-white/10 transition-colors">
          <Download className="w-3 h-3 text-white/60" />
        </button>
      </div>
    </div>
  );
}
