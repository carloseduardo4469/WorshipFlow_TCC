import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Escala } from "@/types/domain";
const calls = vi.hoisted(() => ({ operations: [] as Array<{ table: string; operation: string; values?: unknown }>, failUpdate: false }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: (table: string) => {
  let operation = "";
  const query = {
    upsert(values: unknown) { operation = "upsert"; calls.operations.push({ table, operation, values }); return query; },
    update(values: unknown) { operation = "update"; calls.operations.push({ table, operation, values }); return query; },
    delete() { operation = "delete"; calls.operations.push({ table, operation }); return query; },
    eq() { return query; }, not() { return query; },
    then(resolve: (value: { error: null | { code: string } }) => unknown) {
      const fail = operation === "update" && calls.failUpdate;
      if (fail) calls.failUpdate = false;
      return Promise.resolve(resolve({ error: fail ? { code: "failure" } : null }));
    },
  };
  return query;
} }) }));
import { salvarEscalaSemNotificacoes } from "./legacy-schedules";
const before: Escala = { id: 4, titulo: "Culto", dataEscala: "2026-10-04", status: "PUBLICADA", usuarioIds: [], musicaIds: [1], funcoesUsuarios: [], tonalidadesMusicas: [{ musicaId: 1, tonalidade: "C" }], observacoes: null, createdAt: "" };
const after = { ...before, musicaIds: [1, 2], tonalidadesMusicas: [...before.tonalidadesMusicas, { musicaId: 2, tonalidade: "Indefinido" }] };
beforeEach(() => { calls.operations = []; calls.failUpdate = false; });
describe("salvamento de repertório sem migração", () => {
  it("persiste músicas e tons no banco existente", async () => {
    expect(await salvarEscalaSemNotificacoes("repertorio", before, after)).toEqual({ id: 4 });
    expect(calls.operations).toEqual([
      { table: "escala_musicas", operation: "upsert", values: [{ escala_id: 4, musica_id: 1 }, { escala_id: 4, musica_id: 2 }] },
      { table: "escala_musicas", operation: "delete" },
      { table: "escalas", operation: "update", values: { tonalidades_musicas: after.tonalidadesMusicas } },
    ]);
  });
  it("restaura o repertório anterior se a atualização dos tons falhar", async () => {
    calls.failUpdate = true;
    expect(await salvarEscalaSemNotificacoes("repertorio", before, after)).toHaveProperty("error");
    expect(calls.operations.slice(-3)).toEqual([
      { table: "escala_musicas", operation: "upsert", values: [{ escala_id: 4, musica_id: 1 }] },
      { table: "escala_musicas", operation: "delete" },
      { table: "escalas", operation: "update", values: { tonalidades_musicas: before.tonalidadesMusicas } },
    ]);
  });
});
