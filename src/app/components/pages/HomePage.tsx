import { useState, useRef, useEffect, type ReactNode } from "react";
import { motion, useScroll, useTransform, useMotionTemplate, useSpring, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { AnimatedHeadline, FadeIn } from "../AnimatedText";
import { GrainLocal } from "../GrainOverlay";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import {
  Sparkles, Eye, Layers, BarChart3, ArrowRight, Zap,
  Shield, GitCompare, Play, Bot, AlertTriangle, Activity, Wrench, Headphones, X
} from "lucide-react";

const mono: React.CSSProperties = {
  fontFamily: "'Roboto Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const frigateLight = "#F5F4E7";
const frigateText = "#050505";
const frigateMuted = "#686868";
const frigateSoft = "#A8A8A1";

function BlurReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, filter: "blur(12px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

const sectionLabel = (num: string, title: string, light = false) => (
  <div className="flex items-center gap-2 mb-8" style={{ ...mono, fontSize: 10, color: light ? "#686868" : "#686868" }}>
    <span style={{ color: light ? "#FFFFED" : "#050505", opacity: 0.3 }}>[{num}]</span>
    <span style={{ opacity: 0.7 }}>{title}</span>
  </div>
);

/* ===== LOGO BAR ===== */
function LogoBar() {
  const logos = [
    { name: "TEXT SYSTEMS", icon: "+" },
    { name: "VISION WORKFLOWS", icon: "O" },
    { name: "MULTIMODAL TEAMS", icon: "[]" },
    { name: "PRODUCT OPS", icon: "X" }
  ];
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 w-full"
      style={{
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {logos.map((logo, i) => (
        <FadeIn key={logo.name} delay={0.8 + i * 0.06} direction="none" className="col-span-1 flex items-center justify-center py-6 md:py-8">
          <div className="flex items-center cursor-default opacity-70 transition-opacity hover:opacity-100">
            <span style={{ fontSize: 18, marginRight: 8, color: "#050505" }}>{logo.icon}</span>
            <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 15, color: "#050505", letterSpacing: "-0.02em" }}>{logo.name}</span>
          </div>
        </FadeIn>
      ))}
    </div>
  );
}

/* ===== HERO ===== */
function Hero() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <section className="relative w-full overflow-hidden" ref={heroRef} style={{ backgroundColor: "#060606", minHeight: "100vh" }}>
      <GrainLocal opacity={0.16} />

      {/* Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none flex justify-center z-0 mx-auto"
        style={{ maxWidth: 1920, padding: "0 clamp(20px, 3vw, 48px)" }}
      >
        <div className="w-full h-full grid grid-cols-4">
          <div className="border-r border-[rgba(255,255,255,0.06)]" />
          <div className="border-r border-[rgba(255,255,255,0.06)]" />
          <div className="border-r border-[rgba(255,255,255,0.06)]" />
          <div />
        </div>
      </div>

      {/* Giant watermark text in background */}
      <div
        className="absolute bottom-[-10vh] left-0 right-0 pointer-events-none select-none overflow-hidden flex justify-center"
        style={{
          fontFamily: "'Söhne', Inter, sans-serif",
          fontWeight: 900,
          fontSize: "clamp(7rem, 26vw, 32rem)",
          lineHeight: "90%",
          letterSpacing: "-0.05em",
          color: "#FFFFED",
          opacity: 0.03,
          textTransform: "uppercase",
        }}
      >
        FRIGATE
      </div>

      <div
        className="relative z-10 mx-auto grid grid-cols-1 md:grid-cols-4 h-full"
        style={{
          maxWidth: 1920,
          padding: "clamp(160px, 22vh, 240px) clamp(20px, 3vw, 48px) clamp(80px, 10vh, 120px)",
          minHeight: "100vh"
        }}
      >
        {/* Main Content: Spans Col 1, 2, and 3 */}
        <div className="col-span-1 md:col-span-3 flex flex-col justify-center z-10">

          <FadeIn delay={1.4}>
            <div
              className="mb-8"
              style={{
                ...mono,
                fontSize: 11,
                color: "#D1FF00",
                fontWeight: 700,
                letterSpacing: "0.05em"
              }}
            >
              [01] EXPLAIN THE OUTPUT_
            </div>
          </FadeIn>

          {/* Adjust width so it doesn't force a stretch. The max font scale is lowered. */}
          <div className="mb-10 block">
            <h1
              className="flex flex-col"
              style={{
                fontFamily: "'Söhne', Inter, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(1.55rem, 3.1vw, 3.7rem)",
                lineHeight: "1",
                letterSpacing: "-0.015em",
                color: "#F4F4E8",
                margin: 0,
                maxWidth: 820,
              }}
            >
              {/* Line 1 */}
              <div style={{ overflow: "hidden", paddingBottom: "0.08em", width: "100%", maxWidth: "100%" }}>
                <motion.div
                  initial={{ y: "110%", rotateZ: 2 }}
                  animate={{ y: "0%", rotateZ: 0 }}
                  transition={{ delay: 1.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: "flex", flexWrap: "wrap", columnGap: "0.16em", rowGap: "0.08em", maxWidth: "100%", transformOrigin: "left bottom" }}
                >
                  <span>SEE</span>
                  <span>HOW</span>
                  <span>PROMPTS</span>
                  <span>SHAPE</span>
                  <span style={{ color: "#D1FF00" }}>[OUTPUTS]</span>
                </motion.div>
              </div>
              {/* Line 2 */}
              <div style={{ overflow: "hidden", paddingBottom: "0.08em", marginTop: "-0.04em", width: "100%", maxWidth: "100%" }}>
                <motion.div
                  initial={{ y: "110%", rotateZ: 2 }}
                  animate={{ y: "0%", rotateZ: 0 }}
                  transition={{ delay: 1.55, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: "flex", flexWrap: "wrap", columnGap: "0.16em", rowGap: "0.08em", maxWidth: "100%", transformOrigin: "left bottom" }}
                >
                  <span>THEN</span>
                  <span>EDIT</span>
                  <span>WITH</span>
                  <span style={{ color: "#D1FF00" }}>[CONTROL]</span>
                  <span>LIVE.</span>
                </motion.div>
              </div>
            </h1>
          </div>

          <FadeIn delay={1.9}>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "clamp(0.9rem, 1vw, 15px)",
                lineHeight: "1.6",
                color: "#F4F4E8",
                opacity: 0.5,
                maxWidth: 440,
                marginBottom: 60
              }}
            >
              <span className="font-semibold text-[#F4F4E8]" style={{ opacity: 1 }}>Frigate is an explainable, interactive AI platform</span> for text, image, and multimodal generation that maps prompt segments to outputs and guides the next edit in real time.
            </p>
          </FadeIn>

          {/* Button: Exactly 1/3 of the 3-column span = exactly width of Column 1 */}
          <FadeIn delay={2.1} className="w-full sm:w-auto md:w-1/3 relative bg-[#0b0b0b]">
            <button
              onClick={() => navigate("/composer")}
              className="cursor-pointer group flex items-center justify-between relative"
              style={{
                width: "100%", // Exactly matches the width of Col 1
                minHeight: "75px",
                padding: "0 28px",
                border: "none",
                outline: "none",
                borderBottom: "4px solid #D1FF00",
                backgroundColor: "transparent"
              }}
            >
              <div className="absolute inset-0 bg-[#D1FF00] origin-bottom transform scale-y-0 transition-transform duration-300 group-hover:scale-y-100 z-0 pointer-events-none" />
              <span
                style={{
                  ...mono,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#F4F4E8",
                  letterSpacing: "0.05em",
                }}
                className="relative z-10 group-hover:text-[#050505] transition-colors duration-300"
              >
                OPEN FRIGATE
              </span>
              <span
                style={{
                  color: "#D1FF00",
                  fontSize: 22,
                  fontWeight: 900,
                  marginTop: "-2px"
                }}
                className="relative z-10 group-hover:text-[#050505] transition-colors duration-300 transform group-hover:translate-x-1"
              >
                &gt;
              </span>
            </button>
          </FadeIn>

        </div>

        {/* Column 4: Side explainer */}
        <div className="col-span-1 md:col-span-1 flex flex-col justify-end px-0 md:pl-8 lg:pl-10 pb-8 z-10 mt-16 md:mt-0">
          <FadeIn delay={2.2}>
            <div
              style={{
                ...mono,
                fontSize: 10,
                lineHeight: "1.6",
                color: "#F4F4E8",
                marginBottom: 20,
                textTransform: "uppercase"
              }}
            >
              <span className="opacity-60">PROMPTS SHOULD BE REVIEWABLE.</span> <span className="font-bold opacity-100">FRIGATE KEEPS THE DECISION PATH VISIBLE.</span>
            </div>

            <div
              className="relative w-full overflow-hidden rounded-sm border border-[#ffffff15] bg-[#111] text-left"
              style={{ maxWidth: 360, padding: 24 }}
            >
              <div
                className="absolute top-0 left-0 h-[3px] w-full"
                style={{ background: "linear-gradient(90deg, #D1FF00 0%, rgba(209,255,0,0.12) 100%)" }}
              />

              <div style={{ ...mono, fontSize: 9, color: "#F4F4E8", opacity: 0.5, marginBottom: 18 }}>
                [Live View]
              </div>

              <div
                style={{
                  fontFamily: "'TASA Orbiter', Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(1.25rem, 2vw, 1.7rem)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.045em",
                  textTransform: "uppercase",
                  color: "#F4F4E8",
                  maxWidth: 260,
                  marginBottom: 14,
                }}
              >
                One workspace for prompt, output, and trace.
              </div>

              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: "rgba(244,244,232,0.62)",
                  margin: "0 0 22px 0",
                }}
              >
                Frigate keeps the important parts of the workflow in view: what changed, what mattered most, and how confident the team should feel about the result.
              </p>

              <div className="space-y-3">
                <div
                  className="flex items-start gap-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14 }}
                >
                  <div className="mt-[5px] h-[7px] w-[7px] rounded-full bg-[#D1FF00]" />
                  <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: 1.5, color: "rgba(244,244,232,0.7)" }}>
                    Prompt influence stays visible at the token and segment level.
                  </p>
                </div>

                <div
                  className="flex items-start gap-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14 }}
                >
                  <div className="mt-[5px] h-[7px] w-[7px] rounded-full bg-[#7DFFAF]" />
                  <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: 1.5, color: "rgba(244,244,232,0.7)" }}>
                    Side-by-side comparisons make revisions easier to explain in review.
                  </p>
                </div>

                <div
                  className="flex items-start gap-3"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14 }}
                >
                  <div className="mt-[5px] h-[7px] w-[7px] rounded-full bg-[#7DB5FF]" />
                  <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: 1.5, color: "rgba(244,244,232,0.7)" }}>
                    Trust, clarity, and quality signals stay attached to every run.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/composer")}
                className="mt-6 inline-flex items-center gap-2 border-none bg-transparent p-0 cursor-pointer"
                style={{ ...mono, fontSize: 10, color: "#D1FF00" }}
              >
                Open the workspace
                <ArrowRight size={12} />
              </button>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ===== MANIFESTO / WHO FRIGATE IS ===== */

