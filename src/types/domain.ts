// Tipos de domínio do WorshipFlow.
// Compartilhados pelas duas implementações de repositório (Supabase e SQLite local),
// então nada aqui pode depender de um backend específico.

export type PerfilUsuario = "ADMIN" | "MEMBRO";
export type StatusMinisterio = "ATIVO" | "INATIVO";
export type StatusEscala = "RASCUNHO" | "PUBLICADA" | "CONCLUIDA" | "CANCELADA";

export interface Ministerio {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  createdAt: string;
}

export type NewMinisterio = Pick<Ministerio, "nome" | "descricao" | "ativo">;
export type UpdateMinisterio = Partial<NewMinisterio>;

export interface Usuario {
  id: string; // uuid — mesmo id do auth.users no Supabase
  nome: string;
  email: string;
  telefone: string | null;
  instrumentoPrincipal: string | null;
  habilidades: string | null;
  statusMinisterio: StatusMinisterio;
  perfil: PerfilUsuario;
  fotoPerfilUrl: string | null;
  ministerioId: number | null;
  createdAt: string;
}

export type UpdateUsuario = Partial<
  Pick<
    Usuario,
    | "nome"
    | "telefone"
    | "instrumentoPrincipal"
    | "habilidades"
    | "statusMinisterio"
    | "perfil"
    | "fotoPerfilUrl"
    | "ministerioId"
  >
>;

export interface Musica {
  id: number;
  titulo: string;
  artista: string | null;
  tonalidade: string | null;
  bpm: number | null;
  linkCifra: string | null;
  ministerioId: number | null;
  createdAt: string;
}

export type NewMusica = Pick<
  Musica,
  "titulo" | "artista" | "tonalidade" | "bpm" | "linkCifra" | "ministerioId"
>;
export type UpdateMusica = Partial<NewMusica>;

export interface Repertorio {
  id: number;
  nome: string;
  descricao: string | null;
  ministerioId: number | null;
  musicaIds: number[];
  createdAt: string;
}

export type NewRepertorio = Pick<Repertorio, "nome" | "descricao" | "ministerioId">;
export type UpdateRepertorio = Partial<NewRepertorio>;

export interface FuncaoUsuario {
  usuarioId: string;
  funcao: string;
}

export interface TonalidadeMusica {
  musicaId: number;
  tonalidade: string;
}

export interface Escala {
  id: number;
  titulo: string;
  dataEscala: string | null; // ISO date (yyyy-mm-dd)
  status: StatusEscala;
  observacoes: string | null;
  funcoesUsuarios: FuncaoUsuario[];
  tonalidadesMusicas: TonalidadeMusica[];
  ministerioId: number | null;
  usuarioIds: string[];
  musicaIds: number[];
  createdAt: string;
}

export type NewEscala = Pick<
  Escala,
  "titulo" | "dataEscala" | "status" | "observacoes" | "funcoesUsuarios" | "tonalidadesMusicas" | "ministerioId"
>;
export type UpdateEscala = Partial<NewEscala>;
