import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { AppPageLinks } from "./AppPageLinks";
import {
  AccountActionButton,
  AccountField,
  AccountPageShell,
  AccountPanel,
  MetricTile,
  ease,
  mono,
} from "./AccountUi";

type ProfileFormState = {
  fullName: string;
  role: string;
  workspace: string;
};

type StatusTone = "error" | "success";

function formatDate(value?: string | null) {
  if (!value) {
    return "Unavailable";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Unavailable";
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getProviders(user: ReturnType<typeof useAuth>["user"]) {
  const providerSet = new Set<string>();

  const appProviders = user?.app_metadata?.providers;
  if (Array.isArray(appProviders)) {
    for (const provider of appProviders) {
      if (typeof provider === "string" && provider.trim()) {
        providerSet.add(provider.trim());
      }
    }
  }

  for (const identity of user?.identities || []) {
    if (typeof identity.provider === "string" && identity.provider.trim()) {
      providerSet.add(identity.provider.trim());
    }
  }

  if (providerSet.size === 0) {
    providerSet.add("email");
  }

  return [...providerSet];
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return "Something went wrong while updating your profile.";
}

function isMissingProfilesTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? (error as { code?: unknown }).code : null;
  const message = "message" in error ? (error as { message?: unknown }).message : null;

  return code === "42P01" || (typeof message === "string" && message.toLowerCase().includes("profiles") && message.toLowerCase().includes("not exist"));
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
        backgroundColor: tone === "error" ? "rgba(255,107,107,0.12)" : "rgba(209,255,0,0.12)",
        padding: "14px 16px",
        fontFamily: "Inter, sans-serif",
        fontSize: 14,
        lineHeight: 1.55,
        color: tone === "error" ? "#8A2626" : "#1A3D1A",
      }}
    >
      {message}
    </motion.div>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { displayName, signOut, user } = useAuth();
  const metadata = user?.user_metadata || {};
  const providers = getProviders(user);
  const [form, setForm] = useState<ProfileFormState>({
    fullName: typeof metadata.full_name === "string" ? metadata.full_name : displayName || "",
    role: typeof metadata.role === "string" ? metadata.role : "",
    workspace: typeof metadata.workspace === "string" ? metadata.workspace : "",
  });
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [status, setStatus] = useState<{ message: string; tone: StatusTone } | null>(null);

  useEffect(() => {
    setForm({
      fullName: typeof metadata.full_name === "string" ? metadata.full_name : displayName || "",
      role: typeof metadata.role === "string" ? metadata.role : "",
      workspace: typeof metadata.workspace === "string" ? metadata.workspace : "",
    });
  }, [displayName, metadata.full_name, metadata.role, metadata.workspace, user?.id]);

  const busy = saving || signingOut;
  const initialsSource = (form.fullName || displayName || user?.email || "FR").trim();
  const initials = initialsSource
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  const summaryTiles = [
    { label: "Email", value: user?.email || "Unavailable" },
    { label: "Workspace", value: form.workspace || "Default workspace" },
    { label: "Role", value: form.role || "Member" },
    { label: "Provider", value: providers.map((provider) => provider.toUpperCase()).join(", ") },
  ];

  function updateField(field: keyof ProfileFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          ...metadata,
          full_name: form.fullName.trim(),
          role: form.role.trim(),
          workspace: form.workspace.trim(),
        },
      });

      if (error) {
        throw error;
      }

      const { error: profileSyncError } = await supabase.from("profiles").upsert({
        id: user?.id,
        email: user?.email || null,
        full_name: form.fullName.trim(),
        role: form.role.trim(),
        workspace: form.workspace.trim(),
        avatar_url: typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
        provider: providers[0] || "email",
      });

      if (profileSyncError && !isMissingProfilesTableError(profileSyncError)) {
        throw profileSyncError;
      }

      setStatus({
        message: profileSyncError
          ? "Profile updated in auth metadata. Run supabase/schema.sql to mirror it into a visible dashboard table."
          : "Profile updated. Your session metadata and Supabase profile row are now in sync.",
        tone: "success",
      });
    } catch (error) {
      setStatus({ message: getErrorMessage(error), tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    setStatus(null);

    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      setStatus({ message: getErrorMessage(error), tone: "error" });
      setSigningOut(false);
    }
  }

  return (
    <AccountPageShell
      badge="[Profile]"
      title="Your account, inside the same control grid."
      description="Manage the profile metadata attached to your Supabase session, then move between Frigate tools without breaking the current workflow."
      side={
        <div className="grid gap-4">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease, delay: 0.1 }}
          >
            <AccountPanel dark minHeight={260}>
              <div className="grid gap-6" style={{ padding: 22 }}>
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-18 w-18 items-center justify-center"
                    style={{
                      width: 72,
                      height: 72,
                      border: "1px solid rgba(209,255,0,0.32)",
                      backgroundColor: "rgba(209,255,0,0.1)",
                      color: "#D1FF00",
                      fontFamily: "'TASA Orbiter', Inter, sans-serif",
                      fontWeight: 800,
                      fontSize: 24,
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {initials || "FR"}
                  </div>

                  <div>
                    <div style={{ ...mono, fontSize: 9, color: "#F4F4E8", opacity: 0.48, marginBottom: 8 }}>Session Owner</div>
                    <div
                      style={{
                        fontFamily: "'TASA Orbiter', Inter, sans-serif",
                        fontWeight: 800,
                        fontSize: "clamp(1.2rem, 1.5vw, 1.45rem)",
                        lineHeight: 0.96,
                        letterSpacing: "-0.04em",
                        color: "#F4F4E8",
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      {form.fullName || displayName || "Operator"}
                    </div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#F4F4E8", opacity: 0.68 }}>
                      {user?.email || "No email available"}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 12 }}>
                    <div style={{ ...mono, fontSize: 9, color: "#F4F4E8", opacity: 0.46, marginBottom: 6 }}>Created</div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#F4F4E8" }}>{formatDate(user?.created_at)}</div>
                  </div>
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 12 }}>
                    <div style={{ ...mono, fontSize: 9, color: "#F4F4E8", opacity: 0.46, marginBottom: 6 }}>Last Sign In</div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#F4F4E8" }}>{formatDate(user?.last_sign_in_at)}</div>
                  </div>
                </div>
              </div>
            </AccountPanel>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-2">
            {summaryTiles.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease, delay: 0.18 + index * 0.05 }}
              >
                <MetricTile label={item.label} value={item.value} />
              </motion.div>
            ))}
          </div>
        </div>
      }
    >
      <AccountPanel minHeight={700}>
        <div className="grid gap-8" style={{ padding: "clamp(22px, 2.8vw, 34px)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div style={{ ...mono, fontSize: 10, color: "#8A8A82", marginBottom: 8 }}>Account Controls</div>
              <div
                style={{
                  fontFamily: "'TASA Orbiter', Inter, sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(1.45rem, 2vw, 2rem)",
                  lineHeight: 0.94,
                  letterSpacing: "-0.05em",
                  color: "#050505",
                  textTransform: "uppercase",
                }}
              >
                Profile And Session Settings
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <AccountActionButton disabled={busy} onClick={() => navigate("/dashboard")}>
                <span>Dashboard</span>
                <ArrowRight size={13} />
              </AccountActionButton>
              <AccountActionButton disabled={busy} emphasize onClick={() => navigate("/composer")}>
                <span>Composer</span>
                <ArrowRight size={13} />
              </AccountActionButton>
            </div>
          </div>

          <AppPageLinks currentPage="profile" label="Move Through Frigate" />

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_224px]">
            <div
              style={{
                border: "1px solid rgba(5,5,5,0.08)",
                backgroundColor: "rgba(255,255,255,0.58)",
                padding: 18,
              }}
            >
              <div style={{ ...mono, fontSize: 9, color: "#8A8A82", marginBottom: 10 }}>Connected Providers</div>
              <div className="flex flex-wrap gap-2">
                {providers.map((provider) => (
                  <div
                    key={provider}
                    style={{
                      ...mono,
                      fontSize: 10,
                      color: provider === "google" ? "#1A3D1A" : "#050505",
                      border: `1px solid ${provider === "google" ? "#D1FF00" : "rgba(5,5,5,0.1)"}`,
                      backgroundColor: provider === "google" ? "#D1FF001A" : "rgba(255,255,255,0.7)",
                      padding: "8px 10px",
                    }}
                  >
                    {provider}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                border: "1px solid rgba(5,5,5,0.08)",
                backgroundColor: "rgba(255,255,255,0.58)",
                padding: 18,
              }}
            >
              <div style={{ ...mono, fontSize: 9, color: "#8A8A82", marginBottom: 10 }}>Auth Status</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.55, color: "#686868" }}>
                This profile is driven by your active Supabase session and updates the metadata used across the product.
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <AccountField
                autoComplete="name"
                disabled={busy}
                icon={<UserRound size={15} />}
                label="Full Name"
                onChange={(value) => updateField("fullName", value)}
                placeholder="Ava Morgan"
                type="text"
                value={form.fullName}
              />
              <AccountField
                autoComplete="organization"
                disabled={busy}
                icon={<BriefcaseBusiness size={15} />}
                label="Workspace"
                onChange={(value) => updateField("workspace", value)}
                placeholder="Northwind Studio"
                type="text"
                value={form.workspace}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <AccountField
                autoComplete="organization-title"
                disabled={busy}
                icon={<ShieldCheck size={15} />}
                label="Role"
                onChange={(value) => updateField("role", value)}
                placeholder="Product lead"
                type="text"
                value={form.role}
              />
              <AccountField
                autoComplete="email"
                disabled
                icon={<Mail size={15} />}
                label="Email"
                onChange={() => undefined}
                placeholder="Email"
                type="email"
                value={user?.email || ""}
              />
            </div>

            <div className="grid gap-3 border-t border-[rgba(5,5,5,0.08)] pt-4 md:grid-cols-2">
              <AccountActionButton disabled={busy} emphasize type="submit">
                <span>{saving ? "Saving..." : "Save Profile"}</span>
                <Sparkles size={13} />
              </AccountActionButton>

              <AccountActionButton disabled={busy} onClick={() => void handleSignOut()}>
                <span className="inline-flex items-center gap-2">
                  <LogOut size={13} />
                  {signingOut ? "Signing Out..." : "Sign Out"}
                </span>
                <ArrowRight size={13} />
              </AccountActionButton>
            </div>
          </form>

          <div className="grid gap-4 md:grid-cols-2">
            <div
              style={{
                border: "1px solid rgba(5,5,5,0.08)",
                backgroundColor: "rgba(255,255,255,0.58)",
                padding: 18,
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                <CalendarClock size={14} style={{ color: "#1A3D1A" }} />
                <span style={{ ...mono, fontSize: 9, color: "#8A8A82" }}>Session Timeline</span>
              </div>
              <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.55, color: "#686868" }}>
                Account created on {formatDate(user?.created_at)}. Last sign-in recorded on {formatDate(user?.last_sign_in_at)}.
              </p>
            </div>

            <div
              style={{
                border: "1px solid rgba(5,5,5,0.08)",
                backgroundColor: "rgba(255,255,255,0.58)",
                padding: 18,
              }}
            >
              <div style={{ ...mono, fontSize: 9, color: "#8A8A82", marginBottom: 10 }}>Product Scope</div>
              <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.55, color: "#686868" }}>
                Public marketing pages stay available, while the product workspace routes use this same account layer for access.
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {status ? <StatusMessage message={status.message} tone={status.tone} /> : null}
          </AnimatePresence>
        </div>
      </AccountPanel>
    </AccountPageShell>
  );
}
