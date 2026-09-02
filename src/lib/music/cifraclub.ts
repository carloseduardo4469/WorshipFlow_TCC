import { ehTonalidadeMenor, relativaMenor } from "@/lib/music/tonalidades";

const CIFRA_CLUB_BASE_URL = "https://www.cifraclub.com.br";

const ARTIST_ALIASES: Record<string, string> = {
  "adoracao-adoradores": "adoracao-e-adoradores",
  "altomonte-music": "altomonte",
  "attos-2-worship": "attos2-worship",
  "cultura-do-ceu-kaleb-e-josh-davi-fernandes":
    "cultura-do-ceu-kaleb-e-josh-e-davi-fernandes",
  "dunamis-music": "dunamis-movement",
  fhop: "florianopolis-house-of-prayer",
  "fhop-music": "florianopolis-house-of-prayer",
  fhopmusic: "florianopolis-house-of-prayer",
  "florianopolis-house-of-prayer": "florianopolis-house-of-prayer",
  "florianopolis-house-of-prayer-fhop": "florianopolis-house-of-prayer",
  "florianopolis-house-of-prayer-fhop-music": "florianopolis-house-of-prayer",
  "jose-jr": "jose-augusto-five-music",
  "kaleb-josh": "kaleb-e-josh",
  kemuel: "coral-kemuel",
  morada: "ministerio-morada",
  "nic-rachael-billman": "nic-e-rachael-billman",
  "ministerio-voz-de-muitas-aguas": "voz-de-muitas-aguas",
  "pedras-vivas": "ministerio-pedras-vivas",
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

const SONG_SLUG_ALIASES: Record<string, string> = {
  "alessandro-vilas-boas/deixa-queimar-part-brunao-morada": "deixa-queimar",
  "alessandro-vilas-boas/quero-conhecer-jesus":
    "quero-conhecer-jesus-o-meu-amado--o-mais-belo",
  "aline-barros/rendido-estou-part-fernandinho-e-bruna-karla": "rendido-estou",
  "ana-nobrega/oh-quao-lindo-esse-nome-e-what-a-beautiful-name":
    "oh-quao-lindo-esse-nome-",
  "bola-de-neve/autoridade-e-poder": "autoridade-poder",
  "cultura-do-ceu/cultura-do-ceu-reino-inabalavel-part-kaleb-e-josh-davi-fernandes":
    "cultura-do-ceu-reino-inabalavel-pai-nosso",
  "delino-marcal/deus-e-deus": "deus--deus",
  "diante-do-trono/me-ama": "me-ama-",
  "fernandinho/ainda-que-a-figueira": "ainda-que-figueira-",
  "florianopolis-house-of-prayer/tu-es-aguas-purificadoras-pot-pourri":
    "tu-es-aguas-purificadoras",
  "gabriela-rocha/eu-e-o-rei-weslei-santos": "eu-e-o-rei",
  "gabriela-rocha/toda-terra": "toda-terra-ao-vivo",
  "juliano-son/lindo-es-so-quero-ver-voce": "lindo-s",
  "laura-souguellis/amor-que-enche": "amor-que-enche-love-that-fills",
  "marco-telles/colossenses-e-suas-linhas-de-amor-part-fhop-music":
    "colossenses-e-suas-linhas-de-amor",
  "marco-telles/unico-part-fhop-music": "unico",
  "mateus-brito/jesus-te-amo-nao-temo-ondas-pot-pourri":
    "jesus-te-amo--nao-temo-ondas-pot-pourri",
  "ministerio-morada/e-tudo-sobre-voce-ser-mudado":
    "e-tudo-sobre-voce-ser-mudado-medley",
  "ministerio-morada/para-onde-eu-irei": "pra-onde-eu-irei",
  "ministerio-morada/so-tu-es-santo": "so-tu-s-santo",
  "ministerio-morada/so-tu-es-santo-uma-coisa-deixa-queimar-quando-ele-vem-pot-pourri":
    "so-tu-es-santo-uma-coisa-deixa-queimar-quando-ele-vem-ao-vivo",
  "ministerio-zoe/aquieta-minhalma": "aquieta-minh-alma",
  "nivea-soares/nao-seremos-abalados": "nao-seremos-abalados-we-will-not-be-shaken",
  "nivea-soares/que-se-abram-os-ceus": "que-se-abra-os-ceus",
  "one-sounds/como-eu-te-amo": "como-eu-te-amo-",
  "pr-w-junior/tu-es-o-rei": "tu-s-o-rei",
};

const CHROMATIC_POSITIONS: Record<string, number> = {
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
async function detectarTomNaUrl(url: URL): Promise<string | null> {
  try {
    const resposta = await fetch(url, {
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

function resolveSongSlug(artistSlug: string, titulo: string) {
  const songSlug = toCifraClubSlug(titulo);
  return SONG_SLUG_ALIASES[`${artistSlug}/${songSlug}`] ?? songSlug;
}

export async function detectarTomOriginalCifraClub(path: string): Promise<string | null> {
  return detectarTomNaUrl(new URL(`${CIFRA_CLUB_BASE_URL}/${path}/`));
}

/** Descobre o deslocamento específico da página e monta sua versão original sem capotraste. */
export async function resolverCifraOriginalSemCapotraste({
  titulo,
  artista,
}: {
  titulo: string;
  artista: string;
}) {
  const artistSlug = resolveArtistSlug(artista);
  const songSlug = resolveSongSlug(artistSlug, titulo);
  if (!artistSlug || !songSlug) return null;

  const urlOriginal = new URL(`${CIFRA_CLUB_BASE_URL}/${artistSlug}/${songSlug}/`);
  const urlFormaZero = new URL(urlOriginal);
  urlFormaZero.searchParams.set("capo", "0");
  urlFormaZero.searchParams.set("keyShape", "0");
  const [tomOriginal, tomFormaZero] = await Promise.all([
    detectarTomNaUrl(urlOriginal),
    detectarTomNaUrl(urlFormaZero),
  ]);
  if (!tomOriginal || !tomFormaZero) return null;

  const notaOriginal = noteFromKey(tomOriginal);
  const notaFormaZero = noteFromKey(tomFormaZero);
  if (!notaOriginal || !notaFormaZero) return null;
  const posicaoOriginal = CHROMATIC_POSITIONS[notaOriginal];
  const posicaoFormaZero = CHROMATIC_POSITIONS[notaFormaZero];
  if (posicaoOriginal === undefined || posicaoFormaZero === undefined) return null;

  const keyShape = (posicaoOriginal - posicaoFormaZero + 12) % 12;
  urlOriginal.searchParams.set("capo", "0");
  urlOriginal.searchParams.set("keyShape", String(keyShape));
  return { linkCifra: urlOriginal.toString(), tonalidade: tomOriginal };
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
  const songSlug = resolveSongSlug(artistSlug, titulo);
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

function targetKeyForSong(originalKey: string, selectedKey: string) {
  const original = normalizeKey(originalKey);
  let target = normalizeKey(selectedKey);
  if (!original || !target) return null;

  // O seletor do WorshipFlow usa tons maiores. Para uma cifra originalmente
  // menor, a seleção representa sua relativa maior (G selecionado -> Em).
  if (ehTonalidadeMenor(original) && !ehTonalidadeMenor(target)) {
    target = relativaMenor(target);
  }
  return target;
}

/**
 * Troca o tom sem recriar o caminho da cifra. O keyShape do Cifra Club tem um
 * deslocamento próprio em cada página; por isso o cálculo parte do keyShape já
 * validado e salvo, em vez de assumir que ele é absoluto.
 */
export function aplicarTonalidadeAoLinkCifra({
  linkCifra,
  tonalidadeOriginal,
  tonalidadeSelecionada,
}: {
  linkCifra: string | null;
  tonalidadeOriginal: string | null;
  tonalidadeSelecionada: string | null;
}) {
  if (!linkCifra || !tonalidadeOriginal || !tonalidadeSelecionada) return null;

  let url: URL;
  try {
    url = new URL(linkCifra);
  } catch {
    return null;
  }
  if (!["cifraclub.com.br", "www.cifraclub.com.br"].includes(url.hostname.toLowerCase())) {
    return null;
  }

  const originalKeyShape = Number(url.searchParams.get("keyShape"));
  const originalNote = noteFromKey(tonalidadeOriginal);
  const targetKey = targetKeyForSong(tonalidadeOriginal, tonalidadeSelecionada);
  const targetNote = targetKey ? noteFromKey(targetKey) : null;
  if (
    !Number.isInteger(originalKeyShape) ||
    originalKeyShape < 0 ||
    originalKeyShape > 11 ||
    !originalNote ||
    !targetNote
  ) {
    return null;
  }

  const originalPosition = CHROMATIC_POSITIONS[originalNote];
  const targetPosition = CHROMATIC_POSITIONS[targetNote];
  if (originalPosition === undefined || targetPosition === undefined) return null;

  const targetKeyShape = (originalKeyShape + targetPosition - originalPosition + 12) % 12;
  url.protocol = "https:";
  url.hostname = "www.cifraclub.com.br";
  url.hash = "";
  url.searchParams.set("capo", "0");
  url.searchParams.set("keyShape", String(targetKeyShape));
  return { linkCifra: url.toString(), tonalidade: targetKey };
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
  const songSlug = resolveSongSlug(artistSlug, titulo);
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
