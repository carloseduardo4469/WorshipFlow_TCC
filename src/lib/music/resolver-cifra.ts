import { aplicarTonalidadeAoLinkCifra, gerarLinkCifraClub, toCifraClubSlug } from "./cifraclub";

const BASE = "https://www.cifraclub.com.br";
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

function decode(value: string) {
  return value.replace(/&quot;/g, '"').replace(/&apos;|&rsquo;|&lsquo;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code: string) => {
      const n = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code);
      return n <= 0x10ffff ? String.fromCodePoint(n) : "";
    }).replace(/&amp;/g, "&");
}
/** Normaliza apresentação, sem aproximação que possa escolher outra música. */
export function normalizarTituloCifra(value: string) {
  return toCifraClubSlug(decode(value)
    .replace(/^\s*(?:hino\s*)?\d+\s*[-–—:.]\s*/i, "")
    .replace(/\s*[-–—]\s*\d+\s*$/, "")
    .replace(/\s*[([]\s*(?:ao vivo|live|ac[uú]stico|acoustic|oficial|official)\s*[)\]]/gi, ""));
}
function safeUrl(value: string): URL | null {
  try {
    const url = new URL(decode(value), BASE);
    return url.protocol === "https:" && ["www.cifraclub.com.br", "cifraclub.com.br"].includes(url.hostname)
      && !url.username && !url.password && !url.port ? url : null;
  } catch { return null; }
}
type ConfirmedPage = { url: string; tom: string };

