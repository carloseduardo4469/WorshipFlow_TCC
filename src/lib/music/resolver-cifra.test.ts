import { afterEach, describe, expect, it, vi } from "vitest";
import { conferirPaginaCifra, normalizarTituloCifra, resolverCifraValidada } from "./resolver-cifra";

const base = "https://www.cifraclub.com.br";
function page(title: string, artist: string, path: string, tone = "A") {
  const metadata = [
    { "@type": "MusicComposition", name: title, url: `${base}/${artist}/${path}/` },
    { "@type": ["MusicRecording", "Article"], byArtist: { url: `${base}/${artist}/` } },
  ];
  return `<script type="application/ld+json">${JSON.stringify(metadata)}</script>Tom: </span><button>${tone}</button>`;
}
function mockPages(pages: Record<string, string>) {
  const mock = vi.fn(async (input: string | URL) => {
    const body = pages[String(input)];
    return new Response(body ?? "", { status: body === undefined ? 404 : 200 });
  });
  vi.stubGlobal("fetch", mock);
  return mock;
}
afterEach(() => vi.unstubAllGlobals());

describe("resolução geral de cifras", () => {
  it.each(["123 - Minha Canção", "Minha Canção - 123", "Minha Canção (Ao Vivo)"])("normaliza %s", (title) => {
    expect(normalizarTituloCifra(title)).toBe("minha-cancao");
  });
  it("preserva números que fazem parte do título", () => {
    expect(normalizarTituloCifra("10 mil razões")).toBe("10-mil-razoes");
  });
  it("resolve um artista fora da lista interna e aplica o tom escolhido", async () => {
    mockPages({ [`${base}/artista-teste/minha-cancao/`]: page("Minha Canção", "artista-teste", "minha-cancao") });
    const result = await resolverCifraValidada({ titulo: "Minha Canção", artista: "Artista Teste", tonalidade: "G" });
    expect(result).toEqual({ tonalidade: "G", linkCifra: `${base}/artista-teste/minha-cancao/?capo=0&keyShape=10` });
  });
  it("descobre o slug real do artista pela busca pública", async () => {
    mockPages({
      "https://solr.sscdn.co/cifraclub-explore/v1/artists/suggest?q=Artista+Teste": JSON.stringify({ artists: [{ name: "Artista Teste", slug: "outro-slug" }] }),
      [`${base}/outro-slug/minha-cancao/`]: page("Minha Canção", "outro-slug", "minha-cancao", "C"),
    });
    expect(await resolverCifraValidada({ titulo: "Minha Canção", artista: "Artista Teste", tonalidade: "Indefinido" }))
      .toEqual({ tonalidade: "Indefinido", linkCifra: `${base}/outro-slug/minha-cancao/?capo=0&keyShape=3` });
  });
  it("descobre caminhos irregulares no catálogo sem aproximação de título", async () => {
    mockPages({
      [`${base}/artista-teste/musicas.html`]: '<a href="/artista-teste/caminho-antigo/"><p class="primaryLabel">Minha Canção</p></a>',
      [`${base}/artista-teste/caminho-antigo/`]: page("Minha Canção", "artista-teste", "caminho-antigo", "Am"),
    });
    expect(await resolverCifraValidada({ titulo: "Minha Canção", artista: "Artista Teste", tonalidade: "G" }))
      .toEqual({ tonalidade: "Em", linkCifra: `${base}/artista-teste/caminho-antigo/?capo=0&keyShape=7` });
  });
  it("rejeita páginas de outra música, outro artista e respostas sem metadados", () => {
    const url = `${base}/artista-teste/minha-cancao/`;
    expect(conferirPaginaCifra(page("Outra", "artista-teste", "minha-cancao"), url, "Minha Canção", "artista-teste")).toBeNull();
    expect(conferirPaginaCifra(page("Minha Canção", "outro", "minha-cancao"), url, "Minha Canção", "artista-teste")).toBeNull();
    expect(conferirPaginaCifra("Página não encontrada. Tom: A", url, "Minha Canção", "artista-teste")).toBeNull();
  });
  it("não segue redirecionamento para outro domínio", async () => {
    const mock = vi.fn(async () => new Response(null, { status: 302, headers: { location: "https://example.com/" } }));
    vi.stubGlobal("fetch", mock);
    expect(await resolverCifraValidada({ titulo: "Minha Canção", artista: "Artista Teste", tonalidade: "G" })).toBeNull();
    expect(mock.mock.calls.every((call: unknown[]) => !String(call[0]).includes("example.com"))).toBe(true);
  });
  it("não escolhe entre dois caminhos com o mesmo título", async () => {
    mockPages({ [`${base}/artista-teste/musicas.html`]: '<a href="/artista-teste/versao-1/">Minha Canção</a><a href="/artista-teste/versao-2/">Minha Canção</a>' });
    expect(await resolverCifraValidada({ titulo: "Minha Canção", artista: "Artista Teste", tonalidade: "G" })).toBeNull();
  });
});
