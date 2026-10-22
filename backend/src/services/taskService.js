const { DEFAULT_TASK_STATUS } = require("../models/task");
const { NotFoundError } = require("../errors/httpErrors");
const { validateNewTask, validateStatusChange, parseTaskId } = require("../validators/taskValidator");

class TaskService {
  constructor(repository) {
    this.repository = repository;
  }

  async listTasks() {
    return this.repository.findAll();
  }

  async createTask(body) {
    const { title, description } = validateNewTask(body);
    return this.repository.create({ title, description, status: DEFAULT_TASK_STATUS });
  }

  async changeStatus(id, body) {
    const taskId = parseTaskId(id);
    const status = validateStatusChange(body);
    const updated = await this.repository.updateStatus(taskId, status);
    if (!updated) {
      throw new NotFoundError("No existe una tarea con ese identificador.");
    }
    return updated;
  }
}

module.exports = { TaskService };
