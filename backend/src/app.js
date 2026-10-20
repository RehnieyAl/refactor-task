const path = require("node:path");
const express = require("express");
const cors = require("cors");
const { createTaskController } = require("./controllers/taskController");
const { createTaskRoutes } = require("./routes/taskRoutes");
const { notFoundHandler, createErrorHandler } = require("./middlewares/errorHandlers");
const {
  securityHeaders,
  API_CONTENT_SECURITY_POLICY,
  FRONTEND_CONTENT_SECURITY_POLICY
} = require("./middlewares/securityHeaders");

const JSON_BODY_LIMIT = "100kb";
const FRONTEND_HOME = "/pages/GestureTask.html";

function createApiRouter({ taskService, corsOrigins }) {
  const router = express.Router();
  router.use(securityHeaders(API_CONTENT_SECURITY_POLICY));
  router.use(cors({ origin: corsOrigins }));
  router.use(express.json({ limit: JSON_BODY_LIMIT }));
  router.get("/health", (req, res) => res.json({ status: "ok" }));
  router.use("/tasks", createTaskRoutes(createTaskController(taskService)));
  return router;
}

function createFrontendRouter(frontendDir) {
  const router = express.Router();
  router.use(securityHeaders(FRONTEND_CONTENT_SECURITY_POLICY));
  router.get("/", (req, res) => res.redirect(FRONTEND_HOME));
  router.use("/pages", express.static(path.join(frontendDir, "pages")));
  router.use("/src", express.static(path.join(frontendDir, "src")));
  return router;
}

function createApp({ taskService, corsOrigins, frontendDir, logError }) {
  const app = express();
  app.disable("x-powered-by");
  app.use("/api", createApiRouter({ taskService, corsOrigins }));
  app.use(createFrontendRouter(frontendDir));
  app.use(notFoundHandler);
  app.use(createErrorHandler(logError));
  return app;
}

module.exports = { createApp };
