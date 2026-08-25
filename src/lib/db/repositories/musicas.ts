import "server-only";
import { eq } from "drizzle-orm";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLocalDb } from "@/lib/db/local/client";
import { musicas as musicasTable } from "@/lib/db/local/schema";
import type { Musica, NewMusica, UpdateMusica } from "@/types/domain";
import type { Backend, MusicasRepository } from "./types";

function mapSupabaseRow(row: any): Musica {
  return {
    id: row.id,
    titulo: row.titulo,
    artista: row.artista ?? null,
    tonalidade: row.tonalidade ?? null,
    bpm: row.bpm ?? null,
    linkCifra: row.link_cifra ?? null,
    ministerioId: row.ministerio_id ?? null,
    createdAt: row.created_at,
  };
}

function mapLocalRow(row: typeof musicasTable.$inferSelect): Musica {
  return {
    id: row.id,
    titulo: row.titulo,
    artista: row.artista ?? null,
    tonalidade: row.tonalidade ?? null,
    bpm: row.bpm ?? null,
    linkCifra: row.linkCifra ?? null,
    ministerioId: row.ministerioId ?? null,
    createdAt: row.createdAt,
  };
}

function toSupabasePayload(data: Partial<NewMusica>) {
  const { linkCifra, ministerioId, ...rest } = data;
  return {
    ...rest,
    ...(linkCifra !== undefined ? { link_cifra: linkCifra } : {}),
    ...(ministerioId !== undefined ? { ministerio_id: ministerioId } : {}),
  };
}

function createLocalRepository(): MusicasRepository {
  // Lazy: só abre o SQLite de verdade quando o backend local está ativo.
  const localDb = getLocalDb();

  return {
    async list(ministerioId) {
      const rows = ministerioId
        ? await localDb.select().from(musicasTable).where(eq(musicasTable.ministerioId, ministerioId))
        : await localDb.select().from(musicasTable);
      return rows.map(mapLocalRow).sort((a, b) => a.titulo.localeCompare(b.titulo));
    },
    async getById(id) {
      const rows = await localDb.select().from(musicasTable).where(eq(musicasTable.id, id));
      return rows[0] ? mapLocalRow(rows[0]) : null;
    },
    async create(data: NewMusica) {
      const [row] = await localDb
        .insert(musicasTable)
        .values({
          titulo: data.titulo,
          artista: data.artista,
          tonalidade: data.tonalidade,
          bpm: data.bpm,
          linkCifra: data.linkCifra,
          ministerioId: data.ministerioId,
        })
        .returning();
      return mapLocalRow(row);
    },
    async update(id, data: UpdateMusica) {
      const [row] = await localDb
        .update(musicasTable)
        .set(data)
        .where(eq(musicasTable.id, id))
        .returning();
      if (!row) throw new Error(`Música ${id} não encontrada.`);
      return mapLocalRow(row);
    },
    async remove(id) {
      await localDb.delete(musicasTable).where(eq(musicasTable.id, id));
    },
  };
}

function createSupabaseRepository(supabase: SupabaseClient): MusicasRepository {
  return {
    async list(ministerioId) {
      let query = supabase.from("musicas").select("*").order("titulo");
      if (ministerioId) query = query.eq("ministerio_id", ministerioId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapSupabaseRow);
    },
    async getById(id) {
      const { data, error } = await supabase.from("musicas").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? mapSupabaseRow(data) : null;
    },
    async create(data: NewMusica) {
      const { data: row, error } = await supabase
        .from("musicas")
        .insert(toSupabasePayload(data))
        .select()
        .single();
      if (error) throw error;
      return mapSupabaseRow(row);
    },
    async update(id, data: UpdateMusica) {
      const { data: row, error } = await supabase
        .from("musicas")
        .update(toSupabasePayload(data))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapSupabaseRow(row);
    },
    async remove(id) {
      const { error } = await supabase.from("musicas").delete().eq("id", id);
      if (error) throw error;
    },
  };
}

export function createMusicasRepository(
  backend: Backend,
  supabase: SupabaseClient | null
): MusicasRepository {
  return backend === "local" ? createLocalRepository() : createSupabaseRepository(supabase!);
}
