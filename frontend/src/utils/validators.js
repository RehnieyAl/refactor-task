import { TASK_LIMITS, TASK_STATUSES } from "../constants/taskRules.js";

export function validateTaskInput({ title, description }) {
  const normalizedTitle = title.trim();
  if (normalizedTitle.length < TASK_LIMITS.titleMinLength) {
    return { field: "title", message: `El título debe tener al menos ${TASK_LIMITS.titleMinLength} caracteres.` };
  }
  if (normalizedTitle.length > TASK_LIMITS.titleMaxLength) {
    return { field: "title", message: `El título no puede superar los ${TASK_LIMITS.titleMaxLength} caracteres.` };
  }
  if (description.trim().length > TASK_LIMITS.descriptionMaxLength) {
    return {
      field: "description",
      message: `La descripción no puede superar los ${TASK_LIMITS.descriptionMaxLength} caracteres.`
    };
  }
  return null;
}

export function isValidTaskStatus(status) {
  return TASK_STATUSES.includes(status);
}
