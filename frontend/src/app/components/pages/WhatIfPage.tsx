import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { GrainLocal } from "../GrainOverlay";
import { ImageGenerationHeatmap } from "../ImageGenerationHeatmap";
import { AppPageLinks } from "./AppPageLinks";
import { GitCompare, ArrowRight, ChevronDown, BarChart3, RefreshCw, Image as ImageIcon, Type } from "lucide-react";
import { api, type GenerationMode, type WhatIfResponse } from "../../lib/api";
import { buildDraftExplanationSummary, buildDraftSegments } from "../../lib/promptDraft";

const mono: React.CSSProperties = {
  fontFamily: "'Roboto Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const ease = [0.16, 1, 0.3, 1] as const;

const defaultPrompts: Record<GenerationMode, { original: string; modified: string }> = {
  image: {
    original: "A cozy living room with a fireplace, comfortable sofa, and warm lighting.",
    modified: "A modern, minimalist living room with a marble fireplace, sleek white sofa, deep shadows, and cinematic late afternoon sunlight.",
  },
  text: {
    original: "Send an email to the team asking them to review the latest design files before Friday.",
    modified: "Write a clear, professional email to the product team requesting a final review of the dashboard design files by Friday at noon. It must be polite but convey urgency.",
  },
};

const segmentColors = ["#D1FF00", "#7DFFAF", "#FF7D7D", "#7DB5FF", "#FFB87D"];

const comparisonPlaceholders: Record<GenerationMode, { original: string; modified: string }> = {
  image: {
    original: "Describe the baseline image...",
    modified: "Describe the modified image...",
  },
  text: {
    original: "Draft the baseline text...",
    modified: "Draft the text revision...",
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
  const [mode, setMode] = useState<"text" | "image">("text");
  const [originalPrompt, setOriginalPrompt] = useState(defaultPrompts.text.original);
  const [modifiedPrompt, setModifiedPrompt] = useState(defaultPrompts.text.modified);
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [expandedSens, setExpandedSens] = useState<number | null>(0);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendNotice, setBackendNotice] = useState<string | null>(null);

  async function runComparison(
    nextOriginal = originalPrompt,
    nextModified = modifiedPrompt,
    nextMode = mode,
  ) {
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

  const originalDraftSegments = useMemo(() => {
    return buildDraftSegments(originalPrompt, mode).map((segment, index) => ({
      ...segment,
      influence: segment.impact,
      color: segmentColors[index % segmentColors.length],
    }));
  }, [mode, originalPrompt]);

  const modifiedDraftSegments = useMemo(() => {
    return buildDraftSegments(modifiedPrompt, mode).map((segment, index) => ({
      ...segment,
      influence: segment.impact,
      color: segmentColors[index % segmentColors.length],
    }));
  }, [mode, modifiedPrompt]);

  const isOriginalDirty =
    !result ||
    result.original_session.mode !== mode ||
    result.original_session.prompt.trim() !== originalPrompt.trim();
  const isModifiedDirty =
    !result ||
    result.modified_session.mode !== mode ||
    result.modified_session.prompt.trim() !== modifiedPrompt.trim();

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
              disabled={isComparing || !originalPrompt.trim() || !modifiedPrompt.trim()}
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
          {
            id: "A",
            label: "Baseline",
            prompt: originalPrompt,
            setter: setOriginalPrompt,
            session: result?.original_session,
            draftDirty: isOriginalDirty,
            segments: isOriginalDirty
              ? originalDraftSegments
              : ((result?.original_segments || []).map((segment, index) => ({
                  ...segment,
                  influence: segment.impact,
                  color: segmentColors[index % segmentColors.length],
                }))),
            explanation: isOriginalDirty
              ? buildDraftExplanationSummary(originalPrompt, mode)
              : result?.original_explanation_summary,
          },
          {
            id: "B",
            label: "Edited",
            prompt: modifiedPrompt,
            setter: setModifiedPrompt,
            session: result?.modified_session,
            draftDirty: isModifiedDirty,
            segments: isModifiedDirty
              ? modifiedDraftSegments
              : ((result?.modified_segments || []).map((segment, index) => ({
                  ...segment,
                  influence: segment.impact,
                  color: segmentColors[index % segmentColors.length],
                }))),
            explanation: isModifiedDirty
              ? buildDraftExplanationSummary(modifiedPrompt, mode)
              : result?.modified_explanation_summary,
          },
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
                <div style={{ ...mono, fontSize: 10, color: "#686868", marginBottom: 8 }}>Scenario Prompt</div>
                <textarea
                  value={scenario.prompt}
                  onChange={(event) => scenario.setter(event.target.value)}
                  rows={4}
                  className="w-full resize-none outline-none"
                  placeholder={scenario.id === "A" ? comparisonPlaceholders[mode].original : comparisonPlaceholders[mode].modified}
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#050505", backgroundColor: "transparent", border: "none", lineHeight: "170%" }}
                />
                <div className="mt-3 rounded-none p-3" style={{ border: "1px solid #00000010", backgroundColor: "#F7F6EC" }}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div style={{ ...mono, fontSize: 10, color: "#686868", marginBottom: 6 }}>Live Segmentation</div>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: "160%", color: "#686868", margin: 0 }}>
                        Live preview.
                      </p>
                    </div>
                    <span style={{ ...mono, fontSize: 10, color: scenario.draftDirty ? "#1A3D1A" : "#686868" }}>
                      {scenario.draftDirty ? "Draft View" : "Last Compare"}
                    </span>
                  </div>

                  {scenario.segments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {scenario.segments.map((segment, segmentIndex) => (
                        <span
                          key={`${scenario.id}-${segment.id}-${segmentIndex}`}
                          style={{
                            ...mono,
                            fontSize: 9,
                            color: "#050505",
                            backgroundColor: segment.color,
                            padding: "6px 9px",
                          }}
                        >
                          {segment.label} {Math.round(segment.influence * 100)}%
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ ...mono, fontSize: 10, color: "#686868" }}>Awaiting scenario...</span>
                  )}
                </div>
              </div>

              <div className="relative" style={{ aspectRatio: "16/9", backgroundColor: "#EBEAE0", borderTop: "1px solid #00000008" }}>
                {isComparing && !scenario.session ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span style={{ ...mono, fontSize: 10, color: "#686868" }}>Comparing...</span>
                  </div>
                ) : mode === "image" ? (
                  <>
                    {scenario.session?.output ? (
                      <>
                        <img src={scenario.session.output} alt={scenario.prompt || `Scenario ${scenario.id}`} className="absolute inset-0 h-full w-full object-cover" />
                        <ImageGenerationHeatmap
                          compact
                          segments={((scenario.id === "A" ? result?.original_segments : result?.modified_segments) || []).map((segment, segmentIndex) => ({
                            ...segment,
                            influence: segment.impact,
                            color: segmentColors[segmentIndex % segmentColors.length],
                          }))}
                        />
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                        <span style={{ ...mono, fontSize: 9, color: "#686868" }}>Awaiting comparison.</span>
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3">
                      <span style={{ ...mono, fontSize: 9, color: "#FFFFED", backgroundColor: "#050505cc", padding: "4px 8px" }}>{scenario.session?.provider || "preview-image"}</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 overflow-auto p-5">
                    <div style={{ ...mono, fontSize: 10, color: "#686868", marginBottom: 8 }}>Generated text</div>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, lineHeight: "175%", color: "#050505", whiteSpace: "pre-wrap" }}>{scenario.session?.output || "Awaiting comparison."}</p>
                  </div>
                )}
              </div>

              {scenario.explanation ? (
                <div className="p-3.5" style={{ borderTop: "1px solid #9C9C9C08" }}>
                  <div style={{ ...mono, fontSize: 10, color: "#686868", marginBottom: 8 }}>
                    {scenario.draftDirty ? "How This Draft Is Read" : "How This Scenario Is Read"}
                  </div>
                  {scenario.session && scenario.draftDirty ? (
                    <div style={{ ...mono, fontSize: 9, color: "#1A3D1A", marginBottom: 8 }}>Draft changed. Compare again to refresh this scenario.</div>
                  ) : null}
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: "165%", color: "#686868", marginBottom: 8 }}>
                    {scenario.explanation.overview}
                  </p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: "165%", color: "#686868", margin: 0 }}>
                    {scenario.explanation.segment_strategy}
                  </p>
                </div>
              ) : null}
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
            <div className="prose-frigate" style={{ marginTop: 24 }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h3: ({node, ...props}) => <h3 style={{ color: "#050505", marginTop: 20, marginBottom: 12, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "IBM Plex Mono, monospace" }} {...props} />,
                  p: ({node, ...props}) => <p style={{ color: "#686868", fontSize: 15, lineHeight: "1.8", marginBottom: 16 }} {...props} />,
                  li: ({node, ...props}) => <li style={{ color: "#686868", fontSize: 14, lineHeight: "1.7", marginBottom: 8 }} {...props} />
                }}
              >
                {result?.difference || "Awaiting comparison."}
              </ReactMarkdown>
            </div>
          </div>

          {result?.segment_changes?.length ? (
            <div className="mt-5 p-4" style={{ border: "1px solid #00000010", backgroundColor: "#F7F6EC" }}>
              <div style={{ ...mono, fontSize: 10, color: "#1A3D1A", marginBottom: 12 }}>Segment Delta</div>
              <div className="grid gap-3">
                {result.segment_changes.slice(0, 4).map((change) => (
                  <div key={`${change.label}-${change.change_type}`} className="p-3" style={{ border: "1px solid #00000010", backgroundColor: "#EBEAE0" }}>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700, color: "#050505" }}>{change.label}</span>
                      <span style={{ ...mono, fontSize: 9, color: change.change_type === "added" ? "#1A3D1A" : change.change_type === "removed" ? "#FF7D7D" : "#686868" }}>
                        {change.change_type}
                      </span>
                    </div>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: "160%", color: "#686868", marginBottom: 8 }}>
                      A: {change.before}
                    </p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: "160%", color: "#686868", marginBottom: 8 }}>
                      B: {change.after}
                    </p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: "160%", color: "#686868", margin: 0 }}>
                      {change.effect}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
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
                  ? `${Math.abs(Math.round(result.delta.clarity)) >= Math.abs(Math.round(result.delta.quality)) ? "Clarity" : "Quality"} had the largest delta.`
                  : "Awaiting comparison.",
              },
              {
                title: "Recommended Edit",
                text: result?.delta.clarity && result.delta.clarity >= 0
                  ? "Use modified variant."
                  : "Awaiting comparison.",
              },
              {
                title: "Predictability Score",
                text: result
                  ? `${Math.max(55, 100 - Math.abs(Math.round(result.delta.quality)) * 3)}% stable changes.`
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
