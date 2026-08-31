import { useState } from "react";
import { generateProject } from "../services/api";

const EXAMPLE_PROMPT =
  "Build a simple todo list web app with add, complete, and delete tasks.";

export default function AgentGenerator() {
  const [prompt, setPrompt] = useState("");
  const [projectName, setProjectName] = useState("");
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await generateProject({
        prompt,
        projectName: projectName || undefined,
        provider: provider || undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2>Multi-Agent Generator</h2>
          <p className="panel__subtitle">
            Planner → Architect → Coder → Tester → QA → Doc Writer
          </p>
        </div>
      </div>

      <form className="generator-form" onSubmit={handleSubmit}>
        <label className="form-field">
          <span>Software requirement</span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={EXAMPLE_PROMPT}
            rows={5}
            required
            disabled={loading}
          />
        </label>

        <div className="form-row">
          <label className="form-field">
            <span>Project name (optional)</span>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="my-todo-app"
              disabled={loading}
            />
          </label>

          <label className="form-field">
            <span>LLM provider (optional)</span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              disabled={loading}
            >
              <option value="">Default (from .env)</option>
              <option value="gemini">Gemini</option>
              <option value="openai">OpenAI</option>
            </select>
          </label>
        </div>

        <button type="submit" className="btn btn--primary" disabled={loading}>
          {loading ? "Running agents…" : "Generate project"}
        </button>
      </form>

      {error && <p className="app__error">{error}</p>}

      {result && (
        <div className="result">
          <div className="result__summary">
            <StatusPill
              label="Status"
              value={result.status}
              tone={result.status === "ok" || result.status === "completed" ? "ok" : "warn"}
            />
            <StatusPill label="Project" value={result.project_name} />
            <StatusPill label="Tech stack" value={result.tech_stack} />
            <StatusPill label="Output" value={result.output_dir} />
          </div>

          {result.tasks?.length > 0 && (
            <div className="result__block">
              <h3>Requirement analysis (Planner)</h3>
              <ul>
                {result.tasks.map((task) => (
                  <li key={task}>{task}</li>
                ))}
              </ul>
            </div>
          )}

          {result.saved_files?.length > 0 && (
            <div className="result__block">
              <h3>Generated files</h3>
              <ul className="file-list">
                {result.saved_files.map((file) => (
                  <li key={file}>
                    <code>{file}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.review_results && (
            <div className="result__block">
              <h3>QA review</h3>
              <StatusPill
                label="Passed"
                value={result.review_results.passed ? "yes" : "no"}
                tone={result.review_results.passed ? "ok" : "warn"}
              />
              {result.review_results.issues?.length > 0 && (
                <ul>
                  {result.review_results.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {result.logs?.length > 0 && (
            <div className="result__block">
              <h3>Agent execution log</h3>
              <div className="log-list">
                {result.logs.map((entry, index) => (
                  <div key={`${entry.agent}-${entry.timestamp}-${index}`} className="log-entry">
                    <span className={`log-entry__status log-entry__status--${entry.status}`}>
                      {entry.status}
                    </span>
                    <strong>{entry.agent}</strong>
                    <span>{entry.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.documentation && (
            <div className="result__block">
              <h3>Documentation preview</h3>
              <pre className="doc-preview">{result.documentation}</pre>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function StatusPill({ label, value, tone = "neutral" }) {
  return (
    <div className={`status-pill status-pill--${tone}`}>
      <span>{label}</span>
      <strong>{value ?? "—"}</strong>
    </div>
  );
}
