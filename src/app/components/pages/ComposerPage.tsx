import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { GrainLocal } from "../GrainOverlay";
import { AppPageLinks } from "./AppPageLinks";
import {
  Send,
  Sparkles,
  Zap,
  Eye,
  RefreshCw,
  Copy,
  Clock,
  Image as ImageIcon,
  Type,
  GitCompare,
} from "lucide-react";
import { api, formatRelativeTime, type GenerateResponse, type GenerationMode, type SessionRecord } from "../../lib/api";

const mono: React.CSSProperties = {
  fontFamily: "'Roboto Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const ease = [0.16, 1, 0.3, 1] as const;
const segmentColors = ["#D1FF00", "#7DFFAF", "#FF7D7D", "#7DB5FF", "#FFB87D"];
const frigateText = "#050505";
const frigateMuted = "#686868";

const starterPrompts: Record<GenerationMode, string> = {
  image: "Design a premium launch hero for Frigate, an explainable AI platform, with a glass cockpit visual metaphor, prompt-to-output mapping cues, and calm cinematic lighting",
  text: "Write a polished launch announcement for Frigate that explains how prompt-to-output mapping, trust scoring, and what-if comparisons help AI teams ship safely.",
};

const suggestionMap: Record<GenerationMode, string[]> = {
  image: [
    "Add live influence overlay",
    "Try before/after diff ribbon",
    "Consider multimodal control room",
  ],
  text: [
    "Add a sharper CTA",
    "Mention trusted deployment",
    "Include a short product summary",
  ],
};

function ConfidenceMeter({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="mb-2 flex justify-between">
        <span style={{ ...mono, fontSize: 10, color: frigateMuted }}>{label}</span>
        <span style={{ ...mono, fontSize: 10, color: "#1A3D1A" }}>{Math.round(value)}%</span>
      </div>
      <div style={{ height: 4, backgroundColor: "#9C9C9C12", overflow: "hidden" }}>
        <motion.div
          style={{ height: "100%", backgroundColor: "#D1FF00" }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(4, value)}%` }}
          transition={{ duration: 0.9, ease }}
        />
      </div>
    </div>
  );
}

function buildExplanationText(token: string, impact: number, mode: GenerationMode) {
  if (impact >= 0.85) {
    return `"${token}" is acting like a primary steering term and is strongly shaping the ${mode === "image" ? "composition" : "draft direction"}.`;
  }
  if (impact >= 0.65) {
    return `"${token}" is reinforcing the tone and helping the system stay aligned with the prompt's main intent.`;
  }
  return `"${token}" is providing secondary context that supports the final ${mode === "image" ? "visual treatment" : "wording"}, but with lower leverage.`;
}

export function ComposerPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<GenerationMode>("image");
  const [prompt, setPrompt] = useState(starterPrompts.image);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendNotice, setBackendNotice] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState<"explain" | "insights" | "history">("explain");

  async function loadHistory() {
    setIsLoadingHistory(true);
    try {
      const response = await api.sessions(8);
      setHistory(response.sessions);
      setBackendNotice(response.isFallback ? response.fallbackMessage || "Live services are unavailable, so Frigate is showing preview data." : null);
      if (!result && response.sessions.length > 0) {
        setPrompt(response.sessions[0].prompt);
      }
    } catch (historyError) {
      setError(historyError instanceof Error ? historyError.message : "Unable to load session history.");
    } finally {
      setIsLoadingHistory(false);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  const segments = useMemo(() => {
    return (result?.mapping || [])
      .slice()
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 5)
      .map((item, index) => ({
        text: item.token,
        influence: item.impact,
        color: segmentColors[index % segmentColors.length],
      }));
  }, [result]);

  const guidedFeedback = useMemo(() => {
    if (!result) return [];

    const feedback = [];
    const strongestToken = segments[0]?.text;

    if (strongestToken) {
      feedback.push(`"${strongestToken}" is currently the strongest lever in this run.`);
    }
    if (result.session.clarity_score < 84) {
      feedback.push("Add one more concrete constraint to tighten output predictability.");
    } else {
      feedback.push("Prompt structure is clear enough to support stable refinement.");
    }
    feedback.push(
      mode === "image"
        ? "Add an explainability cue if you want a richer visual story in the dashboard."
        : "A short CTA or closing outcome statement would make the text output feel more launch-ready.",
    );

    return feedback;
  }, [mode, result, segments]);

  async function handleGenerate() {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await api.generate({ prompt, mode, source: "composer" });
      setResult(response);
      const sessions = await api.sessions(8);
      setHistory(sessions.sessions);
      setBackendNotice(
        response.isFallback
          ? response.fallbackMessage || "Live services are unavailable, so Frigate is showing preview data."
          : sessions.isFallback
            ? sessions.fallbackMessage || "Live services are unavailable, so Frigate is showing preview data."
            : null,
      );
      setActivePanel("explain");
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSuggestionClick(suggestion: string) {
    const normalized = suggestion
      .replace(/^Add /, "")
      .replace(/^Try /, "")
      .replace(/^Consider /, "");
    setPrompt((current) => `${current.trim().replace(/[.]?$/, "")}. ${normalized}`);
  }

  async function handleCopy() {
    if (!result?.output) return;
    await navigator.clipboard.writeText(result.output);
  }

  function switchMode(nextMode: GenerationMode) {
    setMode(nextMode);
    setPrompt(starterPrompts[nextMode]);
    setResult(null);
    setError(null);
  }

  function openInWhatIf(nextPrompt = prompt, nextMode = mode) {
    if (!nextPrompt.trim()) return;

    navigate("/what-if", {
      state: {
        prompt: nextPrompt.trim(),
        mode: nextMode,
        fromComposer: true,
      },
    });
  }

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: "#F5F4E7", paddingTop: 64 }}>
      <GrainLocal opacity={0.03} />

      <motion.div
        className="relative z-10 flex items-center justify-between gap-4"
        style={{ padding: "14px clamp(20px, 3vw, 40px)", borderBottom: "1px solid #00000010", backgroundColor: "#EBEAE0" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.2 }}
      >
        <div className="flex items-center gap-4">
          <span style={{ ...mono, fontSize: 11, color: "#1A3D1A" }}>Prompt Composer</span>
          <div style={{ width: 1, height: 18, backgroundColor: "#9C9C9C18" }} />
          <span style={{ ...mono, fontSize: 10, color: frigateMuted }}>
            {result ? `Session #${result.session.id}` : history[0] ? `Recent session #${history[0].id}` : "Ready"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {(["explain", "insights", "history"] as const).map((panel) => (
            <button
              key={panel}
              onClick={() => setActivePanel(panel)}
              className="cursor-pointer border-none"
              style={{
                ...mono,
                fontSize: 10,
                color: activePanel === panel ? "#1A3D1A" : frigateMuted,
                backgroundColor: activePanel === panel ? "#D1FF0030" : "#F5F4E7",
                padding: "8px 12px",
                border: `1px solid ${activePanel === panel ? "#D1FF00" : "#00000012"}`,
              }}
            >
              {panel === "explain" ? "mapping" : panel === "insights" ? "insights" : "sessions"}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto grid gap-6" style={{ maxWidth: 1580, padding: "24px clamp(20px, 3vw, 40px) 32px" }}>
        <AppPageLinks currentPage="composer" />

        {backendNotice && (
          <div className="p-4" style={{ border: "1px solid #D1FF00", backgroundColor: "#D1FF0010" }}>
            <div style={{ ...mono, fontSize: 10, color: "#1A3D1A", marginBottom: 8 }}>Preview Mode</div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: "165%", color: frigateMuted, margin: 0 }}>{backendNotice}</p>
          </div>
        )}

      <div className="flex min-h-[calc(100vh-118px)] flex-col lg:flex-row" style={{ border: "1px solid #00000012" }}>
        <div className="flex flex-1 flex-col" style={{ borderRight: "1px solid #00000008" }}>
          <motion.div
            style={{ padding: "28px clamp(20px, 3vw, 34px)", borderBottom: "1px solid #00000008" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles size={13} style={{ color: "#1A3D1A" }} />
                  <span style={{ ...mono, fontSize: 10, color: frigateMuted }}>Prompt Composer</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {([
                  { id: "image", label: "Image", icon: <ImageIcon size={11} /> },
                  { id: "text", label: "Text", icon: <Type size={11} /> },
                ] as const).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => switchMode(item.id)}
                    className="cursor-pointer border-none flex items-center gap-2"
                    style={{
                      ...mono,
                      fontSize: 10,
                      color: mode === item.id ? "#1A3D1A" : frigateMuted,
                      backgroundColor: mode === item.id ? "#D1FF0026" : "#F2F1E8",
                      padding: "10px 14px",
                      border: `1px solid ${mode === item.id ? "#D1FF00" : "#00000010"}`,
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

              <div className="mb-4 flex flex-wrap items-center justify-between gap-3" style={{ border: "1px solid #00000010", backgroundColor: "#F2F1E8", padding: 14 }}>
                <span style={{ ...mono, fontSize: 10, color: frigateMuted }}>Current Prompt</span>
                <button
                  type="button"
                  onClick={() => openInWhatIf()}
                  disabled={!prompt.trim()}
                  className="cursor-pointer border-none flex items-center gap-2"
                  style={{
                    ...mono,
                    fontSize: 10,
                    color: frigateText,
                    backgroundColor: "#D1FF00",
                    padding: "9px 12px",
                    opacity: prompt.trim() ? 1 : 0.45,
                  }}
                >
                  <GitCompare size={12} />
                  Send To What If
                </button>
              </div>

            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={5}
              className="w-full resize-none outline-none"
              placeholder={`Describe the ${mode} result you want to generate...`}
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 17,
                color: frigateText,
                backgroundColor: "#F9F8EF",
                border: "1px solid #00000010",
                lineHeight: "175%",
                padding: 20,
              }}
            />

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {suggestionMap[mode].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="cursor-pointer border-none"
                    style={{
                      ...mono,
                      fontSize: 10,
                      color: frigateMuted,
                      backgroundColor: "#9C9C9C0A",
                      padding: "8px 12px",
                      border: "1px solid #9C9C9C10",
                    }}
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="cursor-pointer border-none flex items-center gap-2"
                style={{
                  ...mono,
                  fontSize: 11,
                  fontWeight: 600,
                  color: frigateText,
                  backgroundColor: "#D1FF00",
                  padding: "13px 20px",
                  opacity: isGenerating ? 0.6 : 1,
                }}
              >
                {isGenerating ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                {isGenerating ? "Generating..." : `Run ${mode === "image" ? "Image" : "Text"} Generation`}
              </button>
            </div>
          </motion.div>

          <motion.div
            style={{ padding: "18px clamp(20px, 3vw, 34px)", borderBottom: "1px solid #00000008" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="mb-4 flex items-center gap-2">
              <Eye size={13} style={{ color: frigateMuted }} />
              <span style={{ ...mono, fontSize: 10, color: frigateMuted }}>Prompt-to-Output Map</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {segments.length > 0 ? (
                segments.map((segment, index) => (
                  <motion.button
                    key={`${segment.text}-${index}`}
                    className="cursor-pointer border-none"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 15,
                      fontWeight: 600,
                      color: frigateText,
                      backgroundColor: activeSegment === index ? segment.color : "#F9F8EF",
                      border: `1px solid ${activeSegment === index ? segment.color : "#9C9C9C20"}`,
                      padding: "8px 14px",
                    }}
                    onMouseEnter={() => setActiveSegment(index)}
                    onMouseLeave={() => setActiveSegment(null)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease, delay: 0.1 + index * 0.05 }}
                  >
                    {segment.text}
                    <span style={{ ...mono, fontSize: 9, marginLeft: 8, opacity: 0.6 }}>{Math.round(segment.influence * 100)}%</span>
                  </motion.button>
                ))
              ) : (
                <span style={{ ...mono, fontSize: 10, color: frigateMuted }}>Generate once to see mapped prompt influence.</span>
              )}
            </div>
          </motion.div>

          <div className="flex-1" style={{ padding: "24px clamp(20px, 3vw, 34px)" }}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div style={{ ...mono, fontSize: 10, color: frigateMuted, marginBottom: 6 }}>Generated Result</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 17, fontWeight: 700, color: frigateText }}>
                  {mode === "image" ? "Visual output preview" : "Written output preview"}
                </div>
              </div>
              {result && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="cursor-pointer border-none flex items-center gap-2"
                    style={{ ...mono, fontSize: 10, color: frigateMuted, backgroundColor: "#F2F1E8", padding: "8px 10px" }}
                    onClick={() => void handleCopy()}
                  >
                    <Copy size={12} />
                    Copy
                  </button>
                  <button
                    type="button"
                    className="cursor-pointer border-none flex items-center gap-2"
                    style={{ ...mono, fontSize: 10, color: frigateText, backgroundColor: "#D1FF00", padding: "8px 10px" }}
                    onClick={() => openInWhatIf(result.session.prompt, result.session.mode)}
                  >
                    <GitCompare size={12} />
                    Compare In What If
                  </button>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="loading"
                  className="flex min-h-[280px] flex-col items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    style={{ width: 48, height: 4, backgroundColor: "#D1FF00" }}
                    animate={{ scaleX: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span style={{ ...mono, fontSize: 10, color: frigateMuted, marginTop: 16 }}>
                    Generating with {mode === "image" ? "Pollinations" : "Replicate"}...
                  </span>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  className="p-5"
                  style={{ minHeight: 220, border: "1px solid #FF7D7D20", backgroundColor: "#FF7D7D08" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div style={{ ...mono, fontSize: 10, color: "#FF7D7D", marginBottom: 10 }}>Request Error</div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: "170%", color: frigateMuted }}>{error}</p>
                </motion.div>
              ) : result ? (
                <motion.div key="output" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
                  {mode === "image" ? (
                    <div className="relative mb-5 w-full overflow-hidden" style={{ backgroundColor: "#1C1E19", aspectRatio: "16/10", border: "1px solid #9C9C9C10" }}>
                      <img src={result.output} alt={prompt} className="absolute inset-0 h-full w-full object-cover" />
                      <AnimatePresence>
                        {activeSegment !== null && segments[activeSegment] && (
                          <motion.div
                            className="absolute inset-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.45 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{
                              background: `radial-gradient(ellipse at ${20 + activeSegment * 15}% ${30 + activeSegment * 10}%, ${segments[activeSegment].color}50 0%, transparent 55%)`,
                            }}
                          />
                        )}
                      </AnimatePresence>
                      <div className="absolute bottom-4 left-4">
                        <span style={{ ...mono, fontSize: 10, color: "#FFFFED", backgroundColor: "#050505cc", padding: "5px 10px" }}>
                          {result.provider} | live image
                        </span>
                      </div>
                      <div className="absolute top-4 right-4">
                        <span style={{ ...mono, fontSize: 10, color: "#1A3D1A", backgroundColor: "#D1FF00", padding: "5px 10px" }}>
                          Overlay Live
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-5" style={{ border: "1px solid #9C9C9C10", backgroundColor: "#EBEAE0", padding: 24 }}>
                      <div style={{ ...mono, fontSize: 10, color: frigateMuted, marginBottom: 12 }}>{result.provider} | generated text</div>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, lineHeight: "185%", color: frigateText, whiteSpace: "pre-wrap" }}>{result.output}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <ConfidenceMeter value={result.session.trust_score} label="Confidence" />
                    <ConfidenceMeter value={result.session.clarity_score} label="Clarity" />
                    <ConfidenceMeter value={result.session.quality_score} label="Quality" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  className="flex min-h-[280px] flex-col items-center justify-center text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Sparkles size={20} style={{ color: frigateMuted, marginBottom: 10, opacity: 0.25 }} />
                  <p style={{ ...mono, fontSize: 10, color: frigateMuted }}>Add a prompt to start the explainable generation loop</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.div
          className="flex flex-col"
          style={{ width: "100%", maxWidth: 390, backgroundColor: "#EBEAE0" }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.4 }}
        >
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #00000010" }}>
            <span style={{ ...mono, fontSize: 10, color: "#1A3D1A" }}>
              {activePanel === "explain" ? "Explanation Layer" : activePanel === "insights" ? "Trust Signals" : "Session History"}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ padding: "18px 20px" }}>
            {activePanel === "explain" && (
              <div className="flex flex-col gap-4">
                {segments.length > 0 ? (
                  segments.map((segment, index) => (
                    <motion.div
                      key={`${segment.text}-${index}`}
                      className="p-4"
                      style={{
                        backgroundColor: activeSegment === index ? "#D1FF0008" : "#9C9C9C06",
                        border: `1px solid ${activeSegment === index ? "#D1FF0025" : "#9C9C9C10"}`,
                        cursor: "default",
                      }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease, delay: index * 0.05 }}
                      onMouseEnter={() => setActiveSegment(index)}
                      onMouseLeave={() => setActiveSegment(null)}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <div style={{ width: 8, height: 8, backgroundColor: segment.color }} />
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 700, color: frigateText }}>"{segment.text}"</span>
                      </div>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: "168%", color: frigateMuted }}>
                        {buildExplanationText(segment.text, segment.influence, mode)}
                      </p>
                      <div className="mt-2">
                        <span style={{ ...mono, fontSize: 9, color: frigateMuted }}>Influence: {Math.round(segment.influence * 100)}%</span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-4" style={{ border: "1px solid #00000010" }}>
                    <span style={{ ...mono, fontSize: 10, color: frigateMuted }}>No mapping yet.</span>
                  </div>
                )}

                {guidedFeedback.length > 0 && (
                  <div className="p-4" style={{ border: "1px solid #00000010" }}>
                    <div style={{ ...mono, fontSize: 10, color: "#1A3D1A", marginBottom: 10 }}>Guided Feedback</div>
                    {guidedFeedback.map((feedback) => (
                      <div key={feedback} className="mb-3 flex items-start gap-2 last:mb-0">
                        <Zap size={12} style={{ color: "#1A3D1A", flexShrink: 0, marginTop: 4 }} />
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: frigateMuted, lineHeight: "160%" }}>{feedback}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activePanel === "insights" && (
              <div className="flex flex-col gap-6">
                <div>
                  <div style={{ ...mono, fontSize: 10, color: frigateMuted, marginBottom: 12 }}>Metrics</div>
                  <div className="flex flex-col gap-4">
                    <ConfidenceMeter value={result?.session.trust_score || 0} label="Overall Confidence" />
                    <ConfidenceMeter value={result?.session.clarity_score || 0} label="Prompt Clarity" />
                    <ConfidenceMeter value={result?.session.quality_score || 0} label="Output Quality" />
                    <ConfidenceMeter value={Math.min(98, (result?.mapping.length || 0) * 16)} label="Edit Efficiency" />
                  </div>
                </div>

                <div>
                  <div style={{ ...mono, fontSize: 10, color: frigateMuted, marginBottom: 12 }}>Mapping Analysis</div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Tokens Used", value: `${result?.tokens.length || 0}` },
                      { label: "Tracked Segments", value: `${segments.length}` },
                      { label: "Provider", value: result?.provider || "idle" },
                      { label: "Latency", value: result ? `${Math.round(result.session.response_time_ms)}ms` : "0ms" },
                    ].map((tile) => (
                      <div key={tile.label} className="p-4" style={{ backgroundColor: "#9C9C9C06", border: "1px solid #9C9C9C10" }}>
                        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 18, color: frigateText }}>{tile.value}</div>
                        <div style={{ ...mono, fontSize: 9, color: frigateMuted, marginTop: 4 }}>{tile.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activePanel === "history" && (
              <div className="flex flex-col gap-3">
                <div style={{ ...mono, fontSize: 10, color: frigateMuted, marginBottom: 4 }}>Recent Sessions</div>
                {isLoadingHistory ? (
                  <span style={{ ...mono, fontSize: 10, color: frigateMuted }}>Loading history...</span>
                ) : history.length > 0 ? (
                  history.map((session) => (
                    <motion.button
                      key={session.id}
                      className="border-none p-4 text-left cursor-pointer"
                      style={{ border: "1px solid #9C9C9C10", backgroundColor: "transparent" }}
                      onClick={() => {
                        setPrompt(session.prompt);
                        setMode(session.mode);
                        setActivePanel("insights");
                      }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease }}
                    >
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: frigateText, marginBottom: 8, lineHeight: "160%" }}>{session.prompt}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock size={11} style={{ color: frigateMuted }} />
                          <span style={{ ...mono, fontSize: 9, color: frigateMuted }}>{formatRelativeTime(session.created_at)}</span>
                        </div>
                        <span style={{ ...mono, fontSize: 9, color: "#1A3D1A" }}>{Math.round(session.trust_score)}% conf</span>
                      </div>
                    </motion.button>
                  ))
                ) : (
                  <span style={{ ...mono, fontSize: 10, color: frigateMuted }}>No sessions stored yet.</span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
}
