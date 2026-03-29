import { supabase } from "./supabase";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const API_PREFIX = `${API_ROOT}/api`;
const tokenPattern = /\b[\w'-]+\b/g;
const demoModeFlag = String(import.meta.env.VITE_DEMO_MODE || "").trim().toLowerCase();

type ApiFallbackMeta = {
  isFallback?: boolean;
  fallbackMessage?: string;
};

export type GenerationMode = "text" | "image";
export type GenerationSource = "composer" | "what-if" | "api";

export type ReferenceImageInput = {
  data_url?: string | null;
  url?: string | null;
  mime_type?: string | null;
  name?: string | null;
};

export type TokenImpact = {
  token: string;
  impact: number;
};

export type PromptSegment = {
  id: string;
  label: string;
  text: string;
  kind: string;
  impact: number;
  effect: string;
  color?: string;
  influence?: number;
};

export type PromptExplanationSummary = {
  overview: string;
  segment_strategy: string;
  improvement_tip: string;
};

export type SegmentChange = {
  label: string;
  before: string;
  after: string;
  effect: string;
  change_type: "added" | "removed" | "modified" | "unchanged";
};

export type SessionRecord = ApiFallbackMeta & {
  id: number;
  prompt: string;
  output: string;
  mode: GenerationMode;
  source: GenerationSource;
  provider: string;
  response_time_ms: number;
  token_count: number;
  trust_score: number;
  clarity_score: number;
  quality_score: number;
  quality_label: string;
  difference_summary: string | null;
  created_at: string;
};

export type GenerateResponse = ApiFallbackMeta & {
  output: string;
  provider: string;
  tokens: string[];
  mapping: TokenImpact[];
  segments: PromptSegment[];
  explanation_summary: PromptExplanationSummary;
  reference_image_used: boolean;
  session: SessionRecord;
};

export type AnalyzeResponse = ApiFallbackMeta & {
  segments: PromptSegment[];
  explanation_summary: PromptExplanationSummary;
};

export type WhatIfResponse = ApiFallbackMeta & {
  difference: string;
  original_session: SessionRecord;
  modified_session: SessionRecord;
  original_segments: PromptSegment[];
  modified_segments: PromptSegment[];
  original_explanation_summary: PromptExplanationSummary;
  modified_explanation_summary: PromptExplanationSummary;
  segment_changes: SegmentChange[];
  delta: {
    confidence: number;
    clarity: number;
    quality: number;
  };
};

export type RecentRun = {
  id: number;
  prompt: string;
  mode: GenerationMode;
  provider: string;
  confidence: number;
  clarity: number;
  quality: number;
  quality_label: string;
  created_at: string;
};

export type DashboardMetricsResponse = ApiFallbackMeta & {
  avg_confidence: number;
  avg_clarity: number;
  avg_quality: number;
  avg_response_time: number;
  total_runs: number;
  trend: Array<{
    day: string;
    confidence: number;
    clarity: number;
    quality: number;
  }>;
  usage_today: Array<{
    hour: string;
    runs: number;
  }>;
  recent_runs: RecentRun[];
  system_status: Array<{
    label: string;
    value: string;
    status: string;
  }>;
  storage_bytes: number;
};

export type SessionListResponse = ApiFallbackMeta & {
  sessions: SessionRecord[];
  total_runs: number;
  storage_bytes: number;
};

let fallbackSessionId = 9000;
let fallbackSessions: SessionRecord[] | null = null;

function isDemoModeEnabled() {
  if (["1", "true", "yes", "on"].includes(demoModeFlag)) {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("demo") === "1";
}

function demoModeMessage() {
  return "Demo mode is enabled, so Frigate is showing seeded preview data.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(`${API_PREFIX}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const raw = await response.text();
    let detail = raw;
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.detail === "string") {
        detail = parsed.detail;
      }
    } catch {
      // Fall back to the raw response body when the backend did not return JSON.
    }
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function tokenizeText(text: string): string[] {
  return text.match(tokenPattern) || [];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function shiftMinutes(minutesAgo: number) {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

function toDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function trimText(value: string, limit = 140) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 3).trimEnd()}...`;
}

function normalizePrompt(prompt: string, referenceImage?: ReferenceImageInput | null) {
  if (prompt.trim()) return prompt.trim();
  if (referenceImage) return "Reference-image-driven generation";
  return "Untitled prompt";
}

function buildMockImageOutput(prompt: string, subtitle: string, referenceImageName?: string) {
  const promptTokens = tokenizeText(prompt).slice(0, 4);
  const safePrompt = escapeXml(prompt.trim().slice(0, 72) || "Frigate visual");
  const safeSubtitle = escapeXml(subtitle);
  const safeReference = escapeXml(referenceImageName || "Prompt-led");
  const chips = promptTokens
    .map((token, index) => {
      const x = 122 + index * 126;
      return `
        <rect x="${x}" y="610" width="108" height="34" rx="17" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)"/>
        <text x="${x + 16}" y="632" fill="#f8fafc" font-family="Arial, sans-serif" font-size="15">${escapeXml(token)}</text>
      `;
    })
    .join("");
  return toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#111827"/>
          <stop offset="42%" stop-color="#0f4c81"/>
          <stop offset="100%" stop-color="#d1ff00"/>
        </linearGradient>
        <radialGradient id="glowA" cx="28%" cy="34%" r="48%">
          <stop offset="0%" stop-color="rgba(125,181,255,0.55)"/>
          <stop offset="100%" stop-color="rgba(125,181,255,0)"/>
        </radialGradient>
        <radialGradient id="glowB" cx="72%" cy="66%" r="42%">
          <stop offset="0%" stop-color="rgba(209,255,0,0.38)"/>
          <stop offset="100%" stop-color="rgba(209,255,0,0)"/>
        </radialGradient>
      </defs>
      <rect width="1280" height="800" fill="url(#bg)"/>
      <rect width="1280" height="800" fill="url(#glowA)"/>
      <rect width="1280" height="800" fill="url(#glowB)"/>
      <rect x="70" y="70" width="1140" height="660" rx="36" fill="rgba(11,15,18,0.58)" stroke="rgba(255,255,255,0.16)"/>
      <path d="M142 214 C 308 120, 470 128, 598 242" fill="none" stroke="rgba(209,255,0,0.7)" stroke-width="3" stroke-linecap="round"/>
      <path d="M654 234 C 812 160, 968 176, 1098 288" fill="none" stroke="rgba(125,181,255,0.65)" stroke-width="3" stroke-linecap="round"/>
      <rect x="120" y="128" width="210" height="34" rx="17" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)"/>
      <text x="138" y="150" fill="#f8fafc" font-family="Arial, sans-serif" font-size="16" letter-spacing="2">${safeSubtitle}</text>
      <rect x="120" y="188" width="442" height="102" rx="24" fill="rgba(255,255,255,0.08)"/>
      <rect x="120" y="324" width="214" height="214" rx="24" fill="rgba(255,255,255,0.06)"/>
      <rect x="364" y="324" width="198" height="214" rx="24" fill="rgba(255,255,255,0.05)"/>
      <rect x="640" y="180" width="452" height="250" rx="28" fill="rgba(255,255,255,0.08)"/>
      <rect x="640" y="466" width="452" height="162" rx="28" fill="rgba(255,255,255,0.06)"/>
      <circle cx="808" cy="306" r="124" fill="rgba(209,255,0,0.18)"/>
      <circle cx="808" cy="306" r="78" fill="rgba(125,255,175,0.32)"/>
      <circle cx="950" cy="532" r="84" fill="rgba(255,125,125,0.2)"/>
      <rect x="696" y="514" width="188" height="8" rx="4" fill="rgba(255,255,255,0.62)"/>
      <rect x="696" y="540" width="262" height="8" rx="4" fill="rgba(255,255,255,0.22)"/>
      <rect x="696" y="566" width="214" height="8" rx="4" fill="rgba(255,255,255,0.22)"/>
      <rect x="142" y="222" width="244" height="10" rx="5" fill="#d1ff00" opacity="0.88"/>
      <text x="120" y="594" fill="#dbe4ea" font-family="Arial, sans-serif" font-size="22">${safePrompt}</text>
      ${chips}
      <rect x="960" y="126" width="132" height="30" rx="15" fill="rgba(5,5,5,0.46)" stroke="rgba(255,255,255,0.1)"/>
      <text x="978" y="146" fill="#f8fafc" font-family="Arial, sans-serif" font-size="14">ref ${safeReference}</text>
    </svg>
  `);
}

