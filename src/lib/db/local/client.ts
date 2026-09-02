// Sem "server-only" aqui de propósito: este módulo também é importado
// por scripts/seed-local.ts, que roda fora do Next (via tsx). A proteção
// contra uso no client já vem dos repositórios em db/repositories/*.
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// Banco de arquivo único, fora do supabase, sem depender de rede/porta nenhuma.
// Existe só para dev continuar funcionando quando o Supabase estiver
// inacessível (ver src/lib/db/provider.ts).

const DB_PATH = path.join(process.cwd(), ".data", "local.db");

const BOOTSTRAP_SQL = `
create table if not exists usuarios (
  id text primary key,
  nome text not null,
  email text not null unique,
  telefone text,
  instrumento_principal text,
  habilidades text,
  is_suspended integer not null default 0,
  perfil text not null default 'MEMBRO',
  foto_perfil_url text,
  ultima_atividade text,
  created_at text not null default current_timestamp
);

create table if not exists musicas (
  id integer primary key autoincrement,
  titulo text not null,
  artista text,
  tonalidade text,
  link_cifra text,
  created_at text not null default current_timestamp
);

create table if not exists repertorios (
  id integer primary key autoincrement,
  nome text not null,
  descricao text,
  created_at text not null default current_timestamp
);

create table if not exists repertorio_musicas (
  repertorio_id integer not null references repertorios(id) on delete cascade,
  musica_id integer not null references musicas(id) on delete cascade,
  primary key (repertorio_id, musica_id)
);

create table if not exists escalas (
  id integer primary key autoincrement,
  titulo text not null,
  data_escala text,
  status text not null default 'RASCUNHO',
  observacoes text,
  funcoes_usuarios text not null default '[]',
  tonalidades_musicas text not null default '[]',
  created_at text not null default current_timestamp
);

create table if not exists escala_usuarios (
  escala_id integer not null references escalas(id) on delete cascade,
  usuario_id text not null references usuarios(id) on delete cascade,
  primary key (escala_id, usuario_id)
);

create table if not exists escala_musicas (
  escala_id integer not null references escalas(id) on delete cascade,
  musica_id integer not null references musicas(id) on delete cascade,
  primary key (escala_id, musica_id)
);
`;

let _sqlite: Database.Database | null = null;
let _localDb: BetterSQLite3Database<typeof schema> | null = null;

function getSqliteHandle(): Database.Database {
  if (_sqlite) return _sqlite;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(BOOTSTRAP_SQL);
  const usuarioColumns = db.prepare("pragma table_info(usuarios)").all() as Array<{ name: string }>;
  if (!usuarioColumns.some((column) => column.name === "is_suspended")) {
    db.exec("alter table usuarios add column is_suspended integer not null default 0");
  }
  // Migração leve: coluna de presença (Online/Offline na equipe).
  if (!usuarioColumns.some((column) => column.name === "ultima_atividade")) {
    db.exec("alter table usuarios add column ultima_atividade text");
  }
  // Migração leve: BPM foi removido do sistema — elimina a coluna se ainda existir.
  try {
    const musicaColumns = db.prepare("pragma table_info(musicas)").all() as Array<{ name: string }>;
    if (musicaColumns.some((column) => column.name === "bpm")) {
      db.exec("alter table musicas drop column bpm");
    }
  } catch {
    // Versões antigas do SQLite não suportam DROP COLUMN; deixa a coluna parada (sem uso).
  }

  _sqlite = db;
  return db;
}

/**
 * Conexão LAZY: o arquivo .data/local.db só é aberto/criado na primeira
 * chamada — nunca no import do módulo. Essencial pra Vercel: o filesystem
 * lá é read-only, e importar a cadeia de repositórios não pode tentar
 * escrever em disco (o provider só escolhe "local" fora de serverless).
 */
export function getLocalDb(): BetterSQLite3Database<typeof schema> {
  if (!_localDb) {
    _localDb = drizzle(getSqliteHandle(), { schema });
  }
  return _localDb;
}
