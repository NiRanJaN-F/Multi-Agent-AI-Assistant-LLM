import { useCallback, useEffect, useState } from "react";
import { getAiEngineHealth, getBackendHealth, getBackendStatus, verifyLlmConnection } from "../../services/api";

function InfoCard({ rows }) {
  return (
    <div className="ide-info-card">
      {rows.map((r) => (
        <div key={r.label} className="ide-info-card__row">
          <span className="ide-info-card__label">{r.label}</span>
          <span className={`ide-info-card__value ${r.tone ? `ide-info-card__value--${r.tone}` : ""}`}>
            {r.value ?? "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ActionsPanel({ result, activeProject, onReset }) {
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const [bh, bs, ai] = await Promise.all([getBackendHealth(), getBackendStatus(), getAiEngineHealth()]);
      setHealth({ backend: bh, status: bs, ai });
    } catch { setHealth(null); }
    finally { setHealthLoading(false); }
  }, []);

  useEffect(() => { loadHealth(); }, [loadHealth]);

  async function handleVerify() {
    setVerifying(true);
    setVerifyResult(null);
    try { setVerifyResult(await verifyLlmConnection()); }
    catch (e) { setVerifyResult({ error: e.message }); }
    finally { setVerifying(false); }
  }

  function handleSync() {
    setSyncMsg("Run sync-now.bat in your project folder to sync files from Docker container to Windows.");
    setTimeout(() => setSyncMsg(null), 5000);
  }

  const outputDir = result?.output_dir;
  const llm = health?.ai?.data?.aiEngine?.data?.llm;
  const aiReachable = health?.ai?.data?.aiEngine?.reachable;
  const dbStatus = health?.status?.data?.database?.status ?? "unknown";

  return (
    <div className="ide-actions ide-scroll">
      {/* Quick Actions */}
      <div>
        <div className="ide-actions__section-title">Project Actions</div>
        <div className="ide-action-grid">
          <button
            type="button"
            className="ide-action-card"
            disabled={!activeProject}
            onClick={() => {
              if (outputDir) {
                setSyncMsg(`Project saved at: ${outputDir}`);
                setTimeout(() => setSyncMsg(null), 5000);
              }
            }}
          >
            <div className="ide-action-card__icon">📂</div>
            <div className="ide-action-card__name">Open Folder</div>
            <div className="ide-action-card__desc">Show project output directory path</div>
          </button>

          <button type="button" className="ide-action-card" disabled={!activeProject} onClick={handleSync}>
            <div className="ide-action-card__icon">🔄</div>
            <div className="ide-action-card__name">Sync Now</div>
            <div className="ide-action-card__desc">Copy project from Docker to Windows host</div>
          </button>

          <button type="button" className="ide-action-card" onClick={onReset} disabled={!activeProject}>
            <div className="ide-action-card__icon">✨</div>
            <div className="ide-action-card__name">New Project</div>
            <div className="ide-action-card__desc">Start fresh with a new prompt</div>
          </button>

          <button type="button" className="ide-action-card" onClick={handleVerify} disabled={verifying}>
            <div className="ide-action-card__icon">🔌</div>
            <div className="ide-action-card__name">{verifying ? "Verifying…" : "Test LLM"}</div>
            <div className="ide-action-card__desc">Verify live LLM connection</div>
          </button>
        </div>

        {syncMsg && (
          <div style={{ marginTop: "10px", padding: "10px 14px", background: "var(--ide-surface)", border: "1px solid var(--ide-border)", borderRadius: "var(--ide-radius-sm)", fontSize: "12px", fontFamily: "var(--ide-mono)", color: "var(--ide-text)", wordBreak: "break-all" }}>
            {syncMsg}
          </div>
        )}
        {verifyResult && (
          <div style={{ marginTop: "10px" }}>
            <InfoCard rows={[
              { label: "LLM Reachable", value: verifyResult.error ? "Error" : verifyResult.reachable ? "Yes" : "No", tone: verifyResult.reachable ? "green" : "red" },
              { label: "Latency", value: verifyResult.latency_ms ? `${verifyResult.latency_ms}ms` : null },
              { label: "Sample", value: verifyResult.sample || verifyResult.error || null },
            ]} />
          </div>
        )}
      </div>

      {/* Project Info */}
      {result && (
        <div>
          <div className="ide-actions__section-title">Project Info</div>
          <InfoCard rows={[
            { label: "Project Name", value: result.project_name || result.projectName },
            { label: "Tech Stack", value: result.tech_stack || result.techStack },
            { label: "Mode", value: result.mode },
            { label: "Status", value: result.status, tone: result.status === "completed" ? "green" : "amber" },
            { label: "Duration", value: result.durationMs ? `${(result.durationMs / 1000).toFixed(1)}s` : null },
            { label: "LLM Provider", value: result.llm?.provider },
            { label: "Model", value: result.llm?.model },
            { label: "LLM Mode", value: result.llm?.mode, tone: result.llm?.mode === "live" ? "green" : "amber" },
            { label: "Files Generated", value: (result.saved_files || result.savedFiles || []).length || null },
            { label: "Output Dir", value: outputDir },
          ].filter((r) => r.value != null)} />
        </div>
      )}

      {/* System Health */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <div className="ide-actions__section-title" style={{ margin: 0 }}>System Health</div>
          <button className="ide-btn ide-btn--ghost ide-btn--sm" onClick={loadHealth} disabled={healthLoading} type="button">
            {healthLoading ? "…" : "Refresh"}
          </button>
        </div>
        <div className="ide-health-grid">
          <div className="ide-health-card">
            <div className="ide-health-card__title">Backend API</div>
            <div className="ide-health-row"><span className="ide-health-row__label">Status</span><span className={`ide-health-row__value ide-health-row__value--${health?.backend?.ok ? "green" : "red"}`}>{health?.backend?.data?.status ?? "—"}</span></div>
            <div className="ide-health-row"><span className="ide-health-row__label">Uptime</span><span className="ide-health-row__value">{health?.status?.data?.uptimeSeconds ? `${health.status.data.uptimeSeconds}s` : "—"}</span></div>
          </div>
          <div className="ide-health-card">
            <div className="ide-health-card__title">MongoDB</div>
            <div className="ide-health-row"><span className="ide-health-row__label">Status</span><span className={`ide-health-row__value ide-health-row__value--${dbStatus === "connected" ? "green" : "amber"}`}>{dbStatus}</span></div>
            <div className="ide-health-row"><span className="ide-health-row__label">DB</span><span className="ide-health-row__value">{health?.status?.data?.database?.name ?? "—"}</span></div>
          </div>
          <div className="ide-health-card">
            <div className="ide-health-card__title">AI Engine</div>
            <div className="ide-health-row"><span className="ide-health-row__label">Reachable</span><span className={`ide-health-row__value ide-health-row__value--${aiReachable ? "green" : "red"}`}>{aiReachable ? "Yes" : "No"}</span></div>
            <div className="ide-health-row"><span className="ide-health-row__label">Service</span><span className="ide-health-row__value">{health?.ai?.data?.aiEngine?.data?.service ?? "—"}</span></div>
          </div>
          <div className="ide-health-card">
            <div className="ide-health-card__title">LLM</div>
            <div className="ide-health-row"><span className="ide-health-row__label">Mode</span><span className={`ide-health-row__value ide-health-row__value--${llm?.mode === "live" ? "green" : "amber"}`}>{llm?.mode ?? "—"}</span></div>
            <div className="ide-health-row"><span className="ide-health-row__label">Provider</span><span className="ide-health-row__value">{llm?.provider ?? "—"}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
