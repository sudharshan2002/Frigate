import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, BriefcaseBusiness, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { FadeSlideText, WordReveal } from "../AnimatedText";
import { getAuthCallbackUrl, getPostAuthDestination, resolveNextPath } from "../../lib/authRedirect";
import { supabase } from "../../lib/supabase";
import { GrainLocal } from "../GrainOverlay";

type AuthMode = "login" | "signup";
type PendingAction = "google" | "magic" | "submit" | null;
type StatusTone = "error" | "neutral" | "success";

type FormState = {
  email: string;
  fullName: string;
  password: string;
  role: string;
  workspace: string;
};

const mono: CSSProperties = {
  fontFamily: "'Roboto Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const ease = [0.16, 1, 0.3, 1] as const;
const authShellMaxWidth = 1480;

const initialFormState: FormState = {
  email: "",
  fullName: "",
  password: "",
  role: "",
  workspace: "",
};

const authCopy = {
  login: {
    badge: "[Access Layer]",
    title: "Welcome back.",
    description: "Sign in and continue.",
    details: ["Google OAuth for instant access", "Magic links when you need them", "Profile-first routing after login"],
    submitLabel: "Sign In",
    secondaryLabel: "Need an account?",
    secondaryCta: "Create one",
    secondaryTo: "/signup",
  },
  signup: {
    badge: "[Create Account]",
    title: "Create your account.",
    description: "Set up once, then move straight into the workspace.",
    details: ["Minimal account setup", "Metadata synced into your profile", "Cleaner handoff into the product"],
    submitLabel: "Create Account",
    secondaryLabel: "Already have access?",
    secondaryCta: "Sign in",
    secondaryTo: "/login",
  },
} satisfies Record<
  AuthMode,
  {
    badge: string;
    title: string;
    description: string;
    details: string[];
    submitLabel: string;
    secondaryLabel: string;
    secondaryCta: string;
    secondaryTo: string;
  }
>;

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return "Something went wrong while contacting Supabase.";
}

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v2.99h3.87c2.26-2.08 3.57-5.14 3.57-8.63Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.87-2.99c-1.07.72-2.44 1.15-4.08 1.15-3.13 0-5.78-2.12-6.73-4.97H1.27v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.63H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.37l4-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.61 4.59 1.79l3.44-3.44C17.95 1.16 15.24 0 12 0A12 12 0 0 0 1.27 6.63l4 3.09c.95-2.85 3.6-4.95 6.73-4.95Z"
      />
    </svg>
  );
}

function TextField({
  autoComplete,
  disabled = false,
  icon,
  label,
  onChange,
  placeholder,
  required = false,
  type,
  value,
}: {
  autoComplete?: string;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  type: string;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span style={{ ...mono, fontSize: 9, color: "#8A8A82" }}>{label}</span>
      <div
        className="flex items-center gap-3"
        style={{
          border: "1px solid rgba(5,5,5,0.09)",
          backgroundColor: disabled ? "rgba(255,255,255,0.46)" : "rgba(255,255,255,0.9)",
          minHeight: 50,
          opacity: disabled ? 0.72 : 1,
          padding: "0 14px",
        }}
      >
        <span style={{ color: "#686868", flexShrink: 0 }}>{icon}</span>
        <input
          autoComplete={autoComplete}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            backgroundColor: "transparent",
            fontFamily: "Inter, sans-serif",
            fontSize: 15,
            color: "#050505",
          }}
        />
      </div>
    </label>
  );
}

function ActionButton({
  children,
  disabled = false,
  emphasize = false,
  form,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  emphasize?: boolean;
  form?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <motion.button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.995 }}
      transition={{ duration: 0.18, ease }}
      className="cursor-pointer border-none"
      style={{
        ...mono,
        fontSize: 10,
        color: "#050505",
        backgroundColor: emphasize ? "#D1FF00" : "rgba(255,255,255,0.9)",
        border: `1px solid ${emphasize ? "#D1FF00" : "rgba(5,5,5,0.08)"}`,
        minHeight: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "0 14px",
        opacity: disabled ? 0.62 : 1,
        cursor: disabled ? "wait" : "pointer",
      }}
    >
      {children}
    </motion.button>
  );
}

function StatusMessage({
  message,
  tone,
}: {
  message: string;
  tone: StatusTone;
}) {
  return (
    <motion.div
      key={message}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease }}
      style={{
        border: `1px solid ${tone === "error" ? "rgba(255,107,107,0.28)" : "rgba(26,61,26,0.16)"}`,
        backgroundColor:
          tone === "error"
            ? "rgba(255,107,107,0.12)"
            : tone === "success"
              ? "rgba(209,255,0,0.12)"
              : "rgba(255,255,255,0.72)",
        padding: "12px 14px",
        fontFamily: "Inter, sans-serif",
        fontSize: 13,
        lineHeight: 1.5,
        color: tone === "error" ? "#8A2626" : "#1A3D1A",
      }}
    >
      {message}
    </motion.div>
  );
}