function ScrollRevealHeadline() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start 75%", "end 30%"]
  });
  const primaryOpacity = useTransform(scrollYProgress, [0, 0.42, 0.58, 0.66], [1, 1, 0.15, 0]);
  const primaryY = useTransform(scrollYProgress, [0.42, 0.66], [0, -44]);
  const primaryBlur = useTransform(scrollYProgress, [0.46, 0.66], ["blur(0px)", "blur(14px)"]);
  const secondaryOpacity = useTransform(scrollYProgress, [0.5, 0.68, 0.82], [0, 0.85, 1]);
  const secondaryY = useTransform(scrollYProgress, [0.5, 0.82], [44, 0]);
  const secondaryScale = useTransform(scrollYProgress, [0.5, 0.82], [0.96, 1]);

  return (
    <div
      ref={container}
      className="relative w-full"
      style={{
        fontFamily: "'Söhne', Inter, sans-serif",
        minHeight: "clamp(10rem, 20vw, 16rem)"
      }}
    >
      <motion.h2
        className="absolute inset-0 flex flex-col"
        style={{
          fontFamily: "'TASA Orbiter', Inter, sans-serif",
          fontWeight: 900,
          fontSize: "clamp(1.35rem, 3.05vw, 52px)",
          lineHeight: "1.05",
          letterSpacing: "-0.025em",
          margin: 0,
          textTransform: "uppercase",
          opacity: primaryOpacity,
          y: primaryY,
          filter: primaryBlur
        }}
      >
        <span>MOST AI TOOLS STILL HIDE THE WHY.</span>
        <span>YOU SEE AN OUTPUT, NOT THE REASON.</span>
      </motion.h2>
      <motion.div
        className="absolute inset-0 flex items-center"
        style={{
          opacity: secondaryOpacity,
          y: secondaryY,
          scale: secondaryScale
        }}
      >
        <h2
          style={{
            fontFamily: "'TASA Orbiter', Inter, sans-serif",
            fontWeight: 900,
            fontSize: "clamp(1.5rem, 3.35vw, 58px)",
            lineHeight: "0.98",
            letterSpacing: "-0.04em",
            margin: 0,
            textTransform: "uppercase",
            color: "#050505",
            maxWidth: "16ch"
          }}
        >
          Frigate eliminates them all.
        </h2>
      </motion.div>
    </div>
  );
}

