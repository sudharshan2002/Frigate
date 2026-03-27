import { motion } from "motion/react";

type HeatmapSegment = {
  label: string;
  text: string;
  kind?: string;
  influence: number;
  color: string;
};

type ImageGenerationHeatmapProps = {
  segments: HeatmapSegment[];
  activeIndex?: number | null;
  compact?: boolean;
};

const anchors = [
  { x: 24, y: 26, width: 52, height: 44 },
  { x: 73, y: 28, width: 48, height: 40 },
  { x: 52, y: 56, width: 62, height: 48 },
  { x: 26, y: 74, width: 44, height: 34 },
  { x: 78, y: 74, width: 38, height: 30 },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hotspotLabel(kind?: string) {
  switch (kind) {
    case "subject":
      return "subject focus";
    case "style":
      return "style wash";
    case "composition":
      return "layout plane";
    case "constraint":
      return "constraint edge";
    case "reference":
      return "reference anchor";
    case "output":
      return "artifact frame";
    default:
      return "detail layer";
  }
}

function trimLabel(value: string, limit: number) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1).trimEnd()}…`;
}

export function ImageGenerationHeatmap({
  segments,
  activeIndex = null,
  compact = false,
}: ImageGenerationHeatmapProps) {
  const visibleSegments = segments.slice(0, compact ? 3 : 5);
  const statusText =
    activeIndex !== null && visibleSegments[activeIndex]
      ? `${visibleSegments[activeIndex].label} in focus`
      : "prompt signals blended";

  if (visibleSegments.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,5,5,0.12) 0%, rgba(5,5,5,0.04) 32%, rgba(5,5,5,0.18) 100%)",
        }}
      />

      {visibleSegments.map((segment, index) => {
        const anchor = anchors[index % anchors.length];
        const opacity =
          activeIndex === null
            ? clamp(segment.influence * 0.9, 0.28, 0.7)
            : activeIndex === index
              ? clamp(segment.influence * 1.05, 0.45, 0.82)
              : clamp(segment.influence * 0.34, 0.12, 0.28);

        return (
          <motion.div
            key={`${segment.label}-${index}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: index * 0.06 }}
            style={{
              background: `radial-gradient(${anchor.width}% ${anchor.height}% at ${anchor.x}% ${anchor.y}%, ${hexToRgba(segment.color, opacity)} 0%, ${hexToRgba(segment.color, opacity * 0.5)} 22%, ${hexToRgba(segment.color, opacity * 0.14)} 48%, transparent 74%)`,
              mixBlendMode: "screen",
            }}
          />
        );
      })}

      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: compact ? "72px 72px" : "88px 88px",
          opacity: compact ? 0.16 : 0.22,
        }}
      />

      <div className="absolute left-4 top-4">
        <span
          style={{
            fontFamily: "'Roboto Mono', monospace",
            fontSize: compact ? 8 : 9,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#FFFFED",
            backgroundColor: "rgba(5,5,5,0.72)",
            padding: compact ? "4px 7px" : "5px 9px",
          }}
        >
          Influence Heatmap
        </span>
      </div>

      <div className="absolute right-4 top-4">
        <span
          style={{
            fontFamily: "'Roboto Mono', monospace",
            fontSize: compact ? 8 : 9,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#1A3D1A",
            backgroundColor: "rgba(209,255,0,0.88)",
            padding: compact ? "4px 7px" : "5px 9px",
          }}
        >
          {statusText}
        </span>
      </div>

      <div
        className="absolute bottom-4 left-4 right-4"
        style={{
          display: "grid",
          gap: compact ? 6 : 8,
          padding: compact ? "8px 10px" : "10px 12px",
          backgroundColor: "rgba(5,5,5,0.56)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(10px)",
        }}
      >
        {visibleSegments.map((segment, index) => {
          const isActive = activeIndex === null || activeIndex === index;
          return (
            <div
              key={`${segment.text}-${index}`}
              className="flex items-center justify-between gap-3"
              style={{ opacity: isActive ? 1 : 0.52 }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <div
                  style={{
                    width: compact ? 7 : 8,
                    height: compact ? 7 : 8,
                    borderRadius: 999,
                    backgroundColor: segment.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: compact ? 11 : 12,
                    fontWeight: 700,
                    color: "#FFFFED",
                  }}
                >
                  {segment.label}
                </span>
                {!compact ? (
                  <span
                    className="truncate"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 11,
                      color: "rgba(255,255,237,0.72)",
                    }}
                  >
                    {trimLabel(segment.text, 34)}
                  </span>
                ) : null}
              </div>
              <span
                style={{
                  fontFamily: "'Roboto Mono', monospace",
                  fontSize: compact ? 8 : 9,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#FFFFED",
                  flexShrink: 0,
                }}
              >
                {hotspotLabel(segment.kind)} {Math.round(segment.influence * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
