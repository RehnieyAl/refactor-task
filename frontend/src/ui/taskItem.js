import { TASK_STATUSES } from "../constants/taskRules.js";
import { createElement } from "../utils/dom.js";

export const TASK_ITEM_SELECTORS = Object.freeze({
  item: ".task",
  statusSelect: ".task-status",
  saveButton: "[data-action='save-status']",
  feedback: ".task-feedback"
});

function createStatusSelect(task) {
  const select = createElement("select", {
    className: "task-status",
    attributes: { id: `status-${task.id}` }
  });
  for (const status of TASK_STATUSES) {
    select.append(createElement("option", { text: status, attributes: { value: status } }));
  }
  select.value = task.status;
  return select;
}

export function createTaskItem(task) {
  const header = createElement("div", { className: "task-top" }, [
    createElement("div", {}, [
      createElement("h3", { className: "task-title", text: task.title }),
      createElement("p", { className: "task-description", text: task.description || "Sin descripción" })
    ]),
    createElement("span", { className: "task-id", text: `#${task.id}` })
  ]);

  const actions = createElement("div", { className: "task-actions" }, [
    createElement("label", { text: "Estado", attributes: { for: `status-${task.id}` } }),
    createStatusSelect(task),
    createElement("button", {
      className: "secondary",
      text: "Guardar estado",
      attributes: { type: "button", "data-action": "save-status", "aria-label": `Guardar estado de «${task.title}»` }
    })
  ]);

  const feedback = createElement("p", { className: "notification task-feedback", attributes: { role: "status" } });

  const item = createElement("article", { className: "task" }, [header, actions, feedback]);
  item.dataset.taskId = String(task.id);
  item.dataset.status = task.status;
  return item;
}
