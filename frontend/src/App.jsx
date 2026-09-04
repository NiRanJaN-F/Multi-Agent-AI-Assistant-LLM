import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./components/auth/LoginPage";
import IDENavbar from "./components/IDENavbar";
import CommandCenter from "./components/CommandCenter";
import DevWorkspace from "./components/DevWorkspace";
import useGeneration from "./hooks/useGeneration";
import "./styles/ide.css";

function MainIDE() {
  const {
    loading,
    error,
    result,
    activeProject,
    stepStates,
    generate,
    refine,
    reset,
  } = useGeneration();

  return (
    <div className="ide-shell">
      <IDENavbar activeProject={activeProject} result={result} />

      {error && (
        <div style={{
          padding: "8px 16px",
          background: "rgba(239,68,68,0.12)",
          borderBottom: "1px solid rgba(239,68,68,0.3)",
          color: "#fca5a5",
          fontSize: "13px",
          flexShrink: 0,
        }}>
          ⚠ {error}
        </div>
      )}

      <div className="ide-body">
        <CommandCenter
          stepStates={stepStates}
          loading={loading}
          activeProject={activeProject}
          result={result}
          onGenerate={generate}
          onRefine={refine}
          onReset={reset}
        />
        <DevWorkspace
          result={result}
          activeProject={activeProject}
          onReset={reset}
        />
      </div>
    </div>
  );
}

function AuthGate() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#090a0f",
        color: "#8b8fa8",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div style={{
          width: "36px",
          height: "36px",
          border: "3px solid #232635",
          borderTopColor: "#6366f1",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          marginBottom: "16px",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: "13px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Authenticating Session…
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <MainIDE />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

