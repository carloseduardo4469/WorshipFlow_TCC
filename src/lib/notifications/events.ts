import type { Escala } from "@/types/domain";

export type ScheduleNotice = { usuario_id: string; titulo: string; mensagem: string; escala_id: number | null; tipo: "nova" | "entrada" | "saida" | "alteracao" | "cancelamento" };
export type NotificationItem = ScheduleNotice & { id: string; created_at: string; read_at: string | null };

const FUNCOES: Record<string, string> = {
  violao: "Violão", guitarra: "Guitarra", bateria: "Bateria", teclado: "Teclado",
  baixo: "Baixo", "voz-principal": "Voz principal", "voz-secundaria": "Voz secundária",
};
function funcao(escala: Escala, id: string) {
  const valores = escala.funcoesUsuarios.filter((item) => item.usuarioId === id)
    .flatMap((item) => item.funcao.split(",").map((valor) => valor.trim()).filter(Boolean));
  return [...new Set(valores)].sort().map((valor) => FUNCOES[valor] ?? valor).join(" e ") || "Função a definir";
}
function resumo(escala: Escala, id: string) {
  const dia = escala.dataEscala
    ? new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${escala.dataEscala}T12:00:00Z`))
    : "Data a definir";
  return `${escala.titulo} · ${dia} · ${funcao(escala, id)}`;
}
function assinatura(escala: Escala) {
  return JSON.stringify({ titulo: escala.titulo, data: escala.dataEscala, observacoes: escala.observacoes ?? "",
    membros: [...new Set(escala.usuarioIds)].sort(),
    funcoes: [...new Set(escala.usuarioIds)].sort().map((id) => [id, funcao(escala, id)]),
    musicas: [...escala.musicaIds].sort((a, b) => a - b),
    tons: [...escala.tonalidadesMusicas].sort((a, b) => a.musicaId - b.musicaId),
  });
}

/** Compara o estado confirmado; salvar sem mudanças não gera avisos. */
export function criarAvisosEscala(antes: Escala | null, depois: Escala | null): ScheduleNotice[] {
  const antiga = antes?.status === "PUBLICADA" ? antes : null;
  const nova = depois?.status === "PUBLICADA" ? depois : null;
  if (!antiga && !nova) return [];
  if (antiga && nova && assinatura(antiga) === assinatura(nova)) return [];
  const anteriores = new Set(antiga?.usuarioIds ?? []);
  const atuais = new Set(nova?.usuarioIds ?? []);
  return [...new Set([...anteriores, ...atuais])].map((usuario_id) => {
    const saiu = !atuais.has(usuario_id);
    const tipo: ScheduleNotice["tipo"] = saiu ? (nova ? "saida" : "cancelamento") : !antiga ? "nova" : !anteriores.has(usuario_id) ? "entrada" : "alteracao";
    const titulos = { nova: "Nova escala para você", entrada: "Você entrou em uma escala", saida: "Você saiu de uma escala", alteracao: "Sua escala foi atualizada", cancelamento: "Escala cancelada" };
    const escala = saiu ? antiga! : nova!;
    return { usuario_id, tipo, titulo: titulos[tipo], escala_id: depois?.id || antes?.id || null,
      mensagem: `${resumo(escala, usuario_id)}.${saiu ? " Você não está mais escalado(a) para este compromisso." : " Confira os detalhes no WorshipFlow."}` };
  });
}
