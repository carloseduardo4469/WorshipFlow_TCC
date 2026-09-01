import "server-only";
import { eq } from "drizzle-orm";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLocalDb } from "@/lib/db/local/client";
import { ministerios as ministeriosTable } from "@/lib/db/local/schema";
import type { Ministerio, NewMinisterio, UpdateMinisterio } from "@/types/domain";
import type { Backend, MinisteriosRepository } from "./types";

type SupabaseMinisterioRow = {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
};

function mapSupabaseRow(row: SupabaseMinisterioRow): Ministerio {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao ?? null,
    ativo: row.ativo,
    createdAt: row.created_at,
  };
}

function mapLocalRow(row: typeof ministeriosTable.$inferSelect): Ministerio {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao ?? null,
    ativo: row.ativo,
    createdAt: row.createdAt,
  };
}

function createLocalRepository(): MinisteriosRepository {
  // Lazy: só abre o SQLite de verdade quando o backend local está ativo.
  const localDb = getLocalDb();

  return {
    async list() {
      const rows = await localDb.select().from(ministeriosTable).orderBy(ministeriosTable.nome);
      return rows.map(mapLocalRow);
    },
    async getById(id) {
      const rows = await localDb.select().from(ministeriosTable).where(eq(ministeriosTable.id, id));
      return rows[0] ? mapLocalRow(rows[0]) : null;
    },
    async create(data: NewMinisterio) {
      const [row] = await localDb.insert(ministeriosTable).values(data).returning();
      return mapLocalRow(row);
    },
    async update(id, data: UpdateMinisterio) {
      const [row] = await localDb
        .update(ministeriosTable)
        .set(data)
        .where(eq(ministeriosTable.id, id))
        .returning();
      if (!row) throw new Error(`Ministério ${id} não encontrado.`);
      return mapLocalRow(row);
    },
    async remove(id) {
      await localDb.delete(ministeriosTable).where(eq(ministeriosTable.id, id));
    },
  };
}

function createSupabaseRepository(supabase: SupabaseClient): MinisteriosRepository {
  return {
    async list() {
      const { data, error } = await supabase.from("ministerios").select("*").order("nome");
      if (error) throw error;
      return (data ?? []).map(mapSupabaseRow);
    },
    async getById(id) {
      const { data, error } = await supabase
        .from("ministerios")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapSupabaseRow(data) : null;
    },
    async create(data: NewMinisterio) {
      const { data: row, error } = await supabase
        .from("ministerios")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return mapSupabaseRow(row);
    },
    async update(id, data: UpdateMinisterio) {
      const { data: row, error } = await supabase
        .from("ministerios")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapSupabaseRow(row);
    },
    async remove(id) {
      const { error } = await supabase.from("ministerios").delete().eq("id", id);
      if (error) throw error;
    },
  };
}

export function createMinisteriosRepository(
  backend: Backend,
  supabase: SupabaseClient | null
): MinisteriosRepository {
  return backend === "local" ? createLocalRepository() : createSupabaseRepository(supabase!);
}
