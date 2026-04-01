import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { GrainLocal } from "../GrainOverlay";
import { ImageGenerationHeatmap } from "../ImageGenerationHeatmap";
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
import {
  api,
  formatRelativeTime,
  type GenerateResponse,
  type GenerationMode,
  type PromptExplanationSummary,
  type PromptSegment,
  type ScoreDetails,
  type SessionRecord,
} from "../../lib/api";
import { buildDraftExplanationSummary, buildDraftFeedback, buildDraftSegments } from "../../lib/promptDraft";

const mono: React.CSSProperties = {
  fontFamily: "'Roboto Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const ease = [0.16, 1, 0.3, 1] as const;

function extractRefinedProposal(markdown: string): string {
  const match = markdown.match(/### Refined Proposal\s*\n+([\s\S]*?)(\n+###|$)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return "";
}

const segmentColors = ["#D1FF00", "#7DFFAF", "#FF7D7D", "#7DB5FF", "#FFB87D"];
const frigateText = "#050505";
const frigateMuted = "#686868";

const starterPrompts: Record<GenerationMode, string> = {
  image: "A minimalist workspace bathed in natural sunlight. A sleek laptop sits on a wooden desk next to a small potted succulent. Clean, modern, 4k photography.",
  text: "Write a short, engaging welcome email for new users of a productivity app, highlighting the main dashboard and calendar features. Keep it friendly.",
};

const suggestionMap: Record<GenerationMode, string[]> = {
  image: [
    "Make it darker",
    "High contrast",
    "Minimalist style",
  ],
  text: [
    "Make it shorter",
    "Professional tone",
    "Add bullet points",
  ],
};

const composerPlaceholders: Record<GenerationMode, string> = {
  image: "Describe the image (e.g., subject, lighting, style)...",
  text: "Draft the request (e.g., topic, format, tone)...",
};

type LiveAnalysisState = {
  segments: PromptSegment[];
  summary: PromptExplanationSummary;
  scoreDetails?: ScoreDetails | null;
};

function scoreSourceLabel(scoreDetails?: ScoreDetails | null) {
  if (!scoreDetails) return "Session scores";
  if (scoreDetails.source === "transformer-regressor") return "Transformer scorer";
  if (scoreDetails.source === "manifest-linear") return "Linear scorer";
  return "Built-in scorer";
}

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

function buildExplanationText(segment: PromptSegment, mode: GenerationMode) {
  if (segment.effect) {
    return segment.effect;
  }
  if (segment.impact >= 0.85) {
    return `"${segment.text}" is the main driver here and is strongly shaping the ${mode === "image" ? "image structure" : "draft direction"}.`;
  }
  if (segment.impact >= 0.65) {
    return `"${segment.text}" is reinforcing the tone and helping the system stay aligned with the prompt's main intent.`;
  }
    return `"${segment.text}" adds supporting context for the final ${mode === "image" ? "image" : "wording"}, but with lower impact.`;
}

export function ComposerPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<GenerationMode>("text");
  const [prompt, setPrompt] = useState(starterPrompts.text);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendNotice, setBackendNotice] = useState<string | null>(null);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [liveResult, setLiveResult] = useState<LiveAnalysisState | null>(null);
  const [activePanel, setActivePanel] = useState<"explain" | "insights" | "history">("explain");

  async function loadHistory() {
    setIsLoadingHistory(true);
    try {
      const response = await api.sessions(8);
      setHistory(response.sessions);
      setBackendNotice(response.isFallback ? response.fallbackMessage || "Live services are unavailable, so Frigate is showing local sample data." : null);
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

  const resultSegments = useMemo(() => {
    const sourceSegments =
      result?.segments?.length
        ? result.segments
        : (result?.mapping || []).slice(0, 5).map((item, index) => ({
            id: `mapping-${index}`,
            label: `Segment ${index + 1}`,
            text: item.token,
            kind: "detail",
            impact: item.impact,
            effect: "",
          }));

    return sourceSegments.map((item, index) => ({
      ...item,
      influence: item.impact,
      color: segmentColors[index % segmentColors.length],
    }));
  }, [result]);

  // Update the live prompt breakdown after the user pauses typing.
  useEffect(() => {
    if (!prompt.trim()) {
      setLiveResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const response = await api.analyze({ prompt, mode });
        setLiveResult({
          segments: response.segments.map((s, i) => ({
            ...s,
            influence: s.impact,
            color: segmentColors[i % segmentColors.length],
          })),
          summary: response.explanation_summary,
          scoreDetails: response.score_details,
        });
      } catch (err) {
        console.error("Live analysis failed:", err);
        // Fallback to local logic if backend fails
        const localSegments = buildDraftSegments(prompt, mode).map((s, i) => ({
          ...s,
          influence: s.impact,
          color: segmentColors[i % segmentColors.length],
        }));
        setLiveResult({
          segments: localSegments,
          summary: buildDraftExplanationSummary(prompt, mode),
          scoreDetails: null,
        });
      } finally {
        setIsAnalyzing(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [mode, prompt]);

  const draftSegments = liveResult?.segments || [];

  const isDraftDirty =
    !result ||
    result.session.mode !== mode ||
    result.session.prompt.trim() !== prompt.trim();

  const segments = isDraftDirty ? draftSegments : resultSegments;
  const explanationSummary = isDraftDirty ? (liveResult?.summary || buildDraftExplanationSummary(prompt, mode)) : result?.explanation_summary;
  const activeScoreDetails = isDraftDirty ? liveResult?.scoreDetails : result?.score_details;
  const segmentByKind = useMemo(() => {
    const output = new Map<string, PromptSegment>();
    for (const segment of segments) {
      if (!output.has(segment.kind)) {
        output.set(segment.kind, segment);
      }
    }
    return output;
  }, [segments]);
  const primarySegment = segments[0] || null;
  const topSegments = segments.slice(0, 4);
  const explanationRows = topSegments.map((segment) => ({
    label: segment.label,
    text: segment.text,
    effect: buildExplanationText(segment, mode),
    influence: Math.round((segment.influence ?? segment.impact ?? 0) * 100),
  }));
  const explainabilityCards = [
    {
      label: "Primary Driver",
      value: primarySegment?.text || "Enter a prompt to begin",
      sub: primarySegment?.label || "Object",
    },
    {
      label: "Style / Tone",
      value: segmentByKind.get("style")?.text || "Not specified yet",
      sub: "How the output should feel",
    },
    {
      label: "Context",
      value: segmentByKind.get("environment")?.text || "No explicit context",
      sub: "Audience, scene, or setting",
    },
    {
      label: "Score Source",
      value: scoreSourceLabel(activeScoreDetails),
      sub: activeScoreDetails?.model_name || "Live session analysis",
    },
  ];

  const guidedFeedback = useMemo(() => {
    if (isDraftDirty) {
      return buildDraftFeedback(prompt, mode, draftSegments);
    }

    if (!result) return [];

    const feedback: string[] = [];
    const strongestToken = segments[0]?.label || segments[0]?.text;

    if (strongestToken) {
      feedback.push(`"${strongestToken}" is having the strongest effect in this run.`);
    }
    if (result.explanation_summary?.segment_strategy) {
      feedback.push(result.explanation_summary.segment_strategy);
    }
    if (segments.length < 3) {
      feedback.push("Add more details to get a better result.");
    } else {
      feedback.push("This prompt looks okay.");
    }
    feedback.push(
      result.explanation_summary?.improvement_tip ||
        (mode === "image"
          ? "Try adding a specific style or color."
          : "Try adding a tone or length constraint."),
    );

    return feedback;
  }, [draftSegments, isDraftDirty, mode, prompt, result, segments]);

  async function handleGenerate() {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await api.generate({ prompt, mode, source: "composer" });
      setResult(response);
      setHistory((current) => {
        const next = [response.session, ...current.filter((session) => session.id !== response.session.id)];
        return next.slice(0, 8);
      });
      setBackendNotice(response.isFallback ? response.fallbackMessage || "Live services are unavailable, so Frigate is showing local sample data." : null);
      setActivePanel("explain");
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSuggestionClick(suggestion: string) {
    setPrompt((current) => `${current.trim().replace(/[.]?$/, "")}. ${suggestion}`);
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
            {result ? `Session #${result.session.id}` : history[0] ? `Recent session #${history[0].id}` : "Waiting"}
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
            <div style={{ ...mono, fontSize: 10, color: "#1A3D1A", marginBottom: 8 }}>Local Data</div>
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
                <span style={{ ...mono, fontSize: 10, color: frigateMuted }}>Prompt Canvas</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openInWhatIf()}
                    disabled={!prompt.trim()}
                    className="cursor-pointer border-none flex items-center gap-2"
                    style={{
                      ...mono,
                      fontSize: 10,
                      color: frigateMuted,
                      backgroundColor: "#F2F1E8",
                      padding: "9px 12px",
                      border: "1px solid #00000014",
                      opacity: prompt.trim() ? 1 : 0.45,
                    }}
                  >
                    <GitCompare size={12} />
                    What If
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="cursor-pointer border-none flex items-center gap-2"
                    style={{
                      ...mono,
                      fontSize: 10,
                      fontWeight: 700,
                      color: frigateText,
                      backgroundColor: "#D1FF00",
                      padding: "9px 14px",
                      opacity: isGenerating || !prompt.trim() ? 0.6 : 1,
                    }}
                  >
                    {isGenerating ? <RefreshCw size={11} className="animate-spin" /> : <Send size={11} />}
                    {isGenerating ? "Generating..." : `Run ${mode === "image" ? "Image" : "Text"}`}
                  </button>
                </div>
              </div>

            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={5}
              className="w-full resize-none outline-none focus:ring-1 focus:ring-[#D1FF00] transition-shadow"
              placeholder={composerPlaceholders[mode]}
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 17,
                color: frigateText,
                backgroundColor: "#F9F8EF",
                border: "1px solid #00000010",
                borderRadius: 8,
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                lineHeight: "175%",
                padding: 20,
              }}
            />

            <div className="mt-4 p-4" style={{ border: "1px solid #00000010", backgroundColor: "#F2F1E8" }}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div style={{ ...mono, fontSize: 10, color: frigateMuted, marginBottom: 6 }}>
                    Prompt Breakdown {isAnalyzing && <span className="animate-pulse" style={{ color: "#D1FF00" }}>Analyzing...</span>}
                  </div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: "165%", color: frigateMuted, margin: 0 }}>
                    Real-time prompt tracking.
                  </p>
                </div>
                <span style={{ ...mono, fontSize: 10, color: isDraftDirty ? "#1A3D1A" : frigateMuted }}>
                  {isDraftDirty ? "Current Draft" : "Last Run"}
                </span>
              </div>

              {segments.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {segments.map((segment, index) => (
                    <button
                      key={`${segment.text}-${index}`}
                      onMouseEnter={() => setActiveSegment(index)}
                      onMouseLeave={() => setActiveSegment(null)}
                      className="cursor-default flex flex-col items-start gap-1 transition-colors"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        color: frigateText,
                        backgroundColor: activeSegment === index ? segment.color : "#F9F8EF",
                        border: `1px solid ${activeSegment === index ? segment.color : "#00000010"}`,
                        borderRadius: 6,
                        boxShadow: activeSegment === index ? `0 2px 8px ${segment.color}40` : "none",
                        padding: "10px 14px",
                        minWidth: 100,
                      }}
                    >
                      <span style={{ ...mono, fontSize: 8, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {segment.label}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        {segment.text.length > 32 ? `${segment.text.slice(0, 30)}...` : segment.text}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <span style={{ ...mono, fontSize: 10, color: frigateMuted }}>Enter a prompt to see the breakdown.</span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
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
                    padding: "7px 11px",
                    border: "1px solid #9C9C9C10",
                  }}
                >
                  + {suggestion}
                </button>
              ))}
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
              <span style={{ ...mono, fontSize: 10, color: frigateMuted }}>{isDraftDirty ? "How Each Part Can Affect The Result" : "How Each Part Affected The Last Run"}</span>
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: "165%", color: frigateMuted, marginBottom: 16 }}>
              {isDraftDirty
                ? "Each row explains what that prompt part is likely changing."
                : "Each row explains how the last run was changed by that prompt part."}
            </p>
            <div className="grid gap-3">
              {explanationRows.length > 0 ? (
                explanationRows.map((row, index) => (
                  <motion.div
                    key={`${row.label}-${row.text}-${index}`}
                    className="p-4"
                    style={{
                      backgroundColor: activeSegment === index ? "#D1FF000D" : "#F9F8EF",
                      border: `1px solid ${activeSegment === index ? "#D1FF00" : "#9C9C9C20"}`,
                    }}
                    onMouseEnter={() => setActiveSegment(index)}
                    onMouseLeave={() => setActiveSegment(null)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease, delay: 0.1 + index * 0.05 }}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span style={{ ...mono, fontSize: 9, color: "#1A3D1A" }}>{row.label}</span>
                      <span style={{ ...mono, fontSize: 9, color: frigateMuted }}>{row.influence}% influence</span>
                    </div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 700, lineHeight: "150%", color: frigateText, marginBottom: 10 }}>
                      {row.text}
                    </div>
                    <div style={{ height: 4, backgroundColor: "#0000000A", marginBottom: 10 }}>
                      <div style={{ width: `${Math.max(8, row.influence)}%`, height: "100%", backgroundColor: "#D1FF00" }} />
                    </div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: "165%", color: frigateMuted }}>
                      {row.effect}
                    </div>
                  </motion.div>
                ))
              ) : (
                <span style={{ ...mono, fontSize: 10, color: frigateMuted }}>Run the prompt to see per-part effects.</span>
              )}
            </div>
          </motion.div>

          <motion.div
            style={{ padding: "20px clamp(20px, 3vw, 34px)", borderBottom: "1px solid #00000008", backgroundColor: "#F8F7EE" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div style={{ ...mono, fontSize: 10, color: "#1A3D1A", marginBottom: 6 }}>Summary</div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: "165%", color: frigateMuted, margin: 0 }}>
                  A short read on the parts carrying the most weight in this prompt.
                </p>
              </div>
              <div style={{ ...mono, fontSize: 10, color: isDraftDirty ? "#1A3D1A" : frigateMuted }}>
                {isDraftDirty ? "Live draft interpretation" : "Last run explanation"}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {explainabilityCards.map((card, index) => (
                <motion.div
                  key={card.label}
                  className="p-4"
                  style={{ border: "1px solid #00000010", backgroundColor: index === 0 ? "#D1FF0012" : "#EBEAE0" }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease, delay: 0.48 + index * 0.04 }}
                >
                  <div style={{ ...mono, fontSize: 9, color: index === 0 ? "#1A3D1A" : frigateMuted, marginBottom: 8 }}>{card.label}</div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: 16, fontWeight: 700, lineHeight: "150%", color: frigateText, marginBottom: 8 }}>
                    {card.value}
                  </div>
                  <div style={{ ...mono, fontSize: 9, color: frigateMuted }}>{card.sub}</div>
                </motion.div>
              ))}
            </div>

            {(primarySegment || explanationSummary) && (
              <div className="mt-4 p-4" style={{ border: "1px solid #00000010", backgroundColor: "#EBEAE0" }}>
                <div style={{ ...mono, fontSize: 10, color: "#1A3D1A", marginBottom: 8 }}>What Is Driving This</div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, lineHeight: "170%", color: frigateText, marginBottom: 10 }}>
                  {primarySegment
                    ? `"${primarySegment.text}" is the strongest prompt part right now, so it has the biggest effect on the ${mode} output.`
                    : "Add a little more structure to the prompt to make the explanation clearer."}
                </p>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: "165%", color: frigateMuted, margin: 0 }}>
                  {primarySegment?.effect || explanationSummary?.segment_strategy}
                </p>
              </div>
            )}
          </motion.div>

          <div className="flex-1" style={{ padding: "24px clamp(20px, 3vw, 34px)" }}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div style={{ ...mono, fontSize: 10, color: frigateMuted, marginBottom: 6 }}>Generated Result</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 17, fontWeight: 700, color: frigateText }}>
                  {mode === "image" ? "Visual output with influence heatmap" : "Written output preview"}
                </div>
                {result && isDraftDirty ? (
                  <div style={{ ...mono, fontSize: 9, color: "#1A3D1A", marginTop: 6 }}>Draft changed. Run again to refresh this output.</div>
                ) : null}
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
                  {mode === "text" && extractRefinedProposal(result.output) && (
                    <button
                      type="button"
                      className="cursor-pointer border-none flex items-center gap-2"
                      style={{ ...mono, fontSize: 10, color: "#1A3D1A", backgroundColor: "#F2F1E8", border: "1px solid #1A3D1A20", padding: "8px 10px" }}
                      onClick={() => {
                        const proposal = extractRefinedProposal(result.output);
                        if (proposal) {
                          setPrompt(proposal);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                    >
                      <Zap size={12} />
                      Use Refined Proposal
                    </button>
                  )}
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
                    Running prompt...
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
                    <div className="mb-5">
                      <div className="relative w-full overflow-hidden" style={{ backgroundColor: "#1C1E19", aspectRatio: "16/10", border: "1px solid #9C9C9C10" }}>
                        <img src={result.output} alt={prompt || "Generated Frigate visual"} className="absolute inset-0 h-full w-full object-cover" />
                        <ImageGenerationHeatmap segments={resultSegments} activeIndex={activeSegment} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span style={{ ...mono, fontSize: 10, color: frigateMuted, backgroundColor: "#F2F1E8", padding: "6px 10px" }}>
                          {result.provider} | generated image
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-5" style={{ border: "1px solid #9C9C9C10", backgroundColor: "#EBEAE0", padding: "32px 40px" }}>
                      <div style={{ ...mono, fontSize: 10, color: frigateMuted, marginBottom: 20, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        {result.provider} | generated text
                      </div>
                      <div className={`prose-frigate ${activeSegment !== null ? "segment-active" : ""}`}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h3: ({node, ...props}) => {
                              const isHighlighted = activeSegment !== null;
                              return <h3 className={isHighlighted ? "highlight-glow" : ""} style={{ color: frigateText, marginTop: 32, marginBottom: 16, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "IBM Plex Mono, monospace" }} {...props} />;
                            },
                            p: ({node, ...props}) => <p style={{ color: frigateText, fontSize: 16, lineHeight: "1.9", marginBottom: 24, fontWeight: 400 }} {...props} />,
                            li: ({node, ...props}) => <li style={{ color: frigateText, fontSize: 15, lineHeight: "1.7", marginBottom: 8 }} {...props} />
                          }}
                        >
                          {result.output}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  <div className="mb-5 grid gap-3 md:grid-cols-4">
                    {topSegments.map((segment, index) => (
                      <div
                        key={`${segment.id}-${index}`}
                        className="p-4"
                        style={{
                          border: `1px solid ${activeSegment === index ? segment.color || "#D1FF00" : "#00000010"}`,
                          backgroundColor: activeSegment === index ? "#D1FF000D" : "#F8F7EE",
                        }}
                        onMouseEnter={() => setActiveSegment(index)}
                        onMouseLeave={() => setActiveSegment(null)}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span style={{ ...mono, fontSize: 9, color: "#1A3D1A" }}>{segment.label}</span>
                          <span style={{ ...mono, fontSize: 9, color: frigateMuted }}>{Math.round((segment.influence ?? segment.impact ?? 0) * 100)}%</span>
                        </div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700, lineHeight: "155%", color: frigateText, marginBottom: 8 }}>
                          {segment.text}
                        </div>
                        <div style={{ fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: "155%", color: frigateMuted }}>
                          {buildExplanationText(segment, mode)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <ConfidenceMeter value={result.session.trust_score} label="Trust" />
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
                  <p style={{ ...mono, fontSize: 10, color: frigateMuted }}>Run the prompt to see the output.</p>
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
                {explanationSummary ? (
                  <div className="p-4" style={{ border: "1px solid #00000010", backgroundColor: "#F9F8EF" }}>
                    <div style={{ ...mono, fontSize: 10, color: "#1A3D1A", marginBottom: 10 }}>
                      {isDraftDirty ? "How The Draft Is Read" : "How The Last Run Was Read"}
                    </div>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: "165%", color: frigateMuted, marginBottom: 10 }}>
                      {explanationSummary?.overview}
                    </p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: "165%", color: frigateMuted, margin: 0 }}>
                      {explanationSummary?.segment_strategy}
                    </p>
                  </div>
                ) : null}

                {topSegments.length > 0 ? (
                  <div className="p-4" style={{ border: "1px solid #00000010", backgroundColor: "#9C9C9C06" }}>
                    <div style={{ ...mono, fontSize: 10, color: "#1A3D1A", marginBottom: 12 }}>Top Drivers</div>
                    <div className="grid gap-3">
                      {topSegments.map((segment, index) => (
                        <div
                          key={`${segment.text}-${index}`}
                          style={{ borderBottom: index === topSegments.length - 1 ? "none" : "1px solid #00000010", paddingBottom: 12 }}
                        >
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700, color: frigateText }}>{segment.label}</span>
                            <span style={{ ...mono, fontSize: 9, color: frigateMuted }}>{Math.round((segment.influence ?? 0) * 100)}%</span>
                          </div>
                          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: "160%", color: frigateText, marginBottom: 6 }}>
                            {segment.text}
                          </p>
                          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: "160%", color: frigateMuted, margin: 0 }}>
                            {buildExplanationText(segment, mode)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4" style={{ border: "1px solid #00000010" }}>
                    <span style={{ ...mono, fontSize: 10, color: frigateMuted }}>Explanation data will appear here after analysis.</span>
                  </div>
                )}

                {guidedFeedback.length > 0 && (
                  <div className="p-4" style={{ border: "1px solid #00000010" }}>
                    <div style={{ ...mono, fontSize: 10, color: "#1A3D1A", marginBottom: 10 }}>Next Steps</div>
                    {guidedFeedback.slice(0, 3).map((feedback, index) => (
                      <div key={`${index}-${feedback}`} className="mb-3 flex items-start gap-2 last:mb-0">
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
                    <ConfidenceMeter value={result?.session.trust_score || 0} label="Overall Trust" />
                    <ConfidenceMeter value={result?.session.clarity_score || 0} label="Prompt Clarity" />
                    <ConfidenceMeter value={result?.session.quality_score || 0} label="Output Quality" />
                    <ConfidenceMeter value={Math.min(98, (result?.segments.length || result?.mapping.length || 0) * 16)} label="Edit Efficiency" />
                  </div>
                </div>

                <div>
                  <div style={{ ...mono, fontSize: 10, color: frigateMuted, marginBottom: 12 }}>Run Details</div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Tokens Used", value: `${result?.tokens.length || 0}` },
                      { label: "Tracked Segments", value: `${result?.segments.length || segments.length}` },
                      { label: "Provider", value: result?.provider || "idle" },
                      { label: "Latency", value: result ? `${Math.round(result.session.response_time_ms)}ms` : "0ms" },
                      { label: "Score Source", value: scoreSourceLabel(isDraftDirty ? liveResult?.scoreDetails : result?.score_details) },
                      { label: "Model", value: (isDraftDirty ? liveResult?.scoreDetails?.model_name : result?.score_details?.model_name) || "standard" },
                    ].map((tile) => (
                      <div key={tile.label} className="p-4" style={{ backgroundColor: "#9C9C9C06", border: "1px solid #9C9C9C10" }}>
                        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 18, color: frigateText }}>{tile.value}</div>
                        <div style={{ ...mono, fontSize: 9, color: frigateMuted, marginTop: 4 }}>{tile.label}</div>
                      </div>
                    ))}
                  </div>
                  {(isDraftDirty ? liveResult?.scoreDetails?.notes : result?.score_details?.notes) ? (
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: "160%", color: frigateMuted, marginTop: 12 }}>
                      {isDraftDirty ? liveResult?.scoreDetails?.notes : result?.score_details?.notes}
                    </p>
                  ) : null}
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
                        <span style={{ ...mono, fontSize: 9, color: "#1A3D1A" }}>{Math.round(session.trust_score)}% trust</span>
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
