import { useState, useRef } from "react";
import { generateProject, refineProject, getProjectFiles } from "../services/api";

const AGENT_STEPS = [
  { key: "planner", label: "Planner", icon: "🧠" },
  { key: "architect", label: "Architect", icon: "📐" },
  { key: "backend", label: "Backend", icon: "⚙️" },
  { key: "frontend", label: "Frontend", icon: "🎨" },
  { key: "tester", label: "Tester", icon: "🧪" },
  { key: "qa", label: "QA Review", icon: "✅" },
  { key: "docwriter", label: "Doc Writer", icon: "📝" },
];

const REFINE_STEPS = [
  { key: "refine_planner", label: "Change Planner", icon: "🧠" },
  { key: "coder", label: "Coder", icon: "⚡" },
  { key: "tester", label: "Tester", icon: "🧪" },
  { key: "qa", label: "QA Review", icon: "✅" },
  { key: "docwriter", label: "Doc Writer", icon: "📝" },
];

function buildStepStates(isRefine = false) {
  const steps = isRefine ? REFINE_STEPS : AGENT_STEPS;
  return steps.map((s) => ({ ...s, status: "pending", log: "", duration: null }));
}

function mapLogsToSteps(logs, isRefine = false) {
  if (!Array.isArray(logs) || logs.length === 0) return null;
  const steps = buildStepStates(isRefine);
  const logTexts = logs.map((l) => (typeof l === "string" ? l.toLowerCase() : (l.message || "").toLowerCase()));

  const keywords = isRefine
    ? {
        refine_planner: ["refineplanner", "change plan", "analysing the existing project", "plan"],
        coder: ["refinecoder", "editing the existing source", "updated", "coder"],
        tester: ["test", "tester", "unit test", "test suite"],
        qa: ["qa", "review", "quality", "interactivity", "issues"],
        docwriter: ["doc", "readme", "documentation"],
      }
    : {
        planner: ["plan", "planner", "planning", "requirement"],
        architect: ["architect", "architecture", "structure", "contract"],
        backend: ["backend", "server-side", "express", "fastapi", "routes", "server"],
        frontend: ["frontend", "client-side", "html", "css", "javascript", "react"],
        tester: ["test", "tester", "unit test", "test suite"],
        qa: ["qa", "review", "quality", "interactivity", "issues"],
        docwriter: ["doc", "readme", "documentation"],
      };

  steps.forEach((step) => {
    const matchingLogs = logTexts.filter((lt) => keywords[step.key]?.some((kw) => lt.includes(kw)));
    if (matchingLogs.length > 0) {
      step.status = "done";
      step.log = logs.find((l) => {
        const lt = (typeof l === "string" ? l : l.message || "").toLowerCase();
        return keywords[step.key]?.some((kw) => lt.includes(kw));
      }) || "";
      if (typeof step.log !== "string") step.log = step.log.message || "";
    }
  });

  return steps;
}

export default function useGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [stepStates, setStepStates] = useState(() => buildStepStates(false));
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const intervalRef = useRef(null);

  function startProgressSim(isRefine = false) {
    const steps = isRefine ? REFINE_STEPS : AGENT_STEPS;
    setStepStates(buildStepStates(isRefine));
    setActiveStepIndex(0);
    let idx = 0;
    intervalRef.current = setInterval(() => {
      idx = Math.min(idx + 1, steps.length - 1);
      setActiveStepIndex(idx);
      setStepStates((prev) =>
        prev.map((s, i) => ({
          ...s,
          status: i < idx ? "done" : i === idx ? "running" : "pending",
        }))
      );
    }, 4500);
  }

  function stopProgressSim(logs, isRefine = false) {
    clearInterval(intervalRef.current);
    const steps = isRefine ? REFINE_STEPS : AGENT_STEPS;
    const mapped = logs ? mapLogsToSteps(logs, isRefine) : null;
    if (mapped) {
      const finalized = mapped.map((s) => ({
        ...s,
        status: "done",
      }));
      setStepStates(finalized);
    } else {
      setStepStates((prev) => prev.map((s) => ({ ...s, status: "done" })));
    }
    setActiveStepIndex(steps.length - 1);
  }

  async function generate({ prompt, projectName, provider }) {
    setLoading(true);
    setError(null);
    setResult(null);
    startProgressSim(false);

    try {
      const data = await generateProject({ prompt, projectName, provider });
      stopProgressSim(data.logs, false);
      setResult(data);
      setActiveProject(data.project_name);
      return data;
    } catch (err) {
      setError(err.message || "Generation failed");
      setStepStates((prev) => prev.map((s) => (s.status === "running" ? { ...s, status: "failed" } : s)));
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function refine({ prompt, provider }) {
    if (!activeProject) throw new Error("No active project to refine");
    setLoading(true);
    setError(null);
    startProgressSim(true);

    try {
      const data = await refineProject({ prompt, projectName: activeProject, provider });
      stopProgressSim(data.logs, true);
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

  async function loadProject(projectName) {
    if (!projectName) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProjectFiles(projectName);
      setActiveProject(projectName);
      setResult({
        status: "completed",
        project_name: projectName,
        tech_stack: "",
        files: data.files || {},
        saved_files: Object.keys(data.files || {}),
        mode: "loaded",
        logs: [],
      });
      setStepStates(buildStepStates(true));
    } catch (err) {
      setError(err.message || `Failed to load project '${projectName}'`);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setActiveProject(null);
    setError(null);
    setStepStates(buildStepStates(false));
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
    loadProject,
    reset,
    AGENT_STEPS,
    REFINE_STEPS,
  };
}

