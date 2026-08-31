import HealthDashboard from "./components/HealthDashboard";
import AgentGenerator from "./components/AgentGenerator";
import "./App.css";

function App() {
  return (
    <main className="app">
      <header className="app__header">
        <p className="app__eyebrow">Phase 2</p>
        <h1>Multi-Agent AI Assistant</h1>
        <p className="app__subtitle">
          LangGraph-powered software engineering assistant — generate projects from natural language requirements.
        </p>
      </header>

      <AgentGenerator />
      <HealthDashboard />

      <footer className="app__footer">
        <code>{import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}</code>
      </footer>
    </main>
  );
}

export default App;
