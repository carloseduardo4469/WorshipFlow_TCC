// Escala cromática em notação por sustenidos — não existem B# nem E#.
const CROMATICA = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

// Bemóis aceitos apenas para compatibilidade com valores já salvos (Db, Eb, Gb, Ab, Bb).
const POSICOES: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

/** Tons selecionáveis no sistema: sempre maiores, com sustenidos (sem B#/E#, que não existem). */
export const TONALIDADES_MAIORES = CROMATICA;

const TOM_REGEX = /^([A-Ga-g])([#b]?)(m?)$/;

function normalizarTom(tom: string): string | null {
  const match = tom.trim().match(TOM_REGEX);
  if (!match) return null;
  const [, nota, acidente, menor] = match;
  const notaNormalizada = `${nota.toUpperCase()}${acidente}`;
  if (POSICOES[notaNormalizada] === undefined) return null; // rejeita B#, E#, Cb, Fb...
  return `${notaNormalizada}${menor}`;
}

/** Tom menor termina com "m" (ex.: C#m, Em). */
export function ehTonalidadeMenor(tom: string): boolean {
  const normalizado = normalizarTom(tom);
  return normalizado !== null && normalizado.endsWith("m");
}

/** Relativa menor de um tom maior (3 semitons abaixo): C → Am, E → C#m. */
export function relativaMenor(tom: string): string | null {
  const normalizado = normalizarTom(tom);
  if (!normalizado || normalizado.endsWith("m")) return null;
  const pos = POSICOES[normalizado];
  return `${CROMATICA[(pos + 9) % 12]}m`;
}

/** Relativa maior de um tom menor (3 semitons acima): C#m → E, Am → C. */
export function relativaMaior(tom: string): string | null {
  const normalizado = normalizarTom(tom);
  if (!normalizado || !normalizado.endsWith("m")) return null;
  const pos = POSICOES[normalizado.slice(0, -1)];
  return CROMATICA[(pos + 3) % 12];
}

/**
 * Converte um tom salvo (inclusive legado em menor/bemol) para o tom maior
 * equivalente do seletor: C#m → E, Cm → D#, Db → C#. Valores inválidos → "".
 */
export function tomParaSelecao(tom: string | null | undefined): string {
  if (!tom) return "";
  const normalizado = normalizarTom(tom);
  if (!normalizado) return "";
  const menor = normalizado.endsWith("m");
  const pos = POSICOES[menor ? normalizado.slice(0, -1) : normalizado];
  if (pos === undefined) return "";
  return menor ? CROMATICA[(pos + 3) % 12] : CROMATICA[pos];
}

export function isTonalidadeValida(tonalidade: string | null | undefined) {
  return Boolean(tonalidade && (TONALIDADES_MAIORES as readonly string[]).includes(tonalidade));
}

export const TONALIDADE_INVALIDA_MESSAGE =
  "Escolha um tom maior: C, C#, D, D#, E, F, F#, G, G#, A, A# ou B.";
