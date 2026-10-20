const COMPONENTS_BASE_URL = new URL("./", import.meta.url);
const COMPONENT_NAME_PATTERN = /^[a-z][a-zA-Z]*$/;

async function fetchComponentMarkup(name) {
  if (!COMPONENT_NAME_PATTERN.test(name)) {
    throw new Error(`Nombre de componente no válido: "${name}".`);
  }
  const response = await fetch(new URL(`${name}.html`, COMPONENTS_BASE_URL));
  if (!response.ok) {
    throw new Error(`No se pudo cargar el componente "${name}" (HTTP ${response.status}).`);
  }
  return response.text();
}

async function loadComponent(placeholder) {
  const template = document.createElement("template");
  template.innerHTML = await fetchComponentMarkup(placeholder.dataset.component);
  placeholder.replaceWith(template.content);
}

export function loadComponents(root = document) {
  return Promise.all([...root.querySelectorAll("[data-component]")].map(loadComponent));
}
