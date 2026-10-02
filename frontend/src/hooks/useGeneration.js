import { useState, useRef, useCallback } from "react";
import { generateProjectStream, refineProjectStream, getProjectFiles } from "../services/api";

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
  { key: "refine_intent", label: "Intent Analyzer", icon: "🎯" },
  { key: "refine_context", label: "Context Scanner", icon: "🔍" },
  { key: "refine_planner", label: "Change Planner", icon: "🧠" },
  { key: "coder", label: "Patch Coder", icon: "⚡" },
  { key: "tester", label: "Tester", icon: "🧪" },
  { key: "qa", label: "Diff QA", icon: "🛡️" },
  { key: "docwriter", label: "Doc Writer", icon: "📝" },
];

function buildStepStates(isRefine = false) {
  const steps = isRefine ? REFINE_STEPS : AGENT_STEPS;
  return steps.map((s) => ({ ...s, status: "pending", log: "", duration: null }));
}

export default function useGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [stepStates, setStepStates] = useState(() => buildStepStates(false));
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [currentFile, setCurrentFile] = useState(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [liveMessage, setLiveMessage] = useState("");

  const abortControllerRef = useRef(null);

  const handleSseEvent = useCallback((event, isRefine = false) => {
    if (!event) return;

    if (event.percent != null) {
      setProgressPercent(event.percent);
    }
    if (event.message) {
      setLiveMessage(event.message);
    }
    if (event.file) {
      setCurrentFile(event.file);
    }

    const stageKey = event.stage;
    const steps = isRefine ? REFINE_STEPS : AGENT_STEPS;

    // Normalize doc_writer to docwriter
    const normalizedKey = stageKey === "doc_writer" ? "docwriter" : stageKey;
    const targetIdx = steps.findIndex((s) => s.key === normalizedKey);

    if (targetIdx !== -1) {
      setActiveStepIndex(targetIdx);
      setStepStates((prev) =>
        prev.map((s, i) => {
          if (i < targetIdx) {
            return { ...s, status: "done" };
          }
          if (i === targetIdx) {
            return {
              ...s,
              status: "running",
              log: event.message || s.log,
            };
          }
          return s;
        })
      );
    }

    if (stageKey === "coder" && event.file) {
      setStepStates((prev) =>
        prev.map((s) => {
          if (s.key === "coder" || s.key === "frontend" || s.key === "backend") {
            return {
              ...s,
              log: `Generated: ${event.file}`,
            };
          }
          return s;
        })
      );
    }
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setLiveMessage("Generation stopped by user.");
    setStepStates((prev) =>
      prev.map((s) => (s.status === "running" ? { ...s, status: "pending", log: "Stopped" } : s))
    );
  }, []);

  async function generate({ prompt, projectName, provider }) {
    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentFile(null);
    setProgressPercent(5);
    setLiveMessage("Starting generation pipeline...");
    setStepStates(buildStepStates(false));
    setActiveStepIndex(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const data = await generateProjectStream({
        prompt,
        projectName,
        provider,
        onEvent: (ev) => handleSseEvent(ev, false),
        signal: controller.signal,
      });

      setStepStates((prev) => prev.map((s) => ({ ...s, status: "done" })));
      setProgressPercent(100);
      setLiveMessage("Generation completed ✓");
      setCurrentFile(null);

      const effectiveName = data?.project_name || data?.projectName || data?.name || projectName;

      if (data && Object.keys(data).length > 0) {
        setResult(data);
      } else if (effectiveName) {
        // Stream complete event was dropped (too large). Fetch files directly.
        try {
          const filesData = await getProjectFiles(effectiveName);
          const syntheticResult = {
            status: "completed",
            project_name: effectiveName,
            tech_stack: "",
            files: filesData.files || {},
            saved_files: Object.keys(filesData.files || {}),
            mode: "generate",
            logs: [],
          };
          setResult(syntheticResult);
        } catch {
          setResult({ status: "completed", project_name: effectiveName, files: {}, saved_files: [], mode: "generate", logs: [] });
        }
      } else {
        setResult(data);
      }

      if (effectiveName) {
        setActiveProject(effectiveName);
      }
      return data;
    } catch (err) {
      if (err.name === "AbortError" || controller.signal.aborted) {
        setLiveMessage("Generation stopped.");
      } else {
        setError(err.message || "Generation failed");
        setStepStates((prev) =>
          prev.map((s) => (s.status === "running" ? { ...s, status: "failed" } : s))
        );
      }
      throw err;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }

  async function refine({ prompt, provider, projectName }) {
    const targetProject = projectName || activeProject || result?.project_name || result?.projectName;
    if (!targetProject) throw new Error("No active project to refine");
    if (!activeProject) setActiveProject(targetProject);

    setLoading(true);
    setError(null);
    setCurrentFile(null);
    setProgressPercent(5);
    setLiveMessage(`Refining project "${targetProject}"...`);
    setStepStates(buildStepStates(true));
    setActiveStepIndex(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const data = await refineProjectStream({
        prompt,
        projectName: targetProject,
        provider,
        onEvent: (ev) => handleSseEvent(ev, true),
        signal: controller.signal,
      });

      setStepStates((prev) => prev.map((s) => ({ ...s, status: "done" })));
      setProgressPercent(100);
      setLiveMessage("Refinement completed ✓");
      setCurrentFile(null);
      setResult(data);
      const effectiveName = data?.project_name || data?.projectName || targetProject;
      if (effectiveName) {
        setActiveProject(effectiveName);
      }
      return data;
    } catch (err) {
      if (err.name === "AbortError" || controller.signal.aborted) {
        setLiveMessage("Refinement stopped.");
      } else {
        setError(err.message || "Refinement failed");
        setStepStates((prev) =>
          prev.map((s) => (s.status === "running" ? { ...s, status: "failed" } : s))
        );
      }
      throw err;
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
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

  function hydrateFromHistory(gen) {
    if (!gen) return;
    const pName = gen.projectName || gen.project_name;
    setActiveProject(pName);
    const restoredResult = {
      id: gen.id || gen._id,
      status: gen.status || "completed",
      project_name: pName,
      projectName: pName,
      tech_stack: gen.techStack || gen.tech_stack || "",
      techStack: gen.techStack || gen.tech_stack || "",
      files: gen.files || {},
      saved_files: gen.savedFiles || Object.keys(gen.files || {}),
      changed_files: gen.changedFiles || [],
      tasks: gen.tasks || [],
      review_results: gen.reviewResults || {},
      documentation: gen.documentation || "",
      logs: gen.logs || [],
      llm: gen.llm || {},
      durationMs: gen.durationMs || 0,
      mode: gen.mode || "generate",
      prompt: gen.prompt || "",
    };
    setResult(restoredResult);
    setStepStates(buildStepStates(true).map((s) => ({ ...s, status: "done", log: "Restored from history" })));
    setProgressPercent(100);
    setLiveMessage(`Restored "${pName}" from history snapshot ✓`);
  }

  function reset() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setResult(null);
    setActiveProject(null);
    setError(null);
    setCurrentFile(null);
    setProgressPercent(0);
    setLiveMessage("");
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
    currentFile,
    progressPercent,
    liveMessage,
    generate,
    refine,
    stopGeneration,
    loadProject,
    hydrateFromHistory,
    reset,
    AGENT_STEPS,
    REFINE_STEPS,
  };
}
