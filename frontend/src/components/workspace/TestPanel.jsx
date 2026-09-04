export default function TestPanel({ result }) {
  if (!result) {
    return (
      <div className="ide-tests">
        <div className="ide-empty">
          <div className="ide-empty__icon">🧪</div>
          <div className="ide-empty__title">No Tests Yet</div>
          <div className="ide-empty__sub">Generate a project to see the TesterAgent and QA results here.</div>
        </div>
      </div>
    );
  }

  const logs = result.logs || [];
  const reviewResults = result.review_results || result.reviewResults;
  const savedFiles = result.saved_files || result.savedFiles || [];

  // Build test items from logs + review
  const testItems = [];

  // From agent logs
  const agentKeywords = [
    { key: "plan", label: "Planning Stage", icon: "🧠" },
    { key: "architect", label: "Architecture Contract", icon: "📐" },
    { key: "backend", label: "Backend Code Generation", icon: "⚙️" },
    { key: "frontend", label: "Frontend Code Generation", icon: "🎨" },
    { key: "test", label: "Test Suite Generation", icon: "🧪" },
    { key: "review", label: "QA Review", icon: "✅" },
    { key: "doc", label: "Documentation", icon: "📝" },
  ];

  for (const kw of agentKeywords) {
    const matchLog = logs.find((l) => {
      const text = (typeof l === "string" ? l : l.message || "").toLowerCase();
      return text.includes(kw.key);
    });
    if (matchLog) {
      const text = typeof matchLog === "string" ? matchLog : matchLog.message || "";
      testItems.push({ label: kw.label, detail: text, icon: kw.icon, pass: true });
    }
  }

  // QA issues
  const qaIssues = reviewResults?.issues || [];
  if (qaIssues.length > 0) {
    for (const issue of qaIssues) {
      testItems.push({ label: "QA Issue Found", detail: issue, icon: "⚠️", pass: false });
    }
  }

  // Check for test file
  const hasTestFile = savedFiles.some((f) => f.includes("test") || f.includes("spec"));
  if (hasTestFile) {
    testItems.push({ label: "Test File Generated", detail: savedFiles.find((f) => f.includes("test") || f.includes("spec")), icon: "🧪", pass: true });
  }

  const passCount = testItems.filter((t) => t.pass).length;
  const total = testItems.length;
  const allPass = qaIssues.length === 0;

  return (
    <div className="ide-tests ide-scroll">
      {total > 0 && (
        <div className="ide-tests__summary">
          <div className={`ide-tests__score ide-tests__score--${allPass ? "pass" : "fail"}`}>
            {passCount}/{total}
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ide-text-strong)", marginBottom: "2px" }}>
              {allPass ? "All checks passed" : `${qaIssues.length} issue${qaIssues.length !== 1 ? "s" : ""} found`}
            </div>
            <div className="ide-tests__label">
              Agent pipeline · {result.tech_stack || "Web App"} · {result.durationMs ? `${(result.durationMs / 1000).toFixed(1)}s` : ""}
            </div>
          </div>
        </div>
      )}

      <div className="ide-test-list">
        {testItems.map((item, i) => (
          <div key={i} className={`ide-test-item ide-test-item--${item.pass ? "pass" : "fail"}`}>
            <div className="ide-test-item__icon">{item.icon}</div>
            <div>
              <div className="ide-test-item__name">{item.label}</div>
              {item.detail && <div className="ide-test-item__detail">{item.detail}</div>}
            </div>
          </div>
        ))}

        {testItems.length === 0 && (
          <div className="ide-empty">
            <div className="ide-empty__icon">🔍</div>
            <div className="ide-empty__title">No Test Data</div>
            <div className="ide-empty__sub">No agent log data available for this generation.</div>
          </div>
        )}
      </div>
    </div>
  );
}
