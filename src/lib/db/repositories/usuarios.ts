import "server-only";
import { randomUUID } from "node:crypto";
import { asc, count, eq, inArray } from "drizzle-orm";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getLocalDb } from "@/lib/db/local/client";
import { usuarios as usuariosTable } from "@/lib/db/local/schema";
import type { Usuario, UpdateUsuario } from "@/types/domain";
import type { Backend, UsuariosRepository } from "./types";

type SupabaseUsuarioRow = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  instrumento_principal: string | null;
  habilidades: string | null;
  is_suspended: boolean | null;
  perfil: Usuario["perfil"];
  foto_perfil_url: string | null;
  ultima_atividade: string | null;
  created_at: string;
};

function mapSupabaseRow(row: SupabaseUsuarioRow): Usuario {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone ?? null,
    instrumentoPrincipal: row.instrumento_principal ?? null,
    habilidades: row.habilidades ?? null,
    isSuspended: Boolean(row.is_suspended),
    perfil: row.perfil,
    fotoPerfilUrl: row.foto_perfil_url ?? null,
    ultimaAtividade: row.ultima_atividade ?? null,
    createdAt: row.created_at,
  };
}

function mapLocalRow(row: typeof usuariosTable.$inferSelect): Usuario {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone ?? null,
    instrumentoPrincipal: row.instrumentoPrincipal ?? null,
    habilidades: row.habilidades ?? null,
    isSuspended: Boolean(row.isSuspended),
    perfil: row.perfil as Usuario["perfil"],
    fotoPerfilUrl: row.fotoPerfilUrl ?? null,
    ultimaAtividade: row.ultimaAtividade ?? null,
    createdAt: row.createdAt,
  };
}

function toSupabasePayload(data: UpdateUsuario) {
  const {
    instrumentoPrincipal,
    isSuspended,
    fotoPerfilUrl,
    ultimaAtividade,
    ...rest
  } = data;
  return {
    ...rest,
    ...(instrumentoPrincipal !== undefined ? { instrumento_principal: instrumentoPrincipal } : {}),
    ...(isSuspended !== undefined ? { is_suspended: isSuspended } : {}),
    ...(fotoPerfilUrl !== undefined ? { foto_perfil_url: fotoPerfilUrl } : {}),
    ...(ultimaAtividade !== undefined ? { ultima_atividade: ultimaAtividade } : {}),
  };
}

function createLocalRepository(): UsuariosRepository {
  // Lazy: só abre o SQLite de verdade quando o backend local está ativo.
  const localDb = getLocalDb();

  return {
    async count() {
      const rows = await localDb.select({ count: count() }).from(usuariosTable);
      return rows[0]?.count ?? 0;
    },
    async list() {
      const rows = await localDb.select().from(usuariosTable);
      return rows.map(mapLocalRow).sort((a, b) => a.nome.localeCompare(b.nome));
    },
    async search({ offset = 0, limit = 50 }) {
      const query = localDb.select().from(usuariosTable);
      const rows = await query.orderBy(asc(usuariosTable.nome)).limit(limit).offset(offset);
      return rows.map(mapLocalRow);
    },
    async getByIds(ids) {
      if (ids.length === 0) return [];
      const rows = await localDb.select().from(usuariosTable).where(inArray(usuariosTable.id, ids));
      return rows.map(mapLocalRow);
    },
    async getById(id) {
      const rows = await localDb.select().from(usuariosTable).where(eq(usuariosTable.id, id));
      return rows[0] ? mapLocalRow(rows[0]) : null;
    },
    async getByEmail(email) {
      const rows = await localDb.select().from(usuariosTable).where(eq(usuariosTable.email, email));
      return rows[0] ? mapLocalRow(rows[0]) : null;
    },
    async update(id, data: UpdateUsuario) {
      const [row] = await localDb
        .update(usuariosTable)
        .set(data)
        .where(eq(usuariosTable.id, id))
        .returning();
      if (!row) throw new Error(`Usuário ${id} não encontrado.`);
      return mapLocalRow(row);
    },
    async remove(id) {
      await localDb.delete(usuariosTable).where(eq(usuariosTable.id, id));
    },
    async createLocal(data) {
      const [row] = await localDb
        .insert(usuariosTable)
        .values({ id: data.id ?? randomUUID(), ...data })
        .returning();
      return mapLocalRow(row);
    },
  };
}

function createSupabaseRepository(supabase: SupabaseClient): UsuariosRepository {
  return {
    async count() {
      const query = supabase.from("profiles").select("id", { count: "exact", head: true });
      const { count: total, error } = await query;
      if (error) throw error;
      return total ?? 0;
    },
    async list() {
      const query = supabase.from("profiles").select("*").order("nome");
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapSupabaseRow);
    },
    async search({ offset = 0, limit = 50 }) {
      const query = supabase.from("profiles").select("*").order("nome").range(offset, offset + limit - 1);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapSupabaseRow);
    },
    async getByIds(ids) {
      if (ids.length === 0) return [];
      const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
      if (error) throw error;
      return (data ?? []).map(mapSupabaseRow);
    },
    async getById(id) {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data ? mapSupabaseRow(data) : null;
    },
    async getByEmail(email) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      if (error) throw error;
      return data ? mapSupabaseRow(data) : null;
    },
    async update(id, data: UpdateUsuario) {
      const { data: row, error } = await supabase
        .from("profiles")
        .update(toSupabasePayload(data))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapSupabaseRow(row);
    },
    async remove(id) {
      // Apagar o profile não basta — o usuário continua existindo no Auth.
      // Em produção isso deve ser feito via Auth Admin API (service role),
      // não por aqui. Deixado explícito para não criar uma ilusão de "delete completo".
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    async createLocal() {
      throw new Error(
        "createLocal() não se aplica ao backend Supabase — profiles são criados via trigger no signup."
      );
    },
  };
}

export function createUsuariosRepository(
  backend: Backend,
  supabase: SupabaseClient | null
): UsuariosRepository {
  return backend === "local" ? createLocalRepository() : createSupabaseRepository(supabase!);
}