function buildMockTextOutput(prompt: string, variant = "base", referenceImageName?: string) {
  const focus = tokenizeText(prompt).slice(0, 6).join(", ") || "clarity, trust, explainability";
  const closer =
    variant === "modified"
      ? "It leans into measurable improvement, faster review cycles, and a clearer shipping story."
      : "It stays grounded in explainability, control, and safer team workflows.";
  const referenceLine = referenceImageName ? `The attached reference image keeps the visual direction anchored in ${referenceImageName}.` : null;

  return [
    "Frigate gives AI teams a clearer way to shape prompts, inspect outputs, and move from experimentation to release with confidence.",
    `Prompt mapping keeps the strongest signals visible, while trust scoring and guided comparison make ${focus} easier to review as a team.`,
    referenceLine,
    closer,
  ].filter(Boolean).join("\n\n");
}

function buildDifferenceSummary(originalPrompt: string, modifiedPrompt: string) {
  const originalTokens = new Set(tokenizeText(originalPrompt).map((token) => token.toLowerCase()));
  const modifiedTokens = new Set(tokenizeText(modifiedPrompt).map((token) => token.toLowerCase()));
  const added = [...modifiedTokens].filter((token) => !originalTokens.has(token));
  const removed = [...originalTokens].filter((token) => !modifiedTokens.has(token));

  if (added.length === 0 && removed.length === 0) {
    return "Both variants keep the same core intent, with only small phrasing changes.";
  }

  const parts: string[] = [];
  if (added.length > 0) {
    parts.push(`Variant B adds emphasis on ${added.slice(0, 4).join(", ")}.`);
  }
  if (removed.length > 0) {
    parts.push(`It reduces emphasis on ${removed.slice(0, 4).join(", ")}.`);
  }
  return parts.join(" ");
}

