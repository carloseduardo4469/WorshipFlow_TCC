import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), getById: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requireAuth: vi.fn(), requireAdmin: vi.fn() }));
vi.mock("@/lib/db/cache", () => ({ invalidateDataCache: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/db/repositories", () => ({
  getRepositories: async () => ({ backend: "local", musicas: mocks }),
}));

import { atualizarMusicaAction, criarMusicaAction, criarMusicaNaEscalaAction } from "@/lib/actions/musicas";

const url = "https://www.cifraclub.com.br/radiohead/creep/";
const expectedLink = `${url}?capo=0&keyShape=11`;
// Estrutura dos metadados e do tom observada na página real de Creep.
const html = `<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": ["MusicRecording", "Article"],
  name: "Radiohead - Creep",
  url,
  byArtist: { "@type": "MusicGroup", name: "Radiohead", url: "https://www.cifraclub.com.br/radiohead/" },
})}</script><script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org", "@type": "MusicComposition", name: "Creep", url,
})}</script><span>Tom<!-- -->: </span> <button type="button" data-anchor="--chord-tone">G</button>`;

function form() {
  const data = new FormData();
  Object.entries({ id: "1", titulo: "Creep", artista: "Radiohead", tonalidade: "G#", preservarPesquisa: "true" })
    .forEach(([key, value]) => data.set(key, value));
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.create.mockImplementation(async (data) => ({ id: 1, createdAt: "", ...data }));
  mocks.update.mockImplementation(async (id, data) => ({ id, createdAt: "", ...data }));
  mocks.getById.mockResolvedValue({ id: 1, titulo: "Creep", artista: "Radiohead", tonalidade: "G#", linkCifra: null, createdAt: "" });
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL) =>
    new Response(String(input) === url ? html : "", { status: String(input) === url ? 200 : 404 })));
});
afterEach(() => vi.unstubAllGlobals());

describe("Creep / Radiohead / G# com o resolvedor real", () => {
  it.each(["Ab", "G♯", "A♭"])("normaliza %s antes de persistir", async (tom) => {
    const data = form();
    data.set("tonalidade", tom);
    const result = await criarMusicaAction(null, data);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ tonalidade: "G#", linkCifra: expectedLink }));
    expect(result).toMatchObject({ success: true, musica: { tonalidade: "G#", linkCifra: expectedLink } });
  });
  it.each([
    ["biblioteca", criarMusicaAction],
    ["escala", criarMusicaNaEscalaAction],
  ] as const)("salva e devolve a cifra no cadastro pela %s", async (_, action) => {
    const result = await action(null, form());

    expect(mocks.create).toHaveBeenCalledWith({ titulo: "Creep", artista: "Radiohead", tonalidade: "G#", linkCifra: expectedLink });
    expect(result).toMatchObject({ success: true, musica: { linkCifra: expectedLink, tonalidade: "G#" } });
  });

  it("recupera o cadastro sem cifra ao salvar novamente sem alterar os dados", async () => {
    const result = await atualizarMusicaAction(null, form());

    expect(mocks.update).toHaveBeenCalledWith(1, expect.objectContaining({ linkCifra: expectedLink, tonalidade: "G#" }));
    expect(result).toMatchObject({ success: true, musica: { linkCifra: expectedLink, tonalidade: "G#" } });
  });
});
