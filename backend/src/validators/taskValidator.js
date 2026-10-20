const { TASK_STATUSES, TASK_LIMITS } = require("../models/task");
const { ValidationError } = require("../errors/httpErrors");

const TASK_ID_PATTERN = /^[1-9]\d*$/;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireJsonObject(body) {
  if (!isPlainObject(body)) {
    throw new ValidationError("El cuerpo de la petición debe ser un objeto JSON.");
  }
  return body;
}

function validateTitle(title) {
  if (title === undefined) {
    throw new ValidationError("El título es obligatorio.");
  }
  if (typeof title !== "string") {
    throw new ValidationError("El título debe ser texto.");
  }
  const normalizedTitle = title.trim();
  if (normalizedTitle.length < TASK_LIMITS.titleMinLength) {
    throw new ValidationError(`El título debe tener al menos ${TASK_LIMITS.titleMinLength} caracteres.`);
  }
  if (normalizedTitle.length > TASK_LIMITS.titleMaxLength) {
    throw new ValidationError(`El título no puede superar los ${TASK_LIMITS.titleMaxLength} caracteres.`);
  }
  return normalizedTitle;
}

function validateDescription(description = "") {
  if (typeof description !== "string") {
    throw new ValidationError("La descripción debe ser texto.");
  }
  const normalizedDescription = description.trim();
  if (normalizedDescription.length > TASK_LIMITS.descriptionMaxLength) {
    throw new ValidationError(`La descripción no puede superar los ${TASK_LIMITS.descriptionMaxLength} caracteres.`);
  }
  return normalizedDescription;
}

function validateNewTask(body) {
  const { title, description } = requireJsonObject(body);
  return { title: validateTitle(title), description: validateDescription(description) };
}

function validateStatusChange(body) {
  const { status } = requireJsonObject(body);
  if (!TASK_STATUSES.includes(status)) {
    throw new ValidationError(`Estado inválido. Use: ${TASK_STATUSES.join(", ")}.`);
  }
  return status;
}

function parseTaskId(value) {
  if (!TASK_ID_PATTERN.test(value)) {
    throw new ValidationError("El identificador de la tarea debe ser un número entero positivo.");
  }
  return Number(value);
}

module.exports = { validateNewTask, validateStatusChange, parseTaskId };
