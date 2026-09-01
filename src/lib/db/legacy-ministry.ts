import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Repositories } from "@/lib/db/repositories";
import type { Usuario } from "@/types/domain";

let migrationPromise: Promise<number | null> | null = null;

async function getOnlyActiveMinistryId(repos: Repositories): Promise<number | null> {
  if (repos.backend === "local") {
    const ministeriosAtivos = (await repos.ministerios.list()).filter((item) => item.ativo);
    return ministeriosAtivos.length === 1 ? ministeriosAtivos[0].id : null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("ministerios")
    .select("id")
    .eq("ativo", true)
    .order("id")
    .limit(2);
  if (error) throw error;
  return data?.length === 1 ? data[0].id : null;
}

async function migrateSupabase(ministerioId: number) {
  const admin = createAdminClient();
  const tables = ["profiles", "musicas", "repertorios", "escalas"] as const;

  await Promise.all(tables.map(async (table) => {
    const { error } = await admin
      .from(table)
      .update({ ministerio_id: ministerioId })
      .is("ministerio_id", null);
    if (error) throw error;
  }));
}

async function migrateLocal(repos: Repositories, ministerioId: number) {
  const [usuarios, musicas, repertorios, escalas] = await Promise.all([
    repos.usuarios.list(),
    repos.musicas.list(),
    repos.repertorios.list(),
    repos.escalas.list(),
  ]);

  await Promise.all([
    ...usuarios.filter((item) => item.ministerioId === null)
      .map((item) => repos.usuarios.update(item.id, { ministerioId })),
    ...musicas.filter((item) => item.ministerioId === null)
      .map((item) => repos.musicas.update(item.id, { ministerioId })),
    ...repertorios.filter((item) => item.ministerioId === null)
      .map((item) => repos.repertorios.update(item.id, { ministerioId })),
    ...escalas.filter((item) => item.ministerioId === null)
      .map((item) => repos.escalas.update(item.id, { ministerioId })),
  ]);
}

async function assignCurrentProfile(
  repos: Repositories,
  profileId: string,
  ministerioId: number
) {
  if (repos.backend === "local") {
    await repos.usuarios.update(profileId, { ministerioId });
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ ministerio_id: ministerioId })
    .eq("id", profileId);
  if (error) throw error;
}

/**
 * Compatibilidade para bancos criados antes de ministerio_id passar a ser
 * obrigatório nas consultas. Só migra automaticamente quando existe um único
 * ministério ativo, evitando atribuir dados legados ao ministério errado.
 */
export async function ensureLegacyMinistryAssignments(
  repos: Repositories,
  profile: Usuario
): Promise<Usuario> {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const ministerioId = await getOnlyActiveMinistryId(repos);
      if (ministerioId === null) return null;
      if (repos.backend === "supabase") await migrateSupabase(ministerioId);
      else await migrateLocal(repos, ministerioId);
      return ministerioId;
    })();
  }

  let ministerioId: number | null;
  try {
    ministerioId = await migrationPromise;
  } catch (error) {
    migrationPromise = null;
    throw error;
  }
  if (ministerioId === null) return profile;

  // A migração em lote roda uma vez por processo. Perfis criados depois dela
  // ainda precisam receber o vínculo de forma persistente no primeiro acesso.
  if (profile.ministerioId !== ministerioId) {
    await assignCurrentProfile(repos, profile.id, ministerioId);
  }

  return profile.ministerioId === ministerioId
    ? profile
    : { ...profile, ministerioId };
}
