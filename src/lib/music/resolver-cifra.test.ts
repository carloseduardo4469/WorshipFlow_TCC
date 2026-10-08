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
function paginaFormatoAtual(title: string, artist: string, path: string, tone: string) {
  const composition = { "@type": "MusicComposition", name: title, url: `${base}/${artist}/${path}/` };
  const recording = {
    "@type": ["MusicRecording", "Article"],
    name: `${artist} - ${title}`,
    url: `${base}/${artist}/${path}/`,
    byArtist: { "@type": "MusicGroup", name: artist, url: `${base}/${artist}/` },
  };
  return `<script type="application/ld+json">${JSON.stringify(recording)}</script><script type="application/ld+json">${JSON.stringify(composition)}</script><span>Tom<!-- -->: </span> <button type="button" data-anchor="--chord-tone">${tone}</button>`;
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
  it("reconhece um título alternativo conhecido e confirmado pela página", async () => {
    const path = "e-tudo-sobre-voce-ser-mudado-medley";
    mockPages({ [`${base}/ministerio-morada/${path}/`]: page("É Tudo Sobre Você / Ser Mudado", "ministerio-morada", path) });
    expect(await resolverCifraValidada({ titulo: "É Tudo Sobre Você", artista: "Morada", tonalidade: "C" }))
      .toEqual({ tonalidade: "C", linkCifra: `${base}/ministerio-morada/${path}/?capo=0&keyShape=3` });
  });
  it("não aceita outro título somente porque a URL é conhecida", () => {
    const path = "e-tudo-sobre-voce-ser-mudado-medley";
    expect(conferirPaginaCifra(page("Outra Música", "ministerio-morada", path),
      `${base}/ministerio-morada/${path}/`, "É Tudo Sobre Você", "ministerio-morada")).toBeNull();
  });
  it.each([503, 502, "network"])("recupera uma falha temporária: %s", async (failure) => {
    const mock = mockPages({ [`${base}/artista-teste/minha-cancao/`]: page("Minha Canção", "artista-teste", "minha-cancao") });
    if (failure === "network") mock.mockRejectedValueOnce(new TypeError("fetch failed"));
    else mock.mockResolvedValueOnce(new Response(null, { status: Number(failure) }));
    expect(await resolverCifraValidada({ titulo: "Minha Canção", artista: "Artista Teste", tonalidade: "G" })).not.toBeNull();
    expect(mock).toHaveBeenCalledTimes(2);
  });
  it("limita as tentativas quando o serviço está indisponível", async () => {
    const mock = vi.fn(async () => new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", mock);
    expect(await resolverCifraValidada({ titulo: "Minha Canção", artista: "Artista Teste", tonalidade: "G" })).toBeNull();
    expect(mock.mock.calls.length).toBeLessThanOrEqual(13);
  });
  it("aceita a lista de artistas nos metadados e ignora entradas nulas", () => {
    const url = `${base}/artista-teste/minha-cancao/`;
    const html = `<script type="application/ld+json">${JSON.stringify({ "@graph": [null,
      { "@type": "MusicComposition", name: "Minha Canção", url },
      { "@type": "MusicRecording", url, byArtist: [{ url: `${base}/artista-teste/` }] },
    ] })}</script>Tom: A`;
    expect(conferirPaginaCifra(html, url, "Minha Canção", "artista-teste")).toEqual({ url, tom: "A" });
    expect(conferirPaginaCifra(html.replace('"MusicRecording","url":"' + url, '"MusicRecording","url":"' + base + '/outra/'), url, "Minha Canção", "artista-teste")).toBeNull();
  });
  it.each(["http", "rede"])("repete uma falha temporária de %s antes de descartar a cifra", async (falha) => {
    const url = `${base}/artista-teste/minha-cancao/`;
    const fetchMock = vi.fn<typeof fetch>(async () => new Response("", { status: 404 }));
    if (falha === "rede") fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    else fetchMock.mockResolvedValueOnce(new Response("Indisponível", { status: 503 }));
    fetchMock.mockResolvedValueOnce(new Response(page("Minha Canção", "artista-teste", "minha-cancao")));
    vi.stubGlobal("fetch", fetchMock);

    expect(await resolverCifraValidada({ titulo: "Minha Canção", artista: "Artista Teste", tonalidade: "G" }))
      .toEqual({ tonalidade: "G", linkCifra: `${url}?capo=0&keyShape=10` });
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(url);
  });
  it("encontra título com apóstrofo codificado no catálogo", async () => {
    mockPages({
      [`${base}/artista-teste/musicas.html`]: '<a href="/artista-teste/caminho-antigo/"><p class="primaryLabel">Fonte D&#x27;Água</p></a>',
      [`${base}/artista-teste/caminho-antigo/`]: page("Fonte D'Água", "artista-teste", "caminho-antigo"),
    });
    expect(await resolverCifraValidada({ titulo: "Fonte D’Água", artista: "Artista Teste", tonalidade: "G" }))
      .toMatchObject({ linkCifra: `${base}/artista-teste/caminho-antigo/?capo=0&keyShape=10` });
  });
  it("aceita lista de artistas e ignora registros JSON-LD nulos", () => {
    const url = `${base}/artista-teste/minha-cancao/`;
    const html = `<script type="application/ld+json">${JSON.stringify({ "@graph": [
      null,
      { "@type": "MusicComposition", name: "Minha Canção", url },
      { "@type": "MusicRecording", byArtist: [{ url: `${base}/artista-teste/` }] },
    ] })}</script>Tom: </span><button>Am</button>`;
    expect(conferirPaginaCifra(html, url, "Minha Canção", "artista-teste")).toEqual({ url, tom: "Am" });
  });
  it("consulta o artista mesmo quando um endereço interno ficou desatualizado", async () => {
    mockPages({
      "https://solr.sscdn.co/cifraclub-explore/v1/artists/suggest?q=MORADA": JSON.stringify({ artists: [{ name: "MORADA", slug: "morada-atual" }] }),
      [`${base}/morada-atual/minha-cancao/`]: page("Minha Canção", "morada-atual", "minha-cancao"),
    });
    expect(await resolverCifraValidada({ titulo: "Minha Canção", artista: "MORADA", tonalidade: "G" }))
      .toMatchObject({ linkCifra: `${base}/morada-atual/minha-cancao/?capo=0&keyShape=10` });
  });
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
  it("resolve o formato atual do CifraClub com JSON-LD separado e comentário no rótulo do tom", async () => {
    const url = `${base}/diante-do-trono/aguas-purificadoras/`;
    mockPages({ [url]: paginaFormatoAtual("Águas Purificadoras", "diante-do-trono", "aguas-purificadoras", "D") });

    const result = await resolverCifraValidada({ titulo: "Águas Purificadoras", artista: "Diante do Trono", tonalidade: "G" });

    expect(result).toEqual({ tonalidade: "G", linkCifra: `${url}?capo=0&keyShape=10` });
  });
  it("preserva o modo menor e os bemóis Unicode ao aplicar o tom escolhido", async () => {
    const url = `${base}/alessandro-vilas-boas/ser-mudado/`;
    mockPages({ [url]: paginaFormatoAtual("Ser Mudado", "alessandro-vilas-boas", "ser-mudado", "B♭m") });

    const result = await resolverCifraValidada({ titulo: "Ser Mudado", artista: "Alessandro Vilas Boas", tonalidade: "C#" });

    expect(result).toEqual({ tonalidade: "A#m", linkCifra: `${url}?capo=0&keyShape=1` });
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
