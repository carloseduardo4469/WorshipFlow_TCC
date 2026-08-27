import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Espelha src/lib/db/schema.sql, mas em SQLite — só usado quando o Supabase
// não está acessível (ex.: rede que bloqueia a conexão). Sem RLS aqui: quem
// decide o que cada perfil pode ver/editar é a camada de repositório/rotas.

export const ministerios = sqliteTable("ministerios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const usuarios = sqliteTable("usuarios", {
  id: text("id").primaryKey(), // uuid gerado em app, para bater com o formato do Supabase
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  telefone: text("telefone"),
  instrumentoPrincipal: text("instrumento_principal"),
  habilidades: text("habilidades"),
  statusMinisterio: text("status_ministerio").notNull().default("ATIVO"),
  isSuspended: integer("is_suspended", { mode: "boolean" }).notNull().default(false),
  perfil: text("perfil").notNull().default("MEMBRO"),
  fotoPerfilUrl: text("foto_perfil_url"),
  ministerioId: integer("ministerio_id").references(() => ministerios.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const musicas = sqliteTable("musicas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  titulo: text("titulo").notNull(),
  artista: text("artista"),
  tonalidade: text("tonalidade"),
  bpm: integer("bpm"),
  linkCifra: text("link_cifra"),
  ministerioId: integer("ministerio_id").references(() => ministerios.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const repertorios = sqliteTable("repertorios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  ministerioId: integer("ministerio_id").references(() => ministerios.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const repertorioMusicas = sqliteTable(
  "repertorio_musicas",
  {
    repertorioId: integer("repertorio_id")
      .notNull()
      .references(() => repertorios.id, { onDelete: "cascade" }),
    musicaId: integer("musica_id")
      .notNull()
      .references(() => musicas.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.repertorioId, t.musicaId] }) })
);

export const escalas = sqliteTable("escalas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  titulo: text("titulo").notNull(),
  dataEscala: text("data_escala"),
  status: text("status").notNull().default("RASCUNHO"),
  observacoes: text("observacoes"),
  // JSON serializado como texto — sqlite não tem jsonb nativo.
  funcoesUsuarios: text("funcoes_usuarios", { mode: "json" }).notNull().default("[]"),
  tonalidadesMusicas: text("tonalidades_musicas", { mode: "json" }).notNull().default("[]"),
  ministerioId: integer("ministerio_id").references(() => ministerios.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

export const escalaUsuarios = sqliteTable(
  "escala_usuarios",
  {
    escalaId: integer("escala_id")
      .notNull()
      .references(() => escalas.id, { onDelete: "cascade" }),
    usuarioId: text("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.escalaId, t.usuarioId] }) })
);

export const escalaMusicas = sqliteTable(
  "escala_musicas",
  {
    escalaId: integer("escala_id")
      .notNull()
      .references(() => escalas.id, { onDelete: "cascade" }),
    musicaId: integer("musica_id")
      .notNull()
      .references(() => musicas.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.escalaId, t.musicaId] }) })
);
