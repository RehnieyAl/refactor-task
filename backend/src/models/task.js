const TASK_STATUSES = Object.freeze(["pendiente", "en progreso", "finalizada"]);
const DEFAULT_TASK_STATUS = "pendiente";
const TASK_LIMITS = Object.freeze({
  titleMinLength: 3,
  titleMaxLength: 100,
  descriptionMaxLength: 500
});

class Task {
  constructor({ id, title, description = "", status = DEFAULT_TASK_STATUS, createdAt = new Date().toISOString() }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.status = status;
    this.createdAt = createdAt;
  }
}

module.exports = { Task, TASK_STATUSES, DEFAULT_TASK_STATUS, TASK_LIMITS };
