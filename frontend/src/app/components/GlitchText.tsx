import { useState, useRef, useEffect, useCallback } from "react";

const glitchChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";

export function GlitchText({
  children,
  className = "",
  style = {},
  as: Tag = "span",
}: {
  children: string;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof JSX.IntrinsicElements;
}) {
  const [display, setDisplay] = useState(children);
  const rafRef = useRef<number>(0);
  const original = children;

  const scramble = useCallback(() => {
    let iteration = 0;
    const len = original.length;
    const speed = 30;

    const step = () => {
      setDisplay(
        original
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < iteration) return original[i];
            return glitchChars[Math.floor(Math.random() * glitchChars.length)];
          })
          .join("")
      );
      iteration += 1 / 2;
      if (iteration < len) {
        rafRef.current = window.setTimeout(step, speed);
      } else {
        setDisplay(original);
      }
    };
    step();
  }, [original]);

  const handleEnter = () => {
    clearTimeout(rafRef.current);
    scramble();
  };

  const handleLeave = () => {
    clearTimeout(rafRef.current);
    setDisplay(original);
  };

  useEffect(() => () => clearTimeout(rafRef.current), []);

  const Component = Tag as any;

  return (
    <Component
      className={className}
      style={{ ...style, cursor: "pointer" }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {display}
    </Component>
  );
}

/* Marquee text that scrolls on hover */
export function MarqueeHoverText({
  children,
  className = "",
  style = {},
}: {
  children: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden relative ${className}`}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        ref={textRef}
        className="whitespace-nowrap"
        style={{
          display: "inline-block",
          transition: hovered ? "none" : "transform 0.4s ease-out",
          animation: hovered ? "marqueeScroll 3s linear infinite" : "none",
        }}
      >
        {hovered ? (
          <>
            <span>{children}&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;</span>
            <span>{children}&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;</span>
            <span>{children}&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;</span>
          </>
        ) : (
          children
        )}
      </div>
      <style>{`
        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  );
}
