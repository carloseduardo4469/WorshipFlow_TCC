export const FORM_LIMITS = {
  nomePessoa: 32,
  telefone: 11,
  email: 254,
  senha: 72,
  musicaTitulo: 80,
  artista: 80,
  nomeGenerico: 80,
  ministerioNome: 64,
  descricao: 240,
  observacoes: 240,
  busca: 80,
  confirmacaoExclusao: 18,
} as const;

export const NAME_ALLOWED_PATTERN = "[\\p{L} ]+";
export const PHONE_ALLOWED_PATTERN = "\\d{11}";

export function normalizePersonName(value: string) {
  return value.replace(/[^\p{L} ]/gu, "").replace(/\s+/g, " ").trimStart().slice(0, FORM_LIMITS.nomePessoa);
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, FORM_LIMITS.telefone);
}

export function normalizeLimitedText(value: string, limit: number) {
  return value.trim().slice(0, limit);
}

export function validatePersonName(nome: string) {
  const normalized = nome.replace(/\s+/g, " ").trim();
  if (!normalized) return "Informe seu nome.";
  if (normalized.length > FORM_LIMITS.nomePessoa) return `O nome deve ter no maximo ${FORM_LIMITS.nomePessoa} caracteres.`;
  if (!/^[\p{L} ]+$/u.test(normalized)) return "Use apenas letras e espacos no nome.";
  return null;
}

export function validatePhone(telefone: string, required = false) {
  if (!telefone) return required ? "Informe seu telefone." : null;
  if (!/^\d+$/.test(telefone)) return "Use apenas numeros no telefone.";
  if (telefone.length !== FORM_LIMITS.telefone) return "Telefone invalido. Informe DDD + numero, com 11 digitos.";
  return null;
}

export function validateMaxLength(value: string, limit: number, label: string) {
  if (value.length > limit) return `${label} deve ter no maximo ${limit} caracteres.`;
  return null;
}
