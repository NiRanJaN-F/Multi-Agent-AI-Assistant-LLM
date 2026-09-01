export function StatusPill({ label, value, tone = "neutral" }) {
  return (
    <div className={`status-pill status-pill--${tone}`}>
      <span>{label}</span>
      <strong>{value ?? "—"}</strong>
    </div>
  );
}

export default function GenerationResult({ result }) {
  if (!result) {
    return null;
  }

  const reviewResults = result.review_results ?? result.reviewResults;
  const savedFiles = result.saved_files ?? result.savedFiles;
  const projectName = result.project_name ?? result.projectName;
  const techStack = result.tech_stack ?? result.techStack;
  const outputDir = result.output_dir ?? result.outputDir;
  const changedFiles = result.changed_files ?? result.changedFiles ?? [];
  const isRefinement = result.mode === "refine";

  return (
    <div className="result">
      <div className="result__summary">
        <StatusPill
          label="Status"
          value={result.status}
          tone={result.status === "ok" || result.status === "completed" ? "ok" : "warn"}
        />
        <StatusPill label="Run" value={isRefinement ? "refinement" : "generation"} />
        <StatusPill label="Project" value={projectName} />
        <StatusPill label="Tech stack" value={techStack} />
        <StatusPill label="Output" value={outputDir} />
        <StatusPill
          label="LLM mode"
          value={result.llm?.mode}
          tone={result.llm?.mode === "live" ? "ok" : "warn"}
        />
        <StatusPill
          label="Model"
          value={result.llm?.model ? `${result.llm.provider}/${result.llm.model}` : "—"}
        />
        {result.durationMs != null && (
          <StatusPill label="Duration" value={`${(result.durationMs / 1000).toFixed(1)}s`} />
        )}
        {result.history && (
          <StatusPill
            label="History"
            value={result.history.persisted ? "saved to MongoDB" : "not saved"}
            tone={result.history.persisted ? "ok" : "warn"}
          />
        )}
      </div>

      {result.tasks?.length > 0 && (
        <div className="result__block">
          <h3>{isRefinement ? "Change plan" : "Requirement analysis (Planner)"}</h3>
          <ul>
            {result.tasks.map((task) => (
              <li key={task}>{task}</li>
            ))}
          </ul>
        </div>
      )}

      {isRefinement && changedFiles.length > 0 && (
        <div className="result__block">
          <h3>Files changed</h3>
          <ul className="file-list">
            {changedFiles.map((file) => (
              <li key={file}>
                <code>{file}</code>
              </li>
            ))}
          </ul>
        </div>
      )}

      {savedFiles?.length > 0 && (
        <div className="result__block">
          <h3>{isRefinement ? "Project files" : "Generated files"}</h3>
          <ul className="file-list">
            {savedFiles.map((file) => (
              <li key={file}>
                <code>{file}</code>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reviewResults && (
        <div className="result__block">
          <h3>QA review</h3>
          <StatusPill
            label="Passed"
            value={reviewResults.passed ? "yes" : "no"}
            tone={reviewResults.passed ? "ok" : "warn"}
          />
          {reviewResults.issues?.length > 0 && (
            <ul>
              {reviewResults.issues.map((issue) => (
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
  );
}
