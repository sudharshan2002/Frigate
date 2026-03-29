import { AnimatedHeadline, FadeIn } from "./AnimatedText";

export function Hero() {
  return (
    <section
      className="relative flex flex-col items-center justify-center"
      style={{
        backgroundColor: "#D1FF00",
        minHeight: "100vh",
        padding: "140px 40px 100px",
      }}
    >
      <div className="w-full" style={{ maxWidth: 1400, textAlign: "center" }}>
        <FadeIn delay={1.4}>
          <div
            style={{
              fontFamily: "'Roboto Mono', monospace",
              fontSize: 12,
              color: "#050505",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 32,
              opacity: 0.6,
            }}
          >
            [01] Explainable AI Generation
          </div>
        </FadeIn>

        <AnimatedHeadline
          delay={1.5}
          className="mb-8"
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(3rem, 8vw, 7.5rem)",
              lineHeight: "100%",
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              color: "#050505",
            }}
          >
            UNDERSTAND, CONTROL, AND TRUST YOUR AI OUTPUTS
          </span>
        </AnimatedHeadline>

        <FadeIn delay={1.8}>
          <p
            className="mx-auto"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
              lineHeight: "160%",
              color: "#050505",
              opacity: 0.7,
              maxWidth: 640,
              marginBottom: 48,
            }}
          >
            Frigate is the next-generation prompt-to-output engine that visualizes influence,
            enables real-time 'what-if' editing, and builds trust through transparency.
          </p>
        </FadeIn>

        <FadeIn delay={2}>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <a
              href="#composer"
              style={{
                fontFamily: "'Roboto Mono', monospace",
                fontSize: 13,
                fontWeight: 600,
                color: "#050505",
                backgroundColor: "#D1FF00",
                padding: "14px 32px",
                borderRadius: 4,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                textDecoration: "none",
                transition: "all 0.3s ease-out",
                display: "inline-block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.2)";
                e.currentTarget.style.backgroundColor = "#2a2d24";
                e.currentTarget.style.color = "#D1FF00";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.backgroundColor = "#D1FF00";
                e.currentTarget.style.color = "#050505";
              }}
            >
              Open Composer
            </a>
            <a
              href="#services"
              style={{
                fontFamily: "'Roboto Mono', monospace",
                fontSize: 13,
                fontWeight: 500,
                color: "#050505",
                border: "1.5px solid #050505",
                padding: "13px 32px",
                borderRadius: 4,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                textDecoration: "none",
                transition: "background-color 0.2s ease-out",
                display: "inline-block",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              See it in Action &#9654;
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={2.2}>
          <div
            style={{
              fontFamily: "'Roboto Mono', monospace",
              fontSize: 11,
              color: "#050505",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              opacity: 0.5,
            }}
          >
            Empowering creators and engineers worldwide
          </div>
        </FadeIn>
      </div>

      {/* Proof block */}
      <FadeIn delay={2.3} className="mt-16 w-full" style={{ maxWidth: 900 }}>
        <div
          className="mx-auto rounded-sm overflow-hidden"
          style={{
            backgroundColor: "#1C1E19",
            maxWidth: 900,
            padding: "32px",
          }}
        >
          <div className="flex flex-wrap gap-6 items-center justify-between">
            {[
              { label: "Prompt Mapping Accuracy", value: "99.8%" },
              { label: "Tokens Explained", value: "12M+" },
              { label: "User Clarity Score", value: "10/10" },
              { label: "Output Confidence", value: "97%" },
            ].map((item, i) => (
              <div key={i} className="text-center flex-1 min-w-[120px]">
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 800,
                    fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                    color: "#D1FF00",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {item.value}
                </div>
                <div
                  style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontSize: 10,
                    color: "#F4F4E8",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    opacity: 0.6,
                    marginTop: 6,
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
