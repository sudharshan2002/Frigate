import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { GrainLocal } from "../GrainOverlay";
import { AppPageLinks } from "./AppPageLinks";
import { GitCompare, ArrowRight, Zap, ChevronDown, BarChart3, RefreshCw, Image as ImageIcon, Type } from "lucide-react";
import { api, type GenerationMode, type WhatIfResponse } from "../../lib/api";

const mono: React.CSSProperties = {
  fontFamily: "'Roboto Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const ease = [0.16, 1, 0.3, 1] as const;

const defaultPrompts: Record<GenerationMode, { original: string; modified: string }> = {
  image: {
    original: "Design a premium Frigate hero with a calm cinematic interface and visible prompt-to-output mapping",
    modified: "Design a premium Frigate hero with a brighter editorial interface, visible prompt-to-output mapping, and a before/after diff ribbon",
  },
  text: {
    original: "Write a concise Frigate product intro for AI teams focusing on explainability and control.",
    modified: "Write a concise Frigate product intro for AI teams focusing on explainability, control, and faster launch confidence with what-if comparison.",
  },
};

const sensitivityTemplate = [
  { variable: "Visual tone", impact: "High", alternatives: ["editorial bright", "industrial dark", "soft minimal", "bold schematic"] },
  { variable: "Explainability cue", impact: "High", alternatives: ["token highlights", "image overlays", "delta ribbons", "confidence badges"] },
  { variable: "Interaction pattern", impact: "Medium", alternatives: ["live diff", "hover map", "scrubbable timeline", "side-by-side compare"] },
  { variable: "Audience framing", impact: "Low", alternatives: ["creative cockpit", "prompt debugger", "co-creator", "team workspace"] },
];

type WhatIfSeedState = {
  prompt?: string;
  mode?: GenerationMode;
  fromComposer?: boolean;
};

function MetricCard({ label, valueA, valueB }: { label: string; valueA: number; valueB: number }) {
  const delta = valueB - valueA;
  return (
    <div className="p-4" style={{ border: "1px solid #9C9C9C10", backgroundColor: "#EBEAE0" }}>
      <div style={{ ...mono, fontSize: 10, color: "#686868", marginBottom: 10 }}>{label}</div>
      <div className="flex items-end gap-3">
        <div>
          <div style={{ ...mono, fontSize: 9, color: "#686868" }}>A</div>
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 22, color: "#050505", letterSpacing: "-0.03em" }}>{Math.round(valueA)}%</div>
        </div>
        <div style={{ color: delta > 0 ? "#7DFFAF" : delta < 0 ? "#FF7D7D" : "#686868", fontFamily: "Inter, sans-serif", fontSize: 14, marginBottom: 3 }}>
          {delta > 0 ? "+" : ""}{Math.round(delta)}%
        </div>
        <div>
          <div style={{ ...mono, fontSize: 9, color: "#686868" }}>B</div>
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 22, color: "#1A3D1A", letterSpacing: "-0.03em" }}>{Math.round(valueB)}%</div>
        </div>
      </div>
      <div className="mt-3 flex gap-1">
        <div style={{ height: 3, flex: Math.max(valueA, 2), backgroundColor: "#FFFFED20" }} />
        <div style={{ height: 3, flex: Math.max(valueB, 2), backgroundColor: "#D1FF0050" }} />
      </div>
    </div>
  );
}

