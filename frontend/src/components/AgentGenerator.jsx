import { useState } from "react";
import { generateProject } from "../services/api";
import GenerationResult from "./GenerationResult";

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

      {result && <GenerationResult result={result} />}
    </section>
  );
}
