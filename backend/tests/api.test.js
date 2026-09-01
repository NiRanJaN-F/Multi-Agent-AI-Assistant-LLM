import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/multi_agent_assistant_test";
process.env.AI_ENGINE_URL ||= "http://127.0.0.1:8000";

const { app } = await import("../src/server.js");

let server;
let baseUrl;

describe("backend API", () => {
  before(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("exposes service metadata on the root route", async () => {
    const response = await fetch(`${baseUrl}/`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.service, "multi-agent-ai-assistant-backend");
    assert.equal(body.history, "/api/agents/history");
  });

  it("reports backend health", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, "ok");
  });

  it("reports service status including the database state", async () => {
    const response = await fetch(`${baseUrl}/api/status`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(body.database);
    assert.ok(["connected", "disconnected", "connecting", "disconnecting"].includes(body.database.status));
  });

  it("rejects generation requests without a prompt", async () => {
    const response = await fetch(`${baseUrl}/api/agents/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "   " }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, "prompt is required");
  });

  it("rejects refinement requests without a prompt", async () => {
    const response = await fetch(`${baseUrl}/api/agents/refine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "  ", projectName: "demo-app" }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, "prompt is required");
  });

  it("rejects refinement requests without a project name", async () => {
    const response = await fetch(`${baseUrl}/api/agents/refine`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Add dark mode" }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, "projectName is required to refine an existing project");
  });

  it("returns 503 for history when MongoDB is not connected", async () => {
    const response = await fetch(`${baseUrl}/api/agents/history`);
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.equal(body.status, "unavailable");
    assert.deepEqual(body.items, []);
  });

  it("returns a JSON 404 for unknown routes", async () => {
    const response = await fetch(`${baseUrl}/api/does-not-exist`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.status, "error");
  });
});
