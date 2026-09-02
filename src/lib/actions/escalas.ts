"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { invalidateDataCache } from "@/lib/db/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { TONALIDADE_INVALIDA_MESSAGE, isTonalidadeValida } from "@/lib/music/tonalidades";
import type { FuncaoUsuario, TonalidadeMusica } from "@/types/domain";
import { FORM_LIMITS, validateMaxLength } from "@/lib/validation/forms";

export type ActionState = { error?: string; success?: boolean } | null;

const FUNCOES_VALIDAS = new Set([
  "violao", "guitarra", "bateria", "teclado", "baixo", "voz-principal", "voz-secundaria",
]);

function dataEscalaValida(dataEscala: string | null) {
  if (!dataEscala) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataEscala)) return false;

  const [year, month, day] = dataEscala.split("-").map(Number);
  const data = new Date(Date.UTC(year, month - 1, day));
  if (
    data.getUTCFullYear() !== year ||
    data.getUTCMonth() !== month - 1 ||
    data.getUTCDate() !== day
  ) return false;

  const hoje = new Date();
  const hojeIso = [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, "0"),
    String(hoje.getDate()).padStart(2, "0"),
  ].join("-");
  return dataEscala >= hojeIso;
}

function readEscalaForm(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const dataEscala = String(formData.get("dataEscala") ?? "").trim();
  const observacoes = String(formData.get("observacoes") ?? "").trim();

  const usuarioIdsRaw = [...new Set(formData.getAll("usuarioIds").map(String).filter(Boolean))];
  const usuarioIds = usuarioIdsRaw
    .slice(0, FORM_LIMITS.selecoes);
  const musicaIds = [...new Set(formData.getAll("musicaIds").map((v) => Number(v)))]
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, FORM_LIMITS.selecoes);

  // funcoes[usuarioId] = "Vocal" | "Guitarra" | ...
  const funcoesUsuarios: FuncaoUsuario[] = usuarioIds
    .map((usuarioId) => ({
      usuarioId,
      funcao: formData.getAll(`funcao_${usuarioId}`).map(String).map((funcao) => funcao.trim()).filter((funcao) => FUNCOES_VALIDAS.has(funcao)).join(","),
    }))
    .filter((f) => f.funcao);

  // tonalidade[musicaId] = "G" | "Am" | ...
  const tonalidadesMusicas: TonalidadeMusica[] = musicaIds
    .map((musicaId) => ({
      musicaId,
      tonalidade: String(formData.get(`tonalidade_${musicaId}`) ?? "").trim(),
    }))
    .filter((t) => t.tonalidade);

  const tonalidadeValida = tonalidadesMusicas.every(({ tonalidade }) => isTonalidadeValida(tonalidade));

  return {
    titulo,
    dataEscala: dataEscala || null,
    observacoes: observacoes || null,
    funcoesUsuarios,
    tonalidadesMusicas,
    usuarioIds,
    musicaIds,
    tonalidadeValida,
    usuarioIdsValidos: usuarioIdsRaw.length <= FORM_LIMITS.selecoes
      && usuarioIds.every((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)),
  };
}

function validarEscala(data: ReturnType<typeof readEscalaForm>): string | null {
  if (!data.titulo) return "Informe o título da escala.";
  const tituloError = validateMaxLength(data.titulo, FORM_LIMITS.nomeGenerico, "Título");
  if (tituloError) return tituloError;
  const observacoesError = validateMaxLength(data.observacoes ?? "", FORM_LIMITS.observacoes, "Observações");
  if (observacoesError) return observacoesError;
  const temVozPrincipal = data.funcoesUsuarios.some(({ funcao }) =>
    funcao.split(",").includes("voz-principal")
  );
  if (!temVozPrincipal) {
    return "Escolha pelo menos uma pessoa como cantor(a) principal para publicar a escala.";
  }
  if (!data.usuarioIdsValidos) return "Seleção de usuários inválida.";
  return null;
}

