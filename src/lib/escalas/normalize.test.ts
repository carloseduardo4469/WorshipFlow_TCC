import { describe, expect, it } from "vitest";
import type { Escala } from "@/types/domain";
import { normalizarEscala, normalizarEscalas } from "./normalize";

const escalaBase: Escala = {
  id: 1,
  titulo: "Culto",
  dataEscala: "2026-09-06",
  status: "PUBLICADA",
  observacoes: null,
  funcoesUsuarios: [],
  tonalidadesMusicas: [],
  ministerioId: 1,
  usuarioIds: [],
  musicaIds: [],
  createdAt: "2026-09-01T00:00:00.000Z",
};

describe("normalização de escalas", () => {
  it("remove vínculos duplicados e ignora relações órfãs", () => {
    const resultado = normalizarEscala({
      ...escalaBase,
      usuarioIds: ["u1", "u1"],
      musicaIds: [7, 7, -2],
      funcoesUsuarios: [
        { usuarioId: "u1", funcao: "violao,voz-principal" },
        { usuarioId: "fora", funcao: "bateria" },
      ],
      tonalidadesMusicas: [
        { musicaId: 7, tonalidade: "G" },
        { musicaId: 99, tonalidade: "A" },
      ],
    });

    expect(resultado.usuarioIds).toEqual(["u1"]);
    expect(resultado.musicaIds).toEqual([7]);
    expect(resultado.funcoesUsuarios).toEqual([{ usuarioId: "u1", funcao: "violao,voz-principal" }]);
    expect(resultado.tonalidadesMusicas).toEqual([{ musicaId: 7, tonalidade: "G" }]);
  });

  it("mantém somente a versão mais recente de ids repetidos na lista", () => {
    expect(normalizarEscalas([escalaBase, { ...escalaBase, titulo: "Atualizada" }])).toHaveLength(1);
    expect(normalizarEscalas([escalaBase, { ...escalaBase, titulo: "Atualizada" }])[0].titulo).toBe("Atualizada");
  });
});
