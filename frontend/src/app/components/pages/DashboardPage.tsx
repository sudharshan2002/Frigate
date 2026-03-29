import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { GrainLocal } from "../GrainOverlay";
import { AppPageLinks } from "./AppPageLinks";
import { BarChart3, Clock, ArrowRight, Eye, Shield, Sparkles, Activity } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { api, formatRelativeTime, formatStorage, type DashboardMetricsResponse, type SessionListResponse } from "../../lib/api";

const mono: React.CSSProperties = {
  fontFamily: "'Roboto Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const ease = [0.16, 1, 0.3, 1] as const;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: "#EBEAE0", border: "1px solid #00000010", padding: "8px 10px" }}>
      <div style={{ ...mono, fontSize: 9, color: "#686868", marginBottom: 4 }}>{label}</div>
      {payload.map((point: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div style={{ width: 6, height: 6, backgroundColor: point.color }} />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#050505" }}>{point.value}</span>
        </div>
      ))}
    </div>
  );
};

function StatCard({ icon, label, value, sub, delay = 0 }: { icon: React.ReactNode; label: string; value: string; sub: string; delay?: number }) {
  return (
    <motion.div
      className="p-5"
      style={{ backgroundColor: "#EBEAE0", border: "1px solid #00000008" }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease, delay }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div style={{ color: "#1A3D1A" }}>{icon}</div>
        <span style={{ ...mono, fontSize: 10, color: "#686868" }}>{label}</span>
      </div>
      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: 28, color: "#050505", letterSpacing: "-0.04em" }}>{value}</div>
      <div style={{ ...mono, fontSize: 10, color: "#686868", marginTop: 4 }}>{sub}</div>
    </motion.div>
  );
}

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "system">("overview");
  const [dashboard, setDashboard] = useState<DashboardMetricsResponse | null>(null);
  const [sessions, setSessions] = useState<SessionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendNotice, setBackendNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const [dashboardResponse, sessionResponse] = await Promise.all([
          api.dashboard(),
          api.sessions(12),
        ]);

        if (!cancelled) {
          setDashboard(dashboardResponse);
          setSessions(sessionResponse);
          setBackendNotice(
            dashboardResponse.isFallback
              ? dashboardResponse.fallbackMessage || "Live services are unavailable, so Frigate is showing preview data."
              : sessionResponse.isFallback
                ? sessionResponse.fallbackMessage || "Live services are unavailable, so Frigate is showing preview data."
                : null,
          );
        }
      } catch (dashboardError) {
        if (!cancelled) {
          setError(dashboardError instanceof Error ? dashboardError.message : "Unable to load dashboard.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const systemCards = dashboard?.system_status || [];
  const recentRuns = dashboard?.recent_runs || [];
  const trendData = dashboard?.trend || [];
  const usageData = dashboard?.usage_today || [];

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: "#F5F4E7", paddingTop: 64 }}>
      <GrainLocal opacity={0.03} />

      <motion.div
        className="relative z-10"
        style={{ padding: "10px clamp(20px, 3vw, 40px)", borderBottom: "1px solid #00000010", backgroundColor: "#EBEAE0" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.2 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BarChart3 size={13} style={{ color: "#1A3D1A" }} />
            <span style={{ ...mono, fontSize: 11, color: "#1A3D1A" }}>Trust Dashboard</span>
            <div style={{ width: 1, height: 14, backgroundColor: "#9C9C9C18" }} />
            <span style={{ ...mono, fontSize: 11, color: "#686868" }}>Run performance and system health</span>
          </div>
          <div className="flex items-center gap-1">
            {(["overview", "sessions", "system"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="cursor-pointer border-none"
                style={{
                  ...mono, fontSize: 10,
                  color: activeTab === tab ? "#1A3D1A" : "#686868",
                  backgroundColor: activeTab === tab ? "#D1FF0030" : "#F5F4E7",
                  padding: "8px 12px",
                  border: `1px solid ${activeTab === tab ? "#D1FF00" : "#00000012"}`,
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto grid gap-6" style={{ maxWidth: 1480, padding: "28px clamp(20px, 3vw, 40px)" }}>
        <AppPageLinks currentPage="dashboard" />

        {backendNotice && (
          <div className="p-4" style={{ border: "1px solid #D1FF00", backgroundColor: "#D1FF0010" }}>
            <div style={{ ...mono, fontSize: 10, color: "#1A3D1A", marginBottom: 8 }}>Preview Mode</div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, lineHeight: "165%", color: "#686868", margin: 0 }}>{backendNotice}</p>
          </div>
        )}

        {loading ? (
          <div style={{ ...mono, fontSize: 10, color: "#686868" }}>Loading...</div>
        ) : error ? (
          <div className="p-5" style={{ border: "1px solid #FF7D7D20", backgroundColor: "#FF7D7D08" }}>
            <div style={{ ...mono, fontSize: 10, color: "#FF7D7D", marginBottom: 10 }}>Dashboard Error</div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 15, lineHeight: "170%", color: "#686868" }}>{error}</p>
          </div>
        ) : activeTab === "overview" && dashboard ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<Shield size={13} />} label="Avg Confidence" value={`${Math.round(dashboard.avg_confidence)}%`} sub="Across recent runs" delay={0.3} />
              <StatCard icon={<Eye size={13} />} label="Avg Clarity" value={`${Math.round(dashboard.avg_clarity)}%`} sub="Prompt understanding" delay={0.36} />
              <StatCard icon={<Sparkles size={13} />} label="Avg Quality" value={`${Math.round(dashboard.avg_quality)}%`} sub="Output quality index" delay={0.42} />
              <StatCard icon={<Activity size={13} />} label="Total Runs" value={`${dashboard.total_runs}`} sub={`${Math.round(dashboard.avg_response_time)}ms avg latency`} delay={0.48} />
            </div>

            <div className="grid lg:grid-cols-2 gap-5 mb-8">
              <motion.div className="p-5" style={{ border: "1px solid #00000010", backgroundColor: "#EBEAE0" }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.5 }}>
                <div className="flex items-center justify-between mb-4">
                  <span style={{ ...mono, fontSize: 10, color: "#686868" }}>Performance Trends</span>
                  <div className="flex items-center gap-3">
                    {[{ l: "Conf", c: "#D1FF00" }, { l: "Clarity", c: "#7DB5FF" }, { l: "Quality", c: "#7DFFAF" }].map((legend) => (
                      <div key={legend.l} className="flex items-center gap-1">
                        <div style={{ width: 6, height: 6, backgroundColor: legend.c }} />
                        <span style={{ ...mono, fontSize: 9, color: "#686868" }}>{legend.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D1FF00" stopOpacity={0.15} /><stop offset="100%" stopColor="#D1FF00" stopOpacity={0} /></linearGradient>
                      <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7DB5FF" stopOpacity={0.1} /><stop offset="100%" stopColor="#7DB5FF" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#686868", fontFamily: "'Roboto Mono', monospace" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#686868", fontFamily: "'Roboto Mono', monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="confidence" stroke="#D1FF00" strokeWidth={1.5} fill="url(#gC)" />
                    <Area type="monotone" dataKey="clarity" stroke="#7DB5FF" strokeWidth={1.5} fill="url(#gB)" />
                    <Area type="monotone" dataKey="quality" stroke="#7DFFAF" strokeWidth={1.5} fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div className="p-5" style={{ border: "1px solid #00000010", backgroundColor: "#EBEAE0" }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.55 }}>
                <div className="flex items-center justify-between mb-4">
                  <span style={{ ...mono, fontSize: 10, color: "#686868" }}>Usage Today</span>
                  <span style={{ ...mono, fontSize: 10, color: "#1A3D1A" }}>{usageData.reduce((sum, item) => sum + item.runs, 0)} runs</span>
                </div>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#686868", fontFamily: "'Roboto Mono', monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#686868", fontFamily: "'Roboto Mono', monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="runs" fill="#D1FF00" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.6 }}>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={13} style={{ color: "#D1FF00" }} />
                <span style={{ ...mono, fontSize: 10, color: "#686868" }}>Recent Generations</span>
              </div>
              {recentRuns.length > 0 ? recentRuns.map((run, index) => (
                <motion.div
                  key={run.id}
                  className="flex items-center justify-between py-3.5 px-2 -mx-2"
                  style={{ borderBottom: "1px solid #9C9C9C08" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.65 + index * 0.04 }}
                >
                  <div className="flex-1 mr-4">
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#050505", marginBottom: 3 }}>{run.prompt}</p>
                    <span style={{ ...mono, fontSize: 9, color: "#686868" }}>{formatRelativeTime(run.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, color: "#D1FF00" }}>{Math.round(run.confidence)}%</div>
                      <div style={{ ...mono, fontSize: 9, color: "#686868" }}>Conf</div>
                    </div>
                    <div className="text-right">
                      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, color: "#050505" }}>{Math.round(run.clarity)}%</div>
                      <div style={{ ...mono, fontSize: 9, color: "#686868" }}>Clarity</div>
                    </div>
                    <span style={{
                      ...mono, fontSize: 9,
                      color: run.quality_label === "Excellent" ? "#7DFFAF" : run.quality_label === "Good" ? "#D1FF00" : "#FFB87D",
                      backgroundColor: run.quality_label === "Excellent" ? "#7DFFAF0D" : run.quality_label === "Good" ? "#D1FF000D" : "#FFB87D0D",
                      padding: "3px 7px",
                    }}>{run.quality_label}</span>
                    <ArrowRight size={12} style={{ color: "#686868" }} />
                  </div>
                </motion.div>
              )) : (
                <span style={{ ...mono, fontSize: 10, color: "#686868" }}>No runs.</span>
              )}
            </motion.div>
          </>
        ) : activeTab === "sessions" && sessions ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div style={{ ...mono, fontSize: 10, color: "#686868", marginBottom: 16 }}>Stored Sessions</div>
            <div className="flex flex-col gap-3">
              {sessions.sessions.length > 0 ? sessions.sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  className="p-5"
                  style={{ border: "1px solid #9C9C9C10" }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease, delay: 0.3 + index * 0.07 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: "#050505", marginBottom: 3, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{session.mode} | {session.provider}</div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, lineHeight: "155%", color: "#686868", marginBottom: 8 }}>{session.prompt}</div>
                      <div className="flex items-center gap-3">
                        <span style={{ ...mono, fontSize: 10, color: "#686868" }}>{formatRelativeTime(session.created_at)}</span>
                        <span style={{ ...mono, fontSize: 10, color: "#686868" }}>{Math.round(session.response_time_ms)}ms</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{
                        ...mono, fontSize: 9,
                        color: session.quality_label === "Excellent" ? "#7DFFAF" : session.quality_label === "Good" ? "#D1FF00" : "#FFB87D",
                        backgroundColor: session.quality_label === "Excellent" ? "#7DFFAF10" : session.quality_label === "Good" ? "#D1FF0010" : "#FFB87D10",
                        padding: "3px 8px",
                      }}>{session.quality_label}</span>
                      <ArrowRight size={12} style={{ color: "#686868" }} />
                    </div>
                  </div>
                </motion.div>
              )) : (
                <span style={{ ...mono, fontSize: 10, color: "#686868" }}>No history.</span>
              )}
            </div>
            <div className="mt-8 p-5 text-center" style={{ border: "1px dashed #9C9C9C15" }}>
              <span style={{ ...mono, fontSize: 10, color: "#686868" }}>
                {sessions.sessions.length} loaded | {sessions.total_runs} total runs | {formatStorage(sessions.storage_bytes)} stored
              </span>
            </div>
          </motion.div>
        ) : activeTab === "system" && dashboard ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-2 mb-6">
              <Activity size={13} style={{ color: "#D1FF00" }} />
              <span style={{ ...mono, fontSize: 10, color: "#686868" }}>System Health</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                ...systemCards,
                { label: "Avg Latency", value: `${Math.round(dashboard.avg_response_time)}ms`, status: "Observed" },
                { label: "Total Runs", value: `${dashboard.total_runs}`, status: "Persisted" },
              ].map((item, index) => (
                <motion.div
                  key={`${item.label}-${index}`}
                  className="p-4"
                  style={{ border: "1px solid #00000010", backgroundColor: "#EBEAE0" }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease, delay: 0.3 + index * 0.05 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ ...mono, fontSize: 10, color: "#686868" }}>{item.label}</span>
                    <span style={{ ...mono, fontSize: 9, color: "#D1FF00", backgroundColor: "#D1FF0010", padding: "3px 6px" }}>{item.status}</span>
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 17, color: "#050505" }}>{item.value}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
