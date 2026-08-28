import "server-only";
import { and, count, eq, inArray } from "drizzle-orm";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLocalDb } from "@/lib/db/local/client";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  escalaMusicas as escalaMusicasTable,
  escalas as escalasTable,
  escalaUsuarios as escalaUsuariosTable,
} from "@/lib/db/local/schema";
import type { Escala, NewEscala, UpdateEscala } from "@/types/domain";
import type { Backend, EscalasRepository } from "./types";

function mapSupabaseRow(row: any): Escala {
  return {
    id: row.id,
    titulo: row.titulo,
    dataEscala: row.data_escala ?? null,
    status: row.status,
    observacoes: row.observacoes ?? null,
    funcoesUsuarios: row.funcoes_usuarios ?? [],
    tonalidadesMusicas: row.tonalidades_musicas ?? [],
    ministerioId: row.ministerio_id ?? null,
    usuarioIds: (row.escala_usuarios ?? []).map((r: any) => r.usuario_id),
    musicaIds: (row.escala_musicas ?? []).map((r: any) => r.musica_id),
    createdAt: row.created_at,
  };
}

function toSupabasePayload(data: Partial<NewEscala>) {
  const { dataEscala, funcoesUsuarios, tonalidadesMusicas, ministerioId, ...rest } = data;
  return {
    ...rest,
    ...(dataEscala !== undefined ? { data_escala: dataEscala } : {}),
    ...(funcoesUsuarios !== undefined ? { funcoes_usuarios: funcoesUsuarios } : {}),
    ...(tonalidadesMusicas !== undefined ? { tonalidades_musicas: tonalidadesMusicas } : {}),
    ...(ministerioId !== undefined ? { ministerio_id: ministerioId } : {}),
  };
}

function createLocalRepository(): EscalasRepository {
  // Lazy: só abre o SQLite de verdade quando o backend local está ativo.
  const localDb = getLocalDb();

  async function attachRelations(row: typeof escalasTable.$inferSelect): Promise<Escala> {
    const [usuarioLinks, musicaLinks] = await Promise.all([
      localDb.select().from(escalaUsuariosTable).where(eq(escalaUsuariosTable.escalaId, row.id)),
      localDb.select().from(escalaMusicasTable).where(eq(escalaMusicasTable.escalaId, row.id)),
    ]);
    return {
      id: row.id,
      titulo: row.titulo,
      dataEscala: row.dataEscala ?? null,
      status: row.status as Escala["status"],
      observacoes: row.observacoes ?? null,
      funcoesUsuarios: (row.funcoesUsuarios as Escala["funcoesUsuarios"]) ?? [],
      tonalidadesMusicas: (row.tonalidadesMusicas as Escala["tonalidadesMusicas"]) ?? [],
      ministerioId: row.ministerioId ?? null,
      usuarioIds: usuarioLinks.map((l) => l.usuarioId),
      musicaIds: musicaLinks.map((l) => l.musicaId),
      createdAt: row.createdAt,
    };
  }

  return {
    async count(ministerioId, statuses) {
      const filters = [];
      if (ministerioId) filters.push(eq(escalasTable.ministerioId, ministerioId));
      if (statuses?.length) filters.push(inArray(escalasTable.status, statuses));
      const query = localDb.select({ count: count() }).from(escalasTable);
      const rows = filters.length ? await query.where(and(...filters)) : await query;
      return rows[0]?.count ?? 0;
    },
    async list(ministerioId) {
      const rows = ministerioId
        ? await localDb.select().from(escalasTable).where(eq(escalasTable.ministerioId, ministerioId))
        : await localDb.select().from(escalasTable);
      const withRelations = await Promise.all(rows.map(attachRelations));
      return withRelations.sort((a, b) => (b.dataEscala ?? "").localeCompare(a.dataEscala ?? ""));
    },
    async getById(id) {
      const rows = await localDb.select().from(escalasTable).where(eq(escalasTable.id, id));
      return rows[0] ? attachRelations(rows[0]) : null;
    },
    async create(data: NewEscala) {
      const [row] = await localDb.insert(escalasTable).values(data).returning();
      return attachRelations(row);
    },
    async update(id, data: UpdateEscala) {
      const [row] = await localDb
        .update(escalasTable)
        .set(data)
        .where(eq(escalasTable.id, id))
        .returning();
      if (!row) throw new Error(`Escala ${id} não encontrada.`);
      return attachRelations(row);
    },
    async remove(id) {
      await localDb.delete(escalasTable).where(eq(escalasTable.id, id));
    },
    async setUsuarios(escalaId, usuarioIds) {
      await localDb.delete(escalaUsuariosTable).where(eq(escalaUsuariosTable.escalaId, escalaId));
      if (usuarioIds.length > 0) {
        await localDb
          .insert(escalaUsuariosTable)
          .values(usuarioIds.map((usuarioId) => ({ escalaId, usuarioId })));
      }
    },
    async setMusicas(escalaId, musicaIds) {
      await localDb.delete(escalaMusicasTable).where(eq(escalaMusicasTable.escalaId, escalaId));
      if (musicaIds.length > 0) {
        await localDb
          .insert(escalaMusicasTable)
          .values(musicaIds.map((musicaId) => ({ escalaId, musicaId })));
      }
    },
  };
}

