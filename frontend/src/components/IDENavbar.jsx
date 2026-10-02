import { useCallback, useEffect, useState } from "react";
import { getAiEngineHealth } from "../services/api";
import UserProfileBadge from "./auth/UserProfileBadge";
import "../styles/ide.css";

export default function IDENavbar({ activeProject, result, onOpenHistory }) {
  const [health, setHealth] = useState(null);

  const checkHealth = useCallback(async () => {
    try {
      const h = await getAiEngineHealth();
      setHealth(h);
    } catch {
      setHealth(null);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const t = setInterval(checkHealth, 30000);
    return () => clearInterval(t);
  }, [checkHealth]);

  const isLive = health?.data?.aiEngine?.reachable;
  const llm = health?.data?.aiEngine?.data?.llm;
  const modelLabel = llm?.model ? `${llm.provider} · ${llm.model}` : null;

  return (
    <header className="ide-navbar">
      <div className="ide-navbar__window-dots">
        <div className="ide-navbar__dot" />
        <div className="ide-navbar__dot" />
        <div className="ide-navbar__dot" />
      </div>

      <div className="ide-navbar__logo">
        <div className="ide-navbar__logo-icon">⬡</div>
        <span>Multi-Agent AI</span>
      </div>

      <div className="ide-navbar__divider" />

      {activeProject ? (
        <div className="ide-navbar__project">
          <span style={{ color: "var(--ide-text-muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>project</span>
          <span className="ide-navbar__project-name">{activeProject}</span>
          {result?.tech_stack && (
            <span className="ide-badge" style={{ fontSize: "10px" }}>{result.tech_stack}</span>
          )}
        </div>
      ) : (
        <span style={{ fontSize: "12.5px", color: "var(--ide-text-muted)" }}>No project open</span>
      )}

      <div className="ide-navbar__spacer" />

      <div className="ide-navbar__badges">
        {onOpenHistory && (
          <button
            type="button"
            className="ide-btn ide-btn--ghost ide-btn--sm"
            onClick={onOpenHistory}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              padding: "5px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              cursor: "pointer",
            }}
            title="Open your generation history (Ctrl+H)"
          >
            <span>📜</span>
            <span style={{ fontWeight: 600 }}>My History</span>
          </button>
        )}

        {modelLabel && (
          <span className="ide-badge">
            <span style={{ opacity: 0.85 }}>🤖</span> {modelLabel}
          </span>
        )}
        <span className="ide-badge">
          <span className={`ide-badge__dot ide-badge__dot--${isLive ? "green" : isLive === false ? "red" : "amber"}`} />
          {isLive ? "Connected" : isLive === false ? "Disconnected" : "Checking…"}
        </span>

        <UserProfileBadge />
      </div>
    </header>
  );
}
