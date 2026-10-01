import type { Escala } from "@/types/domain";

/** Remove da resposta os vínculos de pessoas que não podem ser exibidas. */
export function ocultarParticipantesIndisponiveis(
  escalas: Escala[],
  idsVisiveis: Iterable<string>
): Escala[] {
  const visiveis = new Set(idsVisiveis);
  return escalas.map((escala) => {
    const usuarioIds = escala.usuarioIds.filter((id) => visiveis.has(id));
    if (usuarioIds.length === escala.usuarioIds.length) return escala;
    const idsSelecionados = new Set(usuarioIds);
    return {
      ...escala,
      usuarioIds,
      funcoesUsuarios: escala.funcoesUsuarios.filter(({ usuarioId }) => idsSelecionados.has(usuarioId)),
    };
  });
}
