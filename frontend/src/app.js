import { loadComponents } from "./components/components.js";
import { mountTaskBoard } from "./ui/taskList.js";
import { mountTaskForm } from "./ui/taskForm.js";
import { showNotification } from "./ui/notifications.js";
import { requireElement } from "./utils/dom.js";

async function startApp() {
  const connectionStatusElement = requireElement("#api-status");

  try {
    await loadComponents();
  } catch (error) {
    showNotification(connectionStatusElement, "No se pudo cargar la interfaz. Recarga la página.", "error");
    throw error;
  }

  const board = mountTaskBoard({
    listElement: requireElement("#task-list"),
    refreshButton: requireElement("#refresh"),
    connectionStatusElement
  });
  mountTaskForm({ form: requireElement("#task-form"), onTaskCreated: board.reload });
  await board.reload();
}

startApp();
