export const TONALIDADES_VALIDAS = [
  "C",
  "Cm",
  "C#",
  "C#m",
  "Db",
  "Dbm",
  "D",
  "Dm",
  "D#",
  "D#m",
  "Eb",
  "Ebm",
  "E",
  "Em",
  "F",
  "Fm",
  "F#",
  "F#m",
  "Gb",
  "Gbm",
  "G",
  "Gm",
  "G#",
  "G#m",
  "Ab",
  "Abm",
  "A",
  "Am",
  "A#",
  "A#m",
  "Bb",
  "Bbm",
  "B",
  "Bm",
] as const;

export const TONALIDADES_VALIDAS_SET = new Set<string>(TONALIDADES_VALIDAS);

export const TONALIDADE_INVALIDA_MESSAGE =
  "Use um tom musical real, como C, D, Em, F#m ou G#.";

export function isTonalidadeValida(tonalidade: string | null | undefined) {
  return Boolean(tonalidade && TONALIDADES_VALIDAS_SET.has(tonalidade));
}
