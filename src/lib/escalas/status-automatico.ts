import "server-only";

import type { Repositories } from "@/lib/db/repositories";
import type { Escala } from "@/types/domain";

/** Retorna yyyy-mm-dd considerando explicitamente o horário de Brasília. */
export function hojeEmSaoPaulo(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

/**
 * À meia-noite seguinte à data da escala, troca PUBLICADA por CONCLUIDA.
 * O status é derivado durante a leitura. Não grava no banco nem exige que um
 * membro comum tenha permissão de UPDATE apenas para abrir o dashboard.
 */
export async function concluirEscalasVencidas(
  _repos: Repositories,
  escalas: Escala[]
): Promise<Escala[]> {
  const hoje = hojeEmSaoPaulo();
  const vencidas = escalas.filter(
    (escala) =>
      escala.status === "PUBLICADA" &&
      Boolean(escala.dataEscala && escala.dataEscala < hoje)
  );

  if (vencidas.length === 0) return escalas;

  const ids = new Set(vencidas.map((escala) => escala.id));
  return escalas.map((escala) =>
    ids.has(escala.id) ? { ...escala, status: "CONCLUIDA" as const } : escala
  );
}
