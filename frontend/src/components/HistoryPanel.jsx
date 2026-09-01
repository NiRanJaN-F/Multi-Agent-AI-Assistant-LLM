import { useCallback, useEffect, useState } from "react";
import { deleteGeneration, getGeneration, getGenerationHistory } from "../services/api";
import GenerationResult from "./GenerationResult";

export default function HistoryPanel({ refreshKey = 0 }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getGenerationHistory({ limit: 20 });
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setItems([]);
      setTotal(0);
      setError(err.message || "Generation history is unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, refreshKey]);

  async function handleSelect(id) {
    if (selected?.id === id) {
      setSelected(null);
      return;
    }

    try {
      setSelected(await getGeneration(id));
    } catch (err) {
      setError(err.message || "Failed to load generation");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteGeneration(id);
      if (selected?.id === id) {
        setSelected(null);
      }
      await loadHistory();
    } catch (err) {
      setError(err.message || "Failed to delete generation");
    }
  }

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2>Generation History</h2>
          <p className="panel__subtitle">
            {total > 0 ? `${total} run${total === 1 ? "" : "s"} stored in MongoDB` : "Runs persisted in MongoDB"}
          </p>
        </div>
        <button type="button" className="btn" onClick={loadHistory} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <p className="app__error">{error}</p>}

      {!error && items.length === 0 && !loading && (
        <p className="panel__subtitle">No generations recorded yet.</p>
      )}

      <ul className="history-list">
        {items.map((item) => (
          <li key={item.id} className="history-item">
            <button type="button" className="history-item__main" onClick={() => handleSelect(item.id)}>
              <strong>{item.projectName}</strong>
              <span className="history-item__prompt">{item.prompt}</span>
              <span className="history-item__meta">
                {new Date(item.createdAt).toLocaleString()} ·{" "}
                {item.mode === "refine" ? "refinement" : "generation"} · {item.llm?.mode ?? "unknown"} mode
                {item.durationMs ? ` · ${(item.durationMs / 1000).toFixed(1)}s` : ""}
              </span>
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => handleDelete(item.id)}
              aria-label={`Delete generation ${item.projectName}`}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {selected && <GenerationResult result={selected} />}
    </section>
  );
}
