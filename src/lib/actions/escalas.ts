"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import type { FuncaoUsuario, StatusEscala, TonalidadeMusica } from "@/types/domain";

export type ActionState = { error?: string } | null;

const STATUS_VALIDOS: StatusEscala[] = ["RASCUNHO", "PUBLICADA", "CONCLUIDA", "CANCELADA"];

function readEscalaForm(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const dataEscala = String(formData.get("dataEscala") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "RASCUNHO");
  const observacoes = String(formData.get("observacoes") ?? "").trim();
  const ministerioIdRaw = String(formData.get("ministerioId") ?? "").trim();

  const usuarioIds = formData.getAll("usuarioIds").map(String);
  const musicaIds = formData.getAll("musicaIds").map((v) => Number(v));

  // funcoes[usuarioId] = "Vocal" | "Guitarra" | ...
  const funcoesUsuarios: FuncaoUsuario[] = usuarioIds
    .map((usuarioId) => ({
      usuarioId,
      funcao: String(formData.get(`funcao_${usuarioId}`) ?? "").trim(),
    }))
    .filter((f) => f.funcao);

  // tonalidade[musicaId] = "G" | "Am" | ...
  const tonalidadesMusicas: TonalidadeMusica[] = musicaIds
    .map((musicaId) => ({
      musicaId,
      tonalidade: String(formData.get(`tonalidade_${musicaId}`) ?? "").trim(),
    }))
    .filter((t) => t.tonalidade);

  const status = STATUS_VALIDOS.includes(statusRaw as StatusEscala)
    ? (statusRaw as StatusEscala)
    : "RASCUNHO";

  return {
    titulo,
    dataEscala: dataEscala || null,
    status,
    observacoes: observacoes || null,
    ministerioId: ministerioIdRaw ? Number(ministerioIdRaw) : null,
    funcoesUsuarios,
    tonalidadesMusicas,
    usuarioIds,
    musicaIds,
  };
}

export async function criarEscalaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const data = readEscalaForm(formData);
  if (!data.titulo) return { error: "Informe o título da escala." };

  const repos = await getRepositories();
  const escala = await repos.escalas.create({
    titulo: data.titulo,
    dataEscala: data.dataEscala,
    status: data.status,
    observacoes: data.observacoes,
    ministerioId: data.ministerioId,
    funcoesUsuarios: data.funcoesUsuarios,
    tonalidadesMusicas: data.tonalidadesMusicas,
  });
  await repos.escalas.setUsuarios(escala.id, data.usuarioIds);
  await repos.escalas.setMusicas(escala.id, data.musicaIds);

  revalidatePath("/dashboard/escalas");
  revalidatePath("/dashboard");
  redirect("/dashboard/escalas");
}

export async function atualizarEscalaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const data = readEscalaForm(formData);
  if (!data.titulo) return { error: "Informe o título da escala." };

  const repos = await getRepositories();
  await repos.escalas.update(id, {
    titulo: data.titulo,
    dataEscala: data.dataEscala,
    status: data.status,
    observacoes: data.observacoes,
    ministerioId: data.ministerioId,
    funcoesUsuarios: data.funcoesUsuarios,
    tonalidadesMusicas: data.tonalidadesMusicas,
  });
  await repos.escalas.setUsuarios(id, data.usuarioIds);
  await repos.escalas.setMusicas(id, data.musicaIds);

  revalidatePath("/dashboard/escalas");
  revalidatePath("/dashboard");
  redirect("/dashboard/escalas");
}

export async function removerEscalaAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));

  const repos = await getRepositories();
  await repos.escalas.remove(id);

  revalidatePath("/dashboard/escalas");
  revalidatePath("/dashboard");
}
