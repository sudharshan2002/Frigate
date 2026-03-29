import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BriefcaseBusiness,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../../lib/auth";
import {
  clearLocalProfileDraft,
  getActorDescriptor,
  readLocalProfileDraft,
  writeLocalProfileDraft,
} from "../../lib/actor";
import { api } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import {
  AccountActionButton,
  AccountField,
  AccountPageShell,
  AccountPanel,
  ease,
  mono,
} from "./AccountUi";

type ProfileFormState = {
  fullName: string;
  role: string;
  workspace: string;
};

type StatusTone = "error" | "success";

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

  return (
    code === "42P01" ||
    (typeof message === "string" &&
      message.toLowerCase().includes("profiles") &&
      message.toLowerCase().includes("not exist"))
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease }}
      style={{
        border: `1px solid ${tone === "error" ? "rgba(255,107,107,0.28)" : "rgba(26,61,26,0.16)"}`,
        backgroundColor: tone === "error" ? "rgba(255,107,107,0.08)" : "rgba(209,255,0,0.1)",
        padding: "14px 16px",
        fontFamily: "Inter, sans-serif",
        fontSize: 14,
        lineHeight: 1.6,
        color: tone === "error" ? "#8A2626" : "#1A3D1A",
      }}
    >
      {message}
    </motion.div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[rgba(255,255,255,0.12)] pt-3">
      <span style={{ ...mono, fontSize: 9, color: "#F4F4E8", opacity: 0.48 }}>{label}</span>
      <span
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 14,
          lineHeight: 1.5,
          color: "#F4F4E8",
          textAlign: "right",
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { displayName, isAuthenticated, signOut, user } = useAuth();
  const metadata = user?.user_metadata || {};
  const actor = getActorDescriptor(user, displayName);
  const providers = isAuthenticated ? getProviders(user) : ["local browser"];
  const [form, setForm] = useState<ProfileFormState>(() =>
    isAuthenticated
      ? {
          fullName: typeof metadata.full_name === "string" ? metadata.full_name : displayName || "",
          role: typeof metadata.role === "string" ? metadata.role : "",
          workspace: typeof metadata.workspace === "string" ? metadata.workspace : "",
        }
      : readLocalProfileDraft(),
  );
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [status, setStatus] = useState<{ message: string; tone: StatusTone } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setForm({
        fullName: typeof metadata.full_name === "string" ? metadata.full_name : displayName || "",
        role: typeof metadata.role === "string" ? metadata.role : "",
        workspace: typeof metadata.workspace === "string" ? metadata.workspace : "",
      });
      return;
    }

    setForm(readLocalProfileDraft());
  }, [displayName, isAuthenticated, metadata.full_name, metadata.role, metadata.workspace, user?.id]);

  const busy = saving || signingOut || deletingAccount;
  const initialsSource = (form.fullName || displayName || user?.email || actor.label || "FR").trim();
  const initials = initialsSource
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
  const accountLabel = isAuthenticated ? "Account" : "Guest";
  const primaryIdentity = isAuthenticated ? user?.email || "Unavailable" : "Local browser profile";
  const providerLabel = providers[0]?.toUpperCase() || "EMAIL";

  function updateField(field: keyof ProfileFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);

    const nextForm = {
      fullName: form.fullName.trim(),
      role: form.role.trim(),
      workspace: form.workspace.trim(),
    };

    try {
      if (!isAuthenticated) {
        writeLocalProfileDraft(nextForm);
        setStatus({
          message: "Guest profile saved locally.",
          tone: "success",
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          ...metadata,
          full_name: nextForm.fullName,
          role: nextForm.role,
          workspace: nextForm.workspace,
        },
      });

      if (error) {
        throw error;
      }

      const { error: profileSyncError } = await supabase.from("profiles").upsert({
        id: user?.id,
        email: user?.email || null,
        full_name: nextForm.fullName,
        role: nextForm.role,
        workspace: nextForm.workspace,
        avatar_url: typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
        provider: providers[0] || "email",
      });

      if (profileSyncError && !isMissingProfilesTableError(profileSyncError)) {
        throw profileSyncError;
      }

      setStatus({
        message: profileSyncError
          ? "Profile saved. The public profiles table is not set up yet."
          : "Profile updated.",
        tone: "success",
      });
    } catch (error) {
      setStatus({ message: getErrorMessage(error), tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

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

  function handleResetGuestProfile() {
    clearLocalProfileDraft();
    setForm({ fullName: "", role: "", workspace: "" });
    setStatus({ message: "Guest profile cleared from this browser.", tone: "success" });
  }

  async function handleDeleteAccount() {
    if (!isAuthenticated) {
      handleResetGuestProfile();
      return;
    }

    const confirmed = window.confirm("Delete this account permanently? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    setDeletingAccount(true);
    setStatus(null);

    try {
      await api.deleteAccount();
      await signOut().catch(() => undefined);
      navigate("/", { replace: true });
    } catch (error) {
      setStatus({ message: getErrorMessage(error), tone: "error" });
      setDeletingAccount(false);
    }
  }

  return (
    <AccountPageShell
      badge="[Profile]"
      title="Profile."
      description="A minimal account page with just your core details and clear navigation."
      side={
        <AccountPanel dark>
          <div className="grid gap-6" style={{ padding: "clamp(22px, 2.8vw, 30px)" }}>
            <div className="flex items-start justify-between gap-4">
              <div
                className="flex items-center justify-center"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.12)",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: "'TASA Orbiter', Inter, sans-serif",
                    fontWeight: 900,
                    fontSize: 24,
                    letterSpacing: "-0.08em",
                    color: "#F4F4E8",
                    textTransform: "uppercase",
                  }}
                >
                  {initials || "FR"}
                </span>
              </div>

              <div className="grid gap-2 text-right">
                <span
                  style={{
                    ...mono,
                    fontSize: 9,
                    color: isAuthenticated ? "#050505" : "#D1FF00",
                    backgroundColor: isAuthenticated ? "#D1FF00" : "transparent",
                    border: `1px solid ${isAuthenticated ? "#D1FF00" : "rgba(209,255,0,0.3)"}`,
                    padding: "7px 10px",
                    justifySelf: "end",
                  }}
                >
                  {accountLabel}
                </span>
                <span style={{ ...mono, fontSize: 9, color: "#F4F4E8", opacity: 0.45 }}>{providerLabel}</span>
              </div>
            </div>

            <div className="grid gap-2">
              <div
                style={{
                  fontFamily: "'TASA Orbiter', Inter, sans-serif",
                  fontWeight: 900,
                  fontSize: "clamp(1.4rem, 2vw, 1.9rem)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.06em",
                  color: "#F4F4E8",
                  textTransform: "uppercase",
                }}
              >
                {form.fullName || actor.label}
              </div>
              <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.65, color: "#F4F4E8", opacity: 0.72 }}>
                {primaryIdentity}
              </p>
            </div>

            <div className="grid gap-3">
              <SummaryRow
                label="Workspace"
                value={form.workspace || (isAuthenticated ? "Default workspace" : "Local workspace")}
              />
              <SummaryRow
                label="Role"
                value={form.role || (isAuthenticated ? "Member" : "Guest")}
              />
            </div>

            <div className="grid gap-3 border-t border-[rgba(255,255,255,0.12)] pt-5">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="cursor-pointer border-none"
                style={{
                  ...mono,
                  fontSize: 10,
                  color: "#050505",
                  backgroundColor: "#D1FF00",
                  border: "1px solid #D1FF00",
                  minHeight: 46,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 14px",
                }}
              >
                <span>Dashboard</span>
                <ArrowRight size={13} />
              </button>

              <button
                type="button"
                onClick={() => navigate("/composer")}
                className="cursor-pointer border-none"
                style={{
                  ...mono,
                  fontSize: 10,
                  color: "#F4F4E8",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  minHeight: 46,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 14px",
                }}
              >
                <span>Records</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </AccountPanel>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <form onSubmit={handleSave}>
          <AccountPanel>
            <div className="grid gap-6" style={{ padding: "clamp(24px, 2.8vw, 32px)" }}>
              <div className="grid gap-2">
                <div style={{ ...mono, fontSize: 9, color: "#8A8A82" }}>Edit Profile</div>
                <div
                  style={{
                    fontFamily: "'TASA Orbiter', Inter, sans-serif",
                    fontSize: "clamp(1.2rem, 1.8vw, 1.55rem)",
                    fontWeight: 800,
                    letterSpacing: "-0.05em",
                    textTransform: "uppercase",
                    color: "#050505",
                  }}
                >
                  Only the essentials.
                </div>
              </div>

              <div className="grid gap-4">
                <AccountField
                  autoComplete="name"
                  disabled={busy}
                  icon={<UserRound size={15} />}
                  label="Full Name"
                  onChange={(value) => updateField("fullName", value)}
                  placeholder={isAuthenticated ? "Ava Morgan" : "Your name"}
                  type="text"
                  value={form.fullName}
                />
                <AccountField
                  autoComplete="organization"
                  disabled={busy}
                  icon={<BriefcaseBusiness size={15} />}
                  label="Workspace"
                  onChange={(value) => updateField("workspace", value)}
                  placeholder={isAuthenticated ? "Northwind Studio" : "Workspace"}
                  type="text"
                  value={form.workspace}
                />
                <AccountField
                  autoComplete="organization-title"
                  disabled={busy}
                  icon={<ShieldCheck size={15} />}
                  label="Role"
                  onChange={(value) => updateField("role", value)}
                  placeholder={isAuthenticated ? "Product lead" : "Role"}
                  type="text"
                  value={form.role}
                />
                <AccountField
                  autoComplete="email"
                  disabled
                  icon={<Mail size={15} />}
                  label={isAuthenticated ? "Email" : "Mode"}
                  onChange={() => undefined}
                  placeholder={isAuthenticated ? "Email" : "Guest"}
                  type="text"
                  value={isAuthenticated ? user?.email || "" : "Guest mode"}
                />
              </div>

              <div className="grid gap-3 border-t border-[rgba(5,5,5,0.08)] pt-5 sm:grid-cols-2">
                <AccountActionButton disabled={busy} emphasize type="submit">
                  <span>{saving ? "Saving..." : "Save Profile"}</span>
                  <Sparkles size={13} />
                </AccountActionButton>

                <AccountActionButton disabled={busy} onClick={() => navigate("/dashboard")}>
                  <span>Open Dashboard</span>
                  <ArrowRight size={13} />
                </AccountActionButton>
              </div>
            </div>
          </AccountPanel>
        </form>

        <AccountPanel>
          <div className="grid gap-4" style={{ padding: 18 }}>
            <div className="grid gap-2">
              <div style={{ ...mono, fontSize: 9, color: "#8A8A82" }}>
                {isAuthenticated ? "Account Actions" : "Guest Actions"}
              </div>
              <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: 1.6, color: "#5F5D57" }}>
                {isAuthenticated
                  ? "Sign out or permanently remove this account."
                  : "Clear the local profile stored in this browser."}
              </p>
            </div>

            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  disabled={busy}
                  className="cursor-pointer border-none"
                  style={{
                    ...mono,
                    fontSize: 10,
                    color: "#050505",
                    backgroundColor: "rgba(255,255,255,0.76)",
                    border: "1px solid rgba(5,5,5,0.08)",
                    minHeight: 46,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 14px",
                    opacity: busy ? 0.62 : 1,
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    <LogOut size={13} />
                    {signingOut ? "Signing Out..." : "Sign Out"}
                  </span>
                  <ArrowRight size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => void handleDeleteAccount()}
                  disabled={busy}
                  className="cursor-pointer border-none"
                  style={{
                    ...mono,
                    fontSize: 10,
                    color: "#8A2626",
                    backgroundColor: "rgba(255,107,107,0.08)",
                    border: "1px solid rgba(255,107,107,0.2)",
                    minHeight: 46,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 14px",
                    opacity: busy ? 0.62 : 1,
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    <Trash2 size={13} />
                    {deletingAccount ? "Deleting..." : "Delete Account"}
                  </span>
                  <ArrowRight size={13} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleResetGuestProfile}
                disabled={busy}
                className="cursor-pointer border-none"
                style={{
                  ...mono,
                  fontSize: 10,
                  color: "#8A2626",
                  backgroundColor: "rgba(255,107,107,0.08)",
                  border: "1px solid rgba(255,107,107,0.2)",
                  minHeight: 46,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 14px",
                  opacity: busy ? 0.62 : 1,
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <Trash2 size={13} />
                  Clear Guest Profile
                </span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </AccountPanel>

        <div className="xl:col-span-2">
          <AnimatePresence mode="wait">
            {status ? <StatusMessage message={status.message} tone={status.tone} /> : null}
          </AnimatePresence>
        </div>
      </div>
    </AccountPageShell>
  );
}
