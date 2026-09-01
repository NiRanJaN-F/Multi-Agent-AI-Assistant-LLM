import { useState } from "react";
import HealthDashboard from "./components/HealthDashboard";
import AgentGenerator from "./components/AgentGenerator";
import ChatWorkflow from "./components/ChatWorkflow";
import HistoryPanel from "./components/HistoryPanel";
import "./App.css";

const TABS = [
  { id: "chat", label: "Chat" },
  { id: "form", label: "Form" },
  { id: "history", label: "History" },
];

function App() {
  const [tab, setTab] = useState("chat");
  const [historyKey, setHistoryKey] = useState(0);

  return (
    <main className="app">
      <header className="app__header">
        <p className="app__eyebrow">Phase 4</p>
        <h1>Multi-Agent AI Assistant</h1>
        <p className="app__subtitle">
          Live LLM-powered software engineering — generate projects from natural language using Gemini or OpenAI.
        </p>
      </header>

      <nav className="tabs" aria-label="Workspace views">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tabs__button ${tab === item.id ? "tabs__button--active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "chat" && <ChatWorkflow onGenerated={() => setHistoryKey((key) => key + 1)} />}
      {tab === "form" && <AgentGenerator />}
      {tab === "history" && <HistoryPanel refreshKey={historyKey} />}

      <HealthDashboard />

      <footer className="app__footer">
        <code>{import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}</code>
      </footer>
    </main>
  );
}

export default App;