export function WhatIfPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<GenerationMode>("image");
  const [originalPrompt, setOriginalPrompt] = useState(defaultPrompts.image.original);
  const [modifiedPrompt, setModifiedPrompt] = useState(defaultPrompts.image.modified);
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [expandedSens, setExpandedSens] = useState<number | null>(0);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendNotice, setBackendNotice] = useState<string | null>(null);

  async function runComparison(nextOriginal = originalPrompt, nextModified = modifiedPrompt, nextMode = mode) {
    if (!nextOriginal.trim() || !nextModified.trim()) return;

    setIsComparing(true);
    setError(null);

    try {
      const response = await api.compare({
        original_prompt: nextOriginal,
        modified_prompt: nextModified,
        mode: nextMode,
      });
      setResult(response);
      setBackendNotice(response.isFallback ? response.fallbackMessage || "Live services are unavailable, so Frigate is showing preview data." : null);
    } catch (compareError) {
      setError(compareError instanceof Error ? compareError.message : "Unable to compare prompts.");
    } finally {
      setIsComparing(false);
    }
  }

  useEffect(() => {
    void runComparison(defaultPrompts.image.original, defaultPrompts.image.modified, "image");
  }, []);

  useEffect(() => {
    const seed = location.state as WhatIfSeedState | null;

    if (!seed?.fromComposer || !seed.prompt || !seed.mode) {
      return;
    }

    setMode(seed.mode);
    setOriginalPrompt(seed.prompt);
    setModifiedPrompt(seed.prompt);
    setResult(null);
    setError(null);
    void runComparison(seed.prompt, seed.prompt, seed.mode);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  function switchMode(nextMode: GenerationMode) {
    const nextPrompts = defaultPrompts[nextMode];
    setMode(nextMode);
    setOriginalPrompt(nextPrompts.original);
    setModifiedPrompt(nextPrompts.modified);
    setResult(null);
    setError(null);
    void runComparison(nextPrompts.original, nextPrompts.modified, nextMode);
  }

  const sensitivityData = useMemo(() => {
    return sensitivityTemplate.map((item, index) => ({
      ...item,
      current: index === 0
        ? (mode === "image" ? "calm cinematic" : "product launch")
        : index === 1
          ? "prompt-to-output mapping"
          : index === 2
            ? (mode === "image" ? "side-by-side compare" : "draft compare")
            : "AI teams",
    }));
  }, [mode]);

  const keyChanges = useMemo(() => {
    if (!result) return [];

    return [
      {
        segment: "confidence",
        delta: `${result.delta.confidence > 0 ? "+" : ""}${Math.round(result.delta.confidence)}% confidence`,
        direction: result.delta.confidence > 0 ? "up" : result.delta.confidence < 0 ? "down" : "neutral",
      },
      {
        segment: "clarity",
        delta: `${result.delta.clarity > 0 ? "+" : ""}${Math.round(result.delta.clarity)}% clarity`,
        direction: result.delta.clarity > 0 ? "up" : result.delta.clarity < 0 ? "down" : "neutral",
      },
      {
        segment: "quality",
        delta: `${result.delta.quality > 0 ? "+" : ""}${Math.round(result.delta.quality)}% quality`,
        direction: result.delta.quality > 0 ? "up" : result.delta.quality < 0 ? "down" : "neutral",
      },
    ];
  }, [result]);

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: "#F5F4E7", paddingTop: 64 }}>
      <GrainLocal opacity={0.03} />

      <motion.div
        className="relative z-10"
        style={{ padding: "10px clamp(20px, 3vw, 40px)", borderBottom: "1px solid #00000010", backgroundColor: "#EBEAE0" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.2 }}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4">
            <GitCompare size={13} style={{ color: "#1A3D1A" }} />
            <span style={{ ...mono, fontSize: 11, color: "#1A3D1A" }}>What-If Studio</span>
            <div style={{ width: 1, height: 14, backgroundColor: "#9C9C9C18" }} />
            <span style={{ ...mono, fontSize: 11, color: "#686868" }}>2 Prompt Variants</span>
          </div>
          <div className="flex items-center gap-2">
            {([
              { id: "image", label: "Image", icon: <ImageIcon size={10} /> },
              { id: "text", label: "Text", icon: <Type size={10} /> },
            ] as const).map((item) => (
              <button
                key={item.id}
                onClick={() => switchMode(item.id)}
                className="cursor-pointer border-none flex items-center gap-1.5"
                style={{
                  ...mono,
                  fontSize: 10,
                  color: mode === item.id ? "#1A3D1A" : "#686868",
                  backgroundColor: mode === item.id ? "#D1FF0026" : "#9C9C9C08",
                  padding: "8px 12px",
                  border: `1px solid ${mode === item.id ? "#D1FF00" : "#00000012"}`,
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <button
              className="cursor-pointer border-none flex items-center gap-2"
              style={{ ...mono, fontSize: 10, color: "#050505", backgroundColor: "#D1FF00", padding: "9px 12px" }}
              onClick={() => void runComparison()}
              disabled={isComparing}
            >
              <RefreshCw size={9} className={isComparing ? "animate-spin" : undefined} />
              Compare New Edit
            </button>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto grid gap-6" style={{ maxWidth: 1480, padding: "28px clamp(20px, 3vw, 40px)" }}>
        <AppPageLinks currentPage="what-if" />

        {backendNotice && (
          <div className="p-4" style={{ border: "1px solid #D1FF00", backgroundColor: "#D1FF0010" }}>
            <div style={{ ...mono, fontSize: 10, color: "#1A3D1A", marginBottom: 8 }}>Preview Mode</div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: "165%", color: "#686868", margin: 0 }}>{backendNotice}</p>
          </div>
        )}

        {error && (
          <div className="p-5" style={{ border: "1px solid #FF7D7D20", backgroundColor: "#FF7D7D08" }}>
            <div style={{ ...mono, fontSize: 10, color: "#FF7D7D", marginBottom: 10 }}>Compare Error</div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, lineHeight: "170%", color: "#686868" }}>{error}</p>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2" style={{ border: "1px solid #00000012", backgroundColor: "#F7F6EC", padding: 18 }}>
          {[
            { id: "A", label: "Original", prompt: originalPrompt, setter: setOriginalPrompt, session: result?.original_session },
            { id: "B", label: "Variant", prompt: modifiedPrompt, setter: setModifiedPrompt, session: result?.modified_session },
          ].map((scenario, index) => (
            <motion.div
              key={scenario.id}
              className="overflow-hidden"
              style={{ border: `1px solid ${index === 1 ? "#D1FF00" : "#9C9C9C10"}`, backgroundColor: "#EBEAE0" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.3 + index * 0.1 }}
            >
              <div className="flex items-center justify-between p-3.5" style={{ borderBottom: "1px solid #9C9C9C08", backgroundColor: index === 1 ? "#D1FF0006" : "transparent" }}>
                <div className="flex items-center gap-3">
                  <div style={{ ...mono, fontSize: 10, color: "#050505", backgroundColor: index === 1 ? "#D1FF0099" : "#00000008", padding: "3px 8px" }}>{scenario.id}</div>
                  <span style={{ ...mono, fontSize: 10, color: "#686868" }}>{scenario.label}</span>
                </div>
                <span style={{ ...mono, fontSize: 10, color: "#686868" }}>{scenario.session ? `${Math.round(scenario.session.trust_score)}% conf` : "pending"}</span>
              </div>

              <div className="p-3.5" style={{ borderBottom: "1px solid #9C9C9C08" }}>
                <div style={{ ...mono, fontSize: 10, color: "#686868", marginBottom: 8 }}>Prompt</div>
                <textarea
                  value={scenario.prompt}
                  onChange={(event) => scenario.setter(event.target.value)}
                  rows={4}
                  className="w-full resize-none outline-none"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#050505", backgroundColor: "transparent", border: "none", lineHeight: "170%" }}
                />
              </div>

              <div className="relative" style={{ aspectRatio: "16/9", backgroundColor: "#EBEAE0", borderTop: "1px solid #00000008" }}>
                {isComparing && !scenario.session ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span style={{ ...mono, fontSize: 10, color: "#686868" }}>Comparing...</span>
                  </div>
                ) : mode === "image" ? (
                  <>
                    {scenario.session?.output ? <img src={scenario.session.output} alt={scenario.prompt} className="absolute inset-0 h-full w-full object-cover" /> : null}
                    <div className="absolute bottom-3 left-3">
                      <span style={{ ...mono, fontSize: 9, color: "#FFFFED", backgroundColor: "#050505cc", padding: "4px 8px" }}>Scenario {scenario.id}</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 overflow-auto p-5">
                    <div style={{ ...mono, fontSize: 10, color: "#686868", marginBottom: 8 }}>Generated text</div>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, lineHeight: "175%", color: "#050505", whiteSpace: "pre-wrap" }}>{scenario.session?.output || "Run compare to generate both variants."}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.5 }}>
          <div className="flex items-center gap-3 mb-4">
            <span style={{ ...mono, fontSize: 10, color: "#1A3D1A" }}>Edit Delta</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "#9C9C9C10" }} />
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <MetricCard label="Confidence" valueA={result?.original_session.trust_score || 0} valueB={result?.modified_session.trust_score || 0} />
            <MetricCard label="Clarity" valueA={result?.original_session.clarity_score || 0} valueB={result?.modified_session.clarity_score || 0} />
            <MetricCard label="Quality" valueA={result?.original_session.quality_score || 0} valueB={result?.modified_session.quality_score || 0} />
          </div>

          <div className="p-4" style={{ border: "1px solid #00000010", backgroundColor: "#EBEAE0" }}>
            <div style={{ ...mono, fontSize: 10, color: "#686868", marginBottom: 10 }}>{"Key Changes (A -> B)"}</div>
            {keyChanges.map((change, index) => (
              <div key={index} className="flex items-center gap-4 mb-2">
                <div style={{ width: 6, height: 6, backgroundColor: change.direction === "up" ? "#7DFFAF" : change.direction === "down" ? "#FF7D7D" : "#FFB87D" }} />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#050505", fontWeight: 600 }}>"{change.segment}"</span>
                <ArrowRight size={10} style={{ color: "#686868" }} />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#686868" }}>{change.delta}</span>
              </div>
            ))}
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, lineHeight: "170%", color: "#686868", marginTop: 10 }}>
              {result?.difference || "Compare the variants to inspect how the backend predicts the change."}
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.6 }}>
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 size={13} style={{ color: "#D1FF00" }} />
            <span style={{ ...mono, fontSize: 10, color: "#D1FF00" }}>Sensitivity Analysis</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "#9C9C9C10" }} />
          </div>

          <div className="flex flex-col">
            {sensitivityData.map((item, index) => (
              <motion.div
                key={index}
                className="cursor-pointer"
                style={{ borderBottom: "1px solid #9C9C9C0A" }}
                onClick={() => setExpandedSens(expandedSens === index ? null : index)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.7 + index * 0.05 }}
              >
                <div className="flex items-center justify-between py-4 px-2 -mx-2">
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700, color: "#050505", textTransform: "uppercase", letterSpacing: "-0.01em" }}>{item.variable}</span>
                    <span style={{
                      ...mono, fontSize: 9,
                      color: item.impact === "High" ? "#FF7D7D" : item.impact === "Medium" ? "#FFB87D" : "#7DFFAF",
                      backgroundColor: item.impact === "High" ? "#FF7D7D10" : item.impact === "Medium" ? "#FFB87D10" : "#7DFFAF10",
                      padding: "3px 7px",
                    }}>{item.impact}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ ...mono, fontSize: 10, color: "#686868" }}>{item.current}</span>
                    <motion.div animate={{ rotate: expandedSens === index ? 180 : 0 }} transition={{ duration: 0.3 }}>
                      <ChevronDown size={13} style={{ color: "#686868" }} />
                    </motion.div>
                  </div>
                </div>
                <AnimatePresence>
                  {expandedSens === index && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease }} className="overflow-hidden">
                      <div className="pb-4 pl-3">
                        <div style={{ ...mono, fontSize: 10, color: "#686868", marginBottom: 6 }}>Alternative values</div>
                        <div className="flex flex-wrap gap-2">
                          {item.alternatives.map((alternative) => (
                            <button key={alternative} className="cursor-pointer border-none" style={{
                              ...mono, fontSize: 10, color: "#050505",
                              backgroundColor: "#9C9C9C08", padding: "6px 12px",
                              border: "1px solid #9C9C9C15",
                            }}>{alternative}</button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div className="p-5" style={{ border: "1px solid #9C9C9C10", backgroundColor: "#D1FF0004" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.8 }}>
          <div style={{ ...mono, fontSize: 10, color: "#D1FF00", marginBottom: 10 }}>Impact Summary</div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                title: "Highest Leverage",
                text: result
                  ? `${Math.abs(Math.round(result.delta.clarity)) >= Math.abs(Math.round(result.delta.quality)) ? "Clarity" : "Quality"} moved the most between these variants.`
                  : "Run a comparison to see which quality shifts the most.",
              },
              {
                title: "Recommended Edit",
                text: result?.delta.clarity && result.delta.clarity >= 0
                  ? "Keep the modified variant if you want the clearer prompt path."
                  : "The original remains the steadier option unless you need a stronger change.",
              },
              {
                title: "Predictability Score",
                text: result
                  ? `${Math.max(55, 100 - Math.abs(Math.round(result.delta.quality)) * 3)}% stable - changes remain understandable and contained.`
                  : "Pending comparison.",
              },
            ].map((item, index) => (
              <div key={index}>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: "#050505", marginBottom: 4 }}>{item.title}</div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: "170%", color: "#686868" }}>{item.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
