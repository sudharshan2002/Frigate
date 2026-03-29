import type { CSSProperties, ReactNode } from "react";
import { motion } from "motion/react";
import { GrainLocal } from "../GrainOverlay";

export const mono: CSSProperties = {
  fontFamily: "'Roboto Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

export const ease = [0.16, 1, 0.3, 1] as const;

export function AccountPageShell({
  badge,
  description,
  side,
  title,
  children,
}: {
  badge: string;
  description: string;
  side?: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "#F5F4E7", paddingTop: 72 }}>
      <GrainLocal opacity={0.035} />

      <div
        className="pointer-events-none absolute inset-0 mx-auto hidden md:grid md:grid-cols-4"
        style={{ maxWidth: 1920, padding: "0 clamp(20px, 3vw, 48px)" }}
      >
        <div className="border-r border-[rgba(5,5,5,0.08)]" />
        <div className="border-r border-[rgba(5,5,5,0.08)]" />
        <div className="border-r border-[rgba(5,5,5,0.08)]" />
        <div />
      </div>

      <motion.div
        className="pointer-events-none absolute left-[-6rem] top-[9rem] h-[18rem] w-[18rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(125,181,255,0.16) 0%, rgba(125,181,255,0.08) 34%, rgba(125,181,255,0) 76%)",
          filter: "blur(14px)",
        }}
        animate={{ x: [0, 24, 0], y: [0, -18, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="pointer-events-none absolute right-[-7rem] top-[12rem] h-[24rem] w-[24rem] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(209,255,0,0.18) 0%, rgba(209,255,0,0.08) 38%, rgba(209,255,0,0) 78%)",
          filter: "blur(16px)",
        }}
        animate={{ x: [0, -28, 0], y: [0, 20, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div
        className="relative z-10 mx-auto grid gap-8 md:grid-cols-4"
        style={{ maxWidth: 1920, padding: "clamp(52px, 8vw, 92px) clamp(20px, 3vw, 48px) clamp(40px, 5vw, 72px)" }}
      >
        <motion.div
          className="grid content-start gap-8 md:col-span-2"
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
        >
          <div>
            <div
              style={{
                ...mono,
                fontSize: 10,
                color: "#1A3D1A",
                backgroundColor: "#D1FF0022",
                border: "1px solid #D1FF00",
                display: "inline-flex",
                padding: "9px 12px",
                marginBottom: 24,
              }}
            >
              {badge}
            </div>

            <h1
              style={{
                fontFamily: "'TASA Orbiter', Inter, sans-serif",
                fontWeight: 900,
                fontSize: "clamp(2.25rem, 5vw, 5.2rem)",
                lineHeight: 0.9,
                letterSpacing: "-0.07em",
                color: "#050505",
                margin: 0,
                maxWidth: 760,
                textTransform: "uppercase",
              }}
            >
              {title}
            </h1>

            <p
              style={{
                margin: "24px 0 0 0",
                maxWidth: 520,
                fontFamily: "Inter, sans-serif",
                fontSize: "clamp(1rem, 1.1vw, 1.06rem)",
                lineHeight: 1.55,
                color: "#686868",
              }}
            >
              {description}
            </p>
          </div>

          {side}
        </motion.div>

        <motion.div
          className="md:col-span-2"
          initial={{ opacity: 0, x: 22 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.72, ease, delay: 0.06 }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}

export function AccountPanel({
  children,
  dark = false,
  minHeight,
}: {
  children: ReactNode;
  dark?: boolean;
  minHeight?: number;
}) {
  return (
    <div
      style={{
        border: dark ? "1px solid rgba(209,255,0,0.28)" : "1px solid rgba(5,5,5,0.1)",
        background: dark
          ? "linear-gradient(180deg, rgba(5,5,5,0.95) 0%, rgba(18,18,16,0.94) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(248,247,238,0.94) 100%)",
        minHeight,
      }}
    >
      {children}
    </div>
  );
}

export function MetricTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(5,5,5,0.08)",
        backgroundColor: "rgba(255,255,255,0.58)",
        minHeight: 108,
        padding: 16,
      }}
    >
      <div style={{ ...mono, fontSize: 9, color: "#8A8A82", marginBottom: 12 }}>{label}</div>
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 15,
          fontWeight: 600,
          lineHeight: 1.35,
          color: "#050505",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function AccountField({
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
          backgroundColor: disabled ? "rgba(255,255,255,0.46)" : "rgba(255,255,255,0.76)",
          minHeight: 54,
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

export function AccountActionButton({
  children,
  disabled = false,
  emphasize = false,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  emphasize?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer border-none"
      style={{
        ...mono,
        fontSize: 10,
        color: emphasize ? "#050505" : "#050505",
        backgroundColor: emphasize ? "#D1FF00" : "rgba(255,255,255,0.76)",
        border: `1px solid ${emphasize ? "#D1FF00" : "rgba(5,5,5,0.08)"}`,
        minHeight: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 14px",
        opacity: disabled ? 0.62 : 1,
        cursor: disabled ? "wait" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
