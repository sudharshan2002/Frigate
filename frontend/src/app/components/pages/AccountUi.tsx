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
    <section className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "#F3F0E6", paddingTop: 72 }}>
      <GrainLocal opacity={0.035} />

      <div
        className="pointer-events-none absolute inset-x-0 top-[72px] hidden xl:block"
        style={{ height: 1, backgroundColor: "rgba(5,5,5,0.08)" }}
      >
        <div />
      </div>

      <div
        className="pointer-events-none absolute bottom-0 top-[72px] hidden xl:block"
        style={{ left: "34%", width: 1, backgroundColor: "rgba(5,5,5,0.07)" }}
      />

      <div
        className="relative z-10 mx-auto grid gap-8"
        style={{ maxWidth: 1480, padding: "clamp(34px, 5vw, 54px) clamp(20px, 3vw, 40px) clamp(40px, 5vw, 72px)" }}
      >
        <div className="grid gap-8 xl:grid-cols-[minmax(260px,0.78fr)_minmax(0,1.22fr)] xl:items-end">
          <motion.div
            className="grid content-start gap-6 xl:pr-10"
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
                  backgroundColor: "#E8F0C6",
                  border: "1px solid rgba(26,61,26,0.14)",
                  display: "inline-flex",
                  padding: "9px 12px",
                  marginBottom: 18,
                }}
              >
                {badge}
              </div>

              <h1
                style={{
                  fontFamily: "'TASA Orbiter', Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(2.2rem, 4.7vw, 4.8rem)",
                  lineHeight: 0.9,
                  letterSpacing: "-0.07em",
                  color: "#050505",
                  margin: 0,
                  maxWidth: 620,
                  textTransform: "uppercase",
                }}
              >
                {title}
              </h1>

              <p
                style={{
                  margin: "18px 0 0 0",
                  maxWidth: 440,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: "#5F5D57",
                }}
              >
                {description}
              </p>
            </div>
          </motion.div>

          {side ? (
            <motion.div
              initial={{ opacity: 0, x: 22 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.72, ease, delay: 0.06 }}
            >
              {side}
            </motion.div>
          ) : null}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72, ease, delay: 0.1 }}
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
        border: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(5,5,5,0.1)",
        backgroundColor: dark ? "#11110F" : "#FBF9F0",
        minHeight,
        boxShadow: dark ? "0 22px 56px rgba(5,5,5,0.16)" : "0 16px 36px rgba(5,5,5,0.05)",
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
        backgroundColor: "#F8F6EC",
        minHeight: 104,
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
