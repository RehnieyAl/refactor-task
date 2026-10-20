import { listTasks, updateTaskStatus } from "../services/taskService.js";
import { isValidTaskStatus } from "../utils/validators.js";
import { createElement } from "../utils/dom.js";
import { createTaskItem, TASK_ITEM_SELECTORS } from "./taskItem.js";
import { showNotification } from "./notifications.js";

const EMPTY_LIST_MESSAGE = "No hay tareas todavía. Crea la primera.";
const LOADING_MESSAGE = "Cargando tareas…";

function renderListMessage(listElement, message, tone = "info") {
  listElement.replaceChildren(createElement("p", { className: `list-message is-${tone}`, text: message }));
}

function renderTasks(listElement, tasks) {
  if (tasks.length === 0) {
    renderListMessage(listElement, EMPTY_LIST_MESSAGE);
    return;
  }
  listElement.replaceChildren(...tasks.map(createTaskItem));
}

function describeConnection(error) {
  if (error.isNetworkError) return "API no disponible";
  return "Error en la API";
}

function setItemBusy(item, isBusy) {
  item.querySelector(TASK_ITEM_SELECTORS.statusSelect).disabled = isBusy;
  item.querySelector(TASK_ITEM_SELECTORS.saveButton).disabled = isBusy;
}

async function saveItemStatus(item) {
  const select = item.querySelector(TASK_ITEM_SELECTORS.statusSelect);
  const feedback = item.querySelector(TASK_ITEM_SELECTORS.feedback);
  const previousStatus = item.dataset.status;
  const nextStatus = select.value;

  if (!isValidTaskStatus(nextStatus)) {
    select.value = previousStatus;
    showNotification(feedback, "Selecciona un estado válido.", "error");
    return;
  }

  setItemBusy(item, true);
  showNotification(feedback, "Guardando estado…");
  try {
    const updatedTask = await updateTaskStatus(item.dataset.taskId, nextStatus);
    const updatedItem = createTaskItem(updatedTask);
    item.replaceWith(updatedItem);
    showNotification(updatedItem.querySelector(TASK_ITEM_SELECTORS.feedback), "Estado actualizado.", "success");
    updatedItem.querySelector(TASK_ITEM_SELECTORS.saveButton).focus();
  } catch (error) {
    select.value = previousStatus;
    setItemBusy(item, false);
    showNotification(feedback, error.message, "error");
  }
}

export function mountTaskBoard({ listElement, refreshButton, connectionStatusElement }) {
  let latestLoadId = 0;

  function setLoading(isLoading) {
    listElement.setAttribute("aria-busy", String(isLoading));
    refreshButton.disabled = isLoading;
  }

  async function reload() {
    const loadId = ++latestLoadId;
    setLoading(true);
    if (!listElement.querySelector(TASK_ITEM_SELECTORS.item)) {
      renderListMessage(listElement, LOADING_MESSAGE);
    }
    try {
      const tasks = await listTasks();
      if (loadId !== latestLoadId) return;
      renderTasks(listElement, tasks);
      showNotification(connectionStatusElement, "API conectada", "success");
    } catch (error) {
      if (loadId !== latestLoadId) return;
      renderListMessage(listElement, error.message, "error");
      showNotification(connectionStatusElement, describeConnection(error), "error");
    } finally {
      if (loadId === latestLoadId) setLoading(false);
    }
  }

  refreshButton.addEventListener("click", reload);
  listElement.addEventListener("click", (event) => {
    const saveButton = event.target.closest(TASK_ITEM_SELECTORS.saveButton);
    if (!saveButton) return;
    saveItemStatus(saveButton.closest(TASK_ITEM_SELECTORS.item));
  });

  return { reload };
}
