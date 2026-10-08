import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolve: vi.fn(), getById: vi.fn(), update: vi.fn(), create: vi.fn(), invalidate: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requireAuth: vi.fn(), requireAdmin: vi.fn() }));
vi.mock("@/lib/db/cache", () => ({ invalidateDataCache: mocks.invalidate }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/music/resolver-cifra", () => ({ resolverCifraValidada: mocks.resolve }));
vi.mock("@/lib/db/repositories", () => ({ getRepositories: async () => ({ backend: "local", musicas: { getById: mocks.getById, update: mocks.update, create: mocks.create } }) }));
import { atualizarMusicaAction, criarMusicaAction, criarMusicaNaEscalaAction } from "./musicas";

const original = { id: 1, titulo: "Minha Canção", artista: "Artista", tonalidade: "G", linkCifra: null, createdAt: "" };
const link = "https://www.cifraclub.com.br/artista/minha-cancao/?capo=0&keyShape=10";
function form(changes: Record<string, string> = {}) {
  const data = new FormData();
  Object.entries({ id: "1", titulo: original.titulo, artista: original.artista, tonalidade: original.tonalidade, preservarPesquisa: "true", ...changes })
    .forEach(([key, value]) => data.set(key, value));
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getById.mockResolvedValue(original);
  mocks.update.mockImplementation(async (id, data) => ({ ...original, ...data, id }));
  mocks.create.mockImplementation(async (data) => ({ ...original, ...data }));
  mocks.resolve.mockResolvedValue({ linkCifra: link, tonalidade: "G" });
});

describe("cadastro independente da disponibilidade de cifras", () => {
  it.each([criarMusicaAction, criarMusicaNaEscalaAction])("salva e retorna a música mesmo quando a consulta lança erro", async (action) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mocks.resolve.mockRejectedValueOnce(new Error("Serviço externo indisponível"));
      expect(await action(null, form())).toMatchObject({ success: true, musica: { titulo: original.titulo, linkCifra: null } });
      expect(mocks.create).toHaveBeenCalledOnce();
      expect(mocks.invalidate).toHaveBeenCalledWith("musicas");
    } finally { log.mockRestore(); }
  });
  it("não informa sucesso se o banco falhar", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mocks.create.mockRejectedValueOnce(new Error("Banco indisponível"));
      expect(await criarMusicaAction(null, form())).toMatchObject({ error: expect.any(String) });
      expect(mocks.invalidate).not.toHaveBeenCalled();
    } finally { log.mockRestore(); }
  });
});

describe("nova busca de cifra na edição", () => {
  it.each<Record<string, string>>([{ titulo: "Título corrigido" }, { artista: "Artista corrigido" }, { tonalidade: "C" }, {}])
    ("consulta novamente e retorna a cifra para atualizar a lista: %j", async (changes) => {
      const data = form(changes);
      const result = await atualizarMusicaAction(null, data);
      expect(mocks.resolve).toHaveBeenCalledWith({ titulo: data.get("titulo"), artista: data.get("artista"), tonalidade: data.get("tonalidade") });
      expect(mocks.update).toHaveBeenCalledWith(1, expect.objectContaining({ linkCifra: link }));
      expect(result).toMatchObject({ success: true, musica: { id: 1, linkCifra: link } });
      expect(mocks.invalidate).toHaveBeenCalledWith("musicas");
    });
  it("permite tentar novamente depois de uma busca sem resultado", async () => {
    mocks.resolve.mockResolvedValueOnce(null);
    const first = await atualizarMusicaAction(null, form());
    expect(first).toMatchObject({ success: true, musica: { linkCifra: null } });
    const second = await atualizarMusicaAction(null, form());
    expect(second).toMatchObject({ success: true, musica: { linkCifra: link } });
    expect(mocks.resolve).toHaveBeenCalledTimes(2);
  });
});
