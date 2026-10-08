import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolve: vi.fn(), getById: vi.fn(), update: vi.fn(), create: vi.fn(), invalidate: vi.fn(),
  admin: vi.fn(), checkRateLimit: vi.fn(), backend: "local" as "local" | "supabase",
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requireAuth: vi.fn(async () => ({ authId: "user-1" })), requireAdmin: vi.fn(async () => ({ authId: "user-1" })) }));
vi.mock("@/lib/security/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock("@/lib/db/cache", () => ({ invalidateDataCache: mocks.invalidate }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.admin }));
vi.mock("@/lib/music/resolver-cifra", () => ({ resolverCifraValidada: mocks.resolve }));
vi.mock("@/lib/db/repositories", () => ({ getRepositories: async () => ({ backend: mocks.backend, musicas: { getById: mocks.getById, update: mocks.update, create: mocks.create } }) }));
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
  mocks.checkRateLimit.mockResolvedValue(null);
  mocks.backend = "local";
  mocks.getById.mockResolvedValue(original);
  mocks.update.mockImplementation(async (id, data) => ({ ...original, ...data, id }));
  mocks.create.mockImplementation(async (data) => ({ ...original, ...data, id: 2 }));
  mocks.resolve.mockResolvedValue({ linkCifra: link, tonalidade: "G" });
});

describe("criação e persistência da cifra", () => {
  it("bloqueia uma gravação quando a cota por usuário foi excedida", async () => {
    mocks.checkRateLimit.mockResolvedValue({ error: "Muitas tentativas.", retryAfter: 30 });

    await expect(criarMusicaAction(null, form())).resolves.toEqual({ error: "Muitas tentativas." });

    expect(mocks.checkRateLimit).toHaveBeenCalledWith("musicas", "user-1");
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.resolve).not.toHaveBeenCalled();
  });

  it.each([criarMusicaAction, criarMusicaNaEscalaAction])("retorna o link recuperado também no Supabase", async (action) => {
    mocks.backend = "supabase";
    mocks.resolve.mockResolvedValueOnce(null);
    const criada = { ...original, id: 2, artista: "Artista fora do catálogo" };
    const query = { eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), error: null };
    const table = {
      insert: vi.fn(() => ({ select: () => ({ single: async () => ({ data: {
        ...criada, link_cifra: null, created_at: "",
      }, error: null }) }) })),
      update: vi.fn(() => query),
    };
    mocks.admin.mockReturnValue({ from: () => table });
    mocks.getById.mockResolvedValue({ ...criada, linkCifra: link });

    const result = await action(null, form({ artista: criada.artista }));

    expect(result).toMatchObject({ success: true, musica: { id: 2, linkCifra: link } });
    expect(table.update).toHaveBeenCalledWith({ link_cifra: link, tonalidade: "G" });
    expect(query.is).toHaveBeenCalledWith("link_cifra", null);
    expect(query.eq).toHaveBeenCalledWith("titulo", criada.titulo);
    expect(query.eq).toHaveBeenCalledWith("artista", criada.artista);
  });
  it("conclui o cadastro quando a recuperação excede 2,5 segundos", async () => {
    vi.useFakeTimers();
    try {
      mocks.resolve.mockResolvedValueOnce(null).mockImplementationOnce(() => new Promise(() => {}));
      const pending = criarMusicaNaEscalaAction(null, form({ artista: "Artista fora do catálogo" }));
      await vi.advanceTimersByTimeAsync(2501);
      expect(await pending).toMatchObject({ success: true, musica: { linkCifra: null } });
      expect(mocks.update).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
  it.each([criarMusicaAction, criarMusicaNaEscalaAction])("devolve a cifra recuperada na segunda tentativa para o formulário", async (action) => {
    mocks.resolve.mockResolvedValueOnce(null);
    const criada = { ...original, id: 2, artista: "Artista fora do catálogo" };
    mocks.getById.mockResolvedValue(criada);
    mocks.update.mockImplementation(async (id, data) => ({ ...criada, ...data, id }));

    const result = await action(null, form({ artista: criada.artista }));

    expect(result).toMatchObject({ success: true, musica: { id: 2, linkCifra: link } });
    expect(mocks.update).toHaveBeenCalledWith(2, { linkCifra: link, tonalidade: "G" });
  });
  it("salva a cifra validada ao criar pela biblioteca", async () => {
    const data = form({ artista: "Artista fora do catálogo" });

    const result = await criarMusicaAction(null, data);

    expect(mocks.resolve).toHaveBeenCalledWith({ titulo: original.titulo, artista: "Artista fora do catálogo", tonalidade: "G" });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ linkCifra: link }));
    expect(result).toMatchObject({ success: true, musica: { id: 2, linkCifra: link } });
  });

  it("salva sem inventar uma URL quando a cifra não foi confirmada", async () => {
    mocks.resolve.mockResolvedValue(null);
    const data = form({ titulo: "Fé", artista: "FHOP" });

    const result = await criarMusicaNaEscalaAction(null, data);

    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      linkCifra: null,
    }));
    expect(result).toMatchObject({ success: true, musica: { linkCifra: null } });
  });

  it("não força tom maior no link provisório quando não consegue detectar o modo", async () => {
    mocks.resolve.mockResolvedValue(null);
    const data = form({ titulo: "Ser Mudado", artista: "Alessandro Vilas Boas", tonalidade: "C#" });

    const result = await criarMusicaNaEscalaAction(null, data);

    expect(result).toMatchObject({ success: true });
    expect(mocks.create.mock.calls[0][0].linkCifra).toBeNull();
  });

  it("corrige o link provisório quando a tentativa seguinte detecta a relativa menor", async () => {
    const url = "https://www.cifraclub.com.br/alessandro-vilas-boas/ser-mudado/";
    const provisional = { ...original, id: 2, titulo: "Ser Mudado", artista: "Alessandro Vilas Boas", tonalidade: "C#", linkCifra: `${url}?capo=0` };
    mocks.create.mockResolvedValue(provisional);
    mocks.getById.mockResolvedValue(provisional);
    mocks.resolve.mockResolvedValueOnce(null).mockResolvedValueOnce({ linkCifra: `${url}?capo=0&keyShape=1`, tonalidade: "A#m" });

    const result = await criarMusicaNaEscalaAction(null, form({ titulo: "Ser Mudado", artista: "Alessandro Vilas Boas", tonalidade: "C#" }));

    expect(mocks.update).toHaveBeenCalledWith(2, { linkCifra: `${url}?capo=0&keyShape=1`, tonalidade: "A#m" });
    expect(result).toMatchObject({ success: true, musica: { tonalidade: "A#m", linkCifra: `${url}?capo=0&keyShape=1` } });
  });
});

describe("cadastro independente da disponibilidade de cifras", () => {
  it.each([criarMusicaAction, criarMusicaNaEscalaAction])("salva e retorna a música mesmo quando a consulta lança erro", async (action) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mocks.resolve.mockRejectedValue(new Error("Serviço externo indisponível"));
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
