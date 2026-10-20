import { TASK_LIMITS } from "../constants/taskRules.js";
import { createTask } from "../services/taskService.js";
import { validateTaskInput } from "../utils/validators.js";
import { requireElement } from "../utils/dom.js";
import { showNotification } from "./notifications.js";

function applyFieldLimits(fields) {
  fields.title.maxLength = TASK_LIMITS.titleMaxLength;
  fields.description.maxLength = TASK_LIMITS.descriptionMaxLength;
}

function markInvalidField(fields, invalidFieldName) {
  for (const [name, field] of Object.entries(fields)) {
    if (name === invalidFieldName) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }
  }
}

export function mountTaskForm({ form, onTaskCreated }) {
  const fields = { title: form.elements.title, description: form.elements.description };
  const submitButton = requireElement("button[type='submit']", form);
  const message = requireElement(".notification", form);

  applyFieldLimits(fields);

  form.addEventListener("input", (event) => event.target.removeAttribute("aria-invalid"));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = { title: fields.title.value, description: fields.description.value };
    const validationError = validateTaskInput(input);
    markInvalidField(fields, validationError?.field);

    if (validationError) {
      showNotification(message, validationError.message, "error");
      fields[validationError.field].focus();
      return;
    }

    submitButton.disabled = true;
    showNotification(message, "Creando tarea…");
    try {
      await createTask(input);
    } catch (error) {
      showNotification(message, error.message, "error");
      return;
    } finally {
      submitButton.disabled = false;
    }

    form.reset();
    showNotification(message, "Tarea creada correctamente.", "success");
    onTaskCreated();
  });
}
