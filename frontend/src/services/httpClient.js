import { API_BASE_URL } from "../config/config.js";

const NETWORK_ERROR_MESSAGE = "No fue posible conectar con el servidor. Verifica que el backend esté iniciado.";
const DEFAULT_ERROR_MESSAGE = "No se pudo completar la operación.";
const INVALID_RESPONSE_MESSAGE = "El servidor devolvió una respuesta no válida.";

export class HttpError extends Error {
  constructor(message, status, options) {
    super(message, options);
    this.name = "HttpError";
    this.status = status;
  }

  get isNetworkError() {
    return this.status === 0;
  }
}

function isJsonResponse(response) {
  return (response.headers.get("Content-Type") ?? "").includes("application/json");
}

async function readJsonBody(response) {
  if (response.status === 204 || !isJsonResponse(response)) return null;
  try {
    return await response.json();
  } catch (error) {
    throw new HttpError(INVALID_RESPONSE_MESSAGE, response.status, { cause: error });
  }
}

function buildRequestOptions(method, body) {
  const headers = { Accept: "application/json" };
  if (body === undefined) return { method, headers };
  return { method, headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

export async function request(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, buildRequestOptions(method, body));
  } catch (error) {
    throw new HttpError(NETWORK_ERROR_MESSAGE, 0, { cause: error });
  }

  const data = await readJsonBody(response);
  if (!response.ok) {
    throw new HttpError(typeof data?.error === "string" ? data.error : DEFAULT_ERROR_MESSAGE, response.status);
  }
  if (data === null && response.status !== 204) {
    throw new HttpError(INVALID_RESPONSE_MESSAGE, response.status);
  }
  return data;
}
