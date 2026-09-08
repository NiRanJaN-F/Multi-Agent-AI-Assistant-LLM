import { useEffect, useRef, useState } from "react";
import { LLM_PROVIDERS } from "../constants/providers";
import { getGenerationHistory } from "../services/api";

const APP_TEMPLATES = [
  { emoji: "🛒", label: "E-Commerce", prompt: "Build a full-stack e-commerce store with product listings, a shopping cart, and checkout flow using Express backend and interactive HTML/JS frontend." },
  { emoji: "📊", label: "Dashboard", prompt: "Build a React analytics dashboard with charts, KPI cards, data tables, and a responsive sidebar layout." },
  { emoji: "⚡", label: "FastAPI Service", prompt: "Build a FastAPI REST service with CRUD endpoints, Pydantic models, SQLite database, and auto-generated OpenAPI docs." },
  { emoji: "🚀", label: "Landing Page", prompt: "Build a modern SaaS landing page with hero section, features grid, testimonials, pricing table, and contact form with full CSS animations." },
  { emoji: "☁️", label: "SaaS App", prompt: "Build a SaaS task management app with user authentication, team workspaces, kanban board, and real-time updates using Express + HTML/JS." },
];

const REFINE_TEMPLATES = [
  { emoji: "🌓", label: "Dark Mode", prompt: "Add a modern dark mode toggle button in the header with smooth transitions and persistent state in localStorage." },
  { emoji: "🔍", label: "Search & Filter", prompt: "Add a real-time search bar and category filter tabs with active state highlights." },
  { emoji: "📥", label: "Export JSON", prompt: "Add an 'Export Data' button that downloads the current dataset as a formatted JSON file." },
  { emoji: "🏷️", label: "Priority Tags", prompt: "Add priority level badges (High, Medium, Low) with distinct color badges and priority sorting." },
  { emoji: "✨", label: "Toast Alerts", prompt: "Add interactive toast feedback notifications for user actions with smooth slide-in animations." },
];

