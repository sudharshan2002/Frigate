const grainTexture =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")";

function getGrainStyle(opacity: number) {
  return {
    backgroundImage: grainTexture,
    backgroundRepeat: "repeat",
    backgroundSize: "220px 220px",
    mixBlendMode: "soft-light" as const,
    opacity,
  };
}

export function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9998]"
      style={getGrainStyle(0.18)}
    />
  );
}

export function GrainLocal({ opacity = 0.06, className = "" }: { opacity?: number; className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={getGrainStyle(opacity)}
    />
  );
}