function buildSegments(prompt: string, mode: GenerationMode, referenceImage?: ReferenceImageInput | null): PromptSegment[] {
  const normalizedPrompt = normalizePrompt(prompt, referenceImage);
  const rawClauses = normalizedPrompt
    .split(/[,\n.;:]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const clauses = (rawClauses.length > 0 ? rawClauses : [normalizedPrompt]).slice(0, 5);
  if (referenceImage) {
    clauses.push("Use the attached reference image as a visual anchor.");
  }

  return clauses.slice(0, 6).map((clause, index) => {
    const lower = clause.toLowerCase();
    const kind =
      index === 0
        ? "subject"
        : lower.includes("image") || lower.includes("reference")
          ? "reference"
          : /cinematic|editorial|premium|bright|dark|minimal|glass/.test(lower)
            ? "style"
            : /hero|dashboard|layout|overlay|ribbon|compare|grid/.test(lower)
              ? "composition"
              : /must|only|without|avoid|limit/.test(lower)
                ? "constraint"
                : /write|design|generate|create|draft|intro|announcement/.test(lower)
                  ? "output"
                  : "detail";

    const label =
      kind === "subject"
        ? "Subject"
        : kind === "style"
          ? "Style"
          : kind === "composition"
            ? "Composition"
            : kind === "constraint"
              ? "Constraint"
              : kind === "output"
                ? "Output"
                : kind === "reference"
                  ? "Reference"
                  : "Detail";

    const impact = Number(clamp(0.9 - index * 0.1 + (kind === "reference" ? 0.02 : 0), 0.34, 0.96).toFixed(2));
    const effect =
      kind === "subject"
        ? `This is the main ${mode === "image" ? "scene" : "content"} anchor, so it usually shapes the first draft direction.`
        : kind === "style"
          ? "This segment controls the aesthetic treatment and emotional tone."
          : kind === "composition"
            ? "This segment changes the layout, framing, or interaction structure."
            : kind === "constraint"
              ? "This segment narrows the search space and improves predictability."
              : kind === "output"
                ? `This tells the model what sort of ${mode === "image" ? "visual artifact" : "written artifact"} to produce.`
                : kind === "reference"
                  ? "This uses the attached image as an anchor, so other segments adapt around it."
                  : "This adds secondary detail that fine-tunes the result.";

    return {
      id: `segment-${index + 1}`,
      label,
      text: trimText(clause, 120),
      kind,
      impact,
      effect,
    };
  });
}

function buildMappingFromSegments(segments: PromptSegment[]): TokenImpact[] {
  return segments.slice(0, 6).map((segment) => ({
    token: trimText(segment.text, 38),
    impact: segment.impact,
  }));
}

function buildExplanationSummary(
  prompt: string,
  mode: GenerationMode,
  referenceImage?: ReferenceImageInput | null,
): PromptExplanationSummary {
  return {
    overview: prompt.trim()
      ? "Frigate is reading this prompt as a stack of steering instructions instead of one flat sentence."
      : "Frigate is leaning on the attached image as the main anchor and using text as optional guidance.",
    segment_strategy: `The strongest segments usually establish the ${mode === "image" ? "subject, look, and composition" : "artifact, framing, and tone"} first, then detail segments refine the finish.`,
    improvement_tip: referenceImage
      ? "If you want tighter results, keep the reference image but strengthen one text segment with a concrete constraint."
      : "If you want tighter results, add one explicit constraint or attach a reference image to anchor the style.",
  };
}

function buildSegmentChanges(originalSegments: PromptSegment[], modifiedSegments: PromptSegment[]): SegmentChange[] {
  const originalByLabel = new Map(originalSegments.map((segment) => [segment.label, segment]));
  const modifiedByLabel = new Map(modifiedSegments.map((segment) => [segment.label, segment]));
  const orderedLabels = Array.from(new Set([...originalSegments, ...modifiedSegments].map((segment) => segment.label)));

  return orderedLabels.map((label) => {
    const before = originalByLabel.get(label);
    const after = modifiedByLabel.get(label);
    const change_type =
      before && after
        ? before.text === after.text
          ? "unchanged"
          : "modified"
        : before
          ? "removed"
          : "added";

    return {
      label,
      before: before?.text || "Not present in variant A.",
      after: after?.text || "Not present in variant B.",
      change_type,
      effect:
        change_type === "unchanged"
          ? "This segment stayed stable, so it is probably not driving the visible change."
          : change_type === "modified"
            ? `The "${label}" segment changed wording, so it likely contributes to the delta.`
            : change_type === "added"
              ? `The "${label}" segment was introduced in variant B, adding a new steering signal.`
              : `The "${label}" segment was removed from variant B, reducing its influence.`,
    };
  });
}

function estimateScores(prompt: string, output: string, mode: GenerationMode) {
  const promptTokens = new Set(tokenizeText(prompt).map((token) => token.toLowerCase()));
  const outputTokens = new Set(tokenizeText(output).map((token) => token.toLowerCase()));
  const overlap = promptTokens.size
    ? [...promptTokens].filter((token) => outputTokens.has(token)).length / promptTokens.size
    : 0.45;
  const detail = clamp(prompt.trim().length / 160, 0.22, 1);
  const length = clamp(output.trim().length / (mode === "image" ? 160 : 260), 0.25, 1);

  const trust = clamp(61 + overlap * 20 + detail * 13, 60, 97);
  const clarity = clamp(58 + detail * 26, 58, 98);
  const quality = clamp(63 + overlap * 14 + length * 17 + (mode === "image" ? 4 : 0), 63, 98);

  return {
    trust: Number(trust.toFixed(2)),
    clarity: Number(clarity.toFixed(2)),
    quality: Number(quality.toFixed(2)),
  };
}

function qualityLabel(score: number) {
  if (score >= 92) return "Excellent";
  if (score >= 82) return "Good";
  if (score >= 70) return "Fair";
  return "Needs Work";
}

function nextFallbackId() {
  fallbackSessionId += 1;
  return fallbackSessionId;
}

function createFallbackSession({
  prompt,
  mode,
  source,
  output,
  provider,
  createdAt,
  differenceSummary = null,
}: {
  prompt: string;
  mode: GenerationMode;
  source: GenerationSource;
  output: string;
  provider: string;
  createdAt?: string;
  differenceSummary?: string | null;
}): SessionRecord {
  const scores = estimateScores(prompt, output, mode);

  return {
    id: nextFallbackId(),
    prompt,
    output,
    mode,
    source,
    provider,
    response_time_ms: Number((mode === "image" ? 720 : 540).toFixed(2)),
    token_count: tokenizeText(prompt).length,
    trust_score: scores.trust,
    clarity_score: scores.clarity,
    quality_score: scores.quality,
    quality_label: qualityLabel(scores.quality),
    difference_summary: differenceSummary,
    created_at: createdAt || new Date().toISOString(),
    isFallback: true,
    fallbackMessage: "Live services are unavailable, so Frigate is showing preview data.",
  };
}

function ensureFallbackSessions() {
  if (fallbackSessions) {
    return fallbackSessions;
  }

  fallbackSessions = [
    createFallbackSession({
      prompt: "Design a Frigate launch hero with prompt mapping overlays and a calm cockpit mood",
      mode: "image",
      source: "composer",
      output: buildMockImageOutput("Design a Frigate launch hero with prompt mapping overlays and a calm cockpit mood", "Launch Hero"),
      provider: "preview-image",
      createdAt: shiftMinutes(14),
    }),
    createFallbackSession({
      prompt: "Write a product intro for Frigate focused on trust scoring and explainability",
      mode: "text",
      source: "composer",
      output: buildMockTextOutput("Write a product intro for Frigate focused on trust scoring and explainability"),
      provider: "preview-text",
      createdAt: shiftMinutes(37),
    }),
    createFallbackSession({
      prompt: "Compare a brighter editorial Frigate dashboard against a calm darker one",
      mode: "image",
      source: "what-if",
      output: buildMockImageOutput("Compare a brighter editorial Frigate dashboard against a calm darker one", "Comparison Preview"),
      provider: "preview-image",
      createdAt: shiftMinutes(86),
      differenceSummary: "Variant testing stayed stable while shifting the visual tone.",
    }),
  ];

  return fallbackSessions;
}

function registerFallbackSession(session: SessionRecord) {
  const sessions = ensureFallbackSessions();
  sessions.unshift(session);
  fallbackSessions = sessions.slice(0, 20);
}

function fallbackMessageFrom(error: unknown) {
  if (isDemoModeEnabled()) {
    return demoModeMessage();
  }
  const reason = error instanceof Error ? error.message : "Unable to reach the backend.";
  return `Live services are unavailable, so Frigate is showing preview data. ${reason}`;
}

function buildGenerateFallback(
  payload: { prompt: string; mode: GenerationMode; source?: GenerationSource; reference_image?: ReferenceImageInput | null },
  fallbackMessage: string,
): GenerateResponse {
  const normalizedPrompt = normalizePrompt(payload.prompt, payload.reference_image);
  const output =
    payload.mode === "image"
      ? buildMockImageOutput(normalizedPrompt, "Composer Preview", payload.reference_image?.name || undefined)
      : buildMockTextOutput(normalizedPrompt, "base", payload.reference_image?.name || undefined);
  const segments = buildSegments(payload.prompt, payload.mode, payload.reference_image);
  const session = createFallbackSession({
    prompt: normalizedPrompt,
    mode: payload.mode,
    source: payload.source || "composer",
    output,
    provider: payload.mode === "image" ? "preview-image" : "preview-text",
  });

  session.fallbackMessage = fallbackMessage;
  registerFallbackSession(session);

  return {
    output,
    provider: session.provider,
    tokens: tokenizeText(normalizedPrompt),
    mapping: buildMappingFromSegments(segments),
    segments,
    explanation_summary: buildExplanationSummary(payload.prompt, payload.mode, payload.reference_image),
    reference_image_used: Boolean(payload.reference_image),
    session,
    isFallback: true,
    fallbackMessage,
  };
}

function buildCompareFallback(
  payload: {
    original_prompt: string;
    modified_prompt: string;
    mode: GenerationMode;
    original_reference_image?: ReferenceImageInput | null;
    modified_reference_image?: ReferenceImageInput | null;
  },
  fallbackMessage: string,
): WhatIfResponse {
  const normalizedOriginal = normalizePrompt(payload.original_prompt, payload.original_reference_image);
  const normalizedModified = normalizePrompt(payload.modified_prompt, payload.modified_reference_image);
  const originalOutput =
    payload.mode === "image"
      ? buildMockImageOutput(normalizedOriginal, "Scenario A", payload.original_reference_image?.name || undefined)
      : buildMockTextOutput(normalizedOriginal, "base", payload.original_reference_image?.name || undefined);
  const modifiedOutput =
    payload.mode === "image"
      ? buildMockImageOutput(normalizedModified, "Scenario B", payload.modified_reference_image?.name || undefined)
      : buildMockTextOutput(normalizedModified, "modified", payload.modified_reference_image?.name || undefined);
  const difference = buildDifferenceSummary(normalizedOriginal, normalizedModified);
  const originalSegments = buildSegments(payload.original_prompt, payload.mode, payload.original_reference_image);
  const modifiedSegments = buildSegments(payload.modified_prompt, payload.mode, payload.modified_reference_image);
  const originalSession = createFallbackSession({
    prompt: normalizedOriginal,
    mode: payload.mode,
    source: "what-if",
    output: originalOutput,
    provider: payload.mode === "image" ? "preview-image" : "preview-text",
    differenceSummary: difference,
  });
  const modifiedSession = createFallbackSession({
    prompt: normalizedModified,
    mode: payload.mode,
    source: "what-if",
    output: modifiedOutput,
    provider: payload.mode === "image" ? "preview-image" : "preview-text",
    differenceSummary: difference,
  });

  originalSession.fallbackMessage = fallbackMessage;
  modifiedSession.fallbackMessage = fallbackMessage;
  registerFallbackSession(modifiedSession);
  registerFallbackSession(originalSession);

  return {
    difference,
    original_session: originalSession,
    modified_session: modifiedSession,
    original_segments: originalSegments,
    modified_segments: modifiedSegments,
    original_explanation_summary: buildExplanationSummary(payload.original_prompt, payload.mode, payload.original_reference_image),
    modified_explanation_summary: buildExplanationSummary(payload.modified_prompt, payload.mode, payload.modified_reference_image),
    segment_changes: buildSegmentChanges(originalSegments, modifiedSegments),
    delta: {
      confidence: Number((modifiedSession.trust_score - originalSession.trust_score).toFixed(2)),
      clarity: Number((modifiedSession.clarity_score - originalSession.clarity_score).toFixed(2)),
      quality: Number((modifiedSession.quality_score - originalSession.quality_score).toFixed(2)),
    },
    isFallback: true,
    fallbackMessage,
  };
}

function buildSessionsFallback(limit = 12, fallbackMessage: string): SessionListResponse {
  const sessions = ensureFallbackSessions().slice(0, limit);
  const storageBytes = sessions.reduce((sum, session) => sum + session.prompt.length + session.output.length, 0);

  return {
    sessions,
    total_runs: sessions.length,
    storage_bytes: storageBytes,
    isFallback: true,
    fallbackMessage,
  };
}

function buildDashboardFallback(fallbackMessage: string): DashboardMetricsResponse {
  const sessions = ensureFallbackSessions();
  const avgConfidence = sessions.reduce((sum, session) => sum + session.trust_score, 0) / sessions.length;
  const avgClarity = sessions.reduce((sum, session) => sum + session.clarity_score, 0) / sessions.length;
  const avgQuality = sessions.reduce((sum, session) => sum + session.quality_score, 0) / sessions.length;
  const avgResponse = sessions.reduce((sum, session) => sum + session.response_time_ms, 0) / sessions.length;
  const now = new Date();
  const trend = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (6 - index));
    const label = day.toLocaleDateString("en-US", { weekday: "short" });
    const base = 74 + index * 1.6;
    return {
      day: label,
      confidence: Number(clamp(base + 5, 68, 95).toFixed(2)),
      clarity: Number(clamp(base + 2, 66, 94).toFixed(2)),
      quality: Number(clamp(base + 3.5, 67, 95).toFixed(2)),
    };
  });
  const usageToday = Array.from({ length: 8 }, (_, index) => ({
    hour: `${`${index * 3}`.padStart(2, "0")}:00`,
    runs: index === 2 ? 2 : index === 4 ? 3 : index === 5 ? 1 : 0,
  }));
  const storageBytes = sessions.reduce((sum, session) => sum + session.prompt.length + session.output.length, 0);

  return {
    avg_confidence: Number(avgConfidence.toFixed(2)),
    avg_clarity: Number(avgClarity.toFixed(2)),
    avg_quality: Number(avgQuality.toFixed(2)),
    avg_response_time: Number(avgResponse.toFixed(2)),
    total_runs: sessions.length,
    trend,
    usage_today: usageToday,
    recent_runs: sessions.slice(0, 5).map((session) => ({
      id: session.id,
      prompt: session.prompt,
      mode: session.mode,
      provider: session.provider,
      confidence: session.trust_score,
      clarity: session.clarity_score,
      quality: session.quality_score,
      quality_label: session.quality_label,
      created_at: session.created_at,
    })),
    system_status: [
      { label: "Backend", value: "Preview Mode", status: "Fallback" },
      { label: "Text Provider", value: "preview-text", status: "Preview" },
      { label: "Image Provider", value: "preview-image", status: "Preview" },
      { label: "Storage Used", value: formatStorage(storageBytes), status: "Local Memory" },
    ],
    storage_bytes: storageBytes,
    isFallback: true,
    fallbackMessage,
  };
}

