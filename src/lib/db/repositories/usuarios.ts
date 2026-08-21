import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { SupabaseClient } from "@supabase/supabase-js";
import { localDb } from "@/lib/db/local/client";
import { usuarios as usuariosTable } from "@/lib/db/local/schema";
import type { Usuario, UpdateUsuario } from "@/types/domain";
import type { Backend, UsuariosRepository } from "./types";

function mapSupabaseRow(row: any): Usuario {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone ?? null,
    instrumentoPrincipal: row.instrumento_principal ?? null,
    habilidades: row.habilidades ?? null,
    statusMinisterio: row.status_ministerio,
    perfil: row.perfil,
    fotoPerfilUrl: row.foto_perfil_url ?? null,
    ministerioId: row.ministerio_id ?? null,
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
    statusMinisterio: row.statusMinisterio as Usuario["statusMinisterio"],
    perfil: row.perfil as Usuario["perfil"],
    fotoPerfilUrl: row.fotoPerfilUrl ?? null,
    ministerioId: row.ministerioId ?? null,
    createdAt: row.createdAt,
  };
}

function toSupabasePayload(data: UpdateUsuario) {
  const { instrumentoPrincipal, statusMinisterio, fotoPerfilUrl, ministerioId, ...rest } = data;
  return {
    ...rest,
    ...(instrumentoPrincipal !== undefined ? { instrumento_principal: instrumentoPrincipal } : {}),
    ...(statusMinisterio !== undefined ? { status_ministerio: statusMinisterio } : {}),
    ...(fotoPerfilUrl !== undefined ? { foto_perfil_url: fotoPerfilUrl } : {}),
    ...(ministerioId !== undefined ? { ministerio_id: ministerioId } : {}),
  };
}

function createLocalRepository(): UsuariosRepository {
  return {
    async list(ministerioId) {
      const rows = ministerioId
        ? await localDb.select().from(usuariosTable).where(eq(usuariosTable.ministerioId, ministerioId))
        : await localDb.select().from(usuariosTable);
      return rows.map(mapLocalRow).sort((a, b) => a.nome.localeCompare(b.nome));
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
    async list(ministerioId) {
      let query = supabase.from("profiles").select("*").order("nome");
      if (ministerioId) query = query.eq("ministerio_id", ministerioId);
      const { data, error } = await query;
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
  supabase: SupabaseClient
): UsuariosRepository {
  return backend === "local" ? createLocalRepository() : createSupabaseRepository(supabase);
}
