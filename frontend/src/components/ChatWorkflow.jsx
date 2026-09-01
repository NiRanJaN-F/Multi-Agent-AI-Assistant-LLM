import { useEffect, useRef, useState } from "react";
import { generateProject, refineProject } from "../services/api";
import GenerationResult from "./GenerationResult";

const AGENT_PIPELINE = ["Planner", "Architect", "Coder", "Tester", "QA", "Doc Writer"];
const REFINE_PIPELINE = ["Change Planner", "Coder", "Tester", "QA", "Doc Writer"];

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  text: "Describe the software you want and the agent team will plan, architect, code, test, review, and document it. Follow-up messages then modify that same project.",
};

let messageCounter = 0;

function nextId(prefix) {
  messageCounter += 1;
  return `${prefix}-${messageCounter}`;
}

export default function ChatWorkflow({ onGenerated }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [provider, setProvider] = useState("");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [activeProject, setActiveProject] = useState(null);
  const threadRef = useRef(null);

  const pipeline = activeProject ? REFINE_PIPELINE : AGENT_PIPELINE;

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, activeStage]);

  useEffect(() => {
    if (!loading) {
      return undefined;
    }

    const interval = setInterval(() => {
      setActiveStage((stage) => Math.min(stage + 1, pipeline.length - 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [loading, pipeline.length]);

  function startNewConversation() {
    setMessages([WELCOME_MESSAGE]);
    setActiveProject(null);
    setProjectName("");
  }

  function appendMessage(message) {
    setMessages((current) => [...current, message]);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const prompt = input.trim();
    if (!prompt || loading) {
      return;
    }

    appendMessage({ id: nextId("user"), role: "user", text: prompt });
    setInput("");
    setActiveStage(0);
    setLoading(true);

    try {
      const result = activeProject
        ? await refineProject({
            prompt,
            projectName: activeProject,
            provider: provider || undefined,
          })
        : await generateProject({
            prompt,
            projectName: projectName.trim() || undefined,
            provider: provider || undefined,
          });

      const llmLabel =
        result.llm?.mode === "live"
          ? `${result.llm.provider} (${result.llm.model})`
          : "mock templates";

      appendMessage({
        id: nextId("assistant"),
        role: "assistant",
        text: activeProject
          ? `Updated ${result.changed_files?.length ?? 0} file(s) in "${result.project_name}" using ${llmLabel}.`
          : `Generated ${result.saved_files?.length ?? 0} files for "${result.project_name}" using ${llmLabel}.`,
        result,
      });

      setActiveProject(result.project_name);
      onGenerated?.(result);
    } catch (error) {
      appendMessage({
        id: nextId("error"),
        role: "error",
        text: error.message || "Generation failed",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  }

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2>Agent Chat</h2>
          <p className="panel__subtitle">
            Conversational workflow — {pipeline.join(" → ")}
          </p>
        </div>
        <button type="button" className="btn" onClick={startNewConversation} disabled={loading}>
          New project
        </button>
      </div>

      <div className="chat__thread" ref={threadRef}>
        {messages.map((message) => (
          <article key={message.id} className={`chat__message chat__message--${message.role}`}>
            <span className="chat__author">
              {message.role === "user" ? "You" : message.role === "error" ? "Error" : "Agent team"}
            </span>
            <p className="chat__text">{message.text}</p>
            {message.result && <GenerationResult result={message.result} />}
          </article>
        ))}

        {activeProject && (
          <p className="chat__context">
            Follow-up prompts modify <strong>{activeProject}</strong> — e.g. “add a dark mode
            toggle”. Use “New project” to start from scratch.
          </p>
        )}

        {loading && (
          <article className="chat__message chat__message--assistant">
            <span className="chat__author">Agent team</span>
            <p className="chat__text">
              {activeProject ? `Updating ${activeProject}…` : "Working on it…"}
            </p>
            <ol className="chat__pipeline">
              {pipeline.map((agent, index) => (
                <li
                  key={agent}
                  className={`chat__stage ${
                    index < activeStage
                      ? "chat__stage--done"
                      : index === activeStage
                        ? "chat__stage--active"
                        : ""
                  }`}
                >
                  {agent}
                </li>
              ))}
            </ol>
          </article>
        )}
      </div>

      <form className="chat__composer" onSubmit={handleSubmit}>
        <textarea
          className="chat__input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            activeProject
              ? `e.g. Add a dark mode toggle to ${activeProject}`
              : "e.g. Build a todo list web app with add, complete, and delete tasks."
          }
          rows={3}
          disabled={loading}
        />

        <div className="chat__controls">
          <input
            type="text"
            className="chat__project"
            value={activeProject ?? projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="Project name (optional)"
            disabled={loading || Boolean(activeProject)}
          />

          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            disabled={loading}
          >
            <option value="">Default provider</option>
            <option value="gemini">Gemini</option>
            <option value="openai">OpenAI</option>
          </select>

          <button type="submit" className="btn btn--primary" disabled={loading || !input.trim()}>
            {loading ? "Running agents…" : activeProject ? "Apply change" : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
}
