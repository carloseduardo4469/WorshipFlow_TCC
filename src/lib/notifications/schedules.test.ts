import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Escala } from "@/types/domain";
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), legacy: vi.fn(), after: vi.fn(), push: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ after: mocks.after }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc: mocks.rpc }) }));
vi.mock("./legacy-schedules", () => ({ salvarEscalaSemNotificacoes: mocks.legacy }));
vi.mock("./push", () => ({ dispatchPush: mocks.push }));
import { salvarEscalaNotificando } from "./schedules";
const escala: Escala = { id: 4, titulo: "Culto", dataEscala: "2026-10-04", status: "PUBLICADA", usuarioIds: [], musicaIds: [], funcoesUsuarios: [], tonalidadesMusicas: [], observacoes: null, createdAt: "" };
beforeEach(() => { vi.clearAllMocks(); mocks.legacy.mockResolvedValue({ id: 4 }); });
describe("compatibilidade antes da migração", () => {
  it.each(["criar", "editar", "repertorio", "excluir"] as const)("salva %s quando a função não existe", async (mode) => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "PGRST202", message: "Function not found" } });
    expect(await salvarEscalaNotificando(mode, escala, escala)).toEqual({ id: 4 });
    expect(mocks.legacy).toHaveBeenCalledWith(mode, escala, escala);
    expect(mocks.after).not.toHaveBeenCalled();
  });
  it.each(["40001", "42501", "PGRST205"])("não contorna o erro %s com outra gravação", async (code) => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code, message: "Failure" } });
    expect(await salvarEscalaNotificando("repertorio", escala, escala)).toHaveProperty("error");
    expect(mocks.legacy).not.toHaveBeenCalled();
  });
  it("mantém a transação e o envio quando a migração está disponível", async () => {
    mocks.rpc.mockResolvedValue({ data: 4, error: null });
    expect(await salvarEscalaNotificando("repertorio", escala, escala)).toEqual({ id: 4 });
    expect(mocks.legacy).not.toHaveBeenCalled();
    expect(mocks.after).toHaveBeenCalledOnce();
  });
});
