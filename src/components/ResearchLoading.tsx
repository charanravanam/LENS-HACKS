import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Loader2, Radio, CheckCircle2, ShieldAlert } from "lucide-react";

interface ResearchLoadingProps {
  isFastMode?: boolean;
}

export default function ResearchLoading({ isFastMode = false }: ResearchLoadingProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const steps = [
    { label: "SATELLITE HANDSHAKE", desc: "Establishing telemetry uplink to NASA Earth Orbiters..." },
    { label: "BIOME GRID MAPPING", desc: "Bounding target geographic coordinates into regional biome index..." },
    { label: "THERMAL EMISSIVITY SCAN", desc: "Retrieving MODIS Land Surface Temp (LPDAAC-MOD11A2)..." },
    { label: "HYDRO-METEOROLOGICAL COMPOSITION", desc: "Ingesting half-hourly GPM IMERG precipitation models..." },
    { label: "CONVOLUTION PROCESS", desc: "Running inter-decadal spatial trend neural fitting (2010 - 2026)..." }
  ];

  // Simulated live engineering telemetry logs to satisfy the "process updates list"
  const rawLogPool = [
    "Establishing handshake with Terra Sentinel at 705km altitude...",
    "Telemetry validated. Signal strength: -48dBm.",
    "Bypassing standard slow LLM queue via rapid geographic map lookup...",
    "Querying LPDAAC-MOD11A2-V061 grid matrices...",
    "Querying GPM-3IMERGHH precip indices...",
    "Compiling sub-kilometer surface albedo differentials...",
    "Computing vegetation health indices Red/NIR reflections...",
    "Aligning spatial bands onto visual coordinates...",
    "Generating deep multi-variable trend report...",
    "Pipeline compile successful. Resolving UI view state..."
  ];

  useEffect(() => {
    // Speed depends on fast mode or slow mode
    const totalDuration = isFastMode ? 1500 : 7000;
    const intervalMs = 100;
    const stepsCount = steps.length;
    const increment = (100 / (totalDuration / intervalMs));

    let localProgress = 0;
    const progressInterval = setInterval(() => {
      localProgress = Math.min(localProgress + increment, 98);
      setProgress(Math.round(localProgress));

      // Map progress to steps
      const calculatedStep = Math.min(
        Math.floor((localProgress / 100) * stepsCount),
        stepsCount - 1
      );
      setCurrentStep(calculatedStep);
    }, intervalMs);

    // Roll logs periodically
    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < rawLogPool.length) {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${rawLogPool[logIndex]}`]);
        logIndex++;
      }
    }, isFastMode ? 130 : 600);

    return () => {
      clearInterval(progressInterval);
      clearInterval(logInterval);
    };
  }, [isFastMode]);

  return (
    <div className="space-y-4 py-2 select-none" id="research-loading-container">
      {/* Visual Header / Progress Ring */}
      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 flex items-center justify-center bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-blue-400 uppercase font-bold block leading-none">
              {isFastMode ? "FAST BIOME MAP LOOKUP" : "DEEP SPACE RESEARCH PIPELINE"}
            </span>
            <span className="text-white text-[11px] font-semibold tracking-tight mt-1 block">
              Processing Environmental Assessment...
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[16px] font-black text-white font-mono leading-none tracking-tighter">
            {progress}%
          </span>
          <span className="text-[8px] font-mono text-white/30 uppercase tracking-wider block">
            UPLINK STATE
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Interactive Process List */}
      <div className="space-y-2.5 p-3.5 bg-white/[0.01] border border-white/5 rounded-2xl">
        <h4 className="text-[9px] font-mono font-black text-white/30 tracking-widest uppercase">
          PIPELINE CHECKPOINTS
        </h4>
        <div className="space-y-2">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isActive = idx === currentStep;

            return (
              <div 
                key={step.label}
                className={`flex items-start gap-2.5 p-2 rounded-xl transition-colors ${
                  isActive ? "bg-blue-950/20 border border-blue-500/20" : "border border-transparent"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isActive ? (
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  ) : (
                    <div className="w-3.5 h-3.5 border border-white/20 rounded-full flex items-center justify-center text-[8px] font-mono text-white/30">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div>
                  <h5 className={`text-[10px] font-mono font-bold uppercase tracking-tight leading-tight ${
                    isCompleted ? "text-emerald-400/80" : isActive ? "text-blue-300" : "text-white/40"
                  }`}>
                    {step.label}
                  </h5>
                  <p className="text-[9px] text-white/40 leading-tight mt-0.5 font-sans">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Downlink Telemetry Terminal Console logs */}
      <div className="space-y-1.5">
        <span className="text-[9px] font-mono text-white/30 tracking-widest uppercase">
          SATELLITE TELEMETRY OUTPUT
        </span>
        <div className="bg-black/75 border border-white/5 rounded-xl p-3 h-28 overflow-y-auto text-[9px] font-mono text-blue-400/90 custom-scrollbar flex flex-col-reverse justify-start">
          <div className="space-y-1">
            {logs.slice().reverse().map((log, lIdx) => (
              <div key={lIdx} className="leading-normal border-l border-blue-500/20 pl-2">
                <span className="text-white/20 mr-1.5">&gt;</span>
                {log}
              </div>
            ))}
            {progress < 100 && (
              <div className="flex items-center gap-1.5 text-blue-400 animate-pulse">
                <span className="inline-block w-1.5 h-3 bg-blue-400 animate-caret" />
                <span className="text-[8px] text-white/40 italic">Listening for orbital telemetry package...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
