import { Fragment, type CSSProperties } from "react";
import { motion, useReducedMotion } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;
const viewport = { once: true, amount: 0.12, margin: "0px 0px -8% 0px" } as const;

export function WordReveal({
  text,
  delay = 0,
  lineGap = "0.2em",
  style,
}: {
  text: string;
  delay?: number;
  lineGap?: string;
  style?: CSSProperties;
}) {
  const prefersReducedMotion = useReducedMotion();
  const words = text.trim().split(/\s+/);

  return (
    <span style={{ display: "block", overflow: "hidden", ...style }}>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <motion.span
            style={{ display: "inline-block", whiteSpace: "pre" }}
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : "0.72em" }}
            animate={{ opacity: 1, y: "0em" }}
            transition={{
              duration: prefersReducedMotion ? 0.22 : 0.56,
              ease,
              delay: delay + index * 0.05,
            }}
          >
            {word}
          </motion.span>
          {index < words.length - 1 ? <span style={{ display: "inline-block", width: lineGap }} /> : null}
        </Fragment>
      ))}
    </span>
  );
}

export function FadeSlideText({
  children,
  delay = 0,
  distance = 14,
  style,
}: {
  children: string;
  delay?: number;
  distance?: number;
  style?: CSSProperties;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.span
      style={{ display: "block", ...style }}
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : distance }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.2 : 0.5, ease, delay }}
    >
      {children}
    </motion.span>
  );
}

export function FadeIn({
  children,
  delay = 0,
  className,
  direction = "up",
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "none";
  style?: CSSProperties;
}) {
  const prefersReducedMotion = useReducedMotion();
  const initialY = direction === "none" ? 0 : direction === "down" ? -16 : 16;

  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : initialY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: prefersReducedMotion ? 0.22 : 0.52, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedHeadline({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0.24 : 0.54, ease, delay }}
    >
      <div style={{ display: "block", overflow: "hidden" }}>
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : "0.78em" }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0.24 : 0.62, ease, delay: delay + 0.04 }}
          style={{ willChange: prefersReducedMotion ? "auto" : "transform, opacity" }}
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
}
