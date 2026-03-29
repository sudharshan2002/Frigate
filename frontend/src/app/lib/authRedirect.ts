import type { User } from "@supabase/supabase-js";

function normalizePath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export function resolveNextPath(search: string) {
  return normalizePath(new URLSearchParams(search).get("next"));
}

export function getAuthCallbackUrl(nextPath: string) {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(normalizePath(nextPath))}`;
}

export function needsProfileSetup(user: User | null | undefined) {
  if (!user) {
    return false;
  }

  const metadata = user.user_metadata || {};
  const fullName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : "";
  const role = typeof metadata.role === "string" ? metadata.role : "";
  const workspace = typeof metadata.workspace === "string" ? metadata.workspace : "";

  return !fullName.trim() || !role.trim() || !workspace.trim();
}

export function getPostAuthDestination(user: User | null | undefined, requestedPath: string) {
  const nextPath = normalizePath(requestedPath);

  if (needsProfileSetup(user) && (nextPath === "/" || nextPath === "/dashboard" || nextPath === "/login" || nextPath === "/signup")) {
    return "/profile";
  }

  if (nextPath === "/login" || nextPath === "/signup" || nextPath === "/auth/callback") {
    return "/dashboard";
  }

  return nextPath;
}

export function hasAuthRedirectParams(url: URL) {
  if (url.searchParams.has("code") || url.searchParams.has("token_hash") || url.searchParams.has("error")) {
    return true;
  }

  const hash = url.hash.replace(/^#/, "");
  if (!hash) {
    return false;
  }

  const hashParams = new URLSearchParams(hash);
  return hashParams.has("access_token") || hashParams.has("error_description") || hashParams.has("refresh_token");
}
