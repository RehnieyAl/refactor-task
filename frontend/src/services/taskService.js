import { request } from "./httpClient.js";

const TASKS_PATH = "/tasks";

export function listTasks() {
  return request(TASKS_PATH);
}

export function createTask({ title, description }) {
  return request(TASKS_PATH, { method: "POST", body: { title, description } });
}

export function updateTaskStatus(taskId, status) {
  return request(`${TASKS_PATH}/${encodeURIComponent(taskId)}/status`, { method: "PATCH", body: { status } });
}
