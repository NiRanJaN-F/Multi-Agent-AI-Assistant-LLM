import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteGeneration, downloadProjectZip, getGeneration, getGenerationHistory } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function HistoryDrawer({ isOpen, onClose, onSelectGeneration }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'generate' | 'refine'
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGenerationHistory({ limit: 50 });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || "Failed to load generation history");
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  // Handle ESC key to close drawer
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Filter by mode
      if (filterMode === "generate" && item.mode === "refine") return false;
      if (filterMode === "refine" && item.mode !== "refine") return false;

      // Filter by search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const pName = (item.projectName || "").toLowerCase();
      const prompt = (item.prompt || "").toLowerCase();
      const stack = (item.techStack || "").toLowerCase();
      const provider = (item.provider || item.llm?.provider || "").toLowerCase();

      return pName.includes(q) || prompt.includes(q) || stack.includes(q) || provider.includes(q);
    });
  }, [items, filterMode, searchQuery]);

  async function handleLoad(item) {
    setActionLoadingId(item.id);
    try {
      // Fetch full generation document if files are not present in summary list
      const fullGen = await getGeneration(item.id);
      onSelectGeneration(fullGen || item);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to load full project details");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDownload(e, projectName) {
    e.stopPropagation();
    try {
      await downloadProjectZip(projectName);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  }

  async function handleDelete(e, id, projectName) {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${projectName}" from your history?`)) {
      return;
    }

    try {
      await deleteGeneration(id);
      setItems((prev) => prev.filter((it) => it.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        justifyContent: "flex-end",
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "560px",
          maxWidth: "92vw",
          height: "100%",
          background: "rgba(18, 20, 26, 0.95)",
          borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(28px)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-12px 0 40px rgba(0,0,0,0.8)",
          color: "var(--ide-text, #8b90a0)",
          fontFamily: "var(--ide-font, -apple-system, sans-serif)",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>📜</span>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", margin: 0 }}>
                My Generations & History
              </h2>
            </div>
            <div style={{ fontSize: "12px", color: "var(--ide-text-muted, #5d6172)", marginTop: "4px" }}>
              User: <span style={{ color: "#e2e4f0", fontWeight: 600 }}>{user?.username || user?.email || "Authenticated User"}</span> · {total} saved {total === 1 ? "run" : "runs"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#ffffff",
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: "13px",
            }}
            title="Close Drawer (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            type="text"
            placeholder="🔍 Search by project name, prompt keywords, tech stack…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "9px 14px",
              background: "rgba(33, 36, 43, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#ffffff",
              fontSize: "13px",
              outline: "none",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                { id: "all", label: "All" },
                { id: "generate", label: "New Apps" },
                { id: "refine", label: "Refinements" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterMode(f.id)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "6px",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    border: filterMode === f.id ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.06)",
                    background: filterMode === f.id ? "rgba(255, 255, 255, 0.15)" : "transparent",
                    color: filterMode === f.id ? "#ffffff" : "#8b90a0",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={fetchHistory}
              disabled={loading}
              style={{
                background: "transparent",
                border: "none",
                color: "#818693",
                fontSize: "12px",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              {loading ? "Refreshing…" : "↻ Refresh"}
            </button>
          </div>
        </div>

        {/* List Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", color: "#fca5a5", fontSize: "12.5px" }}>
              ⚠ {error}
            </div>
          )}

          {loading && items.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#8b90a0", fontSize: "13px" }}>
              Loading your generation history…
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 20px", color: "#6b7280" }}>
              <div style={{ fontSize: "28px", marginBottom: "8px" }}>📁</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#9ca3af" }}>No generation history found</div>
              <div style={{ fontSize: "12px", marginTop: "4px" }}>
                {searchQuery ? "Try refining your search query." : "Generate or refine an application to see it recorded in your account history."}
              </div>
            </div>
          )}

          {filteredItems.map((item) => {
            const isRefine = item.mode === "refine";
            const isProcessingThis = actionLoadingId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  padding: "14px 16px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Header Row */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 700, fontSize: "14px", color: "#ffffff", fontFamily: "var(--ide-mono)" }}>
                        {item.projectName}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          background: isRefine ? "rgba(99, 102, 241, 0.15)" : "rgba(16, 185, 129, 0.15)",
                          color: isRefine ? "#818cf8" : "#34d399",
                          border: isRefine ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                        }}
                      >
                        {isRefine ? "Refinement" : "New App"}
                      </span>
                      {item.techStack && (
                        <span style={{ fontSize: "10.5px", color: "#9ca3af", background: "rgba(255,255,255,0.06)", padding: "1px 6px", borderRadius: "4px" }}>
                          {item.techStack}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "3px" }}>
                      {new Date(item.createdAt).toLocaleString()} · {item.durationMs ? `${(item.durationMs / 1000).toFixed(1)}s` : "0s"}
                      {item.provider ? ` · ${item.provider}` : ""}
                    </div>
                  </div>
                </div>

                {/* Prompt Preview */}
                <div
                  style={{
                    fontSize: "12px",
                    color: "#d1d5db",
                    lineHeight: "1.4",
                    background: "rgba(0, 0, 0, 0.25)",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    borderLeft: "2px solid rgba(255,255,255,0.2)",
                    whiteSpace: "pre-wrap",
                    maxHeight: "80px",
                    overflowY: "auto",
                  }}
                >
                  {item.prompt}
                </div>

                {/* Actions Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "4px" }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => handleLoad(item)}
                      disabled={isProcessingThis}
                      style={{
                        padding: "5px 12px",
                        background: "rgba(255, 255, 255, 0.12)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "6px",
                        color: "#ffffff",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                      title="Load this project and files into the active workspace editor"
                    >
                      <span>🚀</span>
                      <span>{isProcessingThis ? "Loading…" : "Open in Workspace"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDownload(e, item.projectName)}
                      style={{
                        padding: "5px 10px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "6px",
                        color: "#d1d5db",
                        fontSize: "11.5px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="Download as ZIP archive"
                    >
                      <span>📦</span>
                      <span>ZIP</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, item.id, item.projectName)}
                    style={{
                      padding: "5px 8px",
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      fontSize: "11.5px",
                      cursor: "pointer",
                      opacity: 0.8,
                    }}
                    title="Delete generation record"
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