async function validarVinculos(
  repos: Awaited<ReturnType<typeof getRepositories>>,
  data: ReturnType<typeof readEscalaForm>
): Promise<string | null> {
  const [usuarios, musicas] = await Promise.all([
    repos.usuarios.getByIds(data.usuarioIds),
    repos.musicas.getByIds(data.musicaIds),
  ]);
  if (usuarios.length !== data.usuarioIds.length) return "Um ou mais membros selecionados não existem mais.";
  if (musicas.length !== data.musicaIds.length) return "Uma ou mais músicas selecionadas não existem mais.";
  return null;
}

export async function criarEscalaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const data = readEscalaForm(formData);
  const escalaError = validarEscala(data);
  if (escalaError) return { error: escalaError };
  if (!dataEscalaValida(data.dataEscala)) return { error: "Informe uma data válida a partir de hoje." };
  if (!data.tonalidadeValida) return { error: TONALIDADE_INVALIDA_MESSAGE };

  const repos = await getRepositories();
  const vinculosError = await validarVinculos(repos, data);
  if (vinculosError) return { error: vinculosError };
  const escala = await repos.escalas.create({
    titulo: data.titulo,
    dataEscala: data.dataEscala,
    status: "PUBLICADA",
    observacoes: data.observacoes,
    funcoesUsuarios: data.funcoesUsuarios,
    tonalidadesMusicas: data.tonalidadesMusicas,
  });
  try {
    await repos.escalas.setUsuarios(escala.id, data.usuarioIds);
    await repos.escalas.setMusicas(escala.id, data.musicaIds);
  } catch (error) {
    await repos.escalas.remove(escala.id).catch(() => {});
    console.error("Falha ao vincular dados da nova escala:", error);
    return { error: "Não foi possível concluir o cadastro da escala. Nenhuma escala incompleta foi mantida." };
  }

  invalidateDataCache("escalas");
  revalidatePath("/dashboard/escalas");
  revalidatePath("/dashboard/admin/escalas");
  revalidatePath("/dashboard");
  redirect("/dashboard/admin/escalas");
}

export async function atualizarEscalaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { error: "Escala inválida." };
  const data = readEscalaForm(formData);
  const escalaError = validarEscala(data);
  if (escalaError) return { error: escalaError };
  if (!data.tonalidadeValida) return { error: TONALIDADE_INVALIDA_MESSAGE };

  const repos = await getRepositories();
  const escalaAtual = await repos.escalas.getById(id);
  if (!escalaAtual) return { error: "Escala não encontrada." };
  if (!dataEscalaValida(data.dataEscala) && data.dataEscala !== escalaAtual.dataEscala) {
    return { error: "A nova data precisa ser válida e não pode estar no passado." };
  }
  const vinculosError = await validarVinculos(repos, data);
  if (vinculosError) return { error: vinculosError };
  try {
    await repos.escalas.update(id, {
      titulo: data.titulo,
      dataEscala: data.dataEscala,
      observacoes: data.observacoes,
      funcoesUsuarios: data.funcoesUsuarios,
      // Músicas não são mais editadas neste formulário; preserve as existentes.
    });
    await repos.escalas.setUsuarios(id, data.usuarioIds);
  } catch (error) {
    await repos.escalas.update(id, {
      titulo: escalaAtual.titulo,
      dataEscala: escalaAtual.dataEscala,
      status: escalaAtual.status,
      observacoes: escalaAtual.observacoes,
      funcoesUsuarios: escalaAtual.funcoesUsuarios,
      tonalidadesMusicas: escalaAtual.tonalidadesMusicas,
    }).catch(() => {});
    await repos.escalas.setUsuarios(id, escalaAtual.usuarioIds).catch(() => {});
    console.error("Falha ao atualizar escala:", error);
    return { error: "Não foi possível salvar a escala. Os dados anteriores foram preservados." };
  }

  invalidateDataCache("escalas");
  revalidatePath("/dashboard/escalas");
  revalidatePath("/dashboard/admin/escalas");
  revalidatePath("/dashboard");
  redirect("/dashboard/admin/escalas");
}

export async function removerEscalaAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) throw new Error("Escala inválida.");

  const repos = await getRepositories();
  const escala = await repos.escalas.getById(id);
  if (!escala) throw new Error("Escala não encontrada.");
  await repos.escalas.remove(id);

  invalidateDataCache("escalas");
  revalidatePath("/dashboard/escalas");
  revalidatePath("/dashboard/admin/escalas");
  revalidatePath("/dashboard");
}

export async function adicionarMusicasNaEscalaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const current = await requireAuth();
  const escalaId = Number(formData.get("escalaId"));
  if (!Number.isInteger(escalaId) || escalaId <= 0) return { error: "Escala inválida." };

  const musicaIdsRaw = [...new Set(formData.getAll("musicaIds").map(Number))];
  const musicaIds = musicaIdsRaw
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, FORM_LIMITS.selecoes);
  if (musicaIdsRaw.length > FORM_LIMITS.selecoes || musicaIds.length !== musicaIdsRaw.length) {
    return { error: "Seleção de músicas inválida." };
  }
  const tonalidadesMusicas: TonalidadeMusica[] = musicaIds.map((musicaId) => ({
    musicaId,
    tonalidade: String(formData.get(`tonalidade_${musicaId}`) ?? "").trim(),
  }));
  if (tonalidadesMusicas.some(({ tonalidade }) => !isTonalidadeValida(tonalidade))) {
    return { error: "Escolha um tom maior para cada música selecionada." };
  }

  const repos = await getRepositories();
  const escala = await repos.escalas.getById(escalaId);
  if (!escala) return { error: "Escala não encontrada." };

  const cantorPrincipal = escala.funcoesUsuarios.some(
    ({ usuarioId, funcao }) =>
      usuarioId === current.authId && funcao.split(",").includes("voz-principal")
  );
  if (!cantorPrincipal && current.profile.perfil !== "ADMIN") {
    return { error: "Somente o cantor principal desta escala pode adicionar músicas." };
  }

  const musicas = await repos.musicas.getByIds(musicaIds);
  if (musicas.length !== musicaIds.length) {
    return { error: "Uma ou mais músicas selecionadas não existem mais." };
  }
  try {
    if (repos.backend === "supabase") {
      const admin = createAdminClient();
      if (musicaIds.length > 0) {
        const { error: insertError } = await admin
          .from("escala_musicas")
          .upsert(
            musicaIds.map((musicaId) => ({ escala_id: escalaId, musica_id: musicaId })),
            { onConflict: "escala_id,musica_id", ignoreDuplicates: true }
          );
        if (insertError) throw insertError;
      }

      let removerAntigas = admin.from("escala_musicas").delete().eq("escala_id", escalaId);
      if (musicaIds.length > 0) removerAntigas = removerAntigas.not("musica_id", "in", `(${musicaIds.join(",")})`);
      const { error: deleteError } = await removerAntigas;
      if (deleteError) throw deleteError;

      const { error: updateError } = await admin
        .from("escalas")
        .update({ tonalidades_musicas: tonalidadesMusicas })
        .eq("id", escalaId);
      if (updateError) throw updateError;
    } else {
      await repos.escalas.setMusicas(escalaId, musicaIds);
      await repos.escalas.update(escalaId, { tonalidadesMusicas });
    }
  } catch {
    try {
      if (repos.backend === "supabase") {
        const admin = createAdminClient();
        await admin.from("escala_musicas").delete().eq("escala_id", escalaId);
        if (escala.musicaIds.length > 0) {
          await admin.from("escala_musicas").insert(
            escala.musicaIds.map((musicaId) => ({ escala_id: escalaId, musica_id: musicaId }))
          );
        }
        await admin.from("escalas").update({ tonalidades_musicas: escala.tonalidadesMusicas }).eq("id", escalaId);
      } else {
        await repos.escalas.setMusicas(escalaId, escala.musicaIds);
        await repos.escalas.update(escalaId, { tonalidadesMusicas: escala.tonalidadesMusicas });
      }
    } catch (rollbackError) {
      console.error("Falha ao restaurar músicas da escala:", rollbackError);
    }
    return { error: "Não foi possível salvar as músicas da escala. Tente novamente." };
  }
  invalidateDataCache("escalas");
  revalidatePath("/dashboard/escalas");
  revalidatePath("/dashboard/historico");
  revalidatePath("/dashboard/admin/escalas");
  revalidatePath("/dashboard");
  return { success: true };
}