export function conferirPaginaCifra(html: string, url: string, titulo: string, artistSlug: string): ConfirmedPage | null {
  const target = safeUrl(url);
  if (!target || target.pathname.split("/")[1] !== artistSlug) return null;
  const records: Array<Record<string, unknown>> = [];
  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]);
      const entries = Array.isArray(parsed) ? parsed : parsed?.["@graph"] ?? [parsed];
      if (Array.isArray(entries)) {
        records.push(...entries.filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry)));
      }
    } catch { /* Não aceitar metadados quebrados. */ }
  }
  const hasType = (record: Record<string, unknown>, type: string) => [record?.["@type"]].flat().includes(type);
  const composition = records.find((record) => hasType(record, "MusicComposition") && typeof record.name === "string"
    && normalizarTituloCifra(record.name) === normalizarTituloCifra(titulo));
  const recording = records.find((record) => {
    if (!hasType(record, "MusicRecording") || !record.byArtist || typeof record.byArtist !== "object") return false;
    const artists = Array.isArray(record.byArtist) ? record.byArtist : [record.byArtist];
    return artists.some((artist) => artist && typeof artist.url === "string"
      && safeUrl(artist.url)?.pathname.replace(/\/$/, "") === `/${artistSlug}`);
  });
  if (!composition || !recording) return null;
  const canonical = typeof composition.url === "string" ? safeUrl(composition.url) : null;
  if (!canonical || canonical.pathname !== target.pathname) return null;
  const tom = html.match(/Tom(?:<!--\s*-->)?\s*:\s*<\/span>\s*<button[^>]*>\s*([A-G][#b♯♭]?m?)\s*<\/button>/)?.[1]
    ?? html.replace(/<[^>]+>/g, " ").match(/\bTom:?\s+([A-G][#b♯♭]?m?)(?=\s|$)/)?.[1];
  return tom ? { url: canonical.toString(), tom } : null;
}

/** Descobre candidatos, mas só devolve uma cifra depois de confirmar título, artista e tom na página. */
export async function resolverCifraValidada({ titulo, artista, tonalidade }: { titulo: string; artista: string; tonalidade: string | null }) {
  if (!titulo.trim() || !artista.trim()) return null;
  const signal = AbortSignal.timeout(12000);
  const visited = new Set<string>();
  let requests = 0;
  async function read(url: URL, redirects = 0): Promise<{ html: string; url: string } | null> {
    if (!safeUrl(url.toString()) || signal.aborted || redirects > 2) return null;
    // Uma conexão interrompida ou um 5xx não deve descartar uma cifra existente.
    // O prazo por requisição deixa tempo para a segunda tentativa e o catálogo.
    for (let attempt = 0; attempt < 2 && requests < 8 && !signal.aborted; attempt++) {
      requests++;
      try {
        const response = await fetch(url, {
          signal: AbortSignal.any([signal, AbortSignal.timeout(4000)]),
          cache: "no-store",
          redirect: "manual",
        });
        if ([301, 302, 307, 308].includes(response.status)) {
          const location = response.headers.get("location");
          const next = location ? safeUrl(new URL(location, url).toString()) : null;
          return next ? read(next, redirects + 1) : null;
        }
        if (response.status >= 500) {
          await response.body?.cancel();
          continue;
        }
        if (!response.ok) return null;
        const html = await response.text();
        return html.length <= 2_000_000 ? { html, url: url.toString() } : null;
      } catch { /* Repetir somente dentro dos limites de tempo e requisições. */ }
    }
    return null;
  }
  const known = gerarLinkCifraClub({ titulo, artista, tonalidade: null });
  let artistSlug = known ? new URL(known).pathname.split("/")[1] : toCifraClubSlug(artista);
  if (!SLUG.test(artistSlug)) return null;
  async function confirm(url: URL) {
    url.search = "";
    if (visited.has(url.toString())) return null;
    visited.add(url.toString());
    const page = await read(url);
    if (!page) return null;
    const confirmed = conferirPaginaCifra(page.html, page.url, titulo, artistSlug);
    if (!confirmed) return null;
    const converted = aplicarTonalidadeAoLinkCifra({ linkCifra: confirmed.url, tonalidadeOriginal: confirmed.tom,
      tonalidadeSelecionada: tonalidade && tonalidade !== "Indefinido" ? tonalidade : confirmed.tom });
    return converted ? { linkCifra: converted.linkCifra, tonalidade: tonalidade === "Indefinido" ? tonalidade : converted.tonalidade } : null;
  }
  const titles = [...new Set([known ? new URL(known).pathname.split("/")[2] : toCifraClubSlug(titulo), normalizarTituloCifra(titulo)])].filter((slug) => SLUG.test(slug));
  for (const title of titles) {
    const found = await confirm(new URL(`/${artistSlug}/${title}/`, BASE));
    if (found) return found;
  }
  // Descoberta pública usada pelo próprio Cifra Club. Não aceitar o primeiro resultado por aproximação.
  if (!signal.aborted) {
    try {
      const search = new URL("https://solr.sscdn.co/cifraclub-explore/v1/artists/suggest");
      search.searchParams.set("q", artista);
      const response = await fetch(search, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(2000)]),
        cache: "no-store", redirect: "error",
      });
      const data = response.ok ? await response.json() : null;
      const artists = Array.isArray(data?.artists) ? data.artists.filter((item: { name?: unknown; slug?: unknown }) =>
        typeof item.name === "string" && typeof item.slug === "string" && SLUG.test(item.slug) && toCifraClubSlug(item.name) === toCifraClubSlug(artista)) : [];
      if (artists.length === 1 && artists[0].slug !== artistSlug) {
        artistSlug = artists[0].slug;
        for (const title of titles) {
          const found = await confirm(new URL(`/${artistSlug}/${title}/`, BASE));
          if (found) return found;
        }
      }
    } catch { /* O cadastro permanece disponível se a busca externa falhar. */ }
  }
  // Caminhos irregulares são descobertos pelos links reais do catálogo do artista.
  const catalog = await read(new URL(`/${artistSlug}/musicas.html`, BASE));
  if (catalog) {
    const candidates = new Set<string>();
    for (const match of catalog.html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
      const url = safeUrl(match[1]);
      if (!url || !new RegExp(`^/${artistSlug}/[a-z0-9-]+/$`).test(url.pathname)) continue;
      const label = match[2].match(/<p[^>]*class=["'][^"']*primaryLabel[^"']*["'][^>]*>([\s\S]*?)<\/p>/)?.[1] ?? match[2];
      if (normalizarTituloCifra(label.replace(/<[^>]+>/g, "").trim()) === normalizarTituloCifra(titulo)) candidates.add(url.toString());
    }
    // Resultados ambíguos ficam sem link em vez de escolher uma gravação aleatória.
    if (candidates.size === 1) return confirm(new URL([...candidates][0]));
  }
  return null;
}
