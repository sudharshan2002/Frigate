import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router";
import { FadeIn } from "../AnimatedText";
import { GrainLocal } from "../GrainOverlay";

const mono: CSSProperties = {
  fontFamily: "'Roboto Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

type PolicySubSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type PolicySection = {
  id: string;
  navLabel: string;
  heading: string;
  intro?: string;
  paragraphs?: string[];
  bullets?: string[];
  note?: string;
  subSections?: PolicySubSection[];
};

type PolicyDefinition = {
  title: string;
  eyebrow: string;
  intro: string;
  lead: string;
  updatedAt: string;
  appliesTo: string[];
  sections: PolicySection[];
};

const relatedPolicies = [
  { label: "Acceptable Use Policy", path: "/legal/acceptable-use-policy" },
  { label: "Privacy Policy", path: "/legal/privacy-policy" },
  { label: "Cookie Policy", path: "/legal/cookie-policy" },
  { label: "Terms & Conditions", path: "/legal/terms-conditions" },
];

const acceptableUsePolicy: PolicyDefinition = {
  title: "Acceptable Use Policy",
  eyebrow: "Platform conduct",
  intro:
    "This policy explains the rules for using Frigate across our website, demos, trials, product interfaces, APIs, and enterprise workspaces.",
  lead:
    "Frigate exists to make text and image AI more explainable, traceable, and controllable. You may use the platform only in ways that are lawful, safe, transparent, and respectful of other people, their data, and the integrity of the system.",
  updatedAt: "March 26, 2026",
  appliesTo: ["Website visitors", "Trial users", "Workspace admins", "API and product users"],
  sections: [
    {
      id: "purpose",
      navLabel: "Purpose",
      heading: "Purpose and Scope",
      paragraphs: [
        "This Acceptable Use Policy is part of the rules that govern access to Frigate. It applies whenever you browse our public site, submit information through forms, upload inputs, create prompts, review outputs, or use any Frigate feature made available through a customer workspace or technical integration.",
        "If you use Frigate on behalf of a company, agency, or client, you are responsible for making sure the people working under your account follow these rules as well.",
      ],
    },
    {
      id: "authorized-use",
      navLabel: "Authorized Use",
      heading: "Authorized Use",
      intro: "Frigate may be used for legitimate product, research, creative, operational, and internal business workflows.",
      bullets: [
        "Analyzing how prompt segments influence text, image, or multimodal outputs.",
        "Comparing versions of prompts, explanations, and revisions inside a customer workflow.",
        "Documenting why an output changed and improving review quality for internal teams.",
        "Testing prompt behavior before publishing content, assets, or automations.",
      ],
      note:
        "You are responsible for making sure your use of Frigate complies with your own contracts, professional obligations, and local law.",
    },
    {
      id: "harmful-content",
      navLabel: "Harmful Content",
      heading: "Unsafe or Illegal Content",
      intro: "You may not use Frigate to plan, generate, request, or operationalize content that harms people or breaks the law.",
      bullets: [
        "Violence, terrorism, threats, or instructions for physical harm.",
        "Child sexual abuse material or exploitative sexual content.",
        "Non-consensual intimate content, stalking, or targeted harassment.",
        "Illegal drugs, weapons trafficking, fraud, identity theft, or financial scams.",
        "Malware, credential theft, phishing, or content designed to compromise systems.",
      ],
    },
    {
      id: "deception",
      navLabel: "Deception",
      heading: "Deceptive or Manipulative Behavior",
      paragraphs: [
        "Frigate may not be used to impersonate people, hide the origin of synthetic content when disclosure is required, or create misleading materials that are likely to deceive users, customers, voters, patients, or the public.",
        "You may not use the platform to fabricate evidence, forge records, automate spam campaigns, inflate reviews, misrepresent endorsements, or present AI-generated material as verified human testimony without clear review and accountability.",
      ],
    },
    {
      id: "privacy",
      navLabel: "Privacy",
      heading: "Privacy and Data Respect",
      paragraphs: [
        "Do not upload, process, or share personal data through Frigate unless you have a valid reason and the right to do so. You must respect privacy rights, confidentiality duties, contractual restrictions, and any notice or consent requirements that apply to your use case.",
        "You may not use Frigate to infer sensitive traits, expose private information, scrape restricted data, or profile individuals in ways that are unlawful, discriminatory, or unfair.",
      ],
    },
    {
      id: "security",
      navLabel: "Security",
      heading: "System Abuse and Security Restrictions",
      intro: "You may not interfere with the operation, safety, or availability of Frigate.",
      bullets: [
        "Reverse engineer, probe, or bypass rate limits, access controls, or safety checks.",
        "Use bots or scripts to overload the site, abuse endpoints, or degrade service for others.",
        "Attempt to access data, accounts, prompts, or outputs that you are not authorized to access.",
        "Use Frigate to benchmark, copy, or replicate the service in a way that violates our agreements.",
      ],
    },
    {
      id: "high-stakes",
      navLabel: "High-Stakes Use",
      heading: "Human Oversight for Sensitive Decisions",
      paragraphs: [
        "Frigate is a workflow and explainability product, not a substitute for qualified human judgment. You must not rely on the platform alone for decisions involving employment, housing, credit, insurance, legal rights, immigration status, emergency response, medical diagnosis, or other materially high-stakes outcomes.",
        "If you use Frigate in a regulated or sensitive setting, you are responsible for applying appropriate review, testing, documentation, escalation, and human sign-off before acting on any output.",
      ],
    },
    {
      id: "enforcement",
      navLabel: "Enforcement",
      heading: "Enforcement and Reporting",
      paragraphs: [
        "We may investigate suspected misuse, limit access, remove content, suspend accounts, or terminate service when we reasonably believe this policy or our agreements have been violated. We may also act to protect users, the public, our systems, or our partners.",
        "If you discover abuse, security issues, or content that appears to violate this policy, contact us at hello@frigate.ai with enough detail for our team to review the issue.",
      ],
    },
  ],
};

const privacyPolicy: PolicyDefinition = {
  title: "Privacy Policy",
  eyebrow: "Data practices",
  intro:
    "This Privacy Policy describes how Frigate collects, uses, stores, shares, and protects information when you visit our site or use our explainable AI platform.",
  lead:
    "We design Frigate around visibility and control. That same principle applies to privacy: we aim to collect only what we need, explain why we use it, and give customers practical ways to manage their information.",
  updatedAt: "March 26, 2026",
  appliesTo: ["Visitors", "Leads and subscribers", "Workspace users", "Enterprise contacts"],
  sections: [
    {
      id: "scope",
      navLabel: "Scope",
      heading: "Who This Policy Covers",
      paragraphs: [
        "This policy applies to information collected through the Frigate website, our demos, newsletters, support channels, customer onboarding, and any product experience where this policy is linked or referenced.",
        "Separate enterprise agreements, order forms, or data processing terms may apply to specific customer relationships. When those documents conflict with this policy, the more specific agreement controls for that customer arrangement.",
      ],
    },
    {
      id: "information-you-provide",
      navLabel: "Provided Info",
      heading: "Information You Provide Directly",
      bullets: [
        "Contact details such as name, work email, company, and role.",
        "Messages, meeting requests, support inquiries, and sales communications.",
        "Account registration details and workspace administration settings.",
        "Prompts, uploads, annotations, feedback, and review notes submitted inside the product.",
      ],
    },
    {
      id: "product-usage",
      navLabel: "Usage Data",
      heading: "Product Usage and Technical Data",
      paragraphs: [
        "We collect technical and usage data needed to operate, secure, and improve Frigate. This may include IP address, browser type, device information, session events, feature interactions, diagnostics, log data, and performance telemetry.",
        "When you use Frigate features, we may process prompt inputs, generated outputs, explanation traces, comparison data, and workflow metadata so the product can deliver the requested functionality.",
      ],
    },
    {
      id: "cookies",
      navLabel: "Cookies",
      heading: "Cookies, Analytics, and Similar Technologies",
      paragraphs: [
        "We use cookies and similar tools to remember preferences, understand site performance, secure sessions, and measure how visitors engage with our pages and product flows.",
        "You can find more detail in our Cookie Policy, including the types of cookies we use and how to manage them.",
      ],
    },
    {
      id: "how-we-use",
      navLabel: "Use of Data",
      heading: "How We Use Information",
      bullets: [
        "Provide and maintain the Frigate website, platform, and related services.",
        "Authenticate users, manage workspaces, and secure accounts.",
        "Respond to inquiries, deliver support, and communicate operational updates.",
        "Improve usability, reliability, safety systems, and product performance.",
        "Send marketing communications where permitted, subject to your preferences.",
        "Comply with law, enforce agreements, and protect rights, security, and property.",
      ],
    },
    {
      id: "sharing",
      navLabel: "Sharing",
      heading: "How We Share Information",
      paragraphs: [
        "We do not sell personal information as part of Frigate's standard business model. We may share information with service providers and infrastructure partners that help us host the product, manage communications, process support requests, secure the service, or analyze product performance.",
        "We may also share information with affiliates, professional advisors, transaction counterparties, or public authorities when needed for legal compliance, corporate transactions, fraud prevention, or the protection of users and our business.",
      ],
      note:
        "Where required, we use contracts and operational controls designed to limit how vendors handle customer information.",
    },
    {
      id: "retention-security",
      navLabel: "Retention",
      heading: "Retention and Security",
      paragraphs: [
        "We retain information for as long as reasonably necessary to provide services, maintain records, resolve disputes, meet legal obligations, and protect the platform. Retention periods may vary depending on account status, the type of data involved, and any customer-specific commitments.",
        "We use administrative, technical, and organizational measures intended to protect information against unauthorized access, loss, misuse, or disclosure. No system is perfectly secure, so you should avoid submitting information that you are not authorized to share.",
      ],
    },
    {
      id: "choices",
      navLabel: "Your Choices",
      heading: "Your Choices and Contact Rights",
      subSections: [
        {
          title: "Access and Updates",
          paragraphs: [
            "You may request access to, correction of, or deletion of certain personal information, subject to legal exceptions and the limits of our technical environment.",
          ],
        },
        {
          title: "Marketing Preferences",
          paragraphs: [
            "You can opt out of promotional emails at any time using the unsubscribe link in the message or by contacting us directly.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            "Privacy requests and questions can be sent to hello@frigate.ai. We may need to verify your identity before acting on certain requests.",
          ],
        },
      ],
    },
  ],
};

const cookiePolicy: PolicyDefinition = {
  title: "Cookie Policy",
  eyebrow: "Site settings",
  intro:
    "This Cookie Policy explains how Frigate uses cookies and similar technologies on our website and product surfaces.",
  lead:
    "Cookies help us keep the site working, understand performance, remember choices, and improve how Frigate behaves across sessions. We aim to use them in a way that supports product quality without turning the experience into a tracking maze.",
  updatedAt: "March 26, 2026",
  appliesTo: ["Marketing pages", "Product sessions", "Analytics tooling", "Preference storage"],
  sections: [
    {
      id: "what-are-cookies",
      navLabel: "Overview",
      heading: "What Cookies Are",
      paragraphs: [
        "Cookies are small text files stored on your browser or device when you visit a site. Related technologies may include local storage, pixels, tags, and software development kit identifiers that serve similar purposes.",
        "Some cookies are set by Frigate directly. Others may be set by service providers that support hosting, analytics, security, support, or embedded product functionality.",
      ],
    },
    {
      id: "how-we-use",
      navLabel: "Why We Use",
      heading: "Why Frigate Uses Cookies",
      bullets: [
        "Keep the site and product running securely.",
        "Remember session state and user interface preferences.",
        "Measure page performance and diagnose technical issues.",
        "Understand which content and workflows are useful to visitors and customers.",
        "Support communication, onboarding, and customer success flows.",
      ],
    },
    {
      id: "essential-cookies",
      navLabel: "Essential",
      heading: "Essential Cookies",
      paragraphs: [
        "These cookies are necessary for core site and product operation. They may support login sessions, load balancing, fraud prevention, routing, network management, and security protections.",
        "Because they are required for basic functionality, disabling them may cause parts of Frigate to stop working properly.",
      ],
    },
    {
      id: "analytics-cookies",
      navLabel: "Analytics",
      heading: "Analytics and Performance Cookies",
      paragraphs: [
        "These cookies help us understand how pages load, which flows visitors use, how often errors occur, and where we should improve usability or reliability.",
        "Analytics tools may collect aggregated or session-level information such as page views, referral sources, approximate geography, browser configuration, click paths, and performance metrics.",
      ],
    },
    {
      id: "functional-cookies",
      navLabel: "Preferences",
      heading: "Functional and Preference Cookies",
      paragraphs: [
        "Functional cookies remember settings such as UI choices, prior form inputs, content preferences, or region-specific selections so the experience feels consistent when you return.",
        "They may also help us tailor onboarding and support experiences based on where you are in the product journey.",
      ],
    },
    {
      id: "managing-cookies",
      navLabel: "Manage Cookies",
      heading: "How to Manage Cookies",
      subSections: [
        {
          title: "Browser Controls",
          paragraphs: [
            "Most browsers let you delete cookies, block certain cookies, or alert you before a cookie is stored. The exact steps depend on the browser you use.",
          ],
        },
        {
          title: "Device and Site Settings",
          paragraphs: [
            "Some devices and application surfaces provide additional privacy or tracking controls that can affect how cookies and similar technologies behave.",
          ],
        },
        {
          title: "What to Expect",
          paragraphs: [
            "If you block essential cookies, some login, security, or product features may be unavailable or unstable.",
          ],
        },
      ],
    },
    {
      id: "updates",
      navLabel: "Updates",
      heading: "Policy Updates and Contact",
      paragraphs: [
        "We may update this Cookie Policy as our tooling, integrations, and legal requirements evolve. When we make material updates, we will revise the date at the top of the page and, where appropriate, provide additional notice.",
        "Questions about cookies or tracking practices can be sent to hello@frigate.ai.",
      ],
    },
  ],
};

const termsPolicy: PolicyDefinition = {
  title: "Terms & Conditions",
  eyebrow: "Service terms",
  intro:
    "These Terms & Conditions govern your access to the Frigate website, software, demos, APIs, and related services unless a separate signed agreement applies.",
  lead:
    "By using Frigate, you agree to follow these terms and any additional rules referenced in them, including our Acceptable Use Policy and Privacy Policy. If you do not agree, do not use the service.",
  updatedAt: "March 26, 2026",
  appliesTo: ["Visitors", "Trial accounts", "Customers", "Team members invited to a workspace"],
  sections: [
    {
      id: "acceptance",
      navLabel: "Acceptance",
      heading: "Acceptance of Terms",
      paragraphs: [
        "You must be legally able to enter into these terms to use Frigate. If you use the service on behalf of an organization, you represent that you have authority to bind that organization.",
        "Additional commercial documents, such as order forms, statements of work, or enterprise contracts, may apply to specific customer relationships. Those documents supplement these terms.",
      ],
    },
    {
      id: "services",
      navLabel: "Services",
      heading: "Our Services",
      paragraphs: [
        "Frigate provides tools for prompt analysis, explainability, comparison, review workflows, and related AI product functionality. We may improve, modify, replace, or discontinue features over time.",
        "We are not obligated to maintain every feature, beta capability, integration, or experimental workflow in its current form.",
      ],
    },
    {
      id: "accounts",
      navLabel: "Accounts",
      heading: "Accounts, Access, and Security",
      bullets: [
        "Keep login credentials confidential and do not share access outside your authorized team.",
        "Provide accurate registration and contact information.",
        "Notify us promptly if you suspect unauthorized access or a security issue.",
        "You are responsible for activities that occur through your account or workspace, except to the extent caused by our own breach of these terms.",
      ],
    },
    {
      id: "customer-content",
      navLabel: "Your Content",
      heading: "Customer Content and Inputs",
      paragraphs: [
        "You retain your rights in prompts, uploads, annotations, and other content that you submit to Frigate, subject to any rights needed for us to operate and support the service.",
        "You represent that you have all rights, permissions, and legal bases required to submit that content and to instruct us to process it on your behalf.",
      ],
    },
    {
      id: "frigate-ip",
      navLabel: "Our IP",
      heading: "Frigate Intellectual Property",
      paragraphs: [
        "Frigate, including our software, interface design, workflows, visual language, documentation, and branding, is protected by intellectual property law. Except for the limited right to use the service under these terms, no license or ownership transfer is granted to you.",
        "You may not copy, modify, distribute, resell, reverse engineer, or create derivative products from Frigate except as expressly allowed by law or a written agreement with us.",
      ],
    },
    {
      id: "feedback",
      navLabel: "Feedback",
      heading: "Feedback",
      paragraphs: [
        "If you send us ideas, suggestions, product requests, or workflow feedback, you agree that we may use that feedback without restriction or compensation, unless a separate written agreement says otherwise.",
      ],
    },
    {
      id: "fees",
      navLabel: "Fees",
      heading: "Fees, Trials, and Commercial Terms",
      paragraphs: [
        "Certain Frigate services may be offered on a paid basis, under a trial, or as part of a pilot. Pricing, billing cadence, payment obligations, renewal terms, and any usage limits will be described in the applicable commercial terms or order documentation.",
        "If a payment is overdue, we may suspend access after providing any notice required by the applicable agreement.",
      ],
    },
    {
      id: "disclaimers",
      navLabel: "Disclaimers",
      heading: "Disclaimers and Limits",
      paragraphs: [
        "Frigate is provided on an as-available basis unless a separate agreement gives you a different service commitment. To the maximum extent permitted by law, we disclaim implied warranties, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.",
        "AI systems can produce inaccurate, incomplete, or unexpected results. You are responsible for reviewing outputs before using them in production, external communications, or sensitive decisions.",
      ],
    },
    {
      id: "termination",
      navLabel: "Termination",
      heading: "Suspension, Termination, and General Terms",
      subSections: [
        {
          title: "Suspension and Termination",
          paragraphs: [
            "We may suspend or terminate access if you breach these terms, create risk for the platform, fail to pay applicable fees, or use the service in a way that violates law or our Acceptable Use Policy.",
          ],
        },
        {
          title: "Changes",
          paragraphs: [
            "We may update these terms from time to time. Continued use after an updated version takes effect means you accept the revised terms.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            "Questions about these terms can be sent to hello@frigate.ai.",
          ],
        },
      ],
    },
  ],
};

function LegalSectionBlock({ section, index }: { section: PolicySection; index: number }) {
  return (
    <FadeIn delay={Math.min(index * 0.05, 0.3)}>
      <section
        id={section.id}
        style={{
          scrollMarginTop: 112,
          padding: "clamp(28px, 3vw, 44px) 0",
          borderTop: "1px solid rgba(5,5,5,0.08)",
        }}
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(100px,140px)_minmax(0,1fr)]">
          <div>
            <div style={{ ...mono, fontSize: 10, color: "rgba(5,5,5,0.34)" }}>
              {String(index + 1).padStart(2, "0")}
            </div>
          </div>

          <div>
            <h2
              style={{
                fontFamily: '"TASA Orbiter", Inter, sans-serif',
                fontWeight: 800,
                fontSize: "clamp(1.5rem, 2vw, 2.3rem)",
                lineHeight: 0.96,
                letterSpacing: "-0.05em",
                color: "#050505",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              {section.heading}
            </h2>

            {section.intro ? (
              <p
                style={{
                  ...mono,
                  fontSize: 11,
                  color: "rgba(5,5,5,0.72)",
                  lineHeight: 1.55,
                  margin: "18px 0 0 0",
                  maxWidth: 760,
                }}
              >
                {section.intro}
              </p>
            ) : null}

            {section.paragraphs?.map((paragraph) => (
              <p
                key={paragraph}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 15,
                  lineHeight: 1.72,
                  color: "rgba(5,5,5,0.68)",
                  margin: "18px 0 0 0",
                  maxWidth: 760,
                }}
              >
                {paragraph}
              </p>
            ))}

            {section.bullets?.length ? (
              <ul
                style={{
                  margin: "20px 0 0 0",
                  paddingLeft: 20,
                  maxWidth: 760,
                  color: "rgba(5,5,5,0.72)",
                }}
              >
                {section.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 15,
                      lineHeight: 1.7,
                      marginBottom: 10,
                    }}
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}

            {section.subSections?.map((subSection) => (
              <div key={subSection.title} style={{ marginTop: 24, maxWidth: 760 }}>
                <h3
                  style={{
                    fontFamily: '"TASA Orbiter", Inter, sans-serif',
                    fontWeight: 700,
                    fontSize: "clamp(1rem, 1.2vw, 1.2rem)",
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                    color: "#050505",
                    margin: 0,
                    textTransform: "uppercase",
                  }}
                >
                  {subSection.title}
                </h3>

                {subSection.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 15,
                      lineHeight: 1.72,
                      color: "rgba(5,5,5,0.68)",
                      margin: "12px 0 0 0",
                    }}
                  >
                    {paragraph}
                  </p>
                ))}

                {subSection.bullets?.length ? (
                  <ul
                    style={{
                      margin: "14px 0 0 0",
                      paddingLeft: 20,
                      color: "rgba(5,5,5,0.72)",
                    }}
                  >
                    {subSection.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: 15,
                          lineHeight: 1.7,
                          marginBottom: 10,
                        }}
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}

            {section.note ? (
              <div
                style={{
                  marginTop: 24,
                  maxWidth: 760,
                  padding: "16px 18px",
                  backgroundColor: "rgba(209,255,0,0.24)",
                  borderLeft: "3px solid #D1FF00",
                }}
              >
                <p
                  style={{
                    ...mono,
                    fontSize: 10,
                    lineHeight: 1.6,
                    color: "#050505",
                    margin: 0,
                  }}
                >
                  {section.note}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </FadeIn>
  );
}

function LegalPolicyPage({ policy }: { policy: PolicyDefinition }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(policy.sections[0]?.id ?? "");

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${policy.title} | Frigate`;

    return () => {
      document.title = previousTitle;
    };
  }, [policy.title]);

  useEffect(() => {
    const sections = policy.sections
      .map((section) => document.getElementById(section.id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((entryA, entryB) => entryB.intersectionRatio - entryA.intersectionRatio);

        const topSection = visibleEntries[0]?.target.id;
        if (topSection) {
          setActiveSection(topSection);
        }
      },
      {
        rootMargin: "-18% 0px -55% 0px",
        threshold: [0.12, 0.25, 0.45, 0.65],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      sections.forEach((section) => observer.unobserve(section));
      observer.disconnect();
    };
  }, [policy.sections]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    const target = document.getElementById(hash);
    if (!target) {
      return;
    }

    const id = window.setTimeout(() => {
      target.scrollIntoView({ behavior: "auto", block: "start" });
      setActiveSection(hash);
    }, 0);

    return () => window.clearTimeout(id);
  }, [policy.title]);

  const goToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }

    window.history.replaceState(null, "", `#${sectionId}`);
    setActiveSection(sectionId);
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative w-full overflow-x-hidden" style={{ backgroundColor: "#F4F4E8" }}>
      <GrainLocal opacity={0.05} />

      <div
        className="pointer-events-none absolute inset-0 mx-auto hidden md:flex"
        style={{ maxWidth: 1920, padding: "0 clamp(20px, 3vw, 48px)" }}
      >
        <div className="grid w-full grid-cols-4">
          <div className="border-r border-[rgba(5,5,5,0.06)]" />
          <div className="border-r border-[rgba(5,5,5,0.06)]" />
          <div className="border-r border-[rgba(5,5,5,0.06)]" />
          <div />
        </div>
      </div>

      <div
        className="relative z-10 mx-auto"
        style={{
          maxWidth: 1920,
          padding: "clamp(124px, 16vh, 156px) clamp(20px, 3vw, 48px) clamp(88px, 10vw, 120px)",
        }}
      >
        <section
          className="grid grid-cols-1 gap-y-14 border-b border-[rgba(5,5,5,0.08)] pb-14 md:grid-cols-4"
          style={{ marginBottom: "clamp(32px, 5vw, 54px)" }}
        >
          <div className="col-span-1 pr-0 md:pr-8">
            <FadeIn>
              <div style={{ ...mono, fontSize: 10, color: "rgba(5,5,5,0.38)", marginBottom: 18 }}>
                Last updated {policy.updatedAt}
              </div>
            </FadeIn>

            <FadeIn delay={0.05}>
              <div style={{ ...mono, fontSize: 10, color: "#050505", marginBottom: 18 }}>{policy.eyebrow}</div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <p
                style={{
                  ...mono,
                  fontSize: 10,
                  lineHeight: 1.7,
                  color: "rgba(5,5,5,0.56)",
                  margin: 0,
                  maxWidth: 240,
                }}
              >
                Frigate explainability platform policies for text, image, and multimodal workflows.
              </p>
            </FadeIn>
          </div>

          <div className="col-span-1 md:col-span-3">
            <FadeIn delay={0.08}>
              <h1
                style={{
                  fontFamily: '"TASA Orbiter", Inter, sans-serif',
                  fontWeight: 800,
                  fontSize: "clamp(2.35rem, 5.9vw, 5.4rem)",
                  lineHeight: 0.86,
                  letterSpacing: "-0.08em",
                  color: "#050505",
                  margin: 0,
                  textTransform: "uppercase",
                  maxWidth: 980,
                }}
              >
                {policy.title}
              </h1>
            </FadeIn>

            <FadeIn delay={0.14}>
              <p
                style={{
                  ...mono,
                  fontSize: 11,
                  lineHeight: 1.7,
                  color: "rgba(5,5,5,0.7)",
                  margin: "26px 0 0 0",
                  maxWidth: 820,
                }}
              >
                {policy.intro}
              </p>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 17,
                  lineHeight: 1.7,
                  color: "rgba(5,5,5,0.66)",
                  margin: "20px 0 0 0",
                  maxWidth: 880,
                }}
              >
                {policy.lead}
              </p>
            </FadeIn>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-y-16 md:grid-cols-4 items-start">
          <aside className="col-span-1 pr-0 md:pr-8 self-start">
            <div className="md:sticky md:top-[96px]">
              <FadeIn>
                <div style={{ ...mono, fontSize: 10, color: "rgba(5,5,5,0.4)", marginBottom: 18 }}>
                  Sections
                </div>
              </FadeIn>

              <FadeIn delay={0.06}>
                <div className="flex flex-col gap-1.5">
                  {policy.sections.map((section) => {
                    const isActive = activeSection === section.id;

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => goToSection(section.id)}
                        className="w-full cursor-pointer border-none bg-transparent px-0 py-0 text-left"
                        style={{ padding: "6px 0" }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 10,
                            ...mono,
                            fontSize: 10,
                            color: isActive ? "#050505" : "rgba(5,5,5,0.42)",
                            transition: "color 180ms ease-out, transform 180ms ease-out",
                            transform: isActive ? "translateX(6px)" : "translateX(0px)",
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: isActive ? "#D1FF00" : "rgba(5,5,5,0.14)",
                              flexShrink: 0,
                            }}
                          />
                          {section.navLabel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </FadeIn>

              <FadeIn delay={0.12}>
                <div
                  style={{
                    marginTop: 28,
                    paddingTop: 22,
                    borderTop: "1px solid rgba(5,5,5,0.08)",
                  }}
                >
                  <div style={{ ...mono, fontSize: 10, color: "rgba(5,5,5,0.4)", marginBottom: 16 }}>
                    Related Pages
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {relatedPolicies.map((page) => {
                      const isCurrent = page.label === policy.title;

                      return (
                        <button
                          key={page.path}
                          type="button"
                          onClick={() => navigate(page.path)}
                          className="w-full cursor-pointer border-none bg-transparent px-0 py-0 text-left"
                          style={{ padding: "6px 0" }}
                        >
                          <span
                            style={{
                              ...mono,
                              fontSize: 10,
                              color: isCurrent ? "#050505" : "rgba(5,5,5,0.42)",
                            }}
                          >
                            {isCurrent ? "[Current] " : ""}
                            {page.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.18}>
                <div
                  style={{
                    marginTop: 28,
                    padding: "18px 18px 16px",
                    backgroundColor: "#050505",
                    color: "#F4F4E8",
                  }}
                >
                  <div style={{ ...mono, fontSize: 9, color: "rgba(244,244,232,0.52)", marginBottom: 12 }}>
                    Applies to
                  </div>
                  {policy.appliesTo.map((item) => (
                    <div key={item} style={{ ...mono, fontSize: 9, marginBottom: 8 }}>
                      {item}
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>
          </aside>

          <div className="col-span-1 md:col-span-3">
            {policy.sections.map((section, index) => (
              <LegalSectionBlock key={section.id} section={section} index={index} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function AcceptableUsePolicyPage() {
  return <LegalPolicyPage policy={acceptableUsePolicy} />;
}

export function PrivacyPolicyPage() {
  return <LegalPolicyPage policy={privacyPolicy} />;
}

export function CookiePolicyPage() {
  return <LegalPolicyPage policy={cookiePolicy} />;
}

export function TermsConditionsPage() {
  return <LegalPolicyPage policy={termsPolicy} />;
}
