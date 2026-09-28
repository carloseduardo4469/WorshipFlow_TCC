import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Escala } from "@/types/domain";

export type ScheduleSaveMode = "criar" | "editar" | "repertorio" | "excluir";

/** Compatibilidade com bancos que ainda não receberam a migração de notificações.
 * Chamado somente após as validações e a autorização da Server Action.
 */
export async function salvarEscalaSemNotificacoes(mode: ScheduleSaveMode, antes: Escala | null, depois: Escala | null) {
  const db = createAdminClient();
  let id = antes?.id ?? 0;
  let alterou = false;

  async function gravarCampos(escala: Escala) {
    const campos = mode === "repertorio"
      ? { tonalidades_musicas: escala.tonalidadesMusicas }
      : { titulo: escala.titulo, data_escala: escala.dataEscala, observacoes: escala.observacoes, funcoes_usuarios: escala.funcoesUsuarios };
    const { error } = await db.from("escalas").update(campos).eq("id", id);
    if (error) throw error;
  }
  async function gravarVinculos(tabela: "escala_usuarios" | "escala_musicas", coluna: "usuario_id" | "musica_id", ids: Array<string | number>) {
    const unicos = [...new Set(ids)];
    if (unicos.length) {
      const { error } = await db.from(tabela).upsert(unicos.map((valor) => ({ escala_id: id, [coluna]: valor })), { onConflict: `escala_id,${coluna}`, ignoreDuplicates: true });
      if (error) throw error;
    }
    let query = db.from(tabela).delete().eq("escala_id", id);
    if (unicos.length) query = query.not(coluna, "in", `(${unicos.join(",")})`);
    const { error } = await query;
    if (error) throw error;
  }
  try {
    if (mode === "excluir") {
      if (!antes) throw new Error("Escala ausente.");
      const { error } = await db.from("escalas").delete().eq("id", id);
      if (error) throw error;
      return { id };
    }
    if (!depois || (mode !== "criar" && !antes)) throw new Error("Escala ausente.");
    if (mode === "criar") {
      const { data, error } = await db.from("escalas").insert({
        titulo: depois.titulo, data_escala: depois.dataEscala, status: depois.status,
        observacoes: depois.observacoes, funcoes_usuarios: depois.funcoesUsuarios,
        tonalidades_musicas: depois.tonalidadesMusicas,
      }).select("id").single();
      if (error || !data) throw error ?? new Error("Escala não criada.");
      id = Number(data.id);
    }
    alterou = true;
    if (mode === "criar" || mode === "editar") await gravarVinculos("escala_usuarios", "usuario_id", depois.usuarioIds);
    if (mode === "criar" || mode === "repertorio") await gravarVinculos("escala_musicas", "musica_id", depois.musicaIds);
    if (mode !== "criar") await gravarCampos(depois);
    return { id };
  } catch {
    if (alterou) {
      try {
        if (mode === "criar") {
          const { error } = await db.from("escalas").delete().eq("id", id);
          if (error) throw error;
        } else if (antes) {
          if (mode === "editar") await gravarVinculos("escala_usuarios", "usuario_id", antes.usuarioIds);
          if (mode === "repertorio") await gravarVinculos("escala_musicas", "musica_id", antes.musicaIds);
          await gravarCampos(antes);
        }
      } catch {
        console.error("Falha ao restaurar a escala no modo de compatibilidade.");
        return { error: "Não foi possível concluir a gravação. Atualize a página e confira os dados da escala antes de tentar novamente." };
      }
    }
    return { error: "Não foi possível salvar a escala. Tente novamente." };
  }
}
