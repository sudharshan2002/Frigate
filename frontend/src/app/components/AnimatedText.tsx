import { Fragment, type CSSProperties } from "react";
import { motion } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

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
  const words = text.trim().split(/\s+/);

  return (
    <span style={{ display: "block", overflow: "hidden", ...style }}>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <motion.span
            style={{ display: "inline-block", whiteSpace: "pre" }}
            initial={{ opacity: 0, y: "0.9em" }}
            animate={{ opacity: 1, y: "0em" }}
            transition={{ duration: 0.65, ease, delay: delay + index * 0.06 }}
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
  return (
    <motion.span
      style={{ display: "block", ...style }}
      initial={{ opacity: 0, y: distance }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.58, ease, delay }}
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
  const initialY = direction === "none" ? 0 : direction === "down" ? -16 : 16;

  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: initialY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.58, ease, delay }}
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
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.72, ease, delay }}
    >
      <motion.div
        initial={{ clipPath: "inset(0 0 100% 0)" }}
        whileInView={{ clipPath: "inset(0 0 0% 0)" }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.8, ease, delay: delay + 0.06 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
