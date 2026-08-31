import type { Escala, FuncaoUsuario, TonalidadeMusica } from "@/types/domain";

function valoresUnicos<T extends string | number>(valores: T[]): T[] {
  return [...new Set(valores)];
}

function normalizarFuncoes(funcoes: FuncaoUsuario[], usuarioIds: string[]): FuncaoUsuario[] {
  const permitidos = new Set(usuarioIds);
  const porUsuario = new Map<string, Set<string>>();

  for (const item of funcoes ?? []) {
    if (!item?.usuarioId || !permitidos.has(item.usuarioId)) continue;
    const valores = String(item.funcao ?? "").split(",").map((valor) => valor.trim()).filter(Boolean);
    if (valores.length === 0) continue;
    const atuais = porUsuario.get(item.usuarioId) ?? new Set<string>();
    valores.forEach((valor) => atuais.add(valor));
    porUsuario.set(item.usuarioId, atuais);
  }

  return usuarioIds.flatMap((usuarioId) => {
    const valores = porUsuario.get(usuarioId);
    return valores?.size ? [{ usuarioId, funcao: [...valores].join(",") }] : [];
  });
}

function normalizarTonalidades(tonalidades: TonalidadeMusica[], musicaIds: number[]): TonalidadeMusica[] {
  const permitidas = new Set(musicaIds);
  const porMusica = new Map<number, string>();
  for (const item of tonalidades ?? []) {
    if (!Number.isInteger(item?.musicaId) || !permitidas.has(item.musicaId)) continue;
    const tonalidade = String(item.tonalidade ?? "").trim();
    if (tonalidade && !porMusica.has(item.musicaId)) porMusica.set(item.musicaId, tonalidade);
  }
  return musicaIds.flatMap((musicaId) => {
    const tonalidade = porMusica.get(musicaId);
    return tonalidade ? [{ musicaId, tonalidade }] : [];
  });
}

/** Corrige relações antigas duplicadas sem alterar a ordem escolhida na escala. */
export function normalizarEscala(escala: Escala): Escala {
  const usuarioIds = valoresUnicos((escala.usuarioIds ?? []).filter(Boolean));
  const musicaIds = valoresUnicos((escala.musicaIds ?? []).filter((id) => Number.isInteger(id) && id > 0));
  return {
    ...escala,
    usuarioIds,
    musicaIds,
    funcoesUsuarios: normalizarFuncoes(escala.funcoesUsuarios ?? [], usuarioIds),
    tonalidadesMusicas: normalizarTonalidades(escala.tonalidadesMusicas ?? [], musicaIds),
  };
}

export function normalizarEscalas(escalas: Escala[]): Escala[] {
  return [...new Map(escalas.map((escala) => [escala.id, normalizarEscala(escala)])).values()];
}
