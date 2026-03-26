import { useState } from "react";
import { motion } from "motion/react";
import { AnimatedHeadline, FadeIn } from "./AnimatedText";
import { useInView } from "./useInView";
import { ChevronDown, Zap, Bot, BarChart3, Workflow, Headphones, Shield } from "lucide-react";

const sectionLabel = (num: string, title: string) => (
  <div
    className="flex items-center gap-3 mb-6"
    style={{
      fontFamily: "'Roboto Mono', monospace",
      fontSize: 11,
      color: "#686868",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
    }}
  >
    <span style={{ color: "#050505", opacity: 0.4 }}>[{num}]</span>
    <span>{title}</span>
  </div>
);

/* ===== MANIFESTO ===== */
export function Manifesto() {
  return (
    <section
      style={{ backgroundColor: "#F4F4E8", padding: "clamp(60px, 10vw, 140px) 40px" }}
    >
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
        <FadeIn>{sectionLabel("02", "Who Frigate Is")}</FadeIn>
        <AnimatedHeadline>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 5vw, 4.5rem)",
              lineHeight: "105%",
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#050505",
            }}
          >
            FRIGATE IS THE INTELLIGENCE LAYER BRINGING TRANSPARENCY TO GENERATIVE AI
          </span>
        </AnimatedHeadline>
        <FadeIn delay={0.3}>
          <p
            className="mt-8"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "clamp(1rem, 1.3vw, 1.15rem)",
              lineHeight: "175%",
              color: "#686868",
              maxWidth: 700,
            }}
          >
            Frigate exists at the intersection of complex LLMs and human-centric design.
            Frigate bridges the gap between prompt and output, providing the explainability needed to
            master AI generation. No black boxes. No guesswork. Every output fully mapped and understood.
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

