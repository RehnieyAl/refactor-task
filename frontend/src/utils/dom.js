export function createElement(tagName, { className, text, attributes = {} } = {}, children = []) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  element.append(...children);
  return element;
}

export function requireElement(selector, root = document) {
  const element = root.querySelector(selector);
  if (!element) {
    throw new Error(`No se encontró el elemento requerido: ${selector}`);
  }
  return element;
}