export default function CommandCenter({
  stepStates,
  loading,
  activeProject,
  onGenerate,
  onRefine,
  onLoadProject,
  onReset,
  result,
}) {
  const [prompt, setPrompt] = useState("");
  const [projectName, setProjectName] = useState("");
  const [provider, setProvider] = useState("");
  const [history, setHistory] = useState([]);
  const textareaRef = useRef(null);

  useEffect(() => {
    getGenerationHistory({ limit: 8 }).then((d) => setHistory(d.items ?? [])).catch(() => {});
  }, [result]);

  useEffect(() => {
    if (activeProject) setProjectName(activeProject);
  }, [activeProject]);

  function handleTemplate(tpl) {
    setPrompt(tpl.prompt);
    textareaRef.current?.focus();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    if (activeProject) {
      await onRefine({ prompt: prompt.trim(), provider: provider || undefined });
    } else {
      await onGenerate({ prompt: prompt.trim(), projectName: projectName.trim() || undefined, provider: provider || undefined });
    }
    setPrompt("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function stepStatus(s) {
    return s.status || "pending";
  }

  const templates = activeProject ? REFINE_TEMPLATES : APP_TEMPLATES;

  return (
    <aside className="ide-left ide-scroll">
      {/* Active Project Status Banner */}
      {activeProject && (
        <div style={{
          margin: "12px 14px 4px 14px",
          padding: "10px 12px",
          background: "rgba(99, 102, 241, 0.08)",
          border: "1px solid rgba(99, 102, 241, 0.25)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "12px",
        }}>
          <div>
            <div style={{ color: "#818cf8", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              ↻ Refining Project
            </div>
            <div style={{ color: "#f1f5f9", fontWeight: 500, marginTop: "2px" }}>
              {activeProject}
            </div>
          </div>
          <button
            type="button"
            className="ide-btn ide-btn--ghost ide-btn--sm"
            onClick={onReset}
            disabled={loading}
            style={{ fontSize: "11px", padding: "3px 8px" }}
            title="Start a new project from scratch"
          >
            New Project
          </button>
        </div>
      )}

      {/* Templates */}
      <div className="ide-templates-section">
        <div className="ide-left__label">
          {activeProject ? "Refinement Suggestions" : "Quick Templates"}
        </div>
        <div className="ide-templates">
          {templates.map((t) => (
            <button key={t.label} className="ide-template-chip" onClick={() => handleTemplate(t)} type="button">
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Area */}
      <form className="ide-prompt-area" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="ide-textarea ide-scroll"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            activeProject
              ? `Refine "${activeProject}" — e.g. add dark mode, add search filter, change styling…`
              : "Describe the application you want to build…"
          }
          disabled={loading}
          rows={5}
        />
        <div className="ide-prompt-row">
          <input
            className="ide-input"
            type="text"
            placeholder="Project name (optional)"
            value={activeProject ?? projectName}
            onChange={(e) => setProjectName(e.target.value)}
            disabled={loading || Boolean(activeProject)}
          />
          <select className="ide-select" value={provider} onChange={(e) => setProvider(e.target.value)} disabled={loading}>
            <option value="">Auto provider</option>
            {LLM_PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="submit"
            className={`ide-btn ${activeProject ? "ide-btn--success" : "ide-btn--primary"}`}
            disabled={loading || !prompt.trim()}
            style={{ flex: 1 }}
          >
            {loading ? "⟳ Agents running…" : activeProject ? "↻ Apply Change" : "✦ Generate App"}
          </button>
          {activeProject && (
            <button type="button" className="ide-btn ide-btn--ghost" onClick={onReset} disabled={loading}>
              Reset
            </button>
          )}
        </div>
      </form>

      {/* Agent Stepper */}
      <div className="ide-stepper ide-scroll">
        <div className="ide-stepper__title">
          {activeProject ? "Refinement Pipeline" : "Agent Pipeline"}
        </div>
        {stepStates.map((step, i) => {
          const status = stepStatus(step);
          const isLast = i === stepStates.length - 1;
          return (
            <div key={step.key} className="ide-step">
              <div className="ide-step__track">
                <div className={`ide-step__dot ide-step__dot--${status}`}>
                  {status === "done" ? "✓" : status === "failed" ? "✗" : status === "running" ? "◉" : i + 1}
                </div>
                {!isLast && <div className={`ide-step__line ide-step__line--${status === "done" ? "done" : status === "running" ? "running" : ""}`} />}
              </div>
              <div className="ide-step__content">
                <div className="ide-step__header">
                  <span style={{ marginRight: "4px" }}>{step.icon}</span>
                  <span className="ide-step__name">{step.label}</span>
                  <span className={`ide-step__status-badge ide-step__status-badge--${status}`}>
                    {status}
                  </span>
                </div>
                {step.log && (
                  <div className="ide-step__log">{step.log}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* History / Recent Projects */}
      {history.length > 0 && (
        <div className="ide-history ide-scroll">
          <div className="ide-history__header">
            <span className="ide-history__title">Recent Projects</span>
            <span style={{ fontSize: "10px", color: "var(--ide-text-muted)" }}>Click to load & refine</span>
          </div>
          {history.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ide-history-item ${activeProject === item.projectName ? "ide-history-item--active" : ""}`}
              onClick={() => onLoadProject?.(item.projectName)}
              disabled={loading}
              title={`Load "${item.projectName}" for refinement`}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}>
                <span className="ide-history-item__name">
                  {item.projectName}
                  {item.mode === "refine" && (
                    <span style={{ fontSize: "9px", marginLeft: "6px", color: "#818cf8", background: "rgba(99,102,241,0.15)", padding: "1px 4px", borderRadius: "3px" }}>
                      refined
                    </span>
                  )}
                </span>
                <span className="ide-history-item__meta">
                  {new Date(item.createdAt).toLocaleDateString()} · {item.techStack || "Web"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}

