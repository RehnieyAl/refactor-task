import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { request, HttpError } from "../src/services/httpClient.js";
import { createTask, listTasks, updateTaskStatus } from "../src/services/taskService.js";
import { API_BASE_URL } from "../src/config/config.js";

const originalFetch = globalThis.fetch;
let calls;

function stubFetch(responder) {
  calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return responder();
  };
}

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });

describe("httpClient", () => {
  beforeEach(() => stubFetch(() => jsonResponse([])));
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("devuelve el JSON de respuestas correctas", async () => {
    stubFetch(() => jsonResponse([{ id: 1 }]));
    assert.deepEqual(await request("/tasks"), [{ id: 1 }]);
    assert.equal(calls[0].url, `${API_BASE_URL}/tasks`);
    assert.equal(calls[0].options.method, "GET");
    assert.equal(calls[0].options.body, undefined);
  });

  it("serializa el cuerpo como JSON", async () => {
    await request("/tasks", { method: "POST", body: { title: "abc" } });
    assert.equal(calls[0].options.headers["Content-Type"], "application/json");
    assert.equal(calls[0].options.body, JSON.stringify({ title: "abc" }));
  });

  it("conserva el mensaje de error del backend", async () => {
    stubFetch(() => jsonResponse({ error: "El título debe tener al menos 3 caracteres." }, 400));
    await assert.rejects(request("/tasks"), { name: "HttpError", status: 400, message: "El título debe tener al menos 3 caracteres." });
  });

  it("tolera errores sin JSON", async () => {
    stubFetch(() => new Response("<pre>Cannot GET</pre>", { status: 404, headers: { "Content-Type": "text/html" } }));
    await assert.rejects(request("/tasks"), { status: 404, message: "No se pudo completar la operación." });
  });

  it("rechaza respuestas correctas con JSON inválido", async () => {
    stubFetch(() => new Response("{roto", { status: 200, headers: { "Content-Type": "application/json" } }));
    await assert.rejects(request("/tasks"), { status: 200, message: "El servidor devolvió una respuesta no válida." });
  });

  it("rechaza respuestas correctas que no son JSON", async () => {
    stubFetch(() => new Response("ok", { status: 200, headers: { "Content-Type": "text/plain" } }));
    await assert.rejects(request("/tasks"), { message: "El servidor devolvió una respuesta no válida." });
  });

  it("acepta respuestas 204 sin cuerpo", async () => {
    stubFetch(() => new Response(null, { status: 204 }));
    assert.equal(await request("/tasks"), null);
  });

  it("convierte fallos de red en HttpError de conexión", async () => {
    globalThis.fetch = async () => {
      throw new TypeError("Failed to fetch");
    };
    const error = await request("/tasks").catch((caught) => caught);
    assert.ok(error instanceof HttpError);
    assert.equal(error.isNetworkError, true);
    assert.match(error.message, /No fue posible conectar con el servidor/);
    assert.equal(error.cause.message, "Failed to fetch");
  });
});

describe("taskService", () => {
  beforeEach(() => stubFetch(() => jsonResponse({})));
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("usa los endpoints del contrato de la API", async () => {
    await listTasks();
    await createTask({ title: "Nueva", description: "Detalle" });
    await updateTaskStatus(7, "finalizada");

    assert.deepEqual(
      calls.map(({ url, options }) => [options.method, url.replace(API_BASE_URL, ""), options.body]),
      [
        ["GET", "/tasks", undefined],
        ["POST", "/tasks", JSON.stringify({ title: "Nueva", description: "Detalle" })],
        ["PATCH", "/tasks/7/status", JSON.stringify({ status: "finalizada" })]
      ]
    );
  });
});