function ManifestoScrollChar({ char, scrollYProgress, charIndex, totalChars }: {
  char: string; scrollYProgress: any; charIndex: number; totalChars: number
}) {
  const step = 1 / totalChars;
  const start = (charIndex / totalChars) * 0.92;

  const p1 = start;
  const p2 = start + (step * 0.10);
  const p3 = start + (step * 0.20);
  const p4 = start + (step * 8);
  const p5 = start + (step * 9);

  const color = useTransform(
    scrollYProgress,
    [0, p1, p2, p3, p4, p5, 1],
    [
      "rgba(5,5,5,0.10)",
      "rgba(5,5,5,0.10)",
      "rgba(5,5,5,0.45)",
      "#D1FF00",
      "#D1FF00",
      "#050505",
      "#050505"
    ]
  );

  return <motion.span style={{ color }}>{char}</motion.span>;
}

function ManifestoHeadline() {
  const container = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start 75%", "end 30%"]
  });

  const lines = [
    "AI SHOULD BE SOMETHING YOU CAN INSPECT.",
    "EDIT. COMPARE. UNDERSTAND.",
    "TRUST EVERY GENERATION."
  ];

  const totalChars = lines.join("").replace(/\s+/g, "").length;
  let charIndex = 0;

  return (
    <h2
      ref={container}
      className="flex flex-col relative w-full"
      style={{
        fontFamily: "'SÃ¶hne', Inter, sans-serif",
        fontWeight: 900,
        fontSize: "clamp(1.35rem, 3.05vw, 52px)",
        lineHeight: "1.05",
        letterSpacing: "-0.025em",
        margin: 0,
        textTransform: "uppercase"
      }}
    >
      {lines.map((line, lineIdx) => (
        <div key={lineIdx} className="flex flex-wrap" style={{ whiteSpace: "nowrap" }}>
          {line.split(" ").map((word, wordIdx) => (
            <span key={wordIdx} style={{ display: "inline-block", marginRight: "0.25em" }}>
              {word.split("").map((char, j) => {
                const idx = charIndex;
                charIndex++;
                return (
                  <ManifestoScrollChar
                    key={j}
                    char={char}
                    scrollYProgress={scrollYProgress}
                    charIndex={idx}
                    totalChars={totalChars}
                  />
                );
              })}
            </span>
          ))}
        </div>
      ))}
    </h2>
  );
}

