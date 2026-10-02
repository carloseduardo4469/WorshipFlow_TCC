import { afterEach, describe, expect, it, vi } from "vitest";
import { gerarLinkCifraClub } from "./cifraclub";
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ requireAuth: vi.fn(async () => ({ authId: "user-1" })), requireAdmin: vi.fn() }));
vi.mock("@/lib/security/rate-limit", () => ({ checkRateLimit: vi.fn(async () => null) }));
vi.mock("@/lib/db/cache", () => ({ invalidateDataCache: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/db/repositories", () => ({ getRepositories: async () => ({ backend: "local", musicas: { create: async (data: object) => ({ id: 1, createdAt: "", ...data }) } }) }));
import { criarMusicaNaEscalaAction } from "@/lib/actions/musicas";
afterEach(() => vi.unstubAllGlobals());
describe("cifra da Harpa no cadastro da escala", () => {
  it.each(["Porque ele vive - 545", "545 - Porque Ele Vive", "Porque Ele Vive"])("resolve o título %s", (titulo) => {
    const url = new URL(gerarLinkCifraClub({ titulo, artista: "Harpa Cristã", tonalidade: "G" })!);
    expect(url.pathname).toBe("/harpa-crista/porque-ele-vive/");
    expect(url.searchParams.get("capo")).toBe("0");
    expect(url.searchParams.get("keyShape")).toBe("10");
  });
  it("já retorna a cifra no cadastro com tom Indefinido", async () => {
    const metadata = [{ "@type": "MusicComposition", name: "Porque Ele Vive - 545", url: "https://www.cifraclub.com.br/harpa-crista/porque-ele-vive/" }, { "@type": "MusicRecording", byArtist: { url: "https://www.cifraclub.com.br/harpa-crista/" } }];
    vi.stubGlobal("fetch", vi.fn(async () => new Response(`<script type="application/ld+json">${JSON.stringify(metadata)}</script>Tom: </span><button>A</button>`)));
    const form = new FormData();
    form.set("titulo", "Porque ele vive - 545"); form.set("artista", "Harpa Cristã"); form.set("tonalidade", "Indefinido");
    const result = await criarMusicaNaEscalaAction(null, form);
    expect(result?.success).toBe(true);
    expect(result?.musica?.tonalidade).toBe("Indefinido");
    expect(result?.musica?.linkCifra).toBe("https://www.cifraclub.com.br/harpa-crista/porque-ele-vive/?capo=0&keyShape=0");
  });
  it("salva a URL sem presumir o tom quando o serviço está indisponível", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    const form = new FormData();
    form.set("titulo", "Porque ele vive - 545"); form.set("artista", "Harpa Cristã"); form.set("tonalidade", "G");
    const result = await criarMusicaNaEscalaAction(null, form);
    expect(result?.success).toBe(true);
    expect(result?.musica?.linkCifra).toBe("https://www.cifraclub.com.br/harpa-crista/porque-ele-vive/?capo=0");
  });
  it("não inventa endereço de artista desconhecido", () => {
    expect(gerarLinkCifraClub({ titulo: "Porque Ele Vive", artista: "artista inexistente teste", tonalidade: "G" })).toBeNull();
  });
});
