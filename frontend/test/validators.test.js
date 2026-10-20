import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateTaskInput, isValidTaskStatus } from "../src/utils/validators.js";

describe("validateTaskInput", () => {
  it("acepta un título válido con descripción vacía", () => {
    assert.equal(validateTaskInput({ title: "Diseñar API", description: "" }), null);
  });

  it("rechaza títulos cortos aunque tengan espacios", () => {
    assert.deepEqual(validateTaskInput({ title: "  ab   ", description: "" }), {
      field: "title",
      message: "El título debe tener al menos 3 caracteres."
    });
  });

  it("rechaza títulos largos", () => {
    assert.equal(validateTaskInput({ title: "a".repeat(101), description: "" }).field, "title");
  });

  it("rechaza descripciones largas", () => {
    assert.deepEqual(validateTaskInput({ title: "Válida", description: "a".repeat(501) }), {
      field: "description",
      message: "La descripción no puede superar los 500 caracteres."
    });
  });
});

describe("isValidTaskStatus", () => {
  it("solo acepta los estados definidos", () => {
    assert.equal(isValidTaskStatus("en progreso"), true);
    assert.equal(isValidTaskStatus("archivada"), false);
  });
});
