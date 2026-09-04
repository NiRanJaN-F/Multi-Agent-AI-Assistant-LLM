import { useEffect, useRef, useState } from "react";
import { LLM_PROVIDERS } from "../constants/providers";
import { getGenerationHistory } from "../services/api";

const TEMPLATES = [
  { emoji: "🛒", label: "E-Commerce", prompt: "Build a full-stack e-commerce store with product listings, a shopping cart, and checkout flow using Express backend and interactive HTML/JS frontend." },
  { emoji: "📊", label: "Dashboard", prompt: "Build a React analytics dashboard with charts, KPI cards, data tables, and a responsive sidebar layout." },
  { emoji: "⚡", label: "FastAPI Service", prompt: "Build a FastAPI REST service with CRUD endpoints, Pydantic models, SQLite database, and auto-generated OpenAPI docs." },
  { emoji: "🚀", label: "Landing Page", prompt: "Build a modern SaaS landing page with hero section, features grid, testimonials, pricing table, and contact form with full CSS animations." },
  { emoji: "☁️", label: "SaaS App", prompt: "Build a SaaS task management app with user authentication, team workspaces, kanban board, and real-time updates using Express + HTML/JS." },
];

const STATUS_ICONS = { pending: "○", running: "◉", done: "✓", failed: "✗" };

export default function CommandCenter({ stepStates, loading, activeProject, onGenerate, onRefine, onReset, result }) {
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
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  }

  function stepStatus(s) {
    return s.status || "pending";
  }

  return (
    <aside className="ide-left ide-scroll">
      {/* Templates */}
      <div className="ide-templates-section">
        <div className="ide-left__label">Quick Templates</div>
        <div className="ide-templates">
          {TEMPLATES.map((t) => (
            <button key={t.label} className="ide-template-chip" onClick={() => handleTemplate(t)} type="button">
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt */}
      <form className="ide-prompt-area" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="ide-textarea ide-scroll"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activeProject ? `Refine "${activeProject}" — e.g. add dark mode, add search filter…` : "Describe the application you want to build…"}
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
          <button type="submit" className="ide-btn ide-btn--primary" disabled={loading || !prompt.trim()} style={{ flex: 1 }}>
            {loading ? "⟳ Agents running…" : activeProject ? "✦ Apply Change" : "✦ Generate App"}
          </button>
          {activeProject && (
            <button type="button" className="ide-btn ide-btn--ghost" onClick={onReset} disabled={loading}>
              New
            </button>
          )}
        </div>
      </form>

      {/* Agent Stepper */}
      <div className="ide-stepper ide-scroll">
        <div className="ide-stepper__title">Agent Pipeline</div>
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

      {/* History */}
      {history.length > 0 && (
        <div className="ide-history ide-scroll">
          <div className="ide-history__header">
            <span className="ide-history__title">Recent Projects</span>
          </div>
          {history.map((item) => (
            <button
              key={item.id}
              type="button"
              className="ide-history-item"
              onClick={() => {}}
            >
              <span className="ide-history-item__name">{item.projectName}</span>
              <span className="ide-history-item__meta">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
