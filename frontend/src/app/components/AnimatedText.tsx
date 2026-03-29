import { motion } from "motion/react";
import { useInView } from "./useInView";

export function AnimatedHeadline({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView(0.2);

  // Extract text content for word splitting
  const getText = (node: React.ReactNode): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (!node) return "";
    if (Array.isArray(node)) return node.map(getText).join("");
    if (typeof node === "object" && "props" in node) {
      return getText((node as React.ReactElement<{ children?: React.ReactNode }>).props.children);
    }
    return "";
  };

  // Get the style from the child span if it exists
  const getStyle = (node: React.ReactNode): React.CSSProperties | undefined => {
    if (typeof node === "object" && node && "props" in node) {
      return (node as React.ReactElement<{ style?: React.CSSProperties }>).props.style;
    }
    return undefined;
  };

  const text = getText(children);
  const style = getStyle(children);
  const words = text.split(" ").filter(Boolean);

  return (
    <div ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.3em]"
          style={style}
          initial={{ opacity: 0.15, filter: "blur(6px)", y: 20 }}
          animate={
            inView
              ? { opacity: 1, filter: "blur(0px)", y: 0 }
              : { opacity: 0.15, filter: "blur(6px)", y: 20 }
          }
          transition={{
            opacity: { duration: 0.6, ease: "easeOut", delay: delay + i * 0.06 },
            filter: { duration: 0.6, ease: "easeOut", delay: delay + i * 0.06 },
            y: { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: delay + i * 0.06 },
          }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
}

export function FadeIn({
  children,
  className = "",
  delay = 0,
  direction = "up",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
  style?: React.CSSProperties;
}) {
  const { ref, inView } = useInView(0.15);
  const initial: Record<string, number> = { opacity: 0 };
  if (direction === "up") initial.y = 30;
  if (direction === "left") initial.x = -15;
  if (direction === "right") initial.x = 15;

  const animate: Record<string, number> = { opacity: 1, y: 0, x: 0 };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={inView ? animate : initial}
      transition={{
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
        delay,
      }}
      style={style}
    >
      {children}
    </motion.div>
  );
}