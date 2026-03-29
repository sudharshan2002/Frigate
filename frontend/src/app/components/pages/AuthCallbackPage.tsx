import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { FadeSlideText, WordReveal } from "../AnimatedText";
import { useAuth } from "../../lib/auth";
import { getPostAuthDestination, hasAuthRedirectParams, resolveNextPath } from "../../lib/authRedirect";
import { GrainLocal } from "../GrainOverlay";

const mono: React.CSSProperties = {
  fontFamily: "'Roboto Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const ease = [0.16, 1, 0.3, 1] as const;
const authShellMaxWidth = 1480;

function readCallbackError(url: URL) {
  const searchError = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (searchError) {
    return searchError;
  }

  const hash = url.hash.replace(/^#/, "");
  if (!hash) {
    return null;
  }

  const hashParams = new URLSearchParams(hash);
  return hashParams.get("error_description") || hashParams.get("error");
}

export function AuthCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useAuth();
  const nextPath = resolveNextPath(location.search);
  const [timedOut, setTimedOut] = useState(false);
  const callbackUrl = useMemo(() => new URL(window.location.href), []);
  const callbackError = useMemo(() => readCallbackError(callbackUrl), [callbackUrl]);
  const hasRedirectState = useMemo(() => hasAuthRedirectParams(callbackUrl), [callbackUrl]);

  useEffect(() => {
    if (callbackError || !hasRedirectState || isAuthenticated) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setTimedOut(true);
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [callbackError, hasRedirectState, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    navigate(getPostAuthDestination(user, nextPath), { replace: true });
  }, [isAuthenticated, navigate, nextPath, user]);

  const message = callbackError
    ? callbackError
    : !hasRedirectState
      ? "No auth callback details were found in this URL."
      : timedOut && !loading && !isAuthenticated
        ? "Supabase did not finish the sign-in handshake. Check your redirect URLs and provider settings, then try again."
        : "Finalizing your Supabase session and routing you into the workspace.";

  const readyForRetry = Boolean(callbackError) || (!loading && !isAuthenticated && (timedOut || !hasRedirectState));

  return (
    <section className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "#F5F4E7", paddingTop: 72 }}>
      <GrainLocal opacity={0.035} />

      <div
        className="relative z-10 mx-auto min-h-[calc(100vh-72px)] w-full"
        style={{ maxWidth: authShellMaxWidth, padding: "clamp(26px, 4vw, 40px) clamp(20px, 3vw, 40px)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(5,5,5,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(5,5,5,0.04) 1px, transparent 1px)",
            backgroundSize: "100% 100%, 100% 180px",
            maskImage: "linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0.18) 72%, rgba(0,0,0,0))",
          }}
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-px lg:block" style={{ backgroundColor: "rgba(5,5,5,0.07)" }} />
        <div className="pointer-events-none absolute inset-y-0 hidden w-px lg:block" style={{ left: "56.5%", backgroundColor: "rgba(5,5,5,0.07)" }} />

        <div
          className="grid min-h-[calc(100vh-72px)] items-start gap-12 lg:grid-cols-[minmax(320px,1fr)_minmax(420px,560px)]"
          style={{ paddingTop: "clamp(16px, 3.5vh, 36px)", paddingBottom: "clamp(20px, 4vh, 40px)" }}
        >
        <motion.div
          className="max-w-[32rem] lg:pr-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <FadeSlideText
            delay={0.04}
            style={{
              ...mono,
              fontSize: 10,
              color: "#1A3D1A",
              backgroundColor: "#D1FF001E",
              border: "1px solid rgba(209,255,0,0.9)",
              display: "inline-flex",
              padding: "8px 12px",
              marginBottom: 18,
            }}
          >
            [Auth Callback]
          </FadeSlideText>

          <h1
            style={{
              fontFamily: "'TASA Orbiter', Inter, sans-serif",
              fontWeight: 900,
              fontSize: "clamp(2.2rem, 4.8vw, 4.6rem)",
              lineHeight: 0.88,
              letterSpacing: "-0.07em",
              color: "#050505",
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            <WordReveal text="Secure Session Handshake." delay={0.1} lineGap="0.22em" />
          </h1>

          <FadeSlideText
            delay={0.26}
            style={{
              margin: "16px 0 0 0",
              maxWidth: 360,
              fontFamily: "Inter, sans-serif",
              fontSize: 16,
              lineHeight: 1.55,
              color: "#686868",
            }}
          >
            Frigate uses this callback route to finish Google, magic-link, and email-confirmation flows before sending you to
            your dashboard or profile.
          </FadeSlideText>
        </motion.div>

        <motion.div
          className="justify-self-stretch lg:mt-[6px]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.05 }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 540,
              border: "1px solid rgba(5,5,5,0.1)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,247,238,0.98) 100%)",
              padding: "26px 22px",
              boxShadow: "0 18px 60px rgba(5,5,5,0.06)",
            }}
          >
            <div className="flex items-center gap-3" style={{ marginBottom: 18 }}>
              <div
                className="flex h-12 w-12 items-center justify-center"
                style={{ border: "1px solid rgba(5,5,5,0.08)", backgroundColor: "rgba(209,255,0,0.18)" }}
              >
                <ShieldCheck size={18} style={{ color: "#1A3D1A" }} />
              </div>
              <div>
                <div style={{ ...mono, fontSize: 9, color: "#8A8A82", marginBottom: 6 }}>Supabase Status</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: 15, color: "#050505" }}>
                  {isAuthenticated ? "Session ready. Redirecting now..." : "Waiting for session confirmation..."}
                </div>
              </div>
            </div>

            <div
              style={{
                border: `1px solid ${readyForRetry ? "rgba(255,107,107,0.28)" : "rgba(26,61,26,0.16)"}`,
                backgroundColor: readyForRetry ? "rgba(255,107,107,0.12)" : "rgba(209,255,0,0.12)",
                padding: "14px 16px",
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                lineHeight: 1.6,
                color: readyForRetry ? "#8A2626" : "#1A3D1A",
              }}
            >
              {message}
            </div>

            <div className="grid gap-3" style={{ marginTop: 18 }}>
              <div style={{ ...mono, fontSize: 9, color: "#8A8A82" }}>Requested Destination</div>
              <div
                style={{
                  border: "1px solid rgba(5,5,5,0.08)",
                  backgroundColor: "rgba(255,255,255,0.8)",
                  padding: "12px 14px",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  color: "#050505",
                }}
              >
                {getPostAuthDestination(user, nextPath)}
              </div>
            </div>

            {readyForRetry ? (
              <div className="flex flex-wrap items-center gap-3" style={{ marginTop: 22 }}>
                <Link
                  to={`/login?next=${encodeURIComponent(nextPath)}`}
                  style={{
                    ...mono,
                    fontSize: 10,
                    color: "#050505",
                    backgroundColor: "#D1FF00",
                    border: "1px solid #D1FF00",
                    padding: "12px 14px",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  Return To Login
                  <ArrowRight size={13} />
                </Link>

                <Link
                  to="/profile"
                  style={{
                    ...mono,
                    fontSize: 10,
                    color: "#050505",
                    backgroundColor: "rgba(255,255,255,0.85)",
                    border: "1px solid rgba(5,5,5,0.08)",
                    padding: "12px 14px",
                    textDecoration: "none",
                  }}
                >
                  Open Profile
                </Link>
              </div>
            ) : null}
          </div>
        </motion.div>
        </div>
      </div>
    </section>
  );
}