function AuthExperience({ mode }: { mode: AuthMode }) {
  const content = authCopy[mode];
  const location = useLocation();
  const navigate = useNavigate();
  const redirectPath = resolveNextPath(location.search);
  const formId = `auth-form-${mode}`;
  const [form, setForm] = useState<FormState>(initialFormState);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<StatusTone>("neutral");

  useEffect(() => {
    setStatus(null);
    setStatusTone("neutral");
  }, [mode, location.search]);

  const busy = pendingAction !== null;

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function showStatus(message: string, tone: StatusTone) {
    setStatus(message);
    setStatusTone(tone);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("submit");
    setStatus(null);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              full_name: form.fullName.trim(),
              role: form.role.trim(),
              workspace: form.workspace.trim(),
            },
            emailRedirectTo: getAuthCallbackUrl(redirectPath),
          },
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          navigate(getPostAuthDestination(data.session.user, redirectPath), { replace: true });
          return;
        }

        showStatus("Check your email to finish setup.", "success");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });

        if (error) {
          throw error;
        }

        navigate(getPostAuthDestination(data.user, redirectPath), { replace: true });
      }
    } catch (error) {
      showStatus(getErrorMessage(error), "error");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleMagicLink() {
    if (!form.email.trim()) {
      showStatus("Enter your email first.", "error");
      return;
    }

    setPendingAction("magic");
    setStatus(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: form.email.trim(),
        options: {
          emailRedirectTo: getAuthCallbackUrl(redirectPath),
        },
      });

      if (error) {
        throw error;
      }

      showStatus("Magic link sent.", "success");
    } catch (error) {
      showStatus(getErrorMessage(error), "error");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleGoogle() {
    setPendingAction("google");
    showStatus("Redirecting to Google sign-in...", "neutral");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            prompt: "select_account",
          },
          redirectTo: getAuthCallbackUrl(redirectPath),
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      showStatus(getErrorMessage(error), "error");
      setPendingAction(null);
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "#F5F4E7", paddingTop: 72 }}>
      <GrainLocal opacity={0.035} />

      <motion.div
        className="pointer-events-none absolute right-[-4rem] top-[8rem] h-[16rem] w-[16rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(209,255,0,0.18) 0%, rgba(209,255,0,0.08) 40%, rgba(209,255,0,0) 78%)",
          filter: "blur(16px)",
        }}
        animate={{ x: [0, -18, 0], y: [0, 18, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="pointer-events-none absolute left-[-6rem] top-[18rem] h-[22rem] w-[22rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.22) 42%, rgba(255,255,255,0) 74%)",
          filter: "blur(26px)",
        }}
        animate={{ x: [0, 18, 0], y: [0, -12, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

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
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease }}
        >
          <FadeSlideText
            delay={0.02}
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
            {content.badge}
          </FadeSlideText>

          <h1
            style={{
              fontFamily: "'TASA Orbiter', Inter, sans-serif",
              fontWeight: 900,
              fontSize: "clamp(2.3rem, 5vw, 5rem)",
              lineHeight: 0.88,
              letterSpacing: "-0.07em",
              color: "#050505",
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            <WordReveal text={content.title} delay={0.08} lineGap="0.22em" />
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
            {content.description}
          </FadeSlideText>

          <div className="grid gap-3" style={{ marginTop: 24, maxWidth: 360 }}>
            {content.details.map((detail, index) => (
              <FadeSlideText
                key={detail}
                delay={0.34 + index * 0.08}
                style={{
                  ...mono,
                  fontSize: 10,
                  color: "#686868",
                  borderTop: index === 0 ? "1px solid rgba(5,5,5,0.08)" : undefined,
                  paddingTop: index === 0 ? 14 : 0,
                }}
              >
                {`0${index + 1} ${detail}`}
              </FadeSlideText>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="justify-self-stretch lg:mt-[6px]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease, delay: 0.06 }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              border: "1px solid rgba(5,5,5,0.1)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,247,238,0.98) 100%)",
              minHeight: 500,
              maxHeight: "calc(100vh - 132px)",
              display: "grid",
              gridTemplateRows: "auto auto minmax(0,1fr) auto",
              boxShadow: "0 18px 60px rgba(5,5,5,0.06)",
            }}
          >
            <div
              className="flex items-center justify-between gap-3"
              style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(5,5,5,0.08)" }}
            >
              <FadeSlideText delay={0.18} style={{ ...mono, fontSize: 10, color: "#8A8A82" }}>
                Session Entry
              </FadeSlideText>

              <div
                style={{
                  display: "inline-flex",
                  border: "1px solid rgba(5,5,5,0.08)",
                  backgroundColor: "rgba(255,255,255,0.72)",
                }}
              >
                {([
                  { label: "Login", pageMode: "login", to: `/login?next=${encodeURIComponent(redirectPath)}` },
                  { label: "Sign Up", pageMode: "signup", to: `/signup?next=${encodeURIComponent(redirectPath)}` },
                ] as const).map((item) => {
                  const isActive = item.pageMode === mode;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      style={{
                        ...mono,
                        fontSize: 10,
                        color: isActive ? "#050505" : "#686868",
                        textDecoration: "none",
                        padding: "10px 14px",
                        backgroundColor: isActive ? "#D1FF00" : "transparent",
                      }}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <motion.div style={{ padding: "16px 20px 12px" }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.48, ease, delay: 0.24 }}>
              <ActionButton disabled={busy} onClick={() => void handleGoogle()}>
                <span className="inline-flex items-center gap-3">
                  <GoogleLogo />
                  {pendingAction === "google" ? "Connecting..." : "Continue with Google"}
                </span>
                <ArrowRight size={13} />
              </ActionButton>
            </motion.div>

            <div style={{ overflowY: "auto", padding: "0 20px 14px" }}>
              <motion.div className="flex items-center gap-3" style={{ marginBottom: 16 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.3 }}>
                <div style={{ height: 1, flex: 1, backgroundColor: "rgba(5,5,5,0.08)" }} />
                <span style={{ ...mono, fontSize: 9, color: "#8A8A82" }}>or use email</span>
                <div style={{ height: 1, flex: 1, backgroundColor: "rgba(5,5,5,0.08)" }} />
              </motion.div>

              <form id={formId} onSubmit={handleSubmit} className="grid gap-4">
                {mode === "signup" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      autoComplete="name"
                      disabled={busy}
                      icon={<UserRound size={15} />}
                      label="Full Name"
                      onChange={(value) => updateField("fullName", value)}
                      placeholder="Ava Morgan"
                      required
                      type="text"
                      value={form.fullName}
                    />
                    <TextField
                      autoComplete="organization"
                      disabled={busy}
                      icon={<BriefcaseBusiness size={15} />}
                      label="Workspace"
                      onChange={(value) => updateField("workspace", value)}
                      placeholder="Northwind Studio"
                      required
                      type="text"
                      value={form.workspace}
                    />
                  </div>
                ) : null}

                <TextField
                  autoComplete="email"
                  disabled={busy}
                  icon={<Mail size={15} />}
                  label="Email"
                  onChange={(value) => updateField("email", value)}
                  placeholder="team@company.com"
                  required
                  type="email"
                  value={form.email}
                />

                {mode === "signup" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      autoComplete="new-password"
                      disabled={busy}
                      icon={<LockKeyhole size={15} />}
                      label="Password"
                      onChange={(value) => updateField("password", value)}
                      placeholder="Create a secure password"
                      required
                      type="password"
                      value={form.password}
                    />
                    <TextField
                      autoComplete="organization-title"
                      disabled={busy}
                      icon={<ShieldCheck size={15} />}
                      label="Role"
                      onChange={(value) => updateField("role", value)}
                      placeholder="Product lead"
                      type="text"
                      value={form.role}
                    />
                  </div>
                ) : (
                  <TextField
                    autoComplete="current-password"
                    disabled={busy}
                    icon={<LockKeyhole size={15} />}
                    label="Password"
                    onChange={(value) => updateField("password", value)}
                    placeholder="Enter your password"
                    required
                    type="password"
                    value={form.password}
                  />
                )}
              </form>
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(5,5,5,0.08)",
                padding: "14px 20px 18px",
                backgroundColor: "rgba(248,247,238,0.94)",
              }}
            >
              <motion.div className="grid gap-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease, delay: 0.34 }}>
                <ActionButton disabled={busy} emphasize form={formId} type="submit">
                  <span>
                    {pendingAction === "submit"
                      ? mode === "signup"
                        ? "Creating..."
                        : "Signing In..."
                      : content.submitLabel}
                  </span>
                  <ArrowRight size={13} />
                </ActionButton>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => void handleMagicLink()}
                    disabled={busy}
                    className="cursor-pointer border-none bg-transparent p-0"
                    style={{ ...mono, fontSize: 10, color: "#1A3D1A", opacity: busy ? 0.6 : 1 }}
                  >
                    {pendingAction === "magic" ? "Sending Magic Link..." : "Use Magic Link"}
                  </button>

                  <div style={{ ...mono, fontSize: 10, color: "#686868" }}>
                    {content.secondaryLabel}{" "}
                    <Link to={`${content.secondaryTo}?next=${encodeURIComponent(redirectPath)}`} style={{ color: "#1A3D1A", textDecoration: "none" }}>
                      {content.secondaryCta}
                    </Link>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {status ? <StatusMessage message={status} tone={statusTone} /> : null}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </motion.div>
        </div>
      </div>
    </section>
  );
}

export function LoginPage() {
  return <AuthExperience mode="login" />;
}

export function SignupPage() {
  return <AuthExperience mode="signup" />;
}
