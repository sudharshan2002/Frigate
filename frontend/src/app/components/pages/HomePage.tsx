import { useState, useRef, useEffect, type ReactNode } from "react";
import { motion, useScroll, useTransform, useMotionTemplate, useSpring, AnimatePresence, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router";
import { AnimatedHeadline, FadeIn } from "../AnimatedText";
import { GrainLocal } from "../GrainOverlay";
import { ImageWithFallback } from "../common/ImageWithFallback";
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

// Top brand logos row
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

// Hero layout
function Hero() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);

  return (
    <section className="relative w-full overflow-hidden" ref={heroRef} style={{ backgroundColor: "#060606", minHeight: "100vh" }}>
      <GrainLocal opacity={0.16} />

      <motion.div
        className="pointer-events-none absolute left-[-8vw] top-[10vh] z-0 h-[36rem] w-[36rem] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(209,255,0,0.16) 0%, rgba(209,255,0,0.06) 32%, rgba(209,255,0,0) 72%)",
          filter: "blur(12px)",
        }}
        animate={
          prefersReducedMotion
            ? undefined
            : { x: [0, 24, -12, 0], y: [0, -16, 12, 0], scale: [1, 1.08, 0.97, 1], opacity: [0.52, 0.7, 0.45, 0.52] }
        }
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="pointer-events-none absolute inset-x-[14%] top-[18vh] z-0 h-px"
        style={{ background: "linear-gradient(90deg, rgba(209,255,0,0) 0%, rgba(209,255,0,0.55) 50%, rgba(209,255,0,0) 100%)" }}
        animate={prefersReducedMotion ? undefined : { opacity: [0.15, 0.75, 0.15], scaleX: [0.92, 1, 0.95] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
      />

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
          padding: "clamp(128px, 16vh, 200px) clamp(20px, 3vw, 48px) clamp(72px, 9vh, 112px)",
          minHeight: "100vh"
        }}
      >
        {/* Main Content: Spans Col 1, 2, and 3 */}
        <div
          className="col-span-1 md:col-span-3 flex flex-col justify-start z-10"
          style={{ paddingTop: "clamp(0px, 1.5vh, 18px)" }}
        >

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
              <span className="font-semibold text-[#F4F4E8]" style={{ opacity: 1 }}>Frigate is an interactive AI platform</span> that maps prompt segments to outputs in real time.
            </p>
          </FadeIn>

          <FadeIn delay={2.1} className="relative w-full">
            <motion.button
              onClick={() => navigate("/composer")}
              className="cursor-pointer group inline-flex items-center gap-3 border"
              whileHover={prefersReducedMotion ? undefined : { y: -2 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.988 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{
                ...mono,
                minHeight: "46px",
                padding: "0 16px",
                borderColor: "rgba(244,244,232,0.18)",
                background: "rgba(255,255,255,0.02)",
                color: "#F4F4E8",
                outline: "none",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.07em",
                backdropFilter: "blur(8px)",
              }}
            >
              <span className="transition-colors duration-300 group-hover:text-white">
                Open Composer
              </span>
              <motion.span
                style={{
                  color: "#D1FF00",
                  fontSize: 14,
                  lineHeight: 1,
                }}
                animate={prefersReducedMotion ? undefined : { x: [0, 2, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                &gt;
              </motion.span>
            </motion.button>
          </FadeIn>

        </div>

        {/* Column 4: Side explainer */}
        <div className="col-span-1 md:col-span-1 flex flex-col justify-end px-0 md:pl-8 lg:pl-10 pb-8 z-10 mt-16 md:mt-0">
          <FadeIn delay={2.2}>
            <motion.div
              style={{
                ...mono,
                fontSize: 10,
                lineHeight: "1.6",
                color: "#F4F4E8",
                marginBottom: 20,
                textTransform: "uppercase"
              }}
              animate={prefersReducedMotion ? undefined : { opacity: [0.78, 1, 0.78] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="opacity-60">PROMPTS SHOULD BE REVIEWABLE.</span> <span className="font-bold opacity-100">FRIGATE KEEPS THE DECISION PATH VISIBLE.</span>
            </motion.div>

            <motion.div
              className="relative w-full overflow-hidden rounded-sm border border-[#ffffff15] bg-[#111] text-left cursor-pointer group"
              onClick={() => setIsVideoExpanded(true)}
              initial={{ opacity: 0, y: 36, rotateX: 8 }}
              animate={prefersReducedMotion ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 1, y: [0, -8, 0], rotateX: 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.75, delay: 2.3, ease: [0.16, 1, 0.3, 1] }
                  : {
                      opacity: { duration: 0.75, delay: 2.3, ease: [0.16, 1, 0.3, 1] },
                      y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2.3 },
                      rotateX: { duration: 0.75, delay: 2.3, ease: [0.16, 1, 0.3, 1] },
                    }
              }
              style={{ maxWidth: 360, padding: 0 }}
            >
              <div className="relative aspect-[4/3] w-full bg-[#050505] transition-opacity group-hover:opacity-90">
                <video src="https://www.w3schools.com/html/mov_bbb.mp4" autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D1FF00] bg-[#D1FF0020] backdrop-blur-sm transition-transform group-hover:scale-110">
                    <Play size={20} fill="#D1FF00" style={{ color: "#D1FF00", marginLeft: 4 }} />
                  </div>
                </div>
                <div
                  className="absolute top-0 left-0 h-[3px] w-full"
                  style={{ background: "linear-gradient(90deg, #D1FF00 0%, rgba(209,255,0,0.12) 100%)" }}
                />
                <div className="absolute bottom-3 left-3 bg-[#050505cc] px-2 py-1" style={{ ...mono, fontSize: 9, color: "#D1FF00" }}>
                  [Live View]
                </div>
              </div>
            </motion.div>
          </FadeIn>
        </div>
      </div>
      <AnimatePresence>
        {isVideoExpanded && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505cc] backdrop-blur-md p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setIsVideoExpanded(false)}
          >
            <motion.div
              className="relative w-full max-w-5xl aspect-video rounded-sm overflow-hidden bg-black border border-[#ffffff20]"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="absolute top-0 left-0 h-[3px] w-full z-10"
                style={{ background: "linear-gradient(90deg, #D1FF00 0%, rgba(209,255,0,0.12) 100%)" }}
              />
              <button 
                className="absolute top-4 right-4 z-10 text-white opacity-60 hover:opacity-100 transition-opacity cursor-pointer border-none bg-transparent"
                onClick={() => setIsVideoExpanded(false)}
              >
                <X size={28} />
              </button>
              <video src="https://www.w3schools.com/html/mov_bbb.mp4" controls autoPlay className="w-full h-full object-contain bg-black" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// Manifesto portion

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
        fontFamily: "'TASA Orbiter', Inter, sans-serif",
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
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Frigate is a prompt debugger and co-creator that shows its work.
                </p>
                <div className="flex items-center gap-4 mt-8">
                  <div className="rounded-full bg-[#D1FF00] flex items-center justify-center font-bold text-[10px]" style={{ width: 44, height: 44, color: "#050505" }}>SR</div>
                  <div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.05em", color: "#050505", textTransform: "uppercase" }}>Sudharshan Ravichandran</div>
                    <div style={{ ...mono, fontSize: 9, color: "#050505", opacity: 0.5, marginTop: 4 }}>Founder</div>
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

// Core value metrics
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

// Pain points and problem visualization
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

// Timeline of features we offer
function Features() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      step: "STEP 1",
      title: "PROMPT SEGMENTATION",
      body: "Break prompts into explainable segments."
    },
    {
      step: "STEP 2",
      title: "GENERATE + TRACE",
      body: "Collect signals from the model stack."
    },
    {
      step: "STEP 3",
      title: "MAP THE RESULT",
      body: "Link segments to text spans and visual regions."
    },
    {
      step: "STEP 4",
      title: "GUIDE THE NEXT EDIT",
      body: "Recommend the smallest changes with the biggest effect."
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

// Dev tools and SDK highlight
function SDKSection() {
  const capabilities = [
    {
      icon: Bot,
      eyebrow: "SDK client",
      title: "Call Frigate from apps",
      body: "Use one typed client for generation, what-if analysis, explainability, sessions, metrics, and dashboard reads.",
      accent: "#D1FF00"
    },
    {
      icon: Layers,
      eyebrow: "Global CLI",
      title: "Install once and run anywhere",
      body: "Teams can install `frigate-sdk` globally and use the same `frigate` commands across local development, scripts, and internal tooling.",
      accent: "#7DFFAF"
    },
    {
      icon: Shield,
      eyebrow: "Production shape",
      title: "Simple surface area",
      body: "Point the SDK at any Frigate backend with `FRIGATE_API_URL` or a custom `baseUrl` and keep the integration easy to explain.",
      accent: "#7DB5FF"
    }
  ];

  const commands = [
    "npm install frigate-sdk",
    "npm install -g frigate-sdk",
    "frigate health"
  ];

  const snippet = [
    'import { FrigateClient } from "frigate-sdk";',
    "",
    "const frigate = new FrigateClient({",
    '  baseUrl: "http://127.0.0.1:8000",',
    "});",
    "",
    "const run = await frigate.generate({",
    '  prompt: "Write a launch note for Frigate.",',
    '  mode: "text",',
    "});",
  ];

  return (
    <section className="relative w-full overflow-hidden" style={{ backgroundColor: "#050505" }}>
      <GrainLocal opacity={0.12} />

      <div
        className="absolute inset-0 pointer-events-none flex justify-center z-0 mx-auto"
        style={{ maxWidth: 1920, padding: "0 clamp(20px, 3vw, 48px)" }}
      >
        <div className="w-full h-full grid grid-cols-4">
          <div className="border-r border-[rgba(255,255,255,0.08)]" />
          <div className="border-r border-[rgba(255,255,255,0.08)]" />
          <div className="border-r border-[rgba(255,255,255,0.08)]" />
          <div />
        </div>
      </div>

      <div
        className="relative z-10 mx-auto"
        style={{
          maxWidth: 1920,
          padding: "clamp(112px, 13vw, 164px) clamp(20px, 3vw, 48px) clamp(110px, 12vw, 150px)"
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-y-10 w-full">
          <div className="md:pr-8">
            <BlurReveal>
              <div
                style={{
                  ...mono,
                  fontSize: 10,
                  color: "#D1FF00",
                  fontWeight: 700,
                  letterSpacing: "0.08em"
                }}
              >
                [05] ABOUT THE SDK_
              </div>
            </BlurReveal>

            <BlurReveal delay={0.08}>
              <p
                style={{
                  margin: "24px 0 0 0",
                  maxWidth: 220,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: "rgba(244,244,232,0.6)"
                }}
              >
                A developer-facing surface for teams that want Frigate inside products, scripts, and operational workflows.
              </p>
            </BlurReveal>
          </div>

          <div className="col-span-1 md:col-span-2 md:pr-10">
            <BlurReveal delay={0.06}>
              <div
                style={{
                  fontFamily: "'TASA Orbiter', Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(2rem, 3.35vw, 3.8rem)",
                  lineHeight: 0.92,
                  letterSpacing: "-0.065em",
                  textTransform: "uppercase",
                  color: "#F4F4E8",
                  maxWidth: 760
                }}
              >
                <div>THE FRIGATE SDK</div>
                <div style={{ color: "#D1FF00" }}>CONNECTS PRODUCT TO PLATFORM.</div>
              </div>
            </BlurReveal>

            <BlurReveal delay={0.14}>
              <p
                style={{
                  margin: "28px 0 0 0",
                  maxWidth: 520,
                  fontFamily: "Inter, sans-serif",
                  fontSize: "clamp(1rem, 1.1vw, 1.08rem)",
                  lineHeight: 1.55,
                  color: "rgba(244,244,232,0.68)"
                }}
              >
                Install `frigate-sdk` inside a project or globally, then call the same generation,
                explainability, session, and dashboard APIs that power the product itself.
              </p>
            </BlurReveal>
          </div>

          <div className="col-span-1">
            <FadeIn delay={0.18}>
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                  padding: 20
                }}
              >
                <div style={{ ...mono, fontSize: 10, color: "rgba(244,244,232,0.5)", marginBottom: 16 }}>
                  Install paths
                </div>
                <div className="space-y-3">
                  {commands.map((command) => (
                    <div
                      key={command}
                      style={{
                        ...mono,
                        fontSize: 10,
                        color: "#F4F4E8",
                        padding: "12px 14px",
                        border: "1px solid rgba(255,255,255,0.09)",
                        backgroundColor: "rgba(5,5,5,0.28)"
                      }}
                    >
                      {command}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full mt-[48px] md:mt-[62px]">
          <div className="col-span-1 md:col-span-2">
            <BlurReveal>
              <div
                className="relative overflow-hidden h-full"
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(18,18,18,0.72) 100%)",
                  padding: "clamp(22px, 2.6vw, 34px)",
                  minHeight: 360
                }}
              >
                <div
                  className="absolute left-0 top-0 h-[3px] w-full"
                  style={{ background: "linear-gradient(90deg, #D1FF00 0%, rgba(209,255,0,0.1) 100%)" }}
                />

                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex items-center justify-between gap-4">
                    <div style={{ ...mono, fontSize: 10, color: "rgba(244,244,232,0.54)" }}>
                      SDK quickstart
                    </div>
                    <div style={{ ...mono, fontSize: 10, color: "#D1FF00" }}>
                      package: frigate-sdk
                    </div>
                  </div>

                  <div
                    className="mt-6"
                    style={{
                      fontFamily: "'TASA Orbiter', Inter, sans-serif",
                      fontWeight: 800,
                      fontSize: "clamp(1.35rem, 1.9vw, 2rem)",
                      lineHeight: 0.96,
                      letterSpacing: "-0.045em",
                      color: "#F4F4E8",
                      maxWidth: 420
                    }}
                  >
                    A small client surface for the core Frigate workflow.
                  </div>

                  <div
                    className="mt-8 flex-1"
                    style={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      backgroundColor: "rgba(0,0,0,0.32)",
                      padding: "18px 18px 16px"
                    }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-[9px] w-[9px] rounded-full bg-[#D1FF00]" />
                      <div className="h-[9px] w-[9px] rounded-full bg-[#7DFFAF]" />
                      <div className="h-[9px] w-[9px] rounded-full bg-[#7DB5FF]" />
                    </div>

                    <div className="space-y-2">
                      {snippet.map((line, index) => (
                        <div
                          key={`${line}-${index}`}
                          style={{
                            ...mono,
                            fontSize: 10,
                            color: line ? "#F4F4E8" : "transparent",
                            opacity: line ? 0.9 : 1,
                            whiteSpace: "pre-wrap"
                          }}
                        >
                          {line || "."}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </BlurReveal>
          </div>

          <div className="col-span-1 md:col-span-2 grid grid-cols-1 gap-4">
            {capabilities.map((item, index) => {
              const Icon = item.icon;

              return (
                <FadeIn key={item.title} delay={0.1 + index * 0.06}>
                  <div
                    className="relative overflow-hidden h-full"
                    style={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)",
                      minHeight: 150,
                      padding: "22px 22px 20px"
                    }}
                  >
                    <div
                      className="absolute left-0 top-0 h-[3px] w-full"
                      style={{ backgroundColor: item.accent, opacity: 0.92 }}
                    />

                    <div className="flex items-start justify-between gap-5">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-full"
                        style={{
                          border: "1px solid rgba(255,255,255,0.09)",
                          backgroundColor: "rgba(255,255,255,0.05)"
                        }}
                      >
                        <Icon size={18} strokeWidth={1.8} style={{ color: item.accent }} />
                      </div>

                      <div style={{ ...mono, fontSize: 10, color: "rgba(244,244,232,0.34)" }}>
                        {`0${index + 1}`}
                      </div>
                    </div>

                    <div style={{ ...mono, fontSize: 10, color: "rgba(244,244,232,0.52)", marginTop: 24 }}>
                      {item.eyebrow}
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        fontFamily: "'TASA Orbiter', Inter, sans-serif",
                        fontWeight: 800,
                        fontSize: "clamp(1.1rem, 1.35vw, 1.35rem)",
                        lineHeight: 0.98,
                        letterSpacing: "-0.04em",
                        color: "#F4F4E8",
                        maxWidth: 280
                      }}
                    >
                      {item.title}
                    </div>

                    <p
                      style={{
                        margin: "16px 0 0 0",
                        maxWidth: 420,
                        fontFamily: "Inter, sans-serif",
                        fontSize: 14,
                        lineHeight: 1.55,
                        color: "rgba(244,244,232,0.62)"
                      }}
                    >
                      {item.body}
                    </p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// The core Frigate workflow
function Process() {
  const items = [
    {
      icon: Activity,
      title: "Multimodal input",
      body: "Inspect text, image, and mixed prompts in one place.",
      eyebrow: "Unified inputs",
      detail: "Text, image, hybrid"
    },
    {
      icon: Wrench,
      title: "Version diffs",
      body: "See what changed and what it shifted, fast.",
      eyebrow: "Prompt compare",
      detail: "Readable deltas"
    },
    {
      icon: Headphones,
      title: "Trust signals",
      body: "Track quality patterns before they turn into drift.",
      eyebrow: "Operational view",
      detail: "Run to team trend"
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-y-10 w-full">
          <div className="col-span-1 md:col-span-2 pr-0 md:pr-12">
            <BlurReveal>
              <div>
                <div
                  className="inline-flex items-center gap-3"
                  style={{
                    ...mono,
                    fontSize: 10,
                    color: frigateMuted,
                    padding: "9px 12px",
                    border: "1px solid rgba(5,5,5,0.1)",
                    backgroundColor: "rgba(255,255,255,0.55)"
                  }}
                >
                  <span style={{ color: "#9A9A92" }}>[03]</span>
                  <span>Why teams use Frigate</span>
                </div>

                <div
                  style={{
                    marginTop: 24,
                    fontFamily: "'TASA Orbiter', Inter, sans-serif",
                    fontWeight: 900,
                    fontSize: "clamp(2rem, 3.7vw, 4rem)",
                    lineHeight: 0.9,
                    letterSpacing: "-0.065em",
                    textTransform: "uppercase",
                    maxWidth: 620
                  }}
                >
                  <div style={{ color: "#787874" }}>Production control</div>
                  <div style={{ color: frigateText }}>that stays legible.</div>
                </div>

                <p
                  style={{
                    margin: "22px 0 0 0",
                    maxWidth: 420,
                    fontFamily: "Inter, sans-serif",
                    fontSize: "clamp(0.98rem, 1.05vw, 1.04rem)",
                    lineHeight: 1.46,
                    color: frigateMuted
                  }}
                >
                  Inspect changes, compare runs, and follow trust without bolting on a separate explainability layer.
                </p>

                <div className="flex flex-wrap gap-3 mt-7">
                  {["Prompt diffs", "Trust tracking"].map((label) => (
                    <div
                      key={label}
                      style={{
                        ...mono,
                        fontSize: 10,
                        color: frigateText,
                        padding: "9px 12px",
                        border: "1px solid rgba(5,5,5,0.09)",
                        backgroundColor: "rgba(255,255,255,0.4)"
                      }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </BlurReveal>
          </div>

          <div className="col-span-1 md:col-span-2">
            <BlurReveal delay={0.08}>
              <div
                className="relative overflow-hidden h-full"
                style={{
                  border: "1px solid rgba(5,5,5,0.1)",
                  backgroundColor: "rgba(255,255,255,0.58)",
                  minHeight: "100%",
                  padding: "clamp(22px, 2.6vw, 32px)"
                }}
              >
                <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                  <div>
                    <div style={{ ...mono, fontSize: 10, color: frigateMuted, marginBottom: 16 }}>
                      Operating Principle
                    </div>

                    <div
                      style={{
                        fontFamily: "'TASA Orbiter', Inter, sans-serif",
                        fontWeight: 800,
                        fontSize: "clamp(1.55rem, 2.35vw, 2.55rem)",
                        lineHeight: 0.94,
                        letterSpacing: "-0.055em",
                        maxWidth: 520
                      }}
                    >
                      <div style={{ color: "#767671" }}>Built for live systems.</div>
                      <div style={{ color: frigateText, marginTop: 6 }}>Still easy to read.</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      ["01", "Inspect", "Prompt changes"],
                      ["02", "Compare", "Outcome shifts"],
                      ["03", "Track", "Trust signals"]
                    ].map(([num, title, body]) => (
                      <div
                        key={num}
                        style={{
                          borderTop: "1px solid rgba(5,5,5,0.12)",
                          paddingTop: 12
                        }}
                      >
                        <div style={{ ...mono, fontSize: 10, color: "#8B8B83", marginBottom: 8 }}>{num}</div>
                        <div
                          style={{
                            fontFamily: "'TASA Orbiter', Inter, sans-serif",
                            fontWeight: 800,
                            fontSize: "clamp(0.98rem, 1vw, 1.08rem)",
                            lineHeight: 1,
                            letterSpacing: "-0.035em",
                            color: frigateText,
                            marginBottom: 6
                          }}
                        >
                          {title}
                        </div>
                        <p
                          style={{
                            margin: 0,
                            fontFamily: "Inter, sans-serif",
                            fontSize: 13,
                            lineHeight: 1.35,
                            color: frigateMuted
                          }}
                        >
                          {body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </BlurReveal>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-y-6 w-full mt-[64px] md:mt-[86px]">
          <div className="hidden md:flex md:flex-col md:justify-between md:pr-8">
            <FadeIn delay={0.08}>
              <div>
                <div style={{ ...mono, fontSize: 10, color: frigateMuted, marginBottom: 18 }}>Capabilities</div>
                <p
                  style={{
                    margin: 0,
                    maxWidth: 220,
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    lineHeight: 1.45,
                    color: frigateMuted
                  }}
                >
                  A tighter operating layer for teams shipping prompts at scale.
                </p>
              </div>
            </FadeIn>
          </div>
          {items.map((item, index) => {
            const Icon = item.icon;

            return (
              <FadeIn key={item.title} delay={0.12 + index * 0.06}>
                <motion.div
                  className="group relative overflow-hidden h-full"
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -6 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.8, delay: 0.14 + index * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    border: "1px solid rgba(5,5,5,0.1)",
                    backgroundColor: index === 1 ? "#F8F7EE" : "rgba(255,255,255,0.58)",
                    minHeight: 300
                  }}
                >
                  <div
                    className="absolute left-0 top-0 h-[3px] w-full origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
                    style={{ backgroundColor: "#D1FF00" }}
                  />

                  <div className="relative z-10 flex h-full flex-col p-6 md:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.7)",
                          border: "1px solid rgba(5,5,5,0.08)"
                        }}
                      >
                        <Icon size={20} strokeWidth={1.8} style={{ color: frigateText }} />
                      </div>
                      <div style={{ ...mono, fontSize: 10, color: "#8F8F88" }}>{`0${index + 1}`}</div>
                    </div>

                    <div style={{ ...mono, fontSize: 10, color: frigateMuted, marginTop: 24 }}>
                      {item.eyebrow}
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        fontFamily: "'TASA Orbiter', Inter, sans-serif",
                        fontWeight: 800,
                        fontSize: "clamp(1.2rem, 1.35vw, 1.5rem)",
                        lineHeight: 0.96,
                        letterSpacing: "-0.04em",
                        color: frigateText,
                        maxWidth: 220
                      }}
                    >
                      {item.title}
                    </div>

                    <p
                      style={{
                        margin: "14px 0 0 0",
                        maxWidth: 260,
                        fontFamily: "Inter, sans-serif",
                        fontSize: "clamp(0.92rem, 0.95vw, 0.98rem)",
                        lineHeight: 1.42,
                        color: frigateMuted
                      }}
                    >
                      {item.body}
                    </p>

                    <div className="mt-auto pt-6">
                      <div
                        style={{
                          borderTop: "1px solid rgba(5,5,5,0.08)",
                          paddingTop: 12,
                          ...mono,
                          fontSize: 10,
                          color: "#7A7A74"
                        }}
                      >
                        {item.detail}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Testimonial quotes
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

// Final call-to-action bar
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



// Main page assembly using the sections above
export function HomePage() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Stats />
      <Problems />
      <Features />
      <SDKSection />
      <Process />
      <Testimonial />
      <FinalCTA />
    </>
  );
}
