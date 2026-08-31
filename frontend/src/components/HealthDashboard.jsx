import { useCallback, useEffect, useState } from "react";
import {
  getAiEngineHealth,
  getBackendHealth,
  getBackendStatus,
} from "../services/api";

function StatusBadge({ label, value, tone = "neutral" }) {
  return (
    <div className={`status-badge status-badge--${tone}`}>
      <span className="status-badge__label">{label}</span>
      <span className="status-badge__value">{value ?? "—"}</span>
    </div>
  );
}

export default function HealthDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendHealth, setBackendHealth] = useState(null);
  const [backendStatus, setBackendStatus] = useState(null);
  const [aiHealth, setAiHealth] = useState(null);

  const loadHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [health, status, ai] = await Promise.all([
        getBackendHealth(),
        getBackendStatus(),
        getAiEngineHealth(),
      ]);

      setBackendHealth(health);
      setBackendStatus(status);
      setAiHealth(ai);
    } catch (err) {
      setError(err.message || "Failed to load health data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  const dbStatus = backendStatus?.data?.database?.status ?? "unknown";
  const aiReachable = aiHealth?.data?.aiEngine?.reachable;
  const aiStatus = aiReachable ? "connected" : "unreachable";

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>System Health</h2>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={loadHealth}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <p className="app__error">{error}</p>}

      <div className="cards">
        <article className="card">
          <h3>Backend API</h3>
          <StatusBadge
            label="Health"
            value={backendHealth?.data?.status}
            tone={backendHealth?.ok ? "ok" : "error"}
          />
          <StatusBadge
            label="Environment"
            value={backendStatus?.data?.environment}
          />
          <StatusBadge
            label="Uptime (s)"
            value={backendStatus?.data?.uptimeSeconds}
          />
        </article>

        <article className="card">
          <h3>MongoDB</h3>
          <StatusBadge
            label="Connection"
            value={dbStatus}
            tone={dbStatus === "connected" ? "ok" : "warn"}
          />
          <StatusBadge
            label="Database"
            value={backendStatus?.data?.database?.name}
          />
          <StatusBadge
            label="Host"
            value={backendStatus?.data?.database?.host}
          />
        </article>

        <article className="card">
          <h3>AI Engine</h3>
          <StatusBadge
            label="Proxy status"
            value={aiHealth?.data?.status}
            tone={aiReachable ? "ok" : "error"}
          />
          <StatusBadge label="Reachable" value={aiReachable ? "yes" : "no"} />
          <StatusBadge
            label="Engine service"
            value={aiHealth?.data?.aiEngine?.data?.service}
          />
          <StatusBadge
            label="Connection"
            value={aiStatus}
            tone={aiReachable ? "ok" : "error"}
          />
        </article>
      </div>
    </section>
  );
}