function Manifesto() {
  return (
    <section className="relative w-full overflow-hidden" id="manifesto" style={{ backgroundColor: "#F4F4E8", color: "#050505" }}>
      <GrainLocal opacity={0.05} />

      {/* Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none flex justify-center z-0 mx-auto"
        style={{ maxWidth: 1920, padding: "0 clamp(20px, 3vw, 48px)" }}
      >
        <div className="w-full h-full grid grid-cols-4">
          <div className="border-r border-[rgba(0,0,0,0.06)]" />
          <div className="border-r border-[rgba(0,0,0,0.06)]" />
          <div className="border-r border-[rgba(0,0,0,0.06)]" />
          <div />
        </div>
      </div>

      <div className="relative z-10 w-full mx-auto" style={{ maxWidth: 1920, padding: "0 clamp(20px, 3vw, 48px)" }}>

        {/* Logo Bar Integrated into Grid block */}
        <LogoBar />

        {/* Main Content inside the Grid */}
        <div className="grid grid-cols-4 pt-24 pb-20">

          <div className="col-span-4 flex flex-col z-10 w-full overflow-hidden">
            <FadeIn delay={0.1}>
              <div
                className="mb-10"
                style={{
                  ...mono,
                  fontSize: 10,
                  color: "#050505",
                  fontWeight: 800,
                  letterSpacing: "0.05em"
                }}
              >
                [02] PRODUCT VISION_
              </div>
            </FadeIn>

            <ManifestoHeadline />
          </div>

          {/* Bottom Grid Elements */}
          <div className="col-span-4 md:col-span-1 pt-16 md:pt-32 z-10">
            <FadeIn delay={0.4}>
              <div className="flex flex-col gap-3">
                {[
                  "Text, image, and multimodal workflows",
                  "Version comparison built into review",
                  "Trust signals attached to every run",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start gap-3"
                    style={{
                      borderTop: index === 0 ? "none" : "1px solid rgba(5,5,5,0.1)",
                      paddingTop: index === 0 ? 0 : 12,
                    }}
                  >
                    <div className="mt-[7px] h-[7px] w-[7px] rounded-full" style={{ backgroundColor: index === 0 ? "#D1FF00" : index === 1 ? "#7DB5FF" : "#7DFFAF" }} />
                    <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 13, lineHeight: 1.45, color: "#050505", maxWidth: 240 }}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          <div className="col-span-4 md:col-start-3 md:col-span-2 pt-16 md:pt-32 z-10 pl-0 md:pl-6 overflow-visible">
            <FadeIn delay={0.5}>
              <div>
                <div style={{ fontFamily: "'Söhne', Inter, sans-serif", fontSize: "clamp(3rem, 6vw, 70px)", color: "#050505", lineHeight: 0.8, marginBottom: 0, fontWeight: 900, transform: "translateY(0.4em)" }}>&ldquo;</div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "clamp(1.2rem, 2vw, 24px)", lineHeight: "1.4", color: "#050505", letterSpacing: "-0.015em" }}>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Frigate is a creative cockpit for AI: a prompt debugger, an explainability layer, and a co-creator that shows its work.
                </p>
                <div className="flex items-center gap-4 mt-8">
                  <div className="rounded-full bg-[#D1FF00] flex items-center justify-center font-bold text-[10px]" style={{ width: 44, height: 44, color: "#050505" }}>SR</div>
                  <div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.05em", color: "#050505", textTransform: "uppercase" }}>Frigate Platform</div>
                    <div style={{ ...mono, fontSize: 9, color: "#050505", opacity: 0.5, marginTop: 4 }}>Product Vision</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ===== STATS ===== */
const StatBar = ({ isBlack, delay }: { isBlack: boolean; delay: number }) => {
  return (
    <div className="relative w-full h-[18px] mb-[6px] overflow-hidden">
      <motion.div
        initial={{ y: "110%", opacity: 0 }}
        whileInView={{ y: "0%", opacity: 1 }}
        viewport={{ once: true }}
        transition={{
          duration: 0.8,
          delay: delay,
          ease: [0.16, 1, 0.3, 1]
        }}
        className="absolute inset-x-0 top-[2px] bottom-[2px]"
        style={{ backgroundColor: isBlack ? "#050505" : "rgba(5,5,5,0.15)" }}
      />
    </div>
  );
};

