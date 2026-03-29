import { useNavigate } from "react-router";
import { useAuth } from "../lib/auth";
import { FadeIn } from "./AnimatedText";
import { GrainLocal } from "./GrainOverlay";

const mono: React.CSSProperties = {
  fontFamily: "'Roboto Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const navLinks = [
  { label: "HOME", path: "/" },
  { label: "COMPOSER", path: "/composer" },
  { label: "WHAT-IF STUDIO", path: "/what-if" },
  { label: "TRUST DASHBOARD", path: "/dashboard" },
  { label: "CONTACT", path: "/contact" },
];

const legalLinks = [
  { num: "1.0", label: "ACCEPTABLE USE POLICY", path: "/legal/acceptable-use-policy" },
  { num: "1.1", label: "PRIVACY POLICY", path: "/legal/privacy-policy" },
  { num: "1.2", label: "TERMS & CONDITIONS", path: "/legal/terms-conditions" },
  { num: "1.3", label: "COOKIE POLICY", path: "/legal/cookie-policy" },
];

function FooterNavLink({ label, path }: { label: string; path: string }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(path)}
      className="group relative block w-full border-none bg-transparent p-0 text-left"
      style={{
        fontFamily: "Inter, sans-serif",
        fontWeight: 900,
        fontSize: "clamp(1.8rem, 2.7vw, 3rem)",
        color: "#050505",
        textTransform: "uppercase",
        letterSpacing: "-0.04em",
        lineHeight: 0.98,
        padding: "8px 0",
      }}
    >
      <span className="inline-flex items-center gap-3 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5">
        {label}
      </span>
    </button>
  );
}

function FooterSmallLink({
  num,
  label,
  onClick,
  path,
}: {
  num: string;
  label: string;
  onClick?: () => void;
  path?: string;
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => {
        if (onClick) {
          onClick();
          return;
        }

        if (path) {
          navigate(path);
        }
      }}
      className="group relative flex w-full items-center gap-5 overflow-hidden border-none bg-transparent px-0 py-1.5 text-left"
      style={{
        fontFamily: "'Roboto Mono', monospace",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        fontSize: 10,
        fontWeight: 600,
        color: "rgba(5,5,5,0.6)",
      }}
    >
      <span style={{ minWidth: 28, opacity: 0.45 }}>{num}</span>
      <span className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5">
        {label}
      </span>
    </button>
  );
}

