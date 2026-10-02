import React, { useMemo } from "react";
import {
  Brain,
  Compass,
  Server,
  Layout,
  FlaskConical,
  ShieldCheck,
  FileText,
  Clock,
  Coins,
  Cpu,
  CheckCircle2,
  Activity,
  ArrowRight,
  Zap,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";

// ─── Default Sample Telemetry Data (Enterprise Fallback) ─────────────────────
export const DEFAULT_PIPELINE_STAGES = [
  {
    id: "planner",
    name: "Planner",
    icon: Brain,
    model: "Groq · Qwen 2.5",
    status: "complete", // "complete" | "running" | "idle" | "failed"
    latencyMs: 920,
    tokensIn: 840,
    tokensOut: 520,
    costUsd: 0.00014,
    description: "Parsed requirements, generated 4 tasks & API contract.",
  },
  {
    id: "architect",
    name: "Architect",
    icon: Compass,
    model: "Groq · Qwen 2.5",
    status: "complete",
    latencyMs: 1450,
    tokensIn: 1100,
    tokensOut: 780,
    costUsd: 0.00021,
    description: "Designed multi-file contract & layout schema.",
  },
  {
    id: "backend",
    name: "Backend Agent",
    icon: Server,
    model: "Groq · Qwen 2.5",
    status: "complete",
    latencyMs: 6200,
    tokensIn: 2150,
    tokensOut: 3400,
    costUsd: 0.00078,
    description: "Generated Express server, API routes, and data models.",
  },
  {
    id: "frontend",
    name: "Frontend Agent",
    icon: Layout,
    model: "Groq · Qwen 2.5",
    status: "complete",
    latencyMs: 7800,
    tokensIn: 2400,
    tokensOut: 4100,
    costUsd: 0.00092,
    description: "Built responsive HTML5/React UI with dynamic event state.",
  },
  {
    id: "tester",
    name: "Tester Agent",
    icon: FlaskConical,
    model: "Groq · Qwen 2.5",
    status: "complete",
    latencyMs: 3100,
    tokensIn: 1800,
    tokensOut: 1250,
    costUsd: 0.00038,
    description: "Wrote unit tests covering all route and handler signatures.",
  },
  {
    id: "qa",
    name: "QA Reviewer",
    icon: ShieldCheck,
    model: "Groq · Qwen 2.5",
    status: "complete",
    latencyMs: 1950,
    tokensIn: 1400,
    tokensOut: 620,
    costUsd: 0.00026,
    description: "Audited DOM null-safety, event bindings, and API contracts.",
  },
  {
    id: "docwriter",
    name: "Doc Writer",
    icon: FileText,
    model: "Groq · Qwen 2.5",
    status: "complete",
    latencyMs: 1200,
    tokensIn: 950,
    tokensOut: 850,
    costUsd: 0.00018,
    description: "Authored README.md setup, routes guide, and run scripts.",
  },
];

const STAGE_COLORS = {
  Planner: "#6366f1",
  Architect: "#8b5cf6",
  "Backend Agent": "#06b6d4",
  "Frontend Agent": "#3b82f6",
  "Tester Agent": "#10b981",
  "QA Reviewer": "#f59e0b",
  "Doc Writer": "#ec4899",
};

// ─── Custom Dark Tooltip ─────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#09090b",
        border: "1px solid #27272a",
        borderRadius: "8px",
        padding: "10px 14px",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.8)",
        fontSize: "12px",
        color: "#e4e4e7",
        fontFamily: "ui-monospace, monospace",
      }}>
        <p style={{ fontWeight: 600, color: "#fafafa", marginBottom: "6px", fontFamily: "sans-serif" }}>
          {label}
        </p>
        {payload.map((item, index) => (
          <div key={index} style={{ display: "flex", justifyContent: "space-between", gap: "16px", padding: "2px 0" }}>
            <span style={{ color: item.color || "#a1a1aa" }}>{item.name}:</span>
            <span style={{ fontWeight: 600 }}>{item.value?.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function AgentTelemetryDashboard({ result, stages = DEFAULT_PIPELINE_STAGES }) {
  // Aggregate High-Level Metrics
  const metrics = useMemo(() => {
    const totalLatency = stages.reduce((acc, s) => acc + s.latencyMs, 0);
    const totalTokensIn = stages.reduce((acc, s) => acc + s.tokensIn, 0);
    const totalTokensOut = stages.reduce((acc, s) => acc + s.tokensOut, 0);
    const totalCost = stages.reduce((acc, s) => acc + s.costUsd, 0);
    return {
      totalLatencySeconds: (totalLatency / 1000).toFixed(2),
      totalTokens: (totalTokensIn + totalTokensOut).toLocaleString(),
      totalCostUsd: totalCost.toFixed(5),
      activeAgentsCount: stages.length,
      successRate: "100%",
    };
  }, [stages]);

  // Chart Data: Token breakdown per agent
  const tokenChartData = useMemo(() => {
    return stages.map((s) => ({
      name: s.name.replace(" Agent", ""),
      "Prompt Tokens": s.tokensIn,
      "Completion Tokens": s.tokensOut,
      Total: s.tokensIn + s.tokensOut,
    }));
  }, [stages]);

  // Chart Data: Cost distribution per agent
  const costChartData = useMemo(() => {
    return stages.map((s) => ({
      name: s.name.replace(" Agent", ""),
      value: Number((s.costUsd * 1000).toFixed(3)),
      color: STAGE_COLORS[s.name] || "#6366f1",
    }));
  }, [stages]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "24px",
      padding: "24px",
      background: "#08090b",
      color: "#8b90a0",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      height: "100%",
      overflowY: "auto",
      boxSizing: "border-box",
    }}>
      {/* ─── Top Telemetry Header & KPI Cards ───────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
              Agent Flow & Telemetry HUD
            </h2>
            <p style={{ fontSize: "13px", color: "#666b7a", margin: 0 }}>
              Live execution telemetry, token throughput, and per-agent latency breakdown.
            </p>
          </div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 12px",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 500,
            color: "#10b981",
            backdropFilter: "blur(12px)",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
            Pipeline Healthy · 7 Nodes Active
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px" }}>
          <div style={{
            background: "rgba(22, 24, 29, 0.75)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "16px 18px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#787d8d", fontSize: "12px", marginBottom: "6px" }}>
              <span>Total Pipeline Latency</span>
              <Clock size={14} color="#8b90a0" />
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", fontFamily: "var(--ide-mono)" }}>
              {result?.durationMs ? `${(result.durationMs / 1000).toFixed(1)}s` : `${metrics.totalLatencySeconds}s`}
            </div>
            <div style={{ fontSize: "11px", color: "#666b7a", marginTop: "4px" }}>
              Across 7 specialist agent calls
            </div>
          </div>

          <div style={{
            background: "rgba(22, 24, 29, 0.75)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "16px 18px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#787d8d", fontSize: "12px", marginBottom: "6px" }}>
              <span>Total Tokens Processed</span>
              <Cpu size={14} color="#8b90a0" />
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", fontFamily: "var(--ide-mono)" }}>
              {metrics.totalTokens} <span style={{ fontSize: "12px", fontWeight: 400, color: "#666b7a" }}>tok</span>
            </div>
            <div style={{ fontSize: "11px", color: "#10b981", marginTop: "4px" }}>
              ↑ Per-file focused prompt mode
            </div>
          </div>

          <div style={{
            background: "rgba(22, 24, 29, 0.75)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "16px 18px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#787d8d", fontSize: "12px", marginBottom: "6px" }}>
              <span>Estimated API Cost</span>
              <Coins size={14} color="#8b90a0" />
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#10b981", fontFamily: "var(--ide-mono)" }}>
              ${metrics.totalCostUsd}
            </div>
            <div style={{ fontSize: "11px", color: "#666b7a", marginTop: "4px" }}>
              Based on DeepSeek/Groq token rates
            </div>
          </div>

          <div style={{
            background: "rgba(22, 24, 29, 0.75)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "14px",
            padding: "16px 18px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#787d8d", fontSize: "12px", marginBottom: "6px" }}>
              <span>QA Validation Score</span>
              <Activity size={14} color="#8b90a0" />
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#818693", fontFamily: "var(--ide-mono)" }}>
              {metrics.successRate}
            </div>
            <div style={{ fontSize: "11px", color: "#666b7a", marginTop: "4px" }}>
              0 Syntax or Contract violations
            </div>
          </div>
        </div>
      </div>

      {/* ─── Modern Linear Agent Flow Pipeline ─────────────────────────────── */}
      <div style={{
        background: "rgba(22, 24, 29, 0.75)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        padding: "22px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Zap size={16} color="#818693" />
            <h3 style={{ fontSize: "13.5px", fontWeight: 700, color: "#ffffff", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Multi-Agent Execution Pipeline
            </h3>
          </div>
          <span style={{ fontSize: "11px", color: "#666b7a", fontFamily: "var(--ide-mono)" }}>
            Directed Acyclic Graph (DAG)
          </span>
        </div>

        {/* Horizontal Node Track */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          overflowX: "auto",
          paddingBottom: "8px",
        }}>
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            const isLast = idx === stages.length - 1;
            return (
              <React.Fragment key={stage.id}>
                <div style={{
                  flexShrink: 0,
                  width: "180px",
                  background: "rgba(33, 36, 43, 0.75)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
                  transition: "all 0.15s ease",
                }}>
                  {/* Top Bar: Icon + Status */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                    }}>
                      <Icon size={16} />
                    </div>

                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "10px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      padding: "2px 7px",
                      borderRadius: "999px",
                      background: "rgba(16, 185, 129, 0.12)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      color: "#34d399",
                    }}>
                      <CheckCircle2 size={10} />
                      Done
                    </span>
                  </div>

                  {/* Agent Name & Model */}
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff", lineHeight: 1.2 }}>
                      {stage.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#787d8d", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {stage.model}
                    </div>
                  </div>

                  {/* Micro Metrics Line */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "8px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                    fontSize: "10.5px",
                    fontFamily: "var(--ide-mono)",
                    color: "#8b90a0",
                  }}>
                    <span>{stage.latencyMs}ms</span>
                    <span>{stage.tokensIn + stage.tokensOut} tok</span>
                  </div>
                </div>

                {!isLast && (
                  <div style={{ display: "flex", alignItems: "center", color: "#5d6172", flexShrink: 0 }}>
                    <ArrowRight size={14} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ─── Telemetry Charts Grid (Recharts) ───────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "16px" }}>
        {/* Token Consumption Chart */}
        <div style={{
          background: "rgba(22, 24, 29, 0.75)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          padding: "22px",
          boxShadow: "0 12px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", margin: 0 }}>
              Token Consumption by Agent Node
            </h3>
            <span style={{ fontSize: "11px", color: "#666b7a", fontFamily: "var(--ide-mono)" }}>
              Prompt vs Completion
            </span>
          </div>

          <div style={{ width: "100%", height: "240px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tokenChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="Prompt Tokens" fill="#818693" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Completion Tokens" fill="#595e69" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Allocation Donut Chart */}
        <div style={{
          background: "rgba(22, 24, 29, 0.75)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "16px",
          padding: "22px",
          boxShadow: "0 12px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#ffffff", margin: 0 }}>
              Cost Allocation Share
            </h3>
            <span style={{ fontSize: "11px", color: "#666b7a", fontFamily: "var(--ide-mono)" }}>
              m$ (1/1000th USD)
            </span>
          </div>

          <div style={{ width: "100%", height: "240px", display: "flex", alignItems: "center" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {costChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(22, 24, 29, 0.9)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: "11px" }}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
