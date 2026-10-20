const TONE_CLASSES = Object.freeze({
  info: "is-info",
  success: "is-success",
  error: "is-error"
});

export function showNotification(element, message, tone = "info") {
  element.classList.remove(...Object.values(TONE_CLASSES));
  element.classList.add(TONE_CLASSES[tone]);
  element.textContent = message;
}
