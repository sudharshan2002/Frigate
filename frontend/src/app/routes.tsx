import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router";
import { Layout } from "./components/Layout";
import { HomePage } from "./components/pages/HomePage";
import { ComposerPage } from "./components/pages/ComposerPage";
import { WhatIfPage } from "./components/pages/WhatIfPage";
import { DashboardPage } from "./components/pages/DashboardPage";
import { ContactPage } from "./components/pages/ContactPage";
import { LoginPage, SignupPage } from "./components/pages/AuthPages";
import { AuthCallbackPage } from "./components/pages/AuthCallbackPage";
import { ProfilePage } from "./components/pages/ProfilePage";
import {
  AcceptableUsePolicyPage,
  CookiePolicyPage,
  PrivacyPolicyPage,
  TermsConditionsPage,
} from "./components/pages/LegalPages";
import { useAuth } from "./lib/auth";

function resolveNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

function AuthGateStatus() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "#F5F4E7", paddingTop: 72 }}
    >
      <div style={{ fontFamily: "'Roboto Mono', monospace", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#686868" }}>
        Loading Session...
      </div>
    </div>
  );
}

function GuestOnly() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AuthGateStatus />;
  }

  if (isAuthenticated) {
    const next = resolveNextPath(new URLSearchParams(location.search).get("next") || "/dashboard");
    return <Navigate to={next} replace />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "contact", Component: ContactPage },
      { path: "composer", Component: ComposerPage },
      { path: "what-if", Component: WhatIfPage },
      { path: "dashboard", Component: DashboardPage },
      { path: "profile", Component: ProfilePage },
      { path: "auth/callback", Component: AuthCallbackPage },
      { path: "legal/acceptable-use-policy", Component: AcceptableUsePolicyPage },
      { path: "legal/privacy-policy", Component: PrivacyPolicyPage },
      { path: "legal/cookie-policy", Component: CookiePolicyPage },
      { path: "legal/terms-conditions", Component: TermsConditionsPage },
      {
        Component: GuestOnly,
        children: [
          { path: "login", Component: LoginPage },
          { path: "signup", Component: SignupPage },
        ],
      },
      {
        path: "*",
        Component: HomePage,
      },
    ],
  },
]);
