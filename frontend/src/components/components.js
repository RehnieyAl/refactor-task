export async function loadComponent(selector, path) {
    const container = document.querySelector(selector);

    if (!container) {
        throw new Error(`No existe el contenedor: ${selector}`);
    }

    const response = await fetch(path);

    if (!response.ok) {
        throw new Error(`Error cargando ${path}`);
    }

    container.innerHTML = await response.text();
}