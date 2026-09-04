import { useCallback, useEffect, useState } from "react";
import { getAiEngineHealth } from "../services/api";
import UserProfileBadge from "./auth/UserProfileBadge";
import "../styles/ide.css";

export default function IDENavbar({ activeProject, result }) {
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
      <div className="ide-navbar__logo">
        <div className="ide-navbar__logo-icon">⬡</div>
        Multi-Agent AI
      </div>

      <div className="ide-navbar__divider" />

      {activeProject ? (
        <div className="ide-navbar__project">
          <span style={{ color: "var(--ide-text-muted)", fontSize: "11px" }}>project</span>
          <span className="ide-navbar__project-name">{activeProject}</span>
          {result?.tech_stack && (
            <span className="ide-badge" style={{ fontSize: "10px" }}>{result.tech_stack}</span>
          )}
        </div>
      ) : (
        <span style={{ fontSize: "13px", color: "var(--ide-text-muted)" }}>No project open</span>
      )}

      <div className="ide-navbar__spacer" />

      <div className="ide-navbar__badges">
        {modelLabel && (
          <span className="ide-badge">
            🤖 {modelLabel}
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
