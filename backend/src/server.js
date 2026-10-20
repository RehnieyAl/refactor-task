const { loadConfig } = require("./config");
const { createApp } = require("./app");
const { TaskRepository } = require("./repositories/taskRepository");
const { TaskService } = require("./services/taskService");
const { asciiArt }  = require("./config");

function startServer(config) {
  const taskService = new TaskService(new TaskRepository());
  const app = createApp({
    taskService,
    corsOrigins: config.corsOrigins,
    frontendDir: config.frontendDir,
    logError: console.error,
  });

  const server = app.listen(config.port, () => {
    const baseUrl = `http://localhost:${server.address().port}`;
    console.log(asciiArt());
    console.log(`API lista en ${baseUrl}/api`);
    console.log(`Interfaz disponible en ${baseUrl}/`);
  });

  server.on("error", (error) => {
    console.error(`No se pudo iniciar el servidor: ${error.message}`);
    process.exitCode = 1;
  });
}

try {
  startServer(loadConfig(process.env));
} catch (error) {
  console.error(`Configuración inválida: ${error.message}`);
  process.exitCode = 1;
}
