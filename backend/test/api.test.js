const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const { createApp } = require("../src/app");
const { loadConfig } = require("../src/config");
const { TaskRepository } = require("../src/repositories/taskRepository");
const { TaskService } = require("../src/services/taskService");

const ALLOWED_ORIGIN = "http://localhost:5500";
const TEST_ENV = Object.freeze({ PORT: "0", CORS_ORIGINS: `${ALLOWED_ORIGIN},http://127.0.0.1:5500` });

async function startTestServer(app) {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  return { server, baseUrl: `http://127.0.0.1:${server.address().port}` };
}

function createTestApp(overrides) {
  const config = loadConfig(TEST_ENV);
  return createApp({
    taskService: new TaskService(new TaskRepository()),
    corsOrigins: config.corsOrigins,
    frontendDir: config.frontendDir,
    logError: console.error,
    ...overrides
  });
}

function sendJson(baseUrl, pathname, method, body) {
  return fetch(`${baseUrl}${pathname}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body)
  });
}

describe("API de tareas", () => {
  let server;
  let baseUrl;

  before(async () => {
    ({ server, baseUrl } = await startTestServer(createTestApp()));
  });

  after(() => server.close());

  it("GET /api/health responde ok", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  });

  it("GET /api/tasks devuelve las tareas iniciales", async () => {
    const response = await fetch(`${baseUrl}/api/tasks`);
    const tasks = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(tasks.map((task) => task.id), [1, 2]);
    assert.deepEqual(Object.keys(tasks[0]).sort(), ["createdAt", "description", "id", "status", "title"]);
  });

  it("POST /api/tasks crea una tarea normalizada y pendiente", async () => {
    const response = await sendJson(baseUrl, "/api/tasks", "POST", {
      title: "  Documentar módulos  ",
      description: "  Revisar capas ",
      status: "finalizada"
    });
    const task = await response.json();
    assert.equal(response.status, 201);
    assert.equal(task.id, 3);
    assert.equal(task.title, "Documentar módulos");
    assert.equal(task.description, "Revisar capas");
    assert.equal(task.status, "pendiente");
    assert.ok(!Number.isNaN(Date.parse(task.createdAt)));

    const list = await (await fetch(`${baseUrl}/api/tasks`)).json();
    assert.equal(list.at(-1).id, 3);
  });

  it("POST /api/tasks acepta tareas sin descripción", async () => {
    const response = await sendJson(baseUrl, "/api/tasks", "POST", { title: "Sin detalle" });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).description, "");
  });

  const invalidTasks = [
    ["sin título", {}, "El título es obligatorio."],
    ["título no textual", { title: 123 }, "El título debe ser texto."],
    ["título corto", { title: "ab" }, "El título debe tener al menos 3 caracteres."],
    ["título de espacios", { title: "     " }, "El título debe tener al menos 3 caracteres."],
    ["título largo", { title: "a".repeat(101) }, "El título no puede superar los 100 caracteres."],
    ["descripción no textual", { title: "Válida", description: { x: 1 } }, "La descripción debe ser texto."],
    ["descripción nula", { title: "Válida", description: null }, "La descripción debe ser texto."],
    ["descripción larga", { title: "Válida", description: "a".repeat(501) }, "La descripción no puede superar los 500 caracteres."],
    ["cuerpo que no es objeto", [{ title: "Válida" }], "El cuerpo de la petición debe ser un objeto JSON."]
  ];

  for (const [caseName, body, expectedError] of invalidTasks) {
    it(`POST /api/tasks rechaza ${caseName}`, async () => {
      const response = await sendJson(baseUrl, "/api/tasks", "POST", body);
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: expectedError });
    });
  }

  it("PATCH /api/tasks/:id/status actualiza el estado", async () => {
    const response = await sendJson(baseUrl, "/api/tasks/2/status", "PATCH", { status: "finalizada" });
    assert.equal(response.status, 200);
    const task = await response.json();
    assert.equal(task.id, 2);
    assert.equal(task.status, "finalizada");

    const list = await (await fetch(`${baseUrl}/api/tasks`)).json();
    assert.equal(list.find((item) => item.id === 2).status, "finalizada");
  });

  it("PATCH /api/tasks/:id/status rechaza estados inválidos", async () => {
    for (const body of [{ status: "archivada" }, {}, { status: 1 }]) {
      const response = await sendJson(baseUrl, "/api/tasks/1/status", "PATCH", body);
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: "Estado inválido. Use: pendiente, en progreso, finalizada." });
    }
  });

  it("PATCH /api/tasks/:id/status rechaza identificadores inválidos", async () => {
    for (const id of ["abc", "0", "-1", "1.5"]) {
      const response = await sendJson(baseUrl, `/api/tasks/${id}/status`, "PATCH", { status: "pendiente" });
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), {
        error: "El identificador de la tarea debe ser un número entero positivo."
      });
    }
  });

  it("PATCH /api/tasks/:id/status responde 404 para tareas inexistentes", async () => {
    const response = await sendJson(baseUrl, "/api/tasks/999/status", "PATCH", { status: "pendiente" });
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: "No existe una tarea con ese identificador." });
  });

  it("rechaza JSON malformado sin exponer detalles internos", async () => {
    const response = await sendJson(baseUrl, "/api/tasks", "POST", "{titulo");
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "El cuerpo de la petición no es JSON válido." });
  });

  it("rechaza cuerpos demasiado grandes", async () => {
    const response = await sendJson(baseUrl, "/api/tasks", "POST", { title: "a".repeat(200_000) });
    assert.equal(response.status, 413);
    assert.deepEqual(await response.json(), { error: "El cuerpo de la petición supera el tamaño permitido." });
  });

  it("responde 404 en JSON para rutas inexistentes", async () => {
    for (const [method, pathname] of [["GET", "/api/inexistente"], ["DELETE", "/api/tasks/1"], ["GET", "/otra"]]) {
      const response = await fetch(`${baseUrl}${pathname}`, { method });
      assert.equal(response.status, 404);
      assert.match(response.headers.get("content-type"), /application\/json/);
      assert.deepEqual(await response.json(), { error: "Ruta no encontrada." });
    }
  });

  it("aplica cabeceras de seguridad y oculta la tecnología del servidor", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.headers.get("x-powered-by"), null);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.match(response.headers.get("content-security-policy"), /default-src 'none'/);
  });

  it("permite CORS solo a los orígenes configurados", async () => {
    const allowed = await fetch(`${baseUrl}/api/tasks`, { headers: { Origin: ALLOWED_ORIGIN } });
    assert.equal(allowed.headers.get("access-control-allow-origin"), ALLOWED_ORIGIN);

    const blocked = await fetch(`${baseUrl}/api/tasks`, { headers: { Origin: "https://externo.example" } });
    assert.equal(blocked.headers.get("access-control-allow-origin"), null);
  });

  it("sirve la interfaz y sus recursos", async () => {
    const home = await fetch(`${baseUrl}/`, { redirect: "manual" });
    assert.equal(home.status, 302);
    assert.equal(home.headers.get("location"), "/pages/GestureTask.html");

    for (const resource of ["/pages/GestureTask.html", "/src/app.js", "/src/styles/styles.css", "/src/components/panel.html"]) {
      const response = await fetch(`${baseUrl}${resource}`);
      assert.equal(response.status, 200, resource);
    }
  });
});

describe("Errores internos", () => {
  it("responde 500 genérico y registra el error original", async () => {
    const loggedErrors = [];
    const failingService = {
      listTasks: async () => {
        throw new Error("detalle interno sensible");
      }
    };
    const { server, baseUrl } = await startTestServer(
      createTestApp({ taskService: failingService, logError: (error) => loggedErrors.push(error) })
    );
    try {
      const response = await fetch(`${baseUrl}/api/tasks`);
      assert.equal(response.status, 500);
      assert.deepEqual(await response.json(), { error: "Error interno del servidor." });
      assert.equal(loggedErrors.length, 1);
      assert.equal(loggedErrors[0].message, "detalle interno sensible");
    } finally {
      server.close();
    }
  });
});

describe("Configuración", () => {
  it("exige todas las variables de entorno sin valores por defecto", () => {
    assert.throws(() => loadConfig({}), /Falta la variable de entorno obligatoria PORT/);
    assert.throws(() => loadConfig({ PORT: "3000" }), /Falta la variable de entorno obligatoria CORS_ORIGINS/);
    assert.throws(() => loadConfig({ ...TEST_ENV, PORT: "  " }), /Falta la variable de entorno obligatoria PORT/);
  });

  it("lee y valida PORT", () => {
    assert.equal(loadConfig({ ...TEST_ENV, PORT: "4100" }).port, 4100);
    for (const port of ["abc", "-1", "3.5", "70000"]) {
      assert.throws(() => loadConfig({ ...TEST_ENV, PORT: port }), /PORT/);
    }
  });

  it("lee y valida la lista de orígenes CORS", () => {
    assert.deepEqual(loadConfig({ ...TEST_ENV, CORS_ORIGINS: "http://a.test, http://b.test:8080" }).corsOrigins, [
      "http://a.test",
      "http://b.test:8080"
    ]);
    for (const origins of ["*", "localhost:3000", "http://a.test/ruta", "ftp://a.test", ","]) {
      assert.throws(() => loadConfig({ ...TEST_ENV, CORS_ORIGINS: origins }), /CORS_ORIGINS/);
    }
  });
});

describe("Arranque del servidor", () => {
  const serverEntry = (env) =>
    spawn(process.execPath, ["src/server.js"], { cwd: path.resolve(__dirname, ".."), env: { PATH: process.env.PATH, ...env } });

  it("inicia el servidor y responde en el puerto asignado", async () => {
    const child = serverEntry(TEST_ENV);
    try {
      const [output] = await once(child.stdout, "data");
      const match = output.toString().match(/API lista en (http:\/\/localhost:\d+)\/api/);
      assert.ok(match, output.toString());
      const response = await fetch(`${match[1]}/api/health`);
      assert.equal(response.status, 200);
    } finally {
      child.kill();
    }
  });

  it("no inicia y explica el error si falta configuración", async () => {
    const child = serverEntry({ PORT: "0" });
    const [[output], [exitCode]] = await Promise.all([once(child.stderr, "data"), once(child, "exit")]);
    assert.match(output.toString(), /Configuración inválida: Falta la variable de entorno obligatoria CORS_ORIGINS/);
    assert.equal(exitCode, 1);
  });
});
