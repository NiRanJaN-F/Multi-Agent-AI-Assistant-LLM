import { useState, useRef } from "react";
import { generateProject, refineProject } from "../services/api";

const AGENT_STEPS = [
  { key: "planner", label: "Planner", icon: "🧠" },
  { key: "architect", label: "Architect", icon: "📐" },
  { key: "backend", label: "Backend", icon: "⚙️" },
  { key: "frontend", label: "Frontend", icon: "🎨" },
  { key: "tester", label: "Tester", icon: "🧪" },
  { key: "qa", label: "QA Review", icon: "✅" },
  { key: "docwriter", label: "Doc Writer", icon: "📝" },
];

function buildStepStates() {
  return AGENT_STEPS.map((s) => ({ ...s, status: "pending", log: "", duration: null }));
}

function mapLogsToSteps(logs) {
  if (!Array.isArray(logs) || logs.length === 0) return null;
  const steps = buildStepStates();
  const logTexts = logs.map((l) => (typeof l === "string" ? l.toLowerCase() : (l.message || "").toLowerCase()));

  const keywords = {
    planner: ["plan", "planner", "planning", "requirement"],
    architect: ["architect", "architecture", "structure", "contract"],
    backend: ["backend", "server-side", "express", "fastapi", "routes", "server"],
    frontend: ["frontend", "client-side", "html", "css", "javascript", "react"],
    tester: ["test", "tester", "unit test", "test suite"],
    qa: ["qa", "review", "quality", "interactivity", "issues"],
    docwriter: ["doc", "readme", "documentation"],
  };

  let lastMatchedIndex = -1;
  steps.forEach((step, si) => {
    const matchingLogs = logTexts.filter((lt) => keywords[step.key]?.some((kw) => lt.includes(kw)));
    if (matchingLogs.length > 0) {
      step.status = "done";
      step.log = logs.find((l) => {
        const lt = (typeof l === "string" ? l : l.message || "").toLowerCase();
        return keywords[step.key]?.some((kw) => lt.includes(kw));
      }) || "";
      if (typeof step.log !== "string") step.log = step.log.message || "";
      lastMatchedIndex = si;
    }
  });

  return steps;
}

export default function useGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [stepStates, setStepStates] = useState(buildStepStates);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const intervalRef = useRef(null);

  function startProgressSim() {
    setStepStates(buildStepStates());
    setActiveStepIndex(0);
    let idx = 0;
    intervalRef.current = setInterval(() => {
      idx = Math.min(idx + 1, AGENT_STEPS.length - 1);
      setActiveStepIndex(idx);
      setStepStates((prev) =>
        prev.map((s, i) => ({
          ...s,
          status: i < idx ? "done" : i === idx ? "running" : "pending",
        }))
      );
    }, 4500);
  }

  function stopProgressSim(logs) {
    clearInterval(intervalRef.current);
    const mapped = logs ? mapLogsToSteps(logs) : null;
    if (mapped) {
      setStepStates(mapped);
    } else {
      setStepStates((prev) => prev.map((s) => ({ ...s, status: "done" })));
    }
    setActiveStepIndex(AGENT_STEPS.length - 1);
  }

  async function generate({ prompt, projectName, provider }) {
    setLoading(true);
    setError(null);
    setResult(null);
    startProgressSim();

    try {
      const data = await generateProject({ prompt, projectName, provider });
      stopProgressSim(data.logs);
      setResult(data);
      setActiveProject(data.project_name);
      return data;
    } catch (err) {
      setError(err.message || "Generation failed");
      setStepStates((prev) => prev.map((s, i) => (s.status === "running" ? { ...s, status: "failed" } : s)));
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function refine({ prompt, provider }) {
    if (!activeProject) throw new Error("No active project to refine");
    setLoading(true);
    setError(null);
    startProgressSim();

    try {
      const data = await refineProject({ prompt, projectName: activeProject, provider });
      stopProgressSim(data.logs);
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message || "Refinement failed");
      setStepStates((prev) => prev.map((s) => (s.status === "running" ? { ...s, status: "failed" } : s)));
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setActiveProject(null);
    setError(null);
    setStepStates(buildStepStates());
    setActiveStepIndex(0);
  }

  return {
    loading,
    error,
    result,
    activeProject,
    stepStates,
    activeStepIndex,
    generate,
    refine,
    reset,
    AGENT_STEPS,
  };
}
