import "server-only";
import { count, eq } from "drizzle-orm";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLocalDb } from "@/lib/db/local/client";
import {
  repertorioMusicas as repertorioMusicasTable,
  repertorios as repertoriosTable,
} from "@/lib/db/local/schema";
import type { NewRepertorio, Repertorio, UpdateRepertorio } from "@/types/domain";
import type { Backend, RepertoriosRepository } from "./types";

function mapSupabaseRow(row: any): Repertorio {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao ?? null,
    ministerioId: row.ministerio_id ?? null,
    musicaIds: (row.repertorio_musicas ?? []).map((r: any) => r.musica_id),
    createdAt: row.created_at,
  };
}

function createLocalRepository(): RepertoriosRepository {
  // Lazy: só abre o SQLite de verdade quando o backend local está ativo.
  const localDb = getLocalDb();

  async function attachMusicaIds(row: typeof repertoriosTable.$inferSelect): Promise<Repertorio> {
    const links = await localDb
      .select()
      .from(repertorioMusicasTable)
      .where(eq(repertorioMusicasTable.repertorioId, row.id));
    return {
      id: row.id,
      nome: row.nome,
      descricao: row.descricao ?? null,
      ministerioId: row.ministerioId ?? null,
      musicaIds: links.map((l) => l.musicaId),
      createdAt: row.createdAt,
    };
  }

  return {
    async count(ministerioId) {
      const query = localDb.select({ count: count() }).from(repertoriosTable);
      const rows = ministerioId
        ? await query.where(eq(repertoriosTable.ministerioId, ministerioId))
        : await query;
      return rows[0]?.count ?? 0;
    },
    async list(ministerioId) {
      const rows = ministerioId
        ? await localDb.select().from(repertoriosTable).where(eq(repertoriosTable.ministerioId, ministerioId))
        : await localDb.select().from(repertoriosTable);
      const withMusicas = await Promise.all(rows.map(attachMusicaIds));
      return withMusicas.sort((a, b) => a.nome.localeCompare(b.nome));
    },
    async getById(id) {
      const rows = await localDb.select().from(repertoriosTable).where(eq(repertoriosTable.id, id));
      return rows[0] ? attachMusicaIds(rows[0]) : null;
    },
    async create(data: NewRepertorio) {
      const [row] = await localDb.insert(repertoriosTable).values(data).returning();
      return attachMusicaIds(row);
    },
    async update(id, data: UpdateRepertorio) {
      const [row] = await localDb
        .update(repertoriosTable)
        .set(data)
        .where(eq(repertoriosTable.id, id))
        .returning();
      if (!row) throw new Error(`Repertório ${id} não encontrado.`);
      return attachMusicaIds(row);
    },
    async remove(id) {
      await localDb.delete(repertoriosTable).where(eq(repertoriosTable.id, id));
    },
    async setMusicas(repertorioId, musicaIds) {
      await localDb
        .delete(repertorioMusicasTable)
        .where(eq(repertorioMusicasTable.repertorioId, repertorioId));
      if (musicaIds.length > 0) {
        await localDb
          .insert(repertorioMusicasTable)
          .values(musicaIds.map((musicaId) => ({ repertorioId, musicaId })));
      }
    },
  };
}

function createSupabaseRepository(supabase: SupabaseClient): RepertoriosRepository {
  const selectWithMusicas = "*, repertorio_musicas(musica_id)";

  return {
    async count(ministerioId) {
      let query = supabase.from("repertorios").select("id", { count: "exact", head: true });
      if (ministerioId) query = query.eq("ministerio_id", ministerioId);
      const { count: total, error } = await query;
      if (error) throw error;
      return total ?? 0;
    },
    async list(ministerioId) {
      let query = supabase.from("repertorios").select(selectWithMusicas).order("nome");
      if (ministerioId) query = query.eq("ministerio_id", ministerioId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapSupabaseRow);
    },
    async getById(id) {
      const { data, error } = await supabase
        .from("repertorios")
        .select(selectWithMusicas)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapSupabaseRow(data) : null;
    },
    async create(data: NewRepertorio) {
      const { data: row, error } = await supabase
        .from("repertorios")
        .insert({ nome: data.nome, descricao: data.descricao, ministerio_id: data.ministerioId })
        .select(selectWithMusicas)
        .single();
      if (error) throw error;
      return mapSupabaseRow(row);
    },
    async update(id, data: UpdateRepertorio) {
      const payload: Record<string, unknown> = {};
      if (data.nome !== undefined) payload.nome = data.nome;
      if (data.descricao !== undefined) payload.descricao = data.descricao;
      if (data.ministerioId !== undefined) payload.ministerio_id = data.ministerioId;

      const { data: row, error } = await supabase
        .from("repertorios")
        .update(payload)
        .eq("id", id)
        .select(selectWithMusicas)
        .single();
      if (error) throw error;
      return mapSupabaseRow(row);
    },
    async remove(id) {
      const { error } = await supabase.from("repertorios").delete().eq("id", id);
      if (error) throw error;
    },
    async setMusicas(repertorioId, musicaIds) {
      const { error: deleteError } = await supabase
        .from("repertorio_musicas")
        .delete()
        .eq("repertorio_id", repertorioId);
      if (deleteError) throw deleteError;

      if (musicaIds.length > 0) {
        const { error: insertError } = await supabase
          .from("repertorio_musicas")
          .insert(musicaIds.map((musicaId) => ({ repertorio_id: repertorioId, musica_id: musicaId })));
        if (insertError) throw insertError;
      }
    },
  };
}

export function createRepertoriosRepository(
  backend: Backend,
  supabase: SupabaseClient | null
): RepertoriosRepository {
  return backend === "local" ? createLocalRepository() : createSupabaseRepository(supabase!);
}
