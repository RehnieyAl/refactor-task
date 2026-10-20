const express = require("express");
const { asyncHandler } = require("../middlewares/asyncHandler");

function createTaskRoutes(controller) {
  const router = express.Router();
  router.get("/", asyncHandler(controller.list));
  router.post("/", asyncHandler(controller.create));
  router.patch("/:id/status", asyncHandler(controller.updateStatus));
  return router;
}

module.exports = { createTaskRoutes };
