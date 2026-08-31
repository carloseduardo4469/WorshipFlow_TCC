import { ehTonalidadeMenor, relativaMenor } from "@/lib/music/tonalidades";

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

const CIFRA_CLUB_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// O tom da cifra fica num botão logo após o rótulo "Tom:" da barra do site.
const TOM_PADRAO = /Tom(?:<!--\s*-->)?\s*:\s*<\/span>\s*<button[^>]*>\s*([A-G][#b]?m?)\s*<\/button>/;

/**
 * Detecta o tom original da música direto no CifraClub (sem keyShape a página
 * abre no tom original). É o que permite converter o tom maior cadastrado na
 * relativa menor quando a música é menor — para qualquer música, sem mapa fixo.
 * Falha silenciosamente (null) em caso de rede/timeout/música inexistente.
 */
export async function detectarTomOriginalCifraClub(path: string): Promise<string | null> {
  try {
    const resposta = await fetch(`${CIFRA_CLUB_BASE_URL}/${path}/`, {
      headers: { "User-Agent": CIFRA_CLUB_USER_AGENT, "Accept-Language": "pt-BR,pt;q=0.9" },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!resposta.ok) return null;

    const html = await resposta.text();
    const noBotao = html.match(TOM_PADRAO);
    if (noBotao) return normalizeKey(noBotao[1]);

    const texto = html.replace(/<[^>]+>/g, " ");
    const noTexto = texto.match(/\bTom:?\s+([A-G][#b]?m?)\b/);
    return noTexto ? normalizeKey(noTexto[1]) : null;
  } catch {
    return null;
  }
}

/** Resolve o caminho da cifra no site e detecta o tom original (null se não houver). */
export async function resolverTomOriginal({
  titulo,
  artista,
}: {
  titulo: string;
  artista: string;
}): Promise<string | null> {
  const artistSlug = resolveArtistSlug(artista);
  const songSlug = toCifraClubSlug(titulo);
  if (!artistSlug || !songSlug) return null;
  return detectarTomOriginalCifraClub(`${artistSlug}/${songSlug}`);
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

export function gerarLinkCifraClub({
  titulo,
  artista,
  tonalidade,
  tomOriginal,
}: {
  titulo: string;
  artista: string | null;
  tonalidade: string | null;
  tomOriginal?: string | null;
}) {
  if (!titulo.trim() || !artista?.trim()) return null;

  const artistSlug = resolveArtistSlug(artista);
  const songSlug = toCifraClubSlug(titulo);
  if (!artistSlug || !songSlug) return null;

  const path = `${artistSlug}/${songSlug}`;
  const url = new URL(`${CIFRA_CLUB_BASE_URL}/${path}/`);
  url.searchParams.set("capo", "0");

  // Tom original: detectado no CifraClub ao salvar; o mapa fixo é o fallback
  // para quando a detecção não está disponível.
  const originalKey =
    normalizeKey(tomOriginal ?? "") ??
    (ORIGINAL_KEYS[path] ? normalizeKey(ORIGINAL_KEYS[path]) : null);

  // O tom cadastrado é sempre maior (padrão do seletor). Em músicas de tom menor,
  // a cifra abre na relativa menor — ex.: tom C → Am, tom E → C#m.
  let tomAlvo = tonalidade ? normalizeKey(tonalidade) : null;
  if (tomAlvo && originalKey && ehTonalidadeMenor(originalKey) && !ehTonalidadeMenor(tomAlvo)) {
    tomAlvo = relativaMenor(tomAlvo);
  }

  if (tomAlvo) {
    const notaAlvo = noteFromKey(tomAlvo);
    // Sem keyShape quando o tom alvo já é o tom original da música no site.
    if (notaAlvo && originalKey !== tomAlvo) {
      const keyShape = KEY_SHAPES[notaAlvo];
      if (keyShape !== undefined) url.searchParams.set("keyShape", String(keyShape));
    }
  }

  return url.toString();
}
