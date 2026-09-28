import "server-only";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Escala } from "@/types/domain";
import { criarAvisosEscala } from "./events";
import { dispatchPush } from "./push";
import { salvarEscalaSemNotificacoes } from "./legacy-schedules";

function snapshot(escala: Escala | null) {
  if (!escala) return null;
  return { titulo: escala.titulo, data_escala: escala.dataEscala, status: escala.status,
    observacoes: escala.observacoes, funcoes_usuarios: escala.funcoesUsuarios,
    tonalidades_musicas: escala.tonalidadesMusicas, usuario_ids: escala.usuarioIds, musica_ids: escala.musicaIds };
}
export async function salvarEscalaNotificando(mode: "criar" | "editar" | "repertorio" | "excluir", antes: Escala | null, depois: Escala | null) {
  const { data, error } = await createAdminClient().rpc("wf_save_schedule", {
    p_mode: mode, p_id: antes?.id ?? null, p_before: snapshot(antes), p_after: snapshot(depois),
    p_notices: criarAvisosEscala(antes, depois),
  });
  if (error) {
    // PGRST202: a função não foi encontrada; nenhuma alteração foi executada.
    // Não usar fallback em conflitos, erros internos ou falhas de conexão.
    if (error.code === "PGRST202") {
      console.warn("Migração de notificações pendente; salvando escala sem emitir avisos.");
      return salvarEscalaSemNotificacoes(mode, antes, depois);
    }
    console.error("Falha ao salvar escala e notificações", { code: error.code });
    return { error: error.message.includes("WF_CONFLICT")
      ? "Esta escala foi alterada por outra pessoa. Atualize a página antes de tentar novamente."
      : "Não foi possível salvar a escala e seus avisos. Tente novamente; se persistir, contate o administrador." };
  }
  after(async () => {
    try { await dispatchPush(); } catch { console.error("Envio push adiado; os avisos permanecem na fila."); }
  });
  return { id: Number(data) };
}
