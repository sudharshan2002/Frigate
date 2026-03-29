import type { User } from "@supabase/supabase-js";

const GUEST_ACTOR_STORAGE_KEY = "frigate.guestActorId";
const GUEST_PROFILE_STORAGE_KEY = "frigate.guestProfile";

export type LocalProfileDraft = {
  fullName: string;
  role: string;
  workspace: string;
};

export function getGuestActorId() {
  if (typeof window === "undefined") {
    return "guest-server";
  }

  const existing = window.localStorage.getItem(GUEST_ACTOR_STORAGE_KEY)?.trim();
  if (existing) {
    return existing;
  }

  const nextId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `guest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(GUEST_ACTOR_STORAGE_KEY, nextId);
  return nextId;
}

export function getActorKey(userId?: string | null) {
  return userId?.trim() ? `user:${userId}` : `guest:${getGuestActorId()}`;
}

export function getActorDescriptor(user: User | null, displayName?: string | null) {
  if (user?.id) {
    return {
      key: getActorKey(user.id),
      kind: "member" as const,
      label: displayName || user.email || "Signed-in member",
      detail: user.email || "Supabase session",
    };
  }

  const guestId = getGuestActorId();
  const shortId = guestId.slice(0, 8).toUpperCase();

  return {
    key: `guest:${guestId}`,
    kind: "guest" as const,
    label: "Guest workspace",
    detail: `Local browser session ${shortId}`,
  };
}

export function readLocalProfileDraft(): LocalProfileDraft {
  if (typeof window === "undefined") {
    return { fullName: "", role: "", workspace: "" };
  }

  try {
    const raw = window.localStorage.getItem(GUEST_PROFILE_STORAGE_KEY);
    if (!raw) {
      return { fullName: "", role: "", workspace: "" };
    }

    const parsed = JSON.parse(raw) as Partial<LocalProfileDraft>;
    return {
      fullName: typeof parsed.fullName === "string" ? parsed.fullName : "",
      role: typeof parsed.role === "string" ? parsed.role : "",
      workspace: typeof parsed.workspace === "string" ? parsed.workspace : "",
    };
  } catch {
    return { fullName: "", role: "", workspace: "" };
  }
}

export function writeLocalProfileDraft(draft: LocalProfileDraft) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(GUEST_PROFILE_STORAGE_KEY, JSON.stringify(draft));
}

export function clearLocalProfileDraft() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(GUEST_PROFILE_STORAGE_KEY);
}
