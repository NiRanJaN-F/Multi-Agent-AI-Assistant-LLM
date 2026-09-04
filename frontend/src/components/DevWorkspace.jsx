import { useState } from "react";
import PreviewPanel from "./workspace/PreviewPanel";
import FileExplorer from "./workspace/FileExplorer";
import TestPanel from "./workspace/TestPanel";
import ActionsPanel from "./workspace/ActionsPanel";
import AgentTelemetryDashboard from "./AgentTelemetryDashboard";

const TABS = [
  { id: "preview",   label: "Preview",   icon: "🌐" },
  { id: "telemetry", label: "Telemetry", icon: "📊" },
  { id: "files",     label: "Files",     icon: "📁" },
  { id: "tests",     label: "Tests",     icon: "🧪" },
  { id: "actions",   label: "Actions",   icon: "⚡" },
];

export default function DevWorkspace({ result, activeProject, onReset }) {
  const [activeTab, setActiveTab] = useState("preview");

  const savedFiles = result?.saved_files || result?.savedFiles || [];
  const testCount  = (result?.logs || []).filter((l) => {
    const t = (typeof l === "string" ? l : l.message || "").toLowerCase();
    return t.includes("test") || t.includes("qa");
  }).length;

  return (
    <section className="ide-right">
      <div className="ide-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`ide-tab ${activeTab === tab.id ? "ide-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
            {tab.id === "files" && savedFiles.length > 0 && (
              <span className="ide-tab__badge">{savedFiles.length}</span>
            )}
            {tab.id === "tests" && testCount > 0 && (
              <span className="ide-tab__badge">{testCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="ide-workspace">
        {activeTab === "preview" && (
          <PreviewPanel result={result} projectName={activeProject} />
        )}
        {activeTab === "telemetry" && (
          <AgentTelemetryDashboard result={result} />
        )}
        {activeTab === "files" && (
          <FileExplorer result={result} projectName={activeProject} />
        )}
        {activeTab === "tests" && (
          <TestPanel result={result} />
        )}
        {activeTab === "actions" && (
          <ActionsPanel result={result} activeProject={activeProject} onReset={onReset} />
        )}
      </div>
    </section>
  );
}

