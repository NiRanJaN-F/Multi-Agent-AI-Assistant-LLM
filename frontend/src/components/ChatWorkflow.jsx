import { useEffect, useRef, useState } from "react";
import { generateProject } from "../services/api";
import GenerationResult from "./GenerationResult";

const AGENT_PIPELINE = ["Planner", "Architect", "Coder", "Tester", "QA", "Doc Writer"];

const WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  text: "Describe the software you want and the agent team will plan, architect, code, test, review, and document it.",
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
  const threadRef = useRef(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, activeStage]);

  useEffect(() => {
    if (!loading) {
      return undefined;
    }

    const interval = setInterval(() => {
      setActiveStage((stage) => Math.min(stage + 1, AGENT_PIPELINE.length - 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [loading]);

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
      const result = await generateProject({
        prompt,
        projectName: projectName.trim() || undefined,
        provider: provider || undefined,
      });

      appendMessage({
        id: nextId("assistant"),
        role: "assistant",
        text: `Generated ${result.saved_files?.length ?? 0} files for "${result.project_name}" using ${
          result.llm?.mode === "live" ? `${result.llm.provider} (${result.llm.model})` : "mock templates"
        }.`,
        result,
      });

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
            Conversational workflow — {AGENT_PIPELINE.join(" → ")}
          </p>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => setMessages([WELCOME_MESSAGE])}
          disabled={loading}
        >
          New conversation
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

        {loading && (
          <article className="chat__message chat__message--assistant">
            <span className="chat__author">Agent team</span>
            <p className="chat__text">Working on it…</p>
            <ol className="chat__pipeline">
              {AGENT_PIPELINE.map((agent, index) => (
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
          placeholder="e.g. Build a todo list web app with add, complete, and delete tasks."
          rows={3}
          disabled={loading}
        />

        <div className="chat__controls">
          <input
            type="text"
            className="chat__project"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="Project name (optional)"
            disabled={loading}
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
            {loading ? "Running agents…" : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
}
