function createTaskController(service) {
  return {
    async list(req, res) {
      res.json(await service.listTasks());
    },
    async create(req, res) {
      res.status(201).json(await service.createTask(req.body));
    },
    async updateStatus(req, res) {
      res.json(await service.changeStatus(req.params.id, req.body));
    }
  };
}

module.exports = { createTaskController };
