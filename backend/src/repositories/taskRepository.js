const { Task } = require("../models/task");

const INITIAL_TASKS = [
  { id: 1, title: "Analizar el proyecto base", description: "Identificar responsabilidades", status: "en progreso" },
  { id: 2, title: "Diseñar la arquitectura", description: "Proponer módulos", status: "pendiente" }
];

const toSnapshot = (task) => ({ ...task });

class TaskRepository {
  #tasks;
  #nextId;

  constructor(initialTasks = INITIAL_TASKS) {
    this.#tasks = initialTasks.map((data) => new Task(data));
    this.#nextId = Math.max(0, ...this.#tasks.map((task) => task.id)) + 1;
  }

  async findAll() {
    return this.#tasks.map(toSnapshot);
  }

  async create(data) {
    const task = new Task({ ...data, id: this.#nextId++ });
    this.#tasks.push(task);
    return toSnapshot(task);
  }

  async updateStatus(id, status) {
    const task = this.#tasks.find((candidate) => candidate.id === id);
    if (!task) return null;
    task.status = status;
    return toSnapshot(task);
  }
}

module.exports = { TaskRepository };
