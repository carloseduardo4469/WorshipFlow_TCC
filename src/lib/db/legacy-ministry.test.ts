import { describe, expect, it, vi } from "vitest";
import type { Repositories } from "@/lib/db/repositories";
import type { Usuario } from "@/types/domain";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { ensureLegacyMinistryAssignments } from "./legacy-ministry";

describe("compatibilidade de ministério legado", () => {
  it("vincula perfil e conteúdos sem ministério quando há um único ministério ativo", async () => {
    const updateUsuario = vi.fn().mockResolvedValue(undefined);
    const updateMusica = vi.fn().mockResolvedValue(undefined);
    const updateRepertorio = vi.fn().mockResolvedValue(undefined);
    const updateEscala = vi.fn().mockResolvedValue(undefined);
    const profile: Usuario = {
      id: "usuario-1",
      nome: "Lucas",
      email: "lucas@example.com",
      telefone: null,
      instrumentoPrincipal: null,
      habilidades: null,
      statusMinisterio: "ATIVO",
      isSuspended: false,
      perfil: "ADMIN",
      fotoPerfilUrl: null,
      ministerioId: null,
      ultimaAtividade: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const repos = {
      backend: "local",
      ministerios: {
        list: vi.fn().mockResolvedValue([
          { id: 7, nome: "Louvor", descricao: null, ativo: true, createdAt: "2026-01-01" },
        ]),
      },
      usuarios: { list: vi.fn().mockResolvedValue([profile]), update: updateUsuario },
      musicas: {
        list: vi.fn().mockResolvedValue([{ id: 1, ministerioId: null }]),
        update: updateMusica,
      },
      repertorios: {
        list: vi.fn().mockResolvedValue([{ id: 2, ministerioId: null }]),
        update: updateRepertorio,
      },
      escalas: {
        list: vi.fn().mockResolvedValue([{ id: 3, ministerioId: null }]),
        update: updateEscala,
      },
    } as unknown as Repositories;

    const result = await ensureLegacyMinistryAssignments(repos, profile);

    expect(result.ministerioId).toBe(7);
    expect(updateUsuario).toHaveBeenCalledWith("usuario-1", { ministerioId: 7 });
    expect(updateMusica).toHaveBeenCalledWith(1, { ministerioId: 7 });
    expect(updateRepertorio).toHaveBeenCalledWith(2, { ministerioId: 7 });
    expect(updateEscala).toHaveBeenCalledWith(3, { ministerioId: 7 });
  });
});
