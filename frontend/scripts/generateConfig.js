import { writeFile } from "node:fs/promises";

const CONFIG_FILE = new URL("../src/config/config.js", import.meta.url);

function readRequired(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta la variable de entorno obligatoria ${name}.`);
  }
  return value;
}

function isHttpUrl(value) {
  return URL.canParse(value) && ["http:", "https:"].includes(new URL(value).protocol);
}

function parseApiBaseUrl(value) {
  const apiBaseUrl = value.replace(/\/+$/, "");
  if (!apiBaseUrl.startsWith("/") && !isHttpUrl(apiBaseUrl)) {
    throw new Error(`El valor de API_BASE_URL no es válido: "${value}".`);
  }
  return apiBaseUrl;
}

async function generateConfig() {
  const apiBaseUrl = parseApiBaseUrl(readRequired("API_BASE_URL"));
  await writeFile(CONFIG_FILE, `export const API_BASE_URL = ${JSON.stringify(apiBaseUrl)};\n`);
  console.log(`Configuración generada en src/config/config.js con API_BASE_URL=${apiBaseUrl}`);
}

try {
  await generateConfig();
} catch (error) {
  console.error(`Configuración inválida: ${error.message}`);
  process.exitCode = 1;
}
