import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

const mono: React.CSSProperties = {
  fontFamily: "'Roboto Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

type AppPageId = "composer" | "what-if" | "dashboard";

const pageLinks: Record<AppPageId, { label: string; to: string }> = {
  composer: {
    label: "Composer",
    to: "/composer",
  },
  "what-if": {
    label: "What If",
    to: "/what-if",
  },
  dashboard: {
    label: "Dashboard",
    to: "/dashboard",
  },
};

export function AppPageLinks({
  currentPage,
  label = "Jump To",
}: {
  currentPage: AppPageId;
  label?: string;
}) {
  const links = (Object.entries(pageLinks) as Array<[AppPageId, (typeof pageLinks)[AppPageId]]>)
    .filter(([page]) => page !== currentPage);

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3"
      style={{ border: "1px solid #00000010", backgroundColor: "#EEEDE1", padding: "10px 12px" }}
    >
      <span style={{ ...mono, fontSize: 10, color: "#686868" }}>{label}</span>

      <div className="flex flex-wrap items-center gap-2">
        {links.map(([page, item], index) => (
          <Link
            key={page}
            to={item.to}
            className="inline-flex items-center gap-2"
            style={{
              ...mono,
              fontSize: 10,
              color: index === 0 ? "#1A3D1A" : "#050505",
              backgroundColor: index === 0 ? "#D1FF0020" : "#F8F7ED",
              border: `1px solid ${index === 0 ? "#D1FF00" : "#00000010"}`,
              padding: "8px 11px",
              textDecoration: "none",
            }}
          >
            {item.label}
            <ArrowUpRight size={11} />
          </Link>
        ))}
      </div>
    </div>
  );
}