function createSupabaseRepository(supabase: SupabaseClient): EscalasRepository {
  const selectWithRelations = "*, escala_usuarios(usuario_id), escala_musicas(musica_id)";

  return {
    async count(ministerioId, statuses) {
      let query = supabase.from("escalas").select("id", { count: "exact", head: true });
      if (ministerioId) query = query.eq("ministerio_id", ministerioId);
      if (statuses?.length) query = query.in("status", statuses);
      const { count: total, error } = await query;
      if (error) throw error;
      return total ?? 0;
    },
    async list(ministerioId) {
      let query = supabase
        .from("escalas")
        .select(selectWithRelations)
        .order("data_escala", { ascending: false });
      if (ministerioId) query = query.eq("ministerio_id", ministerioId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapSupabaseRow);
    },
    async getById(id) {
      const { data, error } = await supabase
        .from("escalas")
        .select(selectWithRelations)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapSupabaseRow(data) : null;
    },
    async create(data: NewEscala) {
      const { data: row, error } = await supabase
        .from("escalas")
        .insert(toSupabasePayload(data))
        .select(selectWithRelations)
        .single();
      if (error) throw error;
      return mapSupabaseRow(row);
    },
    async update(id, data: UpdateEscala) {
      const { data: row, error } = await supabase
        .from("escalas")
        .update(toSupabasePayload(data))
        .eq("id", id)
        .select(selectWithRelations)
        .single();
      if (error) throw error;
      return mapSupabaseRow(row);
    },
    async remove(id) {
      const admin = createAdminClient();
      const { error: usuariosError } = await admin
        .from("escala_usuarios")
        .delete()
        .eq("escala_id", id);
      if (usuariosError) throw usuariosError;

      const { error: musicasError } = await admin
        .from("escala_musicas")
        .delete()
        .eq("escala_id", id);
      if (musicasError) throw musicasError;

      const { error } = await admin.from("escalas").delete().eq("id", id);
      if (error) throw error;
    },
    async setUsuarios(escalaId, usuarioIds) {
      const { error: deleteError } = await supabase
        .from("escala_usuarios")
        .delete()
        .eq("escala_id", escalaId);
      if (deleteError) throw deleteError;

      if (usuarioIds.length > 0) {
        const { error: insertError } = await supabase
          .from("escala_usuarios")
          .insert(usuarioIds.map((usuarioId) => ({ escala_id: escalaId, usuario_id: usuarioId })));
        if (insertError) throw insertError;
      }
    },
    async setMusicas(escalaId, musicaIds) {
      const { error: deleteError } = await supabase
        .from("escala_musicas")
        .delete()
        .eq("escala_id", escalaId);
      if (deleteError) throw deleteError;

      if (musicaIds.length > 0) {
        const { error: insertError } = await supabase
          .from("escala_musicas")
          .insert(musicaIds.map((musicaId) => ({ escala_id: escalaId, musica_id: musicaId })));
        if (insertError) throw insertError;
      }
    },
  };
}

export function createEscalasRepository(
  backend: Backend,
  supabase: SupabaseClient | null
): EscalasRepository {
  return backend === "local" ? createLocalRepository() : createSupabaseRepository(supabase!);
}
