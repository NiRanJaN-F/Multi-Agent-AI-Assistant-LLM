import { useCallback, useEffect, useState } from "react";
import {
  getAiEngineHealth,
  getBackendHealth,
  getBackendStatus,
} from "./services/api";
import "./App.css";

const initialState = {
  loading: true,
  error: null,
  backendHealth: null,
  backendStatus: null,
  aiHealth: null,
};

function StatusBadge({ label, value, tone = "neutral" }) {
  return (
    <div className={`status-badge status-badge--${tone}`}>
      <span className="status-badge__label">{label}</span>
      <span className="status-badge__value">{value ?? "—"}</span>
    </div>
  );
}

function App() {
  const [state, setState] = useState(initialState);

  const loadHealth = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [backendHealth, backendStatus, aiHealth] = await Promise.all([
        getBackendHealth(),
        getBackendStatus(),
        getAiEngineHealth(),
      ]);

      setState({
        loading: false,
        error: null,
        backendHealth,
        backendStatus,
        aiHealth,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Failed to load health data",
      }));
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const dbStatus = state.backendStatus?.data?.database?.status ?? "unknown";
  const aiReachable = state.aiHealth?.data?.aiEngine?.reachable;
  const aiStatus = aiReachable ? "connected" : "unreachable";

  return (
    <main className="app">
      <header className="app__header">
        <p className="app__eyebrow">Phase 1</p>
        <h1>Multi-Agent AI Assistant</h1>
        <p className="app__subtitle">
          System health dashboard — backend, database, and AI engine connectivity.
        </p>
        <button
          type="button"
          className="app__refresh"
          onClick={loadHealth}
          disabled={state.loading}
        >
          {state.loading ? "Refreshing…" : "Refresh status"}
        </button>
      </header>

      {state.error && <p className="app__error">{state.error}</p>}

      <section className="cards">
        <article className="card">
          <h2>Backend API</h2>
          <StatusBadge
            label="Health"
            value={state.backendHealth?.data?.status}
            tone={state.backendHealth?.ok ? "ok" : "error"}
          />
          <StatusBadge
            label="Environment"
            value={state.backendStatus?.data?.environment}
          />
          <StatusBadge
            label="Uptime (s)"
            value={state.backendStatus?.data?.uptimeSeconds}
          />
        </article>

        <article className="card">
          <h2>MongoDB</h2>
          <StatusBadge
            label="Connection"
            value={dbStatus}
            tone={dbStatus === "connected" ? "ok" : "warn"}
          />
          <StatusBadge
            label="Database"
            value={state.backendStatus?.data?.database?.name}
          />
          <StatusBadge
            label="Host"
            value={state.backendStatus?.data?.database?.host}
          />
        </article>

        <article className="card">
          <h2>AI Engine</h2>
          <StatusBadge
            label="Proxy status"
            value={state.aiHealth?.data?.status}
            tone={aiReachable ? "ok" : "error"}
          />
          <StatusBadge label="Reachable" value={aiReachable ? "yes" : "no"} />
          <StatusBadge
            label="Engine service"
            value={state.aiHealth?.data?.aiEngine?.data?.service}
          />
          <StatusBadge label="Connection" value={aiStatus} tone={aiReachable ? "ok" : "error"} />
        </article>
      </section>

      <footer className="app__footer">
        <code>{import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}</code>
      </footer>
    </main>
  );
}

export default App;