const StatColumn = ({
  value,
  label,
  bars,
  blackBars,
  colIndex
}: {
  value: string; label: string; bars: number; blackBars: number; colIndex: number
}) => {
  // Staircase offsets (ascending from left to right)
  const offsets = [160, 100, 40, 0];
  const offset = offsets[colIndex];

  return (
    <div
      className={`flex flex-col ${colIndex < 3 ? 'md:border-r md:border-[rgba(5,5,5,0.06)]' : ''} pb-20 px-0`}
      style={{ marginTop: offset }}
    >
      <div className={`${colIndex > 0 ? 'md:pl-6' : 'pl-0'} h-full flex flex-col`}>
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 + (colIndex * 0.05), ease: [0.16, 1, 0.3, 1] }}
        >
          <div style={{
            fontFamily: "'Söhne', Inter, sans-serif",
            fontWeight: 900,
            fontSize: "clamp(1.8rem, 3.8vw, 4.2rem)",
            color: "#050505",
            letterSpacing: "-0.05em",
            lineHeight: "0.85",
            marginBottom: 16,
          }}>{value}</div>
          <div style={{
            ...mono,
            fontSize: 10,
            color: "#050505",
            opacity: 0.7,
            marginBottom: 50,
            fontWeight: 800,
            letterSpacing: "0.05em"
          }}>{label}</div>
        </motion.div>

        <div className="flex flex-col mt-auto relative pt-4 pb-2">
          {/* Horizontal lines at top and bottom of the set */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-[rgba(5,5,5,0.08)]" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[rgba(5,5,5,0.08)]" />

          {Array.from({ length: bars }).map((_, i) => (
            <StatBar
              key={i}
              isBlack={i >= (bars - blackBars)}
              delay={0.2 + (colIndex * 0.1) + (i * 0.03)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

function Stats() {
  const stats = [
    { value: "TEXT + IMAGE", label: "MULTIMODAL INPUTS", bars: 6, blackBars: 4 },
    { value: "LIVE", label: "WHAT-IF EDITING", bars: 11, blackBars: 9 },
    { value: "TOKEN", label: "TEXT INFLUENCE TRACING", bars: 14, blackBars: 12 },
    { value: "REGION", label: "IMAGE OVERLAY MAPPING", bars: 17, blackBars: 15 }
  ];

  return (
    <section className="relative w-full overflow-hidden" style={{ backgroundColor: "#F4F4E8", padding: "60px 0 200px" }}>
      <GrainLocal opacity={0.06} />
      <div className="relative z-10 mx-auto" style={{ maxWidth: 1920, padding: "0 clamp(20px, 3vw, 48px)" }}>
        <div className="grid grid-cols-1 md:grid-cols-4 w-full items-end">
          {stats.map((stat, i) => (
            <StatColumn key={i} {...stat} colIndex={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== PROBLEMS ===== */
function MarqueeRow({
  tags,
  direction = 1,
  col,
  scrollYProgress
}: {
  tags: string[]; direction?: number; col: number; scrollYProgress: any
}) {
  const isOuter = col === 1 || col === 4;
  const entryStart = 0.35;
  const entryEnd = 0.45;
  const exitStart = 0.60;
  const exitEnd = 0.70;

  // Entry: expand outwards dramatically
  const yOffset = col === 1 ? 300 : col === 2 ? 100 : col === 3 ? -100 : -300;

  // Exit Phase: Synchronized with BG shift (0.78 to 0.88)
  const scale = useTransform(scrollYProgress, [entryStart, entryEnd, exitStart, exitEnd], [0.8, 1, 1, 1.4]);
  const rowBlur = useTransform(scrollYProgress, [exitStart, exitEnd], ["blur(0px)", "blur(40px)"]);
  const rowOpacity = useTransform(scrollYProgress, [0, entryStart, entryEnd, exitStart, exitEnd], [0, 0, 1, 1, 0]);
  const rowY = useTransform(scrollYProgress, [entryStart, entryEnd, exitStart, exitEnd], [yOffset, 0, 0, 0]);

  return (
    <motion.div
      style={{ opacity: rowOpacity, y: rowY, scale, filter: rowBlur, pointerEvents: "none" }}
      className="flex whitespace-nowrap py-3 overflow-hidden w-full"
    >
      <motion.div
        animate={{ x: direction > 0 ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="flex gap-4"
        style={{ width: "max-content" }}
      >
        {[...tags, ...tags, ...tags, ...tags, ...tags, ...tags].map((tag, i) => (
          <div
            key={i}
            className="px-4 py-2 rounded-none border border-[rgba(255,255,237,0.12)] text-[#FFFFFF] flex items-center gap-3"
            style={{
              ...mono,
              fontSize: 12,
              textTransform: "uppercase",
              backgroundColor: "#1A1A1A",
              letterSpacing: "0.03em",
              lineHeight: 1
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full flex items-center justify-center bg-[#D1FF00]">
              <div className="w-1.5 h-1.5 bg-black rounded-full" />
            </div>
            {tag}
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function Problems() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"]
  });

  // Safe Compressed Timeline:
  // 0.0 - 0.45: Headline 1 reveal + BG Flip
  // 0.45 - 0.60: THE DWELL (Black screen)
  // 0.60 - 0.70: THE HANDOVER (BG -> Light, H1 -> Out, H2 -> In)
  // 0.70 - 0.90: THE SOLUTION (H2 on Light screen)
  // 0.90 - 0.95: Final H2 Fade

  const bgColor = useTransform(
    scrollYProgress,
    [0.0, 0.35, 0.45, 0.60, 0.70],
    ["#F4F4E8", "#F4F4E8", "#050505", "#050505", "#F4F4E8"]
  );

  const h1Lines = [
    "MOST AI TOOLS STILL HIDE THE WHY.",
    "YOU SEE AN OUTPUT, NOT THE REASON."
  ];
  const h2Text = "FRIGATE ELIMINATES THEM ALL.";

  // H1 Exit: Push the old title fully out before the handover finishes.
  const h1Scale = useTransform(scrollYProgress, [0.56, 0.68], [1, 1.16]);
  const h1Opacity = useTransform(scrollYProgress, [0, 0.54, 0.62, 0.68], [1, 1, 0.12, 0]);
  const h1Blur = useTransform(scrollYProgress, [0.56, 0.68], ["blur(0px)", "blur(16px)"]);

  // H2 Entry & Reveal: Comes in after H1 is already falling away.
  const h2Scale = useTransform(scrollYProgress, [0.62, 0.74], [0.92, 1]);
  const h2Opacity = useTransform(scrollYProgress, [0.6, 0.72, 0.9, 0.95], [0, 1, 1, 0]);
  const h2Blur = useTransform(scrollYProgress, [0.6, 0.72, 0.9, 0.95], ["blur(18px)", "blur(0px)", "blur(0px)", "blur(12px)"]);

  const p1 = ["No prompt breakdown", "No causal trace", "No edit guidance"];
  const p2 = ["Hidden style shifts", "Weak trust", "Slow iteration"];
  const p3 = ["No token reasoning", "No image overlays", "No delta view"];
  const p4 = ["Fragmented tooling", "Blind retries", "Hard to scale"];

  return (
    <div ref={container} className="relative h-[600vh]">
      <motion.section
        style={{ backgroundColor: bgColor }}
        className="sticky top-0 h-screen w-full flex flex-col items-center justify-between py-16 overflow-hidden"
      >
        <GrainLocal opacity={0.06} />

        {/* Top Marquees */}
        <div className="w-full space-y-4 z-10">
          <MarqueeRow tags={p1} direction={1} col={1} scrollYProgress={scrollYProgress} />
          <MarqueeRow tags={p2} direction={-1} col={2} scrollYProgress={scrollYProgress} />
        </div>

        {/* Center Content Stage */}
        <div className="relative flex-1 flex items-center justify-center w-full px-10 text-center">

          {/* Headline 1: Two Lines */}
          <motion.div
            style={{
              opacity: h1Opacity,
              scale: h1Scale,
              filter: h1Blur,
              pointerEvents: "none"
            }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          >
            {h1Lines.map((line, lIdx) => (
              <div
                key={lIdx}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(1.5rem, 4vw, 3.5rem)",
                  lineHeight: "0.95",
                  letterSpacing: "-0.05em",
                  textTransform: "uppercase",
                  color: "#050505",
                }}
              >
                {line}
              </div>
            ))}
          </motion.div>

          {/* Headline 2: Comes from inside */}
          <motion.div
            style={{
              opacity: h2Opacity,
              scale: h2Scale,
              filter: h2Blur,
              zIndex: 30
            }}
            className="absolute inset-0 flex items-center justify-center p-4"
          >
            <div className="flex flex-wrap justify-center max-w-5xl mx-auto px-4">
              {h2Text.split("").map((char, i) => {
                const charStart = 0.64 + ((i / h2Text.length) * 0.1); 
                const charOpacity = useTransform(scrollYProgress, [charStart, charStart + 0.05], [0, 1]);
                const charBlur = useTransform(scrollYProgress, [charStart, charStart + 0.05], ["blur(15px)", "blur(0px)"]);

                return (
                  <motion.span
                    key={i}
                    style={{
                      opacity: charOpacity,
                      filter: charBlur,
                      color: "#050505",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 900,
                      fontSize: "clamp(1.8rem, 5.5vw, 4.5rem)",
                      lineHeight: "1",
                      letterSpacing: "-0.05em",
                      textTransform: "uppercase"
                    }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Bottom Marquees */}
        <div className="w-full space-y-4 z-10">
          <MarqueeRow tags={p3} direction={1} col={3} scrollYProgress={scrollYProgress} />
          <MarqueeRow tags={p4} direction={-1} col={4} scrollYProgress={scrollYProgress} />
        </div>

      </motion.section>
    </div>
  );
}

/* ===== SERVICES / FEATURES TIMELINE ===== */
function Features() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      step: "STEP 1",
      title: "PROMPT SEGMENTATION",
      body: "Break text, image references, and modifiers into explainable segments with influence candidates."
    },
    {
      step: "STEP 2",
      title: "GENERATE + TRACE",
      body: "Run the generation pipeline while collecting token-level and region-level signals from the model stack."
    },
    {
      step: "STEP 3",
      title: "MAP THE RESULT",
      body: "Link each segment to highlighted text spans, visual regions, and style shifts inside the output."
    },
    {
      step: "STEP 4",
      title: "GUIDE THE NEXT EDIT",
      body: "Score confidence, clarity, and drift, then recommend the smallest changes with the biggest effect."
    }
  ];

  const progressWidth = `${(activeStep + 1) * 25}%`;

  return (
    <section className="relative w-full overflow-hidden" style={{ backgroundColor: frigateLight }}>
      <GrainLocal opacity={0.06} />

      <div
        className="absolute inset-0 pointer-events-none flex justify-center z-0 mx-auto"
        style={{ maxWidth: 1920, padding: "0 clamp(20px, 3vw, 48px)" }}
      >
        <div className="w-full h-full grid grid-cols-4">
          <div className="border-r border-[rgba(5,5,5,0.08)]" />
          <div className="border-r border-[rgba(5,5,5,0.08)]" />
          <div className="border-r border-[rgba(5,5,5,0.08)]" />
          <div />
        </div>
      </div>

      <div className="relative z-10 mx-auto" style={{ maxWidth: 1920, padding: "0 clamp(20px, 3vw, 48px)" }}>
        <div className="grid grid-cols-1 md:grid-cols-4 w-full">
          <div className="pt-[108px] pb-[96px] pr-0 md:pr-8">
            <BlurReveal>
              <div
                style={{
                  fontFamily: "'Roboto Mono', monospace",
                  fontSize: 10,
                  color: frigateText,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em"
                }}
              >
                [04] CORE LOOP_
              </div>
            </BlurReveal>
          </div>

          <div className="pt-[108px] pb-[96px] pr-0 md:pr-8 md:col-span-2">
            <BlurReveal delay={0.08}>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'TASA Orbiter', Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(1.95rem, 3vw, 3.25rem)",
                  lineHeight: 0.94,
                  letterSpacing: "-0.065em",
                  textTransform: "uppercase",
                  color: frigateText,
                  maxWidth: 560
                }}
              >
                <div style={{ overflow: "hidden", paddingBottom: "0.04em" }}>
                  <motion.div
                    initial={{ opacity: 0, y: "100%" }}
                    whileInView={{ opacity: 1, y: "0%" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    viewport={{ once: true }}
                  >
                    EXPLAINABILITY
                  </motion.div>
                </div>
                <div style={{ overflow: "hidden", marginTop: "0.02em" }}>
                  <motion.div
                    initial={{ opacity: 0, y: "100%" }}
                    whileInView={{ opacity: 1, y: "0%" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
                    viewport={{ once: true }}
                  >
                    INSIDE GENERATION.
                  </motion.div>
                </div>
              </h2>
            </BlurReveal>

            <BlurReveal delay={0.16}>
              <p
                style={{
                  margin: "34px 0 0 0",
                  maxWidth: 320,
                  fontFamily: "Inter, sans-serif",
                  fontSize: "clamp(1rem, 1.25vw, 1.18rem)",
                  lineHeight: 1.4,
                  color: frigateMuted
                }}
              >
                Not a plugin and not an afterthought.
                <br />
                Frigate makes the explanation layer part of the product.
              </p>
            </BlurReveal>
          </div>

          <div className="hidden md:block pt-[108px] pb-[96px]" />
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.25 }} viewport={{ once: true }} className="relative z-10">
          <div
            className="absolute top-[-24px] left-0 h-[4px] transition-all duration-400 ease-out"
            style={{ backgroundColor: "#D1FF00", width: progressWidth, zIndex: 2 }}
          />
          <div className="relative h-[14px]">
            <div className="absolute bottom-0 left-0 w-full h-[1px]" style={{ backgroundColor: "rgba(5,5,5,0.18)" }} />
            {Array.from({ length: 61 }).map((_, idx) => (
              <div
                key={idx}
                className="absolute bottom-0 w-[1px]"
                style={{
                  backgroundColor: "rgba(5,5,5,0.22)",
                  left: `${(idx / 60) * 100}%`,
                  height: idx % 10 === 0 ? 12 : 8
                }}
              />
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 w-full" onMouseLeave={() => setActiveStep(0)}>
          {steps.map((step, i) => {
            const isActive = activeStep === i;

            return (
              <motion.div
                key={step.title}
                onMouseEnter={() => setActiveStep(i)}
                onClick={() => setActiveStep(i)}
                className="relative px-0 md:px-0 pt-6 pb-20 flex flex-col cursor-pointer transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.8, delay: 0.12 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  backgroundColor: isActive ? "#FBFAF0" : "transparent",
                  minHeight: "360px"
                }}
              >
                <div className="flex items-center gap-3 pl-6 md:pl-7">
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      backgroundColor: isActive ? "#D1FF00" : "#7B7B78",
                      display: "inline-block",
                      flexShrink: 0
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'Roboto Mono', monospace",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#6B6B6B",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em"
                    }}
                  >
                    {step.step}
                  </span>
                </div>

                <div className="mt-auto px-6 md:px-7">
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "'TASA Orbiter', Inter, sans-serif",
                      fontWeight: 900,
                      fontSize: "clamp(1.35rem, 1.45vw, 1.65rem)",
                      lineHeight: 0.94,
                      letterSpacing: "-0.04em",
                      textTransform: "uppercase",
                      color: isActive ? frigateText : frigateSoft,
                      transition: "color 0.45s ease-out"
                    }}
                  >
                    {step.title}
                  </h3>

                  <p
                    style={{
                      margin: "18px 0 0 0",
                      maxWidth: 300,
                      fontFamily: "Inter, sans-serif",
                      fontSize: "clamp(0.92rem, 0.95vw, 0.98rem)",
                      lineHeight: 1.42,
                      color: isActive ? frigateMuted : "#BCBCB5",
                      transition: "color 0.45s ease-out"
                    }}
                  >
                    {step.body}
                  </p>
                </div>

                <div
                  className="absolute bottom-0 left-0 w-full"
                  style={{
                    height: 2,
                    backgroundColor: isActive ? "#D1FF00" : "rgba(116,116,116,0.32)",
                    transition: "background-color 0.45s ease-out"
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ===== PROCESS ===== */
function Process() {
  const items = [
    {
      icon: Activity,
      title: "Multimodal Pipeline",
      body: "One system for text, image, and hybrid prompts with a consistent explanation layer across every mode."
    },
    {
      icon: Wrench,
      title: "Real-Time What-If",
      body: "Compare prompt versions side by side, inspect deltas, and see exactly which phrase changed the result."
    },
    {
      icon: Headphones,
      title: "Trust Dashboard",
      body: "Track confidence, clarity, output quality, and satisfaction from single runs all the way up to team-level patterns."
    }
  ];

  return (
    <section className="relative w-full overflow-hidden" style={{ backgroundColor: frigateLight }}>
      <GrainLocal opacity={0.05} />

      <div
        className="absolute inset-0 pointer-events-none flex justify-center z-0 mx-auto"
        style={{ maxWidth: 1920, padding: "0 clamp(20px, 3vw, 48px)" }}
      >
        <div className="w-full h-full grid grid-cols-4">
          <div className="border-r border-[rgba(5,5,5,0.08)]" />
          <div className="border-r border-[rgba(5,5,5,0.08)]" />
          <div className="border-r border-[rgba(5,5,5,0.08)]" />
          <div />
        </div>
      </div>

      <div
        className="relative z-10 mx-auto"
        style={{
          maxWidth: 1920,
          padding: "clamp(120px, 14vw, 180px) clamp(20px, 3vw, 48px) clamp(110px, 12vw, 150px)"
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 w-full">
          <div className="col-span-1 md:col-span-2 flex items-end pb-12 md:pb-24 pr-0 md:pr-10">
            <BlurReveal>
              <div
                style={{
                  fontFamily: "'TASA Orbiter', Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(1.95rem, 3vw, 3.2rem)",
                  lineHeight: 0.94,
                  letterSpacing: "-0.05em",
                  textTransform: "uppercase",
                  maxWidth: 560
                }}
              >
                  <div style={{ color: "#737373" }}>Why Teams Use</div>
                  <div style={{ color: frigateText }}>Frigate</div>
              </div>
            </BlurReveal>
          </div>

          <div className="col-span-1 md:col-span-2 flex items-end pb-12 md:pb-24">
            <BlurReveal delay={0.08}>
              <div
                style={{
                  fontFamily: "'TASA Orbiter', Inter, sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(1.65rem, 2.5vw, 2.65rem)",
                  lineHeight: 1.04,
                  letterSpacing: "-0.04em",
                  maxWidth: 760
                }}
              >
                <div style={{ color: "#707070" }}>Frigate is designed for production workflows, not one-off demos.</div>
                <div style={{ color: frigateText, marginTop: 4 }}>The system stays understandable as your AI stack grows.</div>
              </div>
            </BlurReveal>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 w-full mt-[70px] md:mt-[92px]">
          <div className="hidden md:block" />
          {items.map((item, index) => {
            const Icon = item.icon;

            return (
              <FadeIn key={item.title} delay={0.12 + index * 0.06}>
                <motion.div
                  className="pt-6 md:pt-10"
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.8, delay: 0.14 + index * 0.07, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-center gap-4 mb-8">
                    <Icon size={22} strokeWidth={1.8} style={{ color: frigateText }} />
                    <div
                      style={{
                        fontFamily: "'TASA Orbiter', Inter, sans-serif",
                        fontWeight: 800,
                        fontSize: "clamp(1.25rem, 1.3vw, 1.5rem)",
                        lineHeight: 1,
                        letterSpacing: "-0.035em",
                        color: frigateText
                      }}
                    >
                      {item.title}
                    </div>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      maxWidth: 330,
                      fontFamily: "Inter, sans-serif",
                      fontSize: "clamp(0.92rem, 0.92vw, 0.98rem)",
                      lineHeight: 1.42,
                      color: frigateMuted
                    }}
                  >
                    {item.body}
                  </p>
                </motion.div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ===== TESTIMONIAL ===== */
function Testimonial() {
  return (
    <section className="relative w-full overflow-hidden" style={{ backgroundColor: frigateLight }}>
      <GrainLocal opacity={0.05} />

      <div
        className="absolute inset-0 pointer-events-none flex justify-center z-0 mx-auto"
        style={{ maxWidth: 1920, padding: "0 clamp(20px, 3vw, 48px)" }}
      >
        <div className="w-full h-full grid grid-cols-4">
          <div className="border-r border-[rgba(5,5,5,0.08)]" />
          <div className="border-r border-[rgba(5,5,5,0.08)]" />
          <div className="border-r border-[rgba(5,5,5,0.08)]" />
          <div />
        </div>
      </div>

      <div
        className="relative z-10 mx-auto"
        style={{
          maxWidth: 1920,
          padding: "clamp(88px, 10vw, 128px) clamp(20px, 3vw, 48px) clamp(120px, 13vw, 165px)"
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 w-full">
          <div className="hidden md:block" />

          <div className="col-span-1 md:col-span-2">
            <BlurReveal>
              <div
                style={{
                  fontFamily: "'TASA Orbiter', Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(1.95rem, 3vw, 3.15rem)",
                  lineHeight: 0.94,
                  letterSpacing: "-0.065em",
                  textTransform: "uppercase",
                  maxWidth: 560
                }}
              >
                <div style={{ color: frigateText }}>The Product</div>
                <div style={{ color: frigateText }}>Promise.</div>
              </div>
            </BlurReveal>

            <BlurReveal delay={0.08}>
              <p
                style={{
                  margin: "30px 0 0 0",
                  maxWidth: 360,
                  fontFamily: "Inter, sans-serif",
                  fontSize: "clamp(1rem, 1.15vw, 1.12rem)",
                  lineHeight: 1.32,
                  color: frigateMuted
                }}
              >
                Users should not just get outputs.
                <br />
                They should understand, control, and trust them.
              </p>
            </BlurReveal>
          </div>

          <div className="hidden md:block" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 w-full mt-[92px] md:mt-[118px]">
          <div className="flex items-start">
            <FadeIn delay={0.12}>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontFamily: "'TASA Orbiter', Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(3rem, 5vw, 4.75rem)",
                  lineHeight: 0.9,
                  letterSpacing: "-0.05em",
                  color: frigateText
                }}
              >
                &ldquo;
              </motion.div>
            </FadeIn>
          </div>

          <div className="col-span-1 md:col-span-3">
            <FadeIn delay={0.16}>
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontFamily: "'TASA Orbiter', Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(1.3rem, 1.95vw, 2.15rem)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.058em",
                  textTransform: "uppercase",
                  color: frigateText,
                  maxWidth: 1450
                }}
              >
                Frigate turns generation from trial-and-error into an inspectable workflow. You can see which words changed tone, which phrases added complexity, and where the output picked it up.
              </motion.div>
            </FadeIn>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 w-full mt-[46px] md:mt-[62px] items-end">
          <div className="hidden md:block" />

          <FadeIn delay={0.22}>
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: frigateText,
                  borderRadius: 4,
                  clipPath: "polygon(0 0, 70% 0, 70% 55%, 100% 100%, 55% 100%, 30% 60%, 0 60%)"
                }}
              />
              <div
                style={{
                  fontFamily: "'TASA Orbiter', Inter, sans-serif",
                  fontWeight: 800,
                  fontSize: 16,
                  color: frigateText,
                  letterSpacing: "-0.03em"
                }}
              >
                PRODUCT VISION
              </div>
            </motion.div>
          </FadeIn>

          <FadeIn delay={0.28}>
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.75, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="rounded-full bg-[#D1FF00] flex items-center justify-center font-bold text-[11px]" style={{ width: 44, height: 44, color: "#050505" }}>FP</div>
              <div>
                <div
                  style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: frigateText,
                    marginBottom: 4
                  }}
                >
                  FRIGATE PLATFORM
                </div>
                <div
                  style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: frigateMuted
                  }}
                >
                  PRODUCT PRINCIPLE
                </div>
              </div>
            </motion.div>
          </FadeIn>

          <div className="hidden md:block" />
        </div>
      </div>
    </section>
  );
}

/* ===== CTA ===== */
function FinalCTA() {
  const navigate = useNavigate();
  return (
    <section className="relative" style={{ backgroundColor: "#D1FF00", padding: "clamp(80px, 14vw, 180px) clamp(20px, 3vw, 48px)" }}>
      <GrainLocal opacity={0.04} />
      <div className="relative z-10 mx-auto text-center" style={{ maxWidth: 900 }}>
        <FadeIn>
          <div style={{ ...mono, fontSize: 10, color: "#050505", opacity: 0.4, marginBottom: 24 }}>[Start Now]</div>
        </FadeIn>
        <AnimatedHeadline className="mb-8">
          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: "clamp(2.5rem, 6vw, 5rem)", lineHeight: "105%", letterSpacing: "-0.04em", textTransform: "uppercase", color: "#050505" }}>
            BUILD WITH EXPLAINABILITY FIRST.
          </span>
        </AnimatedHeadline>
        <FadeIn delay={0.2}>
          <p className="mx-auto mb-10" style={{ fontFamily: "Inter, sans-serif", fontSize: 16, lineHeight: "175%", color: "#050505", opacity: 0.55, maxWidth: 480 }}>
            Open the Composer to map prompt influence, compare edits, and start shaping outputs with clarity.
          </p>
        </FadeIn>
        <FadeIn delay={0.3}>
          <button
            onClick={() => navigate("/composer")}
            className="cursor-pointer border-none"
            style={{
              ...mono, fontSize: 12, fontWeight: 600,
              color: "#D1FF00", backgroundColor: "#050505",
              padding: "18px 48px", borderRadius: 4,
              transition: "transform 0.2s ease-out, box-shadow 0.2s ease-out",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.25)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            Open Frigate &rarr;
          </button>
        </FadeIn>
      </div>
    </section>
  );
}



/* ===== HOME PAGE ===== */
export function HomePage() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Stats />
      <Problems />
      <Features />
      <Process />
      <Testimonial />
      <FinalCTA />
    </>
  );
}
