import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocation, useNavigate } from "react-router";
import { Menu, X } from "lucide-react";
import { useAuth } from "../lib/auth";
import { GrainLocal } from "./GrainOverlay";

const ease = [0.16, 1, 0.3, 1] as const;
const WIPE_COVER_MS = 820;
const WIPE_TOTAL_MS = 1550;
const shellMaxWidth = 1480;

const mono: CSSProperties = {
  fontFamily: "'Roboto Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

type MenuTarget = {
  label: string;
  path: string;
  hash?: string;
};

type MenuAction =
  | { type: "route"; target: MenuTarget }
  | { type: "href"; href: string };

type MenuPhase = "closed" | "opening" | "open" | "closing";

const baseMenuLinks: MenuTarget[] = [
  { label: "HOME", path: "/" },
  { label: "COMPOSER", path: "/composer" },
  { label: "WHAT-IF STUDIO", path: "/what-if" },
  { label: "TRUST DASHBOARD", path: "/dashboard" },
  { label: "CONTACT", path: "/contact" },
];

const contactLinks: Array<{ num: string; label: string; action: MenuAction }> = [
  { num: "1.0", label: "EMAIL PRODUCT TEAM", action: { type: "href", href: "mailto:hello@frigate.ai" } },
  { num: "1.1", label: "OPEN CONTACT PAGE", action: { type: "route", target: { label: "CONTACT", path: "/contact" } } },
  {
    num: "1.2",
    label: "PRIVACY POLICY",
    action: { type: "route", target: { label: "PRIVACY POLICY", path: "/legal/privacy-policy" } },
  },
  {
    num: "1.3",
    label: "TERMS & CONDITIONS",
    action: { type: "route", target: { label: "TERMS & CONDITIONS", path: "/legal/terms-conditions" } },
  },
];

const baseUtilityLinks: MenuTarget[] = [
  { label: "COMPOSER", path: "/composer" },
  { label: "WHAT-IF STUDIO", path: "/what-if" },
  { label: "TRUST DASHBOARD", path: "/dashboard" },
  { label: "CONTACT", path: "/contact" },
];

const featuredCardTagline = "Explainability by default";
const featuredCardBody = "Frigate traces how prompt changes affect clarity, tone, and output quality so teams can refine with evidence instead of guesswork.";

function MenuWipe({ active, cycleKey }: { active: boolean; cycleKey: number }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={cycleKey}
          className="pointer-events-none fixed inset-0 z-[1200] flex"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
        >
          {[0, 1, 2, 3].map((index) => (
            <motion.div
              key={index}
              className="h-full flex-1 bg-[#D1FF00]"
              style={{ marginRight: index < 3 ? "-1px" : "0" }}
              initial={{ y: "100%" }}
              animate={{ y: ["100%", "0%", "0%", "-100%"] }}
              transition={{
                duration: 1.26,
                times: [0, 0.42, 0.58, 1],
                delay: index * 0.08,
                ease,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RollingNavLink({
  label,
  active,
  delay,
  onClick,
}: {
  label: string;
  active: boolean;
  delay: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`menu-rolling-link block w-full border-none bg-transparent p-0 text-left ${
        active ? "menu-rolling-link--active" : ""
      }`}
      style={{
        fontFamily: '"TASA Orbiter", Inter, sans-serif',
        fontWeight: 800,
        fontSize: "clamp(1.95rem, 3.35vw, 3.95rem)",
        letterSpacing: "-0.05em",
        lineHeight: 0.9,
        color: "#050505",
      }}
      initial={{ opacity: 0, x: -28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.65, ease, delay }}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.985 }}
    >
      <span className="menu-rolling-link__viewport">
        <span className="menu-rolling-link__track">
          <span className="menu-rolling-link__text">{label}</span>
          <span aria-hidden="true" className="menu-rolling-link__text menu-rolling-link__text--accent">
            {label}
          </span>
        </span>
      </span>
    </motion.button>
  );
}

function HighlightGlitchLink({
  num,
  label,
  onClick,
  delay,
}: {
  num: string;
  label: string;
  onClick: () => void;
  delay: number;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="menu-glitch-link border-none bg-transparent p-0 text-left"
      style={{ ...mono, fontSize: 11, color: "#050505", textDecoration: "none" }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease, delay }}
    >
      <span className="menu-glitch-link__index">{num}</span>
      <span className="menu-glitch-link__label-wrap">
        <span className="menu-glitch-link__label" data-text={label}>
          {label}
        </span>
      </span>
    </motion.button>
  );
}

function MiniMenuLink({
  num,
  label,
  delay,
  onClick,
}: {
  num: string;
  label: string;
  delay: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="menu-glitch-link border-none bg-transparent p-0 text-left"
      style={{ ...mono, fontSize: 11, color: "#050505" }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease, delay }}
    >
      <span className="menu-glitch-link__index">{num}</span>
      <span className="menu-glitch-link__label-wrap">
        <span className="menu-glitch-link__label" data-text={label}>
          {label}
        </span>
      </span>
    </motion.button>
  );
}

function HeaderAccessButton({
  label,
  active,
  emphasize = false,
  onClick,
}: {
  label: string;
  active: boolean;
  emphasize?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer border-none"
      style={{
        ...mono,
        fontSize: 9,
        color: emphasize ? "#050505" : "#fff",
        backgroundColor: emphasize ? "#D1FF00" : active ? "rgba(255,255,255,0.12)" : "transparent",
        border: `1px solid ${emphasize ? "#D1FF00" : active ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.18)"}`,
        padding: "9px 12px",
        transition: "transform 0.22s ease-out",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {label}
    </button>
  );
}

function LinkChip({
  label,
  active,
  onClick,
  emphasize = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  emphasize?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer border-none"
      style={{
        ...mono,
        fontSize: 10,
        color: emphasize ? "#050505" : active ? "#1A3D1A" : "#050505",
        backgroundColor: emphasize ? "#D1FF00" : active ? "#D1FF001E" : "rgba(255,255,255,0.58)",
        border: `1px solid ${emphasize || active ? "#D1FF00" : "rgba(5,5,5,0.1)"}`,
        padding: "9px 12px",
      }}
    >
      {label}
    </button>
  );
}

export function Navbar() {
  const [menuPhase, setMenuPhase] = useState<MenuPhase>("closed");
  const [wipeKey, setWipeKey] = useState(0);
  const [wipeActive, setWipeActive] = useState(false);
  const [time, setTime] = useState("--:-- AM");
  const { isAuthenticated, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const timersRef = useRef<number[]>([]);
  const menuLinks = isAuthenticated ? [...baseMenuLinks.slice(0, 4), { label: "PROFILE", path: "/profile" }, baseMenuLinks[4]] : baseMenuLinks;
  const utilityLinks = isAuthenticated
    ? [...baseUtilityLinks.slice(0, 3), { label: "PROFILE", path: "/profile" }, baseUtilityLinks[3]]
    : baseUtilityLinks;

  const menuVisible = menuPhase !== "closed";

  useEffect(() => {
    let city = "LOCAL";

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      city = tz.split("/").pop()?.replace(/_/g, " ") || "LOCAL";
    } catch {
      city = "LOCAL";
    }

    const tick = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      setTime(`${city.toUpperCase()} ${timeStr}`);
    };

    tick();
    const id = window.setInterval(tick, 10000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuVisible || wipeActive ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuVisible, wipeActive]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const schedule = (callback: () => void, delay: number) => {
    const id = window.setTimeout(callback, delay);
    timersRef.current.push(id);
  };

  const clearScheduled = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };

  const navigateTo = (target: MenuTarget) => {
    navigate(target.hash ? `${target.path}${target.hash}` : target.path);
  };

  const runAction = (action: MenuAction) => {
    if (action.type === "route") {
      navigateTo(action.target);
      return;
    }

    window.location.href = action.href;
  };

  const isActiveTarget = (target: MenuTarget) =>
    location.pathname === target.path && (target.hash ? location.hash === target.hash : location.hash === "");

  const handleSignOut = () => {
    void signOut()
      .catch((error) => {
        console.error("Unable to sign out.", error);
      })
      .finally(() => {
        navigate("/");
      });
  };

  const openMenu = () => {
    if (menuPhase !== "closed") {
      return;
    }

    clearScheduled();
    setMenuPhase("opening");
    setWipeActive(true);
    setWipeKey((current) => current + 1);

    schedule(() => setMenuPhase("open"), WIPE_TOTAL_MS);
    schedule(() => setWipeActive(false), WIPE_TOTAL_MS);
  };

  const closeMenu = (action?: MenuAction) => {
    if (menuPhase === "closed" || menuPhase === "closing") {
      return;
    }

    clearScheduled();
    setMenuPhase("closing");
    setWipeActive(true);
    setWipeKey((current) => current + 1);

    schedule(() => {
      if (action) {
        runAction(action);
      }
      setMenuPhase("closed");
    }, WIPE_COVER_MS);

    schedule(() => setWipeActive(false), WIPE_TOTAL_MS);
  };

  return (
    <>
      <motion.header
        className="fixed left-0 right-0 top-0 z-[100]"
        style={{ height: 72, mixBlendMode: menuVisible ? "normal" : "difference" }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease, delay: 1.3 }}
      >
        <div
          className="mx-auto flex h-full w-full items-center justify-between gap-6"
          style={{ maxWidth: shellMaxWidth, padding: "0 clamp(20px, 3vw, 40px)" }}
        >
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex cursor-pointer items-center border-none bg-transparent"
              style={{ padding: 0 }}
            >
              <img src="/logo/light%20full%20logo.png" alt="Frigate Logo" style={{ height: 28, width: "auto" }} />
            </button>
          </div>

          <div className="hidden flex-1 items-center justify-center gap-10 md:flex">
            <span style={{ ...mono, fontSize: 9, color: "#fff", opacity: 0.62 }}>PROMPT INTELLIGENCE PLATFORM</span>
            <span style={{ ...mono, fontSize: 9, color: "#fff", opacity: 0.4 }}>{time}</span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="hidden lg:flex items-center gap-2">
              {loading ? null : isAuthenticated ? (
                <>
                  <HeaderAccessButton
                    label="Dashboard"
                    active={location.pathname === "/dashboard"}
                    onClick={() => navigate("/dashboard")}
                  />
                  <HeaderAccessButton
                    label="Profile"
                    active={location.pathname === "/profile"}
                    onClick={() => navigate("/profile")}
                  />
                  <HeaderAccessButton label="Sign Out" active={false} emphasize onClick={handleSignOut} />
                </>
              ) : (
                <>
                  <HeaderAccessButton
                    label="Sign In"
                    active={location.pathname === "/login"}
                    onClick={() => navigate("/login")}
                  />
                  <HeaderAccessButton
                    label="Create Account"
                    active={location.pathname === "/signup"}
                    emphasize
                    onClick={() => navigate("/signup")}
                  />
                </>
              )}
            </div>
            <button
              type="button"
              onClick={menuVisible ? () => closeMenu() : openMenu}
              className="flex cursor-pointer items-center gap-2.5"
              style={{
                backgroundColor: "transparent",
                border: "1px solid rgba(255,255,255,0.22)",
                borderRadius: 4,
                padding: "9px 14px",
                transition: "border-color 0.22s ease-out, transform 0.22s ease-out",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.borderColor = "rgba(255,255,255,0.55)";
                event.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
                event.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {menuVisible ? <X size={16} style={{ color: "#fff" }} /> : <Menu size={16} style={{ color: "#fff" }} />}
              <span style={{ ...mono, fontSize: 9, color: "#fff" }}>{menuVisible ? "Close" : "Menu"}</span>
            </button>
          </div>
        </div>
      </motion.header>

      <MenuWipe active={wipeActive} cycleKey={wipeKey} />

      <AnimatePresence>
        {menuVisible && (
          <motion.div
            key="menu-overlay"
            className="fixed inset-0 z-[999] overflow-hidden"
            style={{ backgroundColor: "#F4F4E8" }}
            initial={{ opacity: 0.98 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.98, transition: { duration: 0.18 } }}
          >
            <GrainLocal opacity={0.05} />

            <div
              className="mx-auto flex h-[72px] w-full items-center"
              style={{
                maxWidth: shellMaxWidth,
                padding: "0 clamp(20px, 3vw, 40px)",
                borderBottom: "1px solid rgba(5,5,5,0.08)",
              }}
            >
              <div className="flex h-full w-full items-center justify-between gap-6">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => closeMenu({ type: "route", target: { label: "HOME", path: "/" } })}
                    className="flex cursor-pointer items-center border-none bg-transparent"
                    style={{ padding: 0 }}
                  >
                    <img src="/logo/dark%20full%20logo.png" alt="Frigate Logo" style={{ height: 28, width: "auto" }} />
                  </button>
                </div>

                <div className="hidden flex-1 items-center justify-center gap-10 md:flex">
                  <span style={{ ...mono, fontSize: 9, color: "#050505", opacity: 0.42 }}>PROMPT INTELLIGENCE PLATFORM</span>
                  <span style={{ ...mono, fontSize: 9, color: "#050505", opacity: 0.34 }}>{time}</span>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => closeMenu()}
                    className="menu-close-button"
                    onMouseEnter={(event) => {
                      event.currentTarget.style.transform = "translateY(-1px)";
                      event.currentTarget.style.backgroundColor = "#111";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.transform = "translateY(0)";
                      event.currentTarget.style.backgroundColor = "#050505";
                    }}
                  >
                    <X size={16} style={{ color: "#F4F4E8" }} />
                    <span style={{ ...mono, fontSize: 9, color: "#F4F4E8" }}>Close</span>
                  </button>
                </div>
              </div>
            </div>

            <motion.div
              className="mx-auto grid"
              style={{
                maxWidth: 1920,
                height: "calc(100vh - 72px)",
                padding: "clamp(10px, 1.6vw, 18px) clamp(20px, 3vw, 48px) clamp(16px, 2vw, 24px)",
                backgroundImage:
                  "linear-gradient(to right, rgba(5,5,5,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(5,5,5,0.04) 1px, transparent 1px)",
                backgroundSize: "25% 100%, 100% 100%",
              }}
              initial={{ opacity: 0, y: 28 }}
              animate={{
                opacity: menuPhase === "closing" ? 0 : 1,
                y: menuPhase === "closing" ? -10 : 0,
              }}
              transition={{
                duration: menuPhase === "closing" ? 0.22 : 0.7,
                ease,
                delay: menuPhase === "opening" ? 0.34 : 0,
              }}
            >
              <div className="grid min-h-0 gap-5 lg:grid-cols-[minmax(240px,320px)_minmax(360px,1fr)_minmax(220px,280px)] lg:gap-8">
                <motion.aside
                  className="hidden lg:block"
                  initial={{ opacity: 0, y: 32 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease, delay: 0.5 }}
                >
                  <div className="menu-feature-card">
                    <div className="menu-feature-card__visual">
                      <div
                        style={{
                          ...mono,
                          fontSize: 8,
                          color: "#F4F4E8",
                          opacity: 0.44,
                          position: "absolute",
                          top: 14,
                          left: 16,
                          zIndex: 2,
                          writingMode: "vertical-lr",
                          transform: "rotate(180deg)",
                        }}
                      >
                        Frigate
                      </div>

                      <div
                        style={{
                          ...mono,
                          fontSize: 8,
                          color: "#F4F4E8",
                          opacity: 0.44,
                          position: "absolute",
                          bottom: 18,
                          left: 16,
                          zIndex: 2,
                          writingMode: "vertical-lr",
                          transform: "rotate(180deg)",
                        }}
                      >
                        Product system
                      </div>

                      <div
                        style={{
                          display: "grid",
                          height: 258,
                          width: "100%",
                          padding: 20,
                          background:
                            "radial-gradient(circle at top left, rgba(209,255,0,0.22), transparent 38%), linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1.15fr 0.85fr",
                            gap: 12,
                            height: "100%",
                          }}
                        >
                          <div
                            style={{
                              border: "1px solid rgba(255,255,255,0.12)",
                              backgroundColor: "rgba(5,5,5,0.18)",
                              padding: 16,
                            }}
                          >
                            <div style={{ ...mono, fontSize: 8, color: "#F4F4E8", opacity: 0.56, marginBottom: 14 }}>
                              Prompt map
                            </div>
                            {[
                              "Position product around explainability",
                              "Track edits across text and image",
                              "Show what changed between runs",
                            ].map((line, index) => (
                              <div key={line} className="flex items-start gap-2" style={{ marginBottom: index === 2 ? 0 : 10 }}>
                                <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: index === 0 ? "#D1FF00" : "#7DFFAF", marginTop: 5 }} />
                                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, lineHeight: 1.45, color: "#F4F4E8" }}>
                                  {line}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="grid gap-10">
                            <div
                              style={{
                                border: "1px solid rgba(255,255,255,0.12)",
                                backgroundColor: "rgba(255,255,255,0.05)",
                                padding: 14,
                              }}
                            >
                              <div style={{ ...mono, fontSize: 8, color: "#F4F4E8", opacity: 0.56, marginBottom: 12 }}>
                                Output
                              </div>
                              <div style={{ height: 56, borderRadius: 14, background: "linear-gradient(135deg, rgba(209,255,0,0.28), rgba(125,181,255,0.14))" }} />
                            </div>

                            <div
                              style={{
                                border: "1px solid rgba(255,255,255,0.12)",
                                backgroundColor: "rgba(255,255,255,0.05)",
                                padding: 14,
                              }}
                            >
                              <div style={{ ...mono, fontSize: 8, color: "#F4F4E8", opacity: 0.56, marginBottom: 12 }}>
                                Trust signals
                              </div>
                              <div style={{ display: "grid", gap: 8 }}>
                                {[91, 88, 94].map((value) => (
                                  <div key={value}>
                                    <div style={{ height: 4, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                                      <div style={{ width: `${value}%`, height: "100%", backgroundColor: "#D1FF00" }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="menu-tag-pill">{featuredCardTagline}</div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 72px",
                        minHeight: 128,
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div style={{ padding: "22px 20px 18px" }}>
                        <div
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontWeight: 800,
                            fontSize: 32,
                            color: "#F4F4E8",
                            letterSpacing: "-0.05em",
                            marginBottom: 8,
                          }}
                        >
                          TEXT
                        </div>
                        <div style={{ ...mono, fontSize: 9, color: "#F4F4E8", opacity: 0.52, marginBottom: 18 }}>
                          Prompt trace
                        </div>

                        <div
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontWeight: 800,
                            fontSize: 32,
                            color: "#F4F4E8",
                            letterSpacing: "-0.05em",
                            marginBottom: 8,
                          }}
                        >
                          IMAGE
                        </div>
                        <div style={{ ...mono, fontSize: 9, color: "#F4F4E8", opacity: 0.52 }}>
                          Output trace
                        </div>
                      </div>

                      <div className="flex items-center justify-center" style={{ borderLeft: "1px solid rgba(209,255,0,0.85)" }}>
                        <span style={{ ...mono, fontSize: 24, color: "#D1FF00" }}>{">"}</span>
                      </div>
                    </div>
                  </div>

                    <div className="mt-3 max-w-[18rem]">
                    <div style={{ ...mono, fontSize: 9, color: "#050505", opacity: 0.42, marginBottom: 10 }}>
                      Why teams use Frigate
                    </div>
                    <div
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 800,
                        fontSize: 13,
                        color: "#050505",
                        lineHeight: 1.16,
                        letterSpacing: "-0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      {featuredCardBody}
                    </div>
                  </div>
                </motion.aside>

                <section className="grid min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] lg:border-l lg:border-[rgba(5,5,5,0.08)] lg:pl-8">
                  <div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.45, delay: 0.48 }}
                    >
                      <div style={{ ...mono, fontSize: 9, color: "#050505", opacity: 0.38, marginBottom: 18 }}>
                        [Navigation]
                      </div>
                    </motion.div>
                    <motion.div
                      className="mb-8 flex flex-wrap items-center gap-2"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, ease, delay: 0.5 }}
                    >
                      {loading ? null : isAuthenticated ? (
                        <>
                          <LinkChip
                            label="Dashboard"
                            active={location.pathname === "/dashboard"}
                            emphasize
                            onClick={() => closeMenu({ type: "route", target: { label: "DASHBOARD", path: "/dashboard" } })}
                          />
                          <LinkChip
                            label="Profile"
                            active={location.pathname === "/profile"}
                            onClick={() => closeMenu({ type: "route", target: { label: "PROFILE", path: "/profile" } })}
                          />
                          <LinkChip
                            label="Sign Out"
                            active={false}
                            onClick={() => {
                              closeMenu();
                              handleSignOut();
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <LinkChip
                            label="Create Account"
                            active={location.pathname === "/signup"}
                            emphasize
                            onClick={() => closeMenu({ type: "route", target: { label: "CREATE ACCOUNT", path: "/signup" } })}
                          />
                          <LinkChip
                            label="Sign In"
                            active={location.pathname === "/login"}
                            onClick={() => closeMenu({ type: "route", target: { label: "SIGN IN", path: "/login" } })}
                          />
                        </>
                      )}
                    </motion.div>
                  </div>

                  <div className="flex min-h-0 items-start">
                    <div className="flex flex-col gap-0">
                      {menuLinks.map((link, index) => (
                        <RollingNavLink
                          key={link.label}
                          label={link.label}
                          active={isActiveTarget(link)}
                          delay={0.54 + index * 0.06}
                          onClick={() => closeMenu({ type: "route", target: link })}
                        />
                      ))}
                    </div>
                  </div>

                  <motion.div
                    className="max-w-[36rem] self-end lg:hidden"
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease, delay: 0.92 }}
                  >
                    <div style={{ ...mono, fontSize: 10, color: "#050505", opacity: 0.54, marginBottom: 10 }}>
                      INQUIRIES
                    </div>
                    <div
                      className="menu-email-highlight"
                      style={{
                        fontFamily: '"TASA Orbiter", Inter, sans-serif',
                        fontWeight: 800,
                        fontSize: "clamp(1.15rem, 1.65vw, 1.85rem)",
                        letterSpacing: "-0.06em",
                        color: "#050505",
                        textTransform: "uppercase",
                      }}
                    >
                      hello@frigate.ai
                    </div>

                    <div className="mt-5">
                      <div style={{ ...mono, fontSize: 9, color: "#050505", opacity: 0.38, marginBottom: 18 }}>
                        [Contact]
                      </div>
                      <div className="grid gap-x-12 gap-y-1 md:grid-cols-2">
                        {contactLinks.map((item, index) => (
                          <HighlightGlitchLink
                            key={item.num}
                            num={item.num}
                            label={item.label}
                            onClick={() => closeMenu(item.action)}
                            delay={0.68 + index * 0.05}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </section>

                <motion.aside
                  className="hidden lg:flex lg:min-h-0 lg:flex-col lg:justify-end lg:border-l lg:border-[rgba(5,5,5,0.08)] lg:pl-8"
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease, delay: 0.86 }}
                >
                  <div>
                    <div style={{ ...mono, fontSize: 9, color: "#050505", opacity: 0.38, marginBottom: 18 }}>
                      [Contact]
                    </div>
                    <div style={{ ...mono, fontSize: 10, color: "#050505", opacity: 0.54, marginBottom: 10 }}>
                      INQUIRIES
                    </div>
                    <div
                      className="menu-email-highlight"
                      style={{
                        fontFamily: '"TASA Orbiter", Inter, sans-serif',
                        fontWeight: 800,
                        fontSize: "clamp(1rem, 1.2vw, 1.35rem)",
                        letterSpacing: "-0.05em",
                        color: "#050505",
                        textTransform: "uppercase",
                      }}
                    >
                      hello@frigate.ai
                    </div>
                  </div>

                  <div className="mt-8">
                    <div style={{ ...mono, fontSize: 9, color: "#050505", opacity: 0.38, marginBottom: 16 }}>
                      [Links]
                    </div>
                    <div className="grid gap-y-1">
                      {utilityLinks.map((item, index) => (
                        <MiniMenuLink
                          key={item.label}
                          num={`2.${index}`}
                          label={item.label}
                          delay={0.92 + index * 0.04}
                          onClick={() => closeMenu({ type: "route", target: item })}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mt-8">
                    <div style={{ ...mono, fontSize: 9, color: "#050505", opacity: 0.38, marginBottom: 16 }}>
                      [Contact]
                    </div>
                    <div className="grid gap-y-1">
                        {contactLinks.map((item, index) => (
                          <HighlightGlitchLink
                            key={item.num}
                            num={item.num}
                            label={item.label}
                            onClick={() => closeMenu(item.action)}
                            delay={1.02 + index * 0.04}
                          />
                        ))}
                    </div>
                  </div>
                </motion.aside>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