export const api = {
  async generate(payload: { prompt: string; mode: GenerationMode; source?: GenerationSource; reference_image?: ReferenceImageInput | null }) {
    if (isDemoModeEnabled()) {
      return buildGenerateFallback(payload, demoModeMessage());
    }

    try {
      return await request<GenerateResponse>("/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: payload.prompt,
          mode: payload.mode,
          source: payload.source || "composer",
          reference_image: payload.reference_image || null,
          include_multimodal: false,
          include_what_if: false,
          include_heatmap: false,
        }),
      });
    } catch (error) {
      return buildGenerateFallback(payload, fallbackMessageFrom(error));
    }
  },
  async compare(payload: {
    original_prompt: string;
    modified_prompt: string;
    mode: GenerationMode;
    original_reference_image?: ReferenceImageInput | null;
    modified_reference_image?: ReferenceImageInput | null;
  }) {
    if (isDemoModeEnabled()) {
      return buildCompareFallback(payload, demoModeMessage());
    }

    try {
      return await request<WhatIfResponse>("/what-if", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          original_reference_image: payload.original_reference_image || null,
          modified_reference_image: payload.modified_reference_image || null,
        }),
      });
    } catch (error) {
      return buildCompareFallback(payload, fallbackMessageFrom(error));
    }
  },
  async dashboard() {
    if (isDemoModeEnabled()) {
      return buildDashboardFallback(demoModeMessage());
    }

    try {
      return await request<DashboardMetricsResponse>("/dashboard");
    } catch (error) {
      return buildDashboardFallback(fallbackMessageFrom(error));
    }
  },
  async sessions(limit = 12) {
    if (isDemoModeEnabled()) {
      return buildSessionsFallback(limit, demoModeMessage());
    }

    try {
      return await request<SessionListResponse>(`/sessions?limit=${limit}`);
    } catch (error) {
      return buildSessionsFallback(limit, fallbackMessageFrom(error));
    }
  },
  async analyze(payload: { prompt: string; mode: GenerationMode }) {
    if (isDemoModeEnabled()) {
      const segments = buildSegments(payload.prompt, payload.mode);
      return {
        segments,
        explanation_summary: buildExplanationSummary(payload.prompt, payload.mode),
        isFallback: true,
        fallbackMessage: demoModeMessage(),
      };
    }

    try {
      return await request<AnalyzeResponse>("/analyze", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const segments = buildSegments(payload.prompt, payload.mode);
      return {
        segments,
        explanation_summary: buildExplanationSummary(payload.prompt, payload.mode),
        isFallback: true,
        fallbackMessage: fallbackMessageFrom(error),
      };
    }
  },
};

export function isDemoModeActive() {
  return isDemoModeEnabled();
}

export function formatRelativeTime(value: string): string {
  const createdAt = new Date(value);
  const now = new Date();
  const seconds = Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 1000));

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function formatStorage(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}
