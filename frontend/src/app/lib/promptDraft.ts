import type { GenerationMode, PromptExplanationSummary, PromptSegment } from "./api";

const STYLE_PATTERN = /\b(cinematic|editorial|premium|minimal|glass|bright|dark|moody|clean|bold|soft|industrial|schematic|luminous|vibrant|matte|neon|realistic|abstract|stylized)\b/i;
const COMPOSITION_PATTERN = /\b(hero|dashboard|layout|overlay|ribbon|compare|grid|frame|split|side-by-side|timeline|panel|center|aligned|spaced|composition|format|macro|wide|close-up)\b/i;
const CONSTRAINT_PATTERN = /\b(must|only|without|avoid|limit|keep|restrict|exactly|no|prevent|never|ensure|always|mandatory)\b/i;
const OUTPUT_PATTERN = /\b(write|design|generate|create|draft|intro|summary|announcement|hero|headline|copy|email|script|prompt|code|post|letter|article|blog)\b/i;
const TONE_PATTERN = /\b(professional|casual|friendly|assertive|technical|persuasive|urgent|funny|engaging|formal|warm|polite|direct)\b/i;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function trimText(value: string, limit = 120) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 3).trimEnd()}...`;
}

function classifyClause(clause: string, index: number) {
  const lowered = clause.toLowerCase();

  if (index === 0) return { kind: "subject", label: "Subject" };
  if (CONSTRAINT_PATTERN.test(lowered)) return { kind: "constraint", label: "Constraint" };
  if (OUTPUT_PATTERN.test(lowered)) return { kind: "output", label: "Output" };
  if (TONE_PATTERN.test(lowered)) return { kind: "tone", label: "Tone" };
  if (STYLE_PATTERN.test(lowered)) return { kind: "style", label: "Style" };
  if (COMPOSITION_PATTERN.test(lowered)) return { kind: "composition", label: "Composition" };
  return { kind: "detail", label: "Detail" };
}

function buildEffect(kind: string, mode: GenerationMode) {
  if (kind === "subject") {
    return `This is the main ${mode === "image" ? "scene" : "content"} anchor, so it usually sets the direction first.`;
  }
  if (kind === "style") {
    return "This segment controls the overall tone, finish, and aesthetic treatment.";
  }
  if (kind === "tone") {
    return "This segment adjusts the emotional resonance and communication style of the text.";
  }
  if (kind === "composition") {
    return "This segment steers layout, framing, or how the output is structured.";
  }
  if (kind === "constraint") {
    return "This segment narrows the search space and makes the result easier to predict.";
  }
  if (kind === "output") {
    return `This tells the model what kind of ${mode === "image" ? "visual" : "written"} artifact to produce.`;
  }
  return "This adds supporting detail that fine-tunes the final result.";
}

export function buildDraftSegments(prompt: string, mode: GenerationMode): PromptSegment[] {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const clauses = normalized
    .split(/[,\n.;:]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 5);

  const source = clauses.length > 0 ? clauses : [normalized];

  return source.map((clause, index) => {
    const classification = classifyClause(clause, index);

    return {
      id: `draft-segment-${index + 1}`,
      label: classification.label,
      text: trimText(clause),
      kind: classification.kind,
      impact: Number(clamp(0.9 - index * 0.1, 0.36, 0.96).toFixed(2)),
      effect: buildEffect(classification.kind, mode),
    };
  });
}

export function buildDraftExplanationSummary(prompt: string, mode: GenerationMode): PromptExplanationSummary {
  if (!prompt.trim()) {
    return {
      overview: "Start typing and Frigate will break the draft into visible steering segments immediately.",
      segment_strategy: `The strongest segments usually establish the ${mode === "image" ? "subject, look, and composition" : "artifact, framing, and tone"} first, then the lighter segments tune the finish.`,
      improvement_tip: "Add one concrete subject or constraint to make the live segmentation more useful.",
    };
  }

  const segments = buildDraftSegments(prompt, mode);
  const strongest = segments[0]?.label.toLowerCase() || "subject";

  return {
    overview: "Frigate is reading this draft as a stack of steering instructions instead of one flat sentence.",
    segment_strategy: `Right now the draft is led by the ${strongest} layer, with the later clauses refining the ${mode === "image" ? "look and framing" : "wording and emphasis"}.`,
    improvement_tip:
      segments.length >= 3
        ? "If you want tighter behavior, add one explicit constraint instead of another descriptive phrase."
        : "Add one more concrete clause if you want clearer separation between the steering segments.",
  };
}

export function buildDraftFeedback(prompt: string, mode: GenerationMode, segments: PromptSegment[]): string[] {
  if (!prompt.trim()) {
    return ["Type a prompt to see Frigate segment the draft before you run it."];
  }

  const strongest = segments[0];
  const hasConstraint = segments.some((segment) => segment.kind === "constraint");
  const hasStyle = segments.some((segment) => segment.kind === "style");
  const hasTone = segments.some((segment) => segment.kind === "tone");
  const feedback = [];

  if (strongest) {
    feedback.push(`"${strongest.text}" is currently acting as the main steering segment.`);
  }
  if (!hasConstraint) {
    feedback.push("Add one hard constraint if you want the output to behave more predictably.");
  }
  if (mode === "image" && !hasStyle) {
    feedback.push("Add a style cue if you want clearer control over the visual treatment.");
  }
  if (mode === "text" && !hasTone) {
    feedback.push("Add a tone keyword (like professional or casual) to better control the voice.");
  }
  if (mode === "text" && segments.length < 3) {
    feedback.push("Add one more clause to separate the subject, tone, and intended outcome.");
  }
  if (feedback.length < 3) {
    feedback.push("The live segmentation is stable enough to support a clean next run.");
  }

  return feedback;
}
