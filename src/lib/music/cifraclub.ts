const CIFRA_CLUB_BASE_URL = "https://www.cifraclub.com.br";

const ARTIST_ALIASES: Record<string, string> = {
  fhop: "florianopolis-house-of-prayer",
  "fhop-music": "florianopolis-house-of-prayer",
  fhopmusic: "florianopolis-house-of-prayer",
  "florianopolis-house-of-prayer": "florianopolis-house-of-prayer",
  "florianopolis-house-of-prayer-fhop": "florianopolis-house-of-prayer",
};

const ORIGINAL_KEYS: Record<string, string> = {
  "florianopolis-house-of-prayer/fe": "C#m",
  "rodolfo-abrantes/pisaduras": "Em",
};

const KEY_SHAPES: Record<string, number> = {
  A: 0,
  "A#": 1,
  Bb: 1,
  B: 2,
  C: 3,
  "C#": 4,
  Db: 4,
  D: 5,
  "D#": 6,
  Eb: 6,
  E: 7,
  F: 8,
  "F#": 9,
  Gb: 9,
  G: 10,
  "G#": 11,
  Ab: 11,
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function toCifraClubSlug(value: string) {
  return normalizeText(value)
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveArtistSlug(artista: string) {
  const slug = toCifraClubSlug(artista);
  return ARTIST_ALIASES[slug] ?? slug;
}

function normalizeKey(tonalidade: string) {
  const match = tonalidade.trim().match(/^([A-Ga-g])([#b]?)(m?)$/);
  if (!match) return null;

  const [, note, accidental, minor] = match;
  return `${note.toUpperCase()}${accidental}${minor}`;
}

function noteFromKey(tonalidade: string) {
  return normalizeKey(tonalidade)?.replace(/m$/, "") ?? null;
}

function shouldOmitKeyShape(path: string, tonalidade: string) {
  const originalKey = ORIGINAL_KEYS[path];
  if (!originalKey) return false;

  return normalizeKey(originalKey) === normalizeKey(tonalidade);
}

export function gerarLinkCifraClub({
  titulo,
  artista,
  tonalidade,
}: {
  titulo: string;
  artista: string | null;
  tonalidade: string | null;
}) {
  if (!titulo.trim() || !artista?.trim()) return null;

  const artistSlug = resolveArtistSlug(artista);
  const songSlug = toCifraClubSlug(titulo);
  if (!artistSlug || !songSlug) return null;

  const path = `${artistSlug}/${songSlug}`;
  const url = new URL(`${CIFRA_CLUB_BASE_URL}/${path}/`);
  const note = tonalidade ? noteFromKey(tonalidade) : null;

  url.searchParams.set("capo", "0");

  if (note && !shouldOmitKeyShape(path, tonalidade ?? "")) {
    const keyShape = KEY_SHAPES[note];
    if (keyShape !== undefined) url.searchParams.set("keyShape", String(keyShape));
  }

  return url.toString();
}
