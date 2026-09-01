import { describe, expect, it } from "vitest";
import {
  FORM_LIMITS,
  normalizePersonName,
  normalizePhone,
  validatePersonName,
  validatePhone,
} from "./forms";

describe("validação dos formulários", () => {
  it("remove números, símbolos e emojis do nome", () => {
    expect(normalizePersonName("  Ana  M4ria 😀- Souza ")).toBe("Ana Mria Souza ");
  });

  it("mantém somente onze dígitos no telefone", () => {
    expect(normalizePhone("(11) 98552-0784 extra 99")).toBe("11985520784");
    expect(normalizePhone("1".repeat(30))).toHaveLength(FORM_LIMITS.telefone);
  });

  it("rejeita dados inválidos também na validação de servidor", () => {
    expect(validatePersonName("Lucas 17")).toMatch(/apenas letras/i);
    expect(validatePhone("1198552A784", true)).toMatch(/apenas numeros/i);
    expect(validatePhone("11985520784", true)).toBeNull();
  });
});
