import { describe, expect, it } from "vitest";
import type { Escala } from "@/types/domain";
import { ocultarParticipantesIndisponiveis } from "./visibilidade";

const escala: Escala = {
  id: 1, titulo: "Culto", dataEscala: "2026-10-04", status: "PUBLICADA", observacoes: null,
  usuarioIds: ["visivel", "oculto"], musicaIds: [], tonalidadesMusicas: [],
  funcoesUsuarios: [{ usuarioId: "visivel", funcao: "guitarra" }, { usuarioId: "oculto", funcao: "baixo" }],
  createdAt: "2026-10-01T00:00:00.000Z",
};

describe("visibilidade de participantes", () => {
  it("não expõe participantes ausentes da lista visível", () => {
    expect(ocultarParticipantesIndisponiveis([escala], ["visivel"])).toEqual([{ ...escala,
      usuarioIds: ["visivel"], funcoesUsuarios: [{ usuarioId: "visivel", funcao: "guitarra" }],
    }]);
  });
});