export function Footer() {
  const { isAuthenticated, signOut } = useAuth();
  const accessLinks = isAuthenticated
    ? [
        { num: "2.0", label: "DASHBOARD", path: "/dashboard" },
        { num: "2.1", label: "COMPOSER", path: "/composer" },
        { num: "2.2", label: "SIGN OUT", onClick: () => void signOut().finally(() => navigate("/")) },
      ]
    : [
        { num: "2.0", label: "CREATE ACCOUNT", path: "/signup" },
        { num: "2.1", label: "SIGN IN", path: "/login" },
      ];
  const navigate = useNavigate();

  return (
    <footer className="relative w-full overflow-hidden" style={{ backgroundColor: "#F4F4E8" }}>
      <GrainLocal opacity={0.03} />

      <div className="mx-auto relative z-10 w-full" style={{ maxWidth: 1920, padding: "0 clamp(20px, 3vw, 48px)" }}>
        <div className="absolute inset-0 pointer-events-none hidden md:flex" style={{ padding: "0 clamp(20px, 3vw, 48px)" }}>
          <div className="w-1/4 border-r border-[#000000] opacity-[0.04]" />
          <div className="w-1/4 border-r border-[#000000] opacity-[0.04]" />
          <div className="w-1/4 border-r border-[#000000] opacity-[0.04]" />
          <div className="w-1/4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-y-12 pt-16 pb-16 relative z-10" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="col-span-1 md:col-span-2 pr-0 md:pr-10">
            <FadeIn>
              <div style={{ ...mono, fontSize: 10, color: "#050505", opacity: 0.48, marginBottom: 16 }}>[CONTACT]</div>
            </FadeIn>
            <FadeIn delay={0.05}>
              <h2
                style={{
                  fontFamily: "'TASA Orbiter', Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(2.2rem, 4vw, 4rem)",
                  letterSpacing: "-0.05em",
                  lineHeight: 0.92,
                  color: "#050505",
                  margin: "0 0 18px 0",
                  textTransform: "uppercase",
                  maxWidth: 620,
                }}
              >
                Build AI workflows your team can actually explain.
              </h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#050505", opacity: 0.62, margin: 0, lineHeight: "160%", maxWidth: 520 }}>
                Frigate helps teams understand what shaped an output, compare revisions with confidence, and move from trial-and-error to accountable generation.
              </p>
            </FadeIn>
          </div>

          <div className="col-span-1 pr-0 md:pr-6">
            <FadeIn delay={0.12}>
              <div style={{ ...mono, fontSize: 10, color: "#050505", opacity: 0.45, marginBottom: 14 }}>[EMAIL]</div>
              <a
                href="mailto:hello@frigate.ai"
                style={{
                  fontFamily: "'TASA Orbiter', Inter, sans-serif",
                  fontSize: "clamp(1rem, 2.2vw, 1.35rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  color: "#050505",
                  textDecoration: "none",
                  textTransform: "uppercase",
                  overflowWrap: "anywhere",
                }}
              >
                hello@frigate.ai
              </a>
            </FadeIn>
          </div>

          <div className="col-span-1 pr-0 md:pr-6 flex items-end">
            <FadeIn delay={0.16} className="w-full">
              <a
                href="mailto:hello@frigate.ai?subject=Frigate%20inquiry"
                className="flex w-full items-center justify-between no-underline"
                style={{
                  ...mono,
                  backgroundColor: "#050505",
                  color: "#D1FF00",
                  padding: "16px 20px",
                  borderBottom: "4px solid #D1FF00",
                }}
              >
                <span>Start A Conversation</span>
                <span style={{ fontSize: 16 }}>&gt;</span>
              </a>
            </FadeIn>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-y-16 pt-24 pb-24 relative z-10">
          <div className="hidden md:block col-span-1 pr-6" />

          <div className="col-span-1 pr-0 md:pr-6">
            <FadeIn>
              <div style={{ ...mono, fontSize: 10, color: "#050505", opacity: 0.4, marginBottom: 28 }}>[NAVIGATION]</div>
            </FadeIn>
            <div className="flex flex-col">
              {navLinks.map((link, index) => (
                <FadeIn key={link.label} delay={0.04 + index * 0.03}>
                  <FooterNavLink label={link.label} path={link.path} />
                </FadeIn>
              ))}
            </div>
          </div>

          <div className="hidden md:block col-span-1 pr-6" />

          <div className="col-span-1 flex flex-col gap-12 items-start">
            <div className="w-full">
              <FadeIn delay={0.1}>
                <div style={{ ...mono, fontSize: 10, color: "#050505", opacity: 0.4, marginBottom: 16 }}>[ACCESS]</div>
              </FadeIn>
              <div className="flex flex-col gap-1">
                {accessLinks.map((link, index) => (
                  <FadeIn key={link.num} delay={0.12 + index * 0.03}>
                    <FooterSmallLink num={link.num} label={link.label} onClick={link.onClick} path={link.path} />
                  </FadeIn>
                ))}
              </div>
            </div>

            <div className="w-full">
              <FadeIn delay={0.12}>
                <div style={{ ...mono, fontSize: 10, color: "#050505", opacity: 0.4, marginBottom: 16 }}>[LEGAL]</div>
              </FadeIn>
              <div className="flex flex-col gap-1">
                {legalLinks.map((link, index) => (
                  <FadeIn key={link.num} delay={0.14 + index * 0.03}>
                    <FooterSmallLink num={link.num} label={link.label} path={link.path} />
                  </FadeIn>
                ))}
              </div>
            </div>

            <div className="w-full">
              <FadeIn delay={0.18}>
                <div style={{ ...mono, fontSize: 10, color: "#050505", opacity: 0.4, marginBottom: 16 }}>[SUMMARY]</div>
              </FadeIn>
              <FadeIn delay={0.22}>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: "165%", color: "#050505", opacity: 0.6, margin: 0, maxWidth: 320 }}>
                  Explainable generation for teams working across text, image, and review workflows.
                </p>
              </FadeIn>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 items-end gap-y-8 pt-8 pb-12 relative z-10" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="col-span-1 md:col-span-2 pr-0 md:pr-6">
            <FadeIn delay={0.15}>
              <img
                src="/logo/dark%20full%20logo.png"
                alt="Frigate Logo"
                className="w-full h-auto object-contain object-left"
                style={{ maxHeight: "20vh", maxWidth: 560, display: "block" }}
              />
            </FadeIn>
          </div>

          <div className="hidden md:block col-span-1 pr-6" />

          <div className="col-span-1 flex flex-col justify-end text-left md:text-right">
            <FadeIn delay={0.2}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "#050505", opacity: 0.35, lineHeight: "170%", margin: 0 }}>
                &copy; 2026 Frigate, Inc. All rights reserved.
              </p>
            </FadeIn>
          </div>
        </div>
      </div>
    </footer>
  );
}
