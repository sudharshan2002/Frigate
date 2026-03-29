import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { HomePage } from "./components/pages/HomePage";
import { ComposerPage } from "./components/pages/ComposerPage";
import { WhatIfPage } from "./components/pages/WhatIfPage";
import { DashboardPage } from "./components/pages/DashboardPage";
import { ContactPage } from "./components/pages/ContactPage";
import {
  AcceptableUsePolicyPage,
  CookiePolicyPage,
  PrivacyPolicyPage,
  TermsConditionsPage,
} from "./components/pages/LegalPages";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "composer", Component: ComposerPage },
      { path: "what-if", Component: WhatIfPage },
      { path: "dashboard", Component: DashboardPage },
      { path: "contact", Component: ContactPage },
      { path: "legal/acceptable-use-policy", Component: AcceptableUsePolicyPage },
      { path: "legal/privacy-policy", Component: PrivacyPolicyPage },
      { path: "legal/cookie-policy", Component: CookiePolicyPage },
      { path: "legal/terms-conditions", Component: TermsConditionsPage },
      {
        path: "*",
        Component: HomePage,
      },
    ],
  },
]);