/* ===== STATS ===== */
export function Stats() {
  const stats = [
    { value: "99.9%", label: "Mapping Precision" },
    { value: "500ms", label: "Influence Latency" },
    { value: "24/7", label: "Insight Monitoring" },
    { value: "100%", label: "Multimodality" },
    { value: "10/10", label: "User Trust Score" },
    { value: "<10ms", label: "What-if Sync Speed" },
  ];

  return (
    <section style={{ backgroundColor: "#050505", padding: "clamp(60px, 10vw, 120px) 40px" }}>
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
        <FadeIn>{sectionLabel("03", "Platform Performance")}</FadeIn>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px" style={{ borderTop: "1px solid #9C9C9C26" }}>
          {stats.map((s, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div
                className="py-10 md:py-14"
                style={{ borderBottom: "1px solid #9C9C9C26" }}
              >
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 800,
                    fontSize: "clamp(2rem, 4vw, 3.5rem)",
                    color: "#D1FF00",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {s.value}
                </div>
                <div
                  className="mt-2"
                  style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontSize: 11,
                    color: "#686868",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {s.label}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== PROBLEM STATEMENT ===== */
export function ProblemStatement() {
  const issues = [
    "Invisible prompt influence",
    "Outputs lack reasoning",
    "No way to debug prompts",
    "Inconsistent style shifts",
    "Opaque generation pipelines",
    "Trial-and-error editing",
    "Hidden model heuristics",
    "Zero visibility into confidence",
  ];

  return (
    <section style={{ backgroundColor: "#F4F4E8", padding: "clamp(60px, 10vw, 120px) 40px" }}>
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
        <FadeIn>{sectionLabel("04", "The Problem")}</FadeIn>
        <AnimatedHeadline>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              lineHeight: "105%",
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#050505",
            }}
          >
            THE BLACK BOX PROBLEM
          </span>
        </AnimatedHeadline>
        <div className="flex flex-wrap gap-3 mt-10">
          {issues.map((issue, i) => (
            <FadeIn key={i} delay={i * 0.06} direction="left">
              <TickerChip label={issue} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function TickerChip({ label }: { label: string }) {
  return (
    <div
      className="inline-flex items-center gap-2"
      style={{
        fontFamily: "'Roboto Mono', monospace",
        fontSize: 12,
        color: "#F4F4E8",
        backgroundColor: "#1C1E19",
        padding: "10px 18px",
        borderRadius: 4,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ color: "#D1FF00", fontSize: 8 }}>&#9679;</span>
      {label}
    </div>
  );
}

/* ===== ROI CALCULATOR ===== */
export function ROICalculator() {
  const [complexity, setComplexity] = useState(10);
  const [nodes, setNodes] = useState(15);
  const clarityBase = 0.7;
  const confidenceScore = Math.min(99.9, (complexity * nodes * clarityBase) / 1.5 + 40);
  const insightsCount = Math.floor(complexity * nodes * 12.5);

  return (
    <section style={{ backgroundColor: "#050505", padding: "clamp(60px, 10vw, 120px) 40px" }}>
      <div className="mx-auto" style={{ maxWidth: 900 }}>
        <FadeIn>{sectionLabel("05", "Prompt Intelligence")}</FadeIn>
        <AnimatedHeadline>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: "105%",
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#FFFFED",
            }}
          >
            QUANTIFY YOUR CONTROL
          </span>
        </AnimatedHeadline>

        <FadeIn delay={0.2}>
          <div className="mt-12 grid md:grid-cols-2 gap-10">
            <div className="flex flex-col gap-8">
              <div>
                <label
                  style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontSize: 11,
                    color: "#686868",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    display: "block",
                    marginBottom: 12,
                  }}
                >
                  Prompt Complexity: <span style={{ color: "#D1FF00" }}>{complexity}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={complexity}
                  onChange={(e) => setComplexity(+e.target.value)}
                  className="w-full"
                  style={{ accentColor: "#D1FF00" }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontSize: 11,
                    color: "#686868",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    display: "block",
                    marginBottom: 12,
                  }}
                >
                  Influence Nodes: <span style={{ color: "#D1FF00" }}>{nodes}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={nodes}
                  onChange={(e) => setNodes(+e.target.value)}
                  className="w-full"
                  style={{ accentColor: "#D1FF00" }}
                />
              </div>
            </div>

            <div
              className="rounded-sm p-8"
              style={{ backgroundColor: "#1C1E19", border: "1px solid #9C9C9C26" }}
            >
              <div
                style={{
                  fontFamily: "'Roboto Mono', monospace",
                  fontSize: 10,
                  color: "#686868",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 8,
                }}
              >
                Output Confidence Score
              </div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(2rem, 4vw, 3rem)",
                  color: "#D1FF00",
                  letterSpacing: "-0.03em",
                }}
              >
                {confidenceScore.toFixed(1)}%
              </div>
              <div
                className="mt-4 pt-4"
                style={{ borderTop: "1px solid #9C9C9C26" }}
              >
                <div
                  style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontSize: 10,
                    color: "#686868",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 4,
                  }}
                >
                  Total Insights Generated
                </div>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 700,
                    fontSize: 24,
                    color: "#FFFFED",
                  }}
                >
                  {insightsCount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ===== SERVICES (HOW IT WORKS) ===== */
export function Services() {
  const [active, setActive] = useState(0);

  const panels = [
    { label: "PHASE 1", title: "PROMPT PARSING", desc: "Frigate segments your prompt into semantic tokens and identifies key influence nodes." },
    { label: "PHASE 2", title: "INFLUENCE SCORING", desc: "Our engine calculates how each segment contributes to the final generated content." },
    { label: "PHASE 3", title: "MAPPING & MUX", desc: "Visual links are created between prompt parts and their corresponding output regions." },
    { label: "PHASE 4", title: "INSIGHT DASHBOARD", desc: "Real-time analytics and quality metrics are generated for complete transparency." },
  ];

  return (
    <section id="services" style={{ backgroundColor: "#F4F4E8" }} className="w-full relative overflow-hidden">
      <div className="mx-auto w-full grid grid-cols-5" style={{ maxWidth: 1400 }}>
        {/* === ROW 1: TITLE === */}
        {/* Col 1 */}
        <div className="pt-24 pb-32 pl-10 pr-8" style={{ borderRight: "1px solid #9C9C9C26" }}>
          <FadeIn>
            <div
              className="flex items-center gap-2 mb-6"
              style={{
                fontFamily: "'Roboto Mono', monospace",
                fontSize: 10,
                color: "#9C9C9C",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              <span style={{ fontWeight: 600 }}>[06] THE PIPELINE</span>
            </div>
            <p
              className="mt-8"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "clamp(1.1rem, 1.4vw, 1.35rem)",
                lineHeight: "160%",
                color: "#686868",
              }}
            >
              Frigate is a precision engine designed to eliminate the 'black box' of AI generation once and for all.
            </p>
          </FadeIn>
        </div>

        {/* Col 2-5 */}
        <div className="col-span-4 pt-24 pb-32 pl-10 pr-8 flex flex-col justify-end">
          <AnimatedHeadline>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: "clamp(3rem, 5vw, 5.5rem)",
                lineHeight: "0.95",
                letterSpacing: "-0.04em",
                textTransform: "uppercase",
                color: "#050505",
                display: "block",
              }}
            >
              ENGINEERED FOR<br />CLARITY.
            </span>
          </AnimatedHeadline>
          <FadeIn delay={0.2}>
            <p
              className="mt-8"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "clamp(1.1rem, 1.4vw, 1.35rem)",
                lineHeight: "160%",
                color: "#686868",
              }}
            >
              From raw input to explained<br />output in milliseconds.
            </p>
          </FadeIn>
        </div>

        {/* === ROW 2: TIMELINE === */}
        {/* Col 1 Empty */}
        <div className="col-span-1" style={{ borderRight: "1px solid #9C9C9C26" }}></div>
        
        {/* Col 2-5 Timeline */}
        <div className="col-span-4 relative h-0 z-10">
          <div className="absolute top-0 left-0 w-full h-[1px]" style={{ backgroundColor: "#9C9C9C26" }}></div>
          
          {/* Timeline Ticks (hanging down) */}
          {Array.from({ length: 33 }).map((_, idx) => (
            <div
              key={idx}
              className="absolute top-[0px] w-[1px] h-[8px]"
              style={{ backgroundColor: "#9C9C9C40", left: `${(idx / 32) * 100}%` }}
            ></div>
          ))}

          {/* Progress Line */}
          <div
            className="absolute top-[-1px] left-0 h-[3px] transition-all duration-400 ease-out"
            style={{ backgroundColor: "#D1FF00", width: `${(active + 1) * 25}%`, zIndex: 2 }}
          ></div>
        </div>

        {/* === ROW 3: PANELS === */}
        {/* Col 1 Empty */}
        <div className="col-span-1" style={{ borderRight: "1px solid #9C9C9C26" }}></div>
        
        {/* Panels */}
        {panels.map((panel, idx) => {
          const isActive = active === idx;
          return (
            <div
              key={idx}
              className="relative pl-10 pr-8 pt-8 pb-12 flex flex-col cursor-pointer transition-colors duration-400 ease-out"
              style={{
                borderRight: idx === 3 ? "none" : "1px solid #9C9C9C26",
                backgroundColor: isActive ? "#FDFDF9" : "transparent",
                minHeight: "440px",
              }}
              onMouseEnter={() => setActive(idx)}
            >
              <div className="transition-opacity duration-400 ease-out flex-1 flex flex-col" style={{ opacity: isActive ? 1 : 0.4 }}>
                {/* Top Label */}
                <div
                  className="flex items-center gap-2"
                  style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#686868",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  <span style={{ color: isActive ? "#D1FF00" : "#9C9C9C", fontSize: "12px", lineHeight: 1 }}>●</span>
                  {panel.label}
                </div>
                
                {/* Bottom Content (Title & Desc) */}
                <div className="mt-auto">
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 800,
                      fontSize: "clamp(1.1rem, 1.4vw, 1.5rem)",
                      color: isActive ? "#050505" : "#686868",
                      marginBottom: 12,
                      letterSpacing: "-0.01em",
                      textTransform: "uppercase",
                      transition: "color 0.4s ease-out",
                    }}
                  >
                    {panel.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "clamp(0.9rem, 1vw, 1.05rem)",
                      lineHeight: "160%",
                      color: "#686868",
                      maxWidth: "280px",
                    }}
                  >
                    {panel.desc}
                  </div>
                </div>
              </div>

              {/* Bottom lime accent */}
              <div
                className="absolute bottom-0 left-0 w-full transition-all duration-400 ease-out"
                style={{
                  height: isActive ? 4 : 0,
                  backgroundColor: "#D1FF00",
                }}
              ></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ===== PROCESS ===== */
export function Process() {
  const steps = [
    { num: "01", title: "Prompt Input", desc: "Feed text, images, or both into our multimodal composer." },
    { num: "02", title: "Segmentation", desc: "Our parser breaks down complex requests into manageable semantic units." },
    { num: "03", title: "Engine Logic", desc: "The core generation engine processes patterns and influence weights." },
    { num: "04", title: "Visual Mapping", desc: "See the direct connection between your words and the AI's creation." },
    { num: "05", title: "What-if Analysis", desc: "Modify segments in real-time to see architectural shifts in output." },
    { num: "06", title: "Trust Validation", desc: "Review confidence scores and quality insights before final use." },
  ];

  return (
    <section id="process" style={{ backgroundColor: "#050505", padding: "clamp(60px, 10vw, 120px) 40px" }}>
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
        <FadeIn>{sectionLabel("07", "Workflow")}</FadeIn>
        <AnimatedHeadline>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              lineHeight: "105%",
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#FFFFED",
            }}
          >
            THE FRIGATE CYCLE
          </span>
        </AnimatedHeadline>

        <div className="mt-12 flex flex-col">
          {steps.map((step, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div
                className="flex gap-6 md:gap-10 py-8 md:py-10"
                style={{ borderBottom: "1px solid #9C9C9C26" }}
              >
                <div
                  style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontSize: 12,
                    color: "#D1FF00",
                    minWidth: 30,
                    paddingTop: 2,
                  }}
                >
                  {step.num}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 700,
                      fontSize: "clamp(1.1rem, 2vw, 1.5rem)",
                      color: "#FFFFED",
                      marginBottom: 6,
                    }}
                  >
                    {step.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 14,
                      lineHeight: "170%",
                      color: "#686868",
                      maxWidth: 600,
                    }}
                  >
                    {step.desc}
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== POST LAUNCH ===== */
export function PostLaunch() {
  return (
    <section style={{ backgroundColor: "#F4F4E8", padding: "clamp(60px, 10vw, 120px) 40px" }}>
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
        <FadeIn>{sectionLabel("08", "Enterprise Grade")}</FadeIn>
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <AnimatedHeadline>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2rem, 4vw, 3rem)",
                lineHeight: "105%",
                letterSpacing: "-0.03em",
                textTransform: "uppercase",
                color: "#050505",
              }}
            >
              SCALABLE EXPLAINABILITY
            </span>
          </AnimatedHeadline>
          <FadeIn delay={0.2}>
            <div className="flex flex-col gap-6">
              {[
                { title: "API First Integration", desc: "Seamlessly integrate our explainability layer into your existing AI workflows." },
                { title: "Custom Heuristics", desc: "Define specific influence rules tailored to your brand's unique style and requirements." },
                { title: "Performance Analytics", desc: "Monitor how prompt variations affect user satisfaction and output quality." },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-6 rounded-sm"
                  style={{ border: "1px solid #9C9C9C26", backgroundColor: "#FFFFED" }}
                >
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      color: "#050505",
                      marginBottom: 6,
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 14,
                      lineHeight: "170%",
                      color: "#686868",
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ===== CUSTOMER STORY ===== */
export function CustomerStory() {
  return (
    <section style={{ backgroundColor: "#1C1E19", padding: "clamp(60px, 10vw, 120px) 40px" }}>
      <div className="mx-auto" style={{ maxWidth: 1000 }}>
        <FadeIn>{sectionLabel("09", "Feature Insight")}</FadeIn>
        <AnimatedHeadline>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: "105%",
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#FFFFED",
            }}
          >
            HOW CREATIVES REGAINED CONTROL WITH FRIGATE
          </span>
        </AnimatedHeadline>
        <FadeIn delay={0.2}>
          <p
            className="mt-8"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "clamp(1rem, 1.3vw, 1.15rem)",
              lineHeight: "175%",
              color: "#686868",
              maxWidth: 700,
            }}
          >
            A leading design studio was struggling with inconsistent AI image outputs.
            By implementing Frigate's influence mapping, they identified the specific 'ghost'
            tokens causing style drift. The result: 3x faster iterations, 99.9% consistency
            across campaigns, and total creative trust.
          </p>
        </FadeIn>
        <FadeIn delay={0.35}>
          <div className="flex flex-wrap gap-8 mt-10">
            {[
              { value: "3x", label: "Faster Iterations" },
              { value: "99.9%", label: "Consistency" },
              { value: "100%", label: "Creative Trust" },
            ].map((s, i) => (
              <div key={i}>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 800,
                    fontSize: 32,
                    color: "#D1FF00",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontSize: 10,
                    color: "#686868",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginTop: 4,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ===== TESTIMONIALS ===== */
export function Testimonials() {
  const testimonials = [
    {
      quote: "Frigate turned the AI black box into a glass house. I finally understand why I'm getting these results.",
      name: "Sarah Chen",
      role: "Lead Creative, Visionary Studio",
    },
    {
      quote: "Our engineers used to guess at prompt weights for weeks. With Frigate, we have full visibility into why the model generates what it does. It's the infrastructure we've been waiting for.",
      name: "SYSTEM ARCHITECT",
      role: "Core Platform User",
    },
    {
      quote: "Generation is no longer a dark art; it's a measurable science. Frigate has mapped every token's influence, giving our engineers total control over the prompt-to-output pipeline.",
      name: "INTELLIGENCE LAYER",
      role: "Platform Verification",
    },
  ];

  return (
    <section style={{ backgroundColor: "#F4F4E8", padding: "clamp(60px, 10vw, 120px) 40px" }}>
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
        <FadeIn>{sectionLabel("10", "User Feedback")}</FadeIn>
        <AnimatedHeadline>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: "105%",
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#050505",
            }}
          >
            THE VERDICT
          </span>
        </AnimatedHeadline>
        <div className="grid md:grid-cols-3 gap-4 mt-12">
          {testimonials.map((t, i) => (
            <FadeIn key={i} delay={i * 0.12}>
              <div
                className="p-7 rounded-sm h-full flex flex-col"
                style={{ backgroundColor: "#FFFFED", border: "1px solid #9C9C9C26" }}
              >
                <p
                  className="flex-1"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 15,
                    lineHeight: "175%",
                    color: "#050505",
                    fontStyle: "italic",
                    marginBottom: 24,
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#050505",
                    }}
                  >
                    {t.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Roboto Mono', monospace",
                      fontSize: 11,
                      color: "#686868",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginTop: 2,
                    }}
                  >
                    {t.role}
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== TECH STACK ===== */
export function TechStack() {
  const techs = [
    "OpenAI", "LangChain", "Make.com", "Zapier", "n8n", "Python",
    "Pinecone", "Supabase", "Vercel", "Slack API", "HubSpot", "Notion API",
    "Stripe", "Twilio", "AWS Lambda", "Google Cloud",
  ];

  return (
    <section style={{ backgroundColor: "#050505", padding: "clamp(60px, 10vw, 100px) 40px" }}>
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
        <FadeIn>{sectionLabel("10", "Tech Stack")}</FadeIn>
        <AnimatedHeadline>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: "105%",
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#FFFFED",
            }}
          >
            PLATFORM STACK
          </span>
        </AnimatedHeadline>
        <div className="flex flex-wrap gap-3 mt-12">
          {techs.map((tech, i) => (
            <FadeIn key={i} delay={i * 0.04}>
              <div
                style={{
                  fontFamily: "'Roboto Mono', monospace",
                  fontSize: 12,
                  color: "#FFFFED",
                  border: "1px solid #9C9C9C26",
                  padding: "10px 20px",
                  borderRadius: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  transition: "border-color 0.2s ease-out",
                  cursor: "default",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#D1FF00")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#9C9C9C26")}
              >
                {tech}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== TEAM ===== */
export function Team() {
  const members = [
    { name: "Sudharshan Ravichandran", role: "Founder & CEO", bio: "Platform Architect. Leading the vision for explainable multimodal generation." },
    { name: "ENGINEERING LEAD", role: "Head of Systems", bio: "Architecting automation systems for mission-critical infrastructure." },
    { name: "SOLUTIONS ARCHITECT", role: "AI Infrastructure", bio: "Leading the integration of complex generation pipelines." },
    { name: "OPERATIONS LEAD", role: "Growth & Scale", bio: "Optimizing operational efficiency for global platform delivery." },
  ];

  return (
    <section id="team" style={{ backgroundColor: "#F4F4E8", padding: "clamp(60px, 10vw, 120px) 40px" }}>
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
        <FadeIn>{sectionLabel("11", "Team")}</FadeIn>
        <AnimatedHeadline>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: "105%",
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#050505",
            }}
          >
            THE MINDS BEHIND FRIGATE
          </span>
        </AnimatedHeadline>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {members.map((m, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="rounded-sm overflow-hidden" style={{ backgroundColor: "#1C1E19" }}>
                <div
                  className="w-full flex items-center justify-center"
                  style={{
                    height: 200,
                    backgroundColor: "#2a2d24",
                    color: "#D1FF00",
                    opacity: 0.3,
                  }}
                >
                  {m.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="p-6">
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      color: "#FFFFED",
                    }}
                  >
                    {m.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Roboto Mono', monospace",
                      fontSize: 10,
                      color: "#D1FF00",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginTop: 4,
                      marginBottom: 10,
                    }}
                  >
                    {m.role}
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      lineHeight: "160%",
                      color: "#686868",
                    }}
                  >
                    {m.bio}
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== PRICING ===== */
export function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "$2,500",
      period: "one-time",
      desc: "Perfect for small teams looking to automate 1-2 key workflows.",
      features: ["1 custom automation", "2 tool integrations", "30-day support", "Documentation"],
      popular: false,
    },
    {
      name: "Growth",
      price: "$5,000",
      period: "/month",
      desc: "For growing companies ready to build a comprehensive automation ecosystem.",
      features: [
        "Up to 5 automations",
        "Unlimited integrations",
        "Dedicated Slack channel",
        "Monthly optimization calls",
        "Priority support",
        "Custom dashboards",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      desc: "Full-scale AI transformation for large organizations.",
      features: [
        "Unlimited automations",
        "Custom AI models",
        "24/7 monitoring",
        "Dedicated team",
        "SLA guarantee",
        "On-site workshops",
      ],
      popular: false,
    },
  ];

  return (
    <section id="pricing" style={{ backgroundColor: "#050505", padding: "clamp(60px, 10vw, 120px) 40px" }}>
      <div className="mx-auto" style={{ maxWidth: 1200 }}>
        <FadeIn>{sectionLabel("12", "Pricing")}</FadeIn>
        <AnimatedHeadline>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: "105%",
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#FFFFED",
            }}
          >
            TRANSPARENT PRICING
          </span>
        </AnimatedHeadline>
        <div className="grid md:grid-cols-3 gap-4 mt-12">
          {plans.map((plan, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div
                className="rounded-sm p-7 h-full flex flex-col relative"
                style={{
                  backgroundColor: plan.popular ? "#D1FF00" : "#1C1E19",
                  border: plan.popular ? "none" : "1px solid #9C9C9C26",
                }}
              >
                {plan.popular && (
                  <div
                    className="absolute top-4 right-4"
                    style={{
                      fontFamily: "'Roboto Mono', monospace",
                      fontSize: 9,
                      color: "#D1FF00",
                      backgroundColor: "#050505",
                      padding: "4px 10px",
                      borderRadius: 2,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Most Popular
                  </div>
                )}
                <div
                  style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontSize: 11,
                    color: plan.popular ? "#050505" : "#686868",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 16,
                    opacity: 0.7,
                  }}
                >
                  {plan.name}
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 800,
                      fontSize: "clamp(2rem, 3vw, 2.5rem)",
                      color: plan.popular ? "#050505" : "#FFFFED",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span
                      style={{
                        fontFamily: "'Roboto Mono', monospace",
                        fontSize: 11,
                        color: plan.popular ? "#050505" : "#686868",
                        opacity: 0.6,
                      }}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>
                <p
                  className="mb-6"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 14,
                    lineHeight: "160%",
                    color: plan.popular ? "#050505" : "#686868",
                    opacity: 0.8,
                  }}
                >
                  {plan.desc}
                </p>
                <ul className="flex-1 flex flex-col gap-3 mb-8">
                  {plan.features.map((f, fi) => (
                    <li
                      key={fi}
                      className="flex items-center gap-2"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        color: plan.popular ? "#050505" : "#FFFFED",
                        opacity: 0.85,
                      }}
                    >
                      <span style={{ color: plan.popular ? "#050505" : "#D1FF00", fontSize: 14 }}>
                        &#10003;
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className="block text-center rounded-sm"
                  style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "14px 24px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    textDecoration: "none",
                    backgroundColor: plan.popular ? "#050505" : "transparent",
                    color: plan.popular ? "#D1FF00" : "#FFFFED",
                    border: plan.popular ? "none" : "1px solid #9C9C9C26",
                    transition: "transform 0.2s ease-out",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  Get Started
                </a>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== FAQ ===== */
export function FAQ() {
  const faqs = [
    { q: "How long does a typical project take?", a: "Most projects take 2-6 weeks depending on complexity. Simple automations can be deployed in under a week, while comprehensive AI systems may take 4-8 weeks." },
    { q: "Do you work with specific industries?", a: "Frigate works across industries including SaaS, e-commerce, healthcare, finance, and professional services. The platform approach is adaptable to any business with multimodal needs." },
    { q: "What if I already have some generation pipelines in place?", a: "Great! Frigate will audit your existing setup, identify optimization opportunities, and build on top of what's already working. No need to start from scratch." },
    { q: "How do you measure ROI?", a: "Frigate tracks tokens saved, iteration speed, quality improvements, and cost reduction. You'll receive a detailed intelligence report within the first 30 days of deployment." },
    { q: "What tools and platforms do you integrate with?", a: "Frigate integrates with all major model providers and enterprise stacks. If it has an API, it can be connected." },
    { q: "Do you offer ongoing support after launch?", a: "Yes. All plans include initial support, and our Growth and Enterprise plans include ongoing monitoring, optimization, and priority support." },
  ];

  return (
    <section id="faq" style={{ backgroundColor: "#F4F4E8", padding: "clamp(60px, 10vw, 120px) 40px" }}>
      <div className="mx-auto" style={{ maxWidth: 900 }}>
        <FadeIn>{sectionLabel("13", "FAQ")}</FadeIn>
        <AnimatedHeadline>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: "105%",
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#050505",
            }}
          >
            FREQUENTLY ASKED
          </span>
        </AnimatedHeadline>
        <div className="mt-12 flex flex-col">
          {faqs.map((faq, i) => (
            <FadeIn key={i} delay={i * 0.06}>
              <FAQItem question={faq.q} answer={faq.a} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="cursor-pointer"
      style={{ borderBottom: "1px solid #9C9C9C26" }}
      onClick={() => setOpen(!open)}
    >
      <div
        className="flex items-center justify-between py-6"
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          fontSize: "clamp(0.95rem, 1.3vw, 1.1rem)",
          color: "#050505",
        }}
      >
        {question}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex-shrink-0 ml-4"
        >
          <ChevronDown size={20} color="#686868" />
        </motion.div>
      </div>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <p
          className="pb-6"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            lineHeight: "175%",
            color: "#686868",
            maxWidth: 700,
          }}
        >
          {answer}
        </p>
      </motion.div>
    </div>
  );
}

/* ===== CONTACT FORM ===== */
export function ContactForm() {
  return (
    <section id="contact" style={{ backgroundColor: "#050505", padding: "clamp(60px, 10vw, 120px) 40px" }}>
      <div className="mx-auto" style={{ maxWidth: 700 }}>
        <FadeIn>{sectionLabel("14", "Contact")}</FadeIn>
        <AnimatedHeadline>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: "105%",
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#FFFFED",
            }}
          >
            BOOK YOUR FREE AI AUDIT
          </span>
        </AnimatedHeadline>

        <FadeIn delay={0.2}>
          <form
            className="mt-12 flex flex-col gap-5"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <FormInput label="Full Name" placeholder="John Doe" />
              <FormInput label="Email" placeholder="john@company.com" type="email" />
            </div>
            <FormInput label="Company" placeholder="Your company name" />
            <FormInput label="Website" placeholder="https://yourcompany.com" />
            <div>
              <label
                style={{
                  fontFamily: "'Roboto Mono', monospace",
                  fontSize: 10,
                  color: "#686868",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Tell us about your challenges
              </label>
              <textarea
                rows={4}
                placeholder="What manual processes are slowing your team down?"
                className="w-full outline-none resize-none"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  color: "#FFFFED",
                  backgroundColor: "#1C1E19",
                  border: "1px solid #9C9C9C26",
                  borderRadius: 4,
                  padding: "14px 16px",
                  transition: "border-color 0.2s ease-out",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#D1FF00")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#9C9C9C26")}
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-sm"
              style={{
                fontFamily: "'Roboto Mono', monospace",
                fontSize: 13,
                fontWeight: 600,
                color: "#050505",
                backgroundColor: "#D1FF00",
                padding: "16px 32px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                border: "none",
                cursor: "pointer",
                transition: "transform 0.2s ease-out, box-shadow 0.2s ease-out",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(209,255,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Submit &rarr;
            </button>
          </form>
        </FadeIn>
      </div>
    </section>
  );
}

function FormInput({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label
        style={{
          fontFamily: "'Roboto Mono', monospace",
          fontSize: 10,
          color: "#686868",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          display: "block",
          marginBottom: 8,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full outline-none"
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
          color: "#FFFFED",
          backgroundColor: "#1C1E19",
          border: "1px solid #9C9C9C26",
          borderRadius: 4,
          padding: "14px 16px",
          transition: "border-color 0.2s ease-out",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#D1FF00")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#9C9C9C26")}
      />
    </div>
  );
}

/* ===== NEWSLETTER + FOOTER ===== */
export function Footer() {
  const mono: React.CSSProperties = {
    fontFamily: "'Roboto Mono', monospace",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  };

  const hoverLink = (e: React.MouseEvent, enter: boolean) => {
    (e.currentTarget as HTMLElement).style.opacity = enter ? "1" : "0.5";
    (e.currentTarget as HTMLElement).style.transform = enter ? "translateY(-1px)" : "translateY(0)";
  };

  return (
    <footer>
      {/* ── Newsletter section ── */}
      <section style={{ backgroundColor: "#1C1E19", padding: "clamp(60px, 10vw, 100px) 40px" }}>
        <div className="mx-auto" style={{ maxWidth: 1200 }}>
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <FadeIn>
              <div>
                <div style={{ ...mono, fontSize: 9, color: "#686868", marginBottom: 20 }}>[Newsletter]</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: "105%", letterSpacing: "-0.03em", textTransform: "uppercase", color: "#FFFFED", marginBottom: 16 }}>
                  STAY IN<br />THE LOOP
                </div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: "175%", color: "#686868", maxWidth: 400 }}>
                  Practical automation strategies, AI insights, and case studies delivered monthly. No spam, unsubscribe anytime.
                </p>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label style={{ ...mono, fontSize: 9, color: "#686868", display: "block", marginBottom: 8 }}>Name</label>
                  <input type="text" placeholder="Your name" className="w-full outline-none" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#FFFFED", backgroundColor: "transparent", border: "1px solid #9C9C9C26", borderRadius: 4, padding: "13px 16px", transition: "border-color 0.2s ease-out" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#D1FF00")} onBlur={(e) => (e.currentTarget.style.borderColor = "#9C9C9C26")} />
                </div>
                <div>
                  <label style={{ ...mono, fontSize: 9, color: "#686868", display: "block", marginBottom: 8 }}>Email</label>
                  <input type="email" placeholder="your@email.com" className="w-full outline-none" style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#FFFFED", backgroundColor: "transparent", border: "1px solid #9C9C9C26", borderRadius: 4, padding: "13px 16px", transition: "border-color 0.2s ease-out" }} onFocus={(e) => (e.currentTarget.style.borderColor = "#D1FF00")} onBlur={(e) => (e.currentTarget.style.borderColor = "#9C9C9C26")} />
                </div>
                <button type="submit" className="w-full rounded-sm" style={{ ...mono, fontSize: 11, fontWeight: 600, color: "#050505", backgroundColor: "#D1FF00", padding: "14px 24px", border: "none", borderRadius: 4, cursor: "pointer", transition: "transform 0.2s ease-out" }} onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}>
                  Subscribe &rarr;
                </button>
                <p style={{ ...mono, fontSize: 8, color: "#686868", opacity: 0.5, lineHeight: "160%" }}>By subscribing you agree to our privacy policy. Frigate respects your inbox.</p>
              </form>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Lower footer ── */}
      <section style={{ backgroundColor: "#050505", padding: "48px 40px 40px" }}>
        <div className="mx-auto" style={{ maxWidth: 1200 }}>
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 pb-12" style={{ borderBottom: "1px solid #9C9C9C15" }}>
            <FadeIn>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "clamp(3rem, 6vw, 5.5rem)", lineHeight: "100%", letterSpacing: "-0.03em", textTransform: "uppercase", color: "#FFFFED" }}>FRIGATE</div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <a href="#contact" style={{ ...mono, fontSize: 10, color: "#050505", backgroundColor: "#D1FF00", padding: "12px 24px", borderRadius: 4, textDecoration: "none", display: "inline-block", transition: "transform 0.2s ease-out" }} onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}>Contact Us</a>
            </FadeIn>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12" style={{ borderBottom: "1px solid #9C9C9C15" }}>
            <FadeIn delay={0.05}>
              <div>
                <div style={{ ...mono, fontSize: 9, color: "#686868", marginBottom: 16 }}>[Socials]</div>
                <div className="flex flex-col gap-3">
                  {["Twitter", "Instagram", "LinkedIn", "YouTube"].map((s) => (
                    <a key={s} href="#" style={{ ...mono, fontSize: 10, color: "#FFFFED", textDecoration: "none", opacity: 0.5, transition: "opacity 0.2s ease-out, transform 0.2s ease-out", display: "inline-block" }} onMouseEnter={(e) => hoverLink(e, true)} onMouseLeave={(e) => hoverLink(e, false)}>{s}</a>
                  ))}
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div>
                <div style={{ ...mono, fontSize: 9, color: "#686868", marginBottom: 16 }}>[Legal]</div>
                <div className="flex flex-col gap-3">
                  {["Acceptable Use Policy", "Privacy Policy", "Terms & Conditions", "Cookies"].map((s) => (
                    <a key={s} href="#" style={{ ...mono, fontSize: 10, color: "#FFFFED", textDecoration: "none", opacity: 0.5, transition: "opacity 0.2s ease-out, transform 0.2s ease-out", display: "inline-block" }} onMouseEnter={(e) => hoverLink(e, true)} onMouseLeave={(e) => hoverLink(e, false)}>{s}</a>
                  ))}
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <div>
                <div style={{ ...mono, fontSize: 9, color: "#686868", marginBottom: 16 }}>[Navigation]</div>
                <div className="flex flex-col gap-3">
                  {["Services", "Process", "Pricing", "Team", "FAQ", "Contact"].map((s) => (
                    <a key={s} href={`#${s.toLowerCase()}`} style={{ ...mono, fontSize: 10, color: "#FFFFED", textDecoration: "none", opacity: 0.5, transition: "opacity 0.2s ease-out, transform 0.2s ease-out", display: "inline-block" }} onMouseEnter={(e) => hoverLink(e, true)} onMouseLeave={(e) => hoverLink(e, false)}>{s}</a>
                  ))}
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div>
                <div style={{ ...mono, fontSize: 9, color: "#686868", marginBottom: 16 }}>[Contact]</div>
                <div className="flex flex-col gap-3">
                  <a href="mailto:hello@frigate.ai" style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#FFFFED", textDecoration: "none", opacity: 0.6, transition: "opacity 0.2s ease-out" }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}>hello@frigate.ai</a>
                </div>
              </div>
            </FadeIn>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8">
            <div style={{ ...mono, fontSize: 9, color: "#686868", opacity: 0.5 }}>&copy; 2026 Frigate, Inc. All rights reserved.</div>
            <div style={{ ...mono, fontSize: 9, color: "#686868", opacity: 0.5 }}>AI Generation Specialists</div>
            <div>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.05em", color: "#050505", textTransform: "uppercase" }}>Sudharshan Ravichandran</div>
              <div style={{ ...mono, fontSize: 9, color: "#050505", opacity: 0.5, marginTop: 4 }}>Founder & CEO</div>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}
