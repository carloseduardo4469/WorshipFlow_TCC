// Tipos de domínio do WorshipFlow.
// Compartilhados pelas duas implementações de repositório (Supabase e SQLite local),
// então nada aqui pode depender de um backend específico.

export type PerfilUsuario = "ADMIN" | "MEMBRO";
export type StatusAcesso = "PENDENTE" | "ATIVO";
export type StatusEscala = "RASCUNHO" | "PUBLICADA" | "CONCLUIDA" | "CANCELADA";

export interface Usuario {
  id: string; // uuid — mesmo id do auth.users no Supabase
  nome: string;
  email: string;
  telefone: string | null;
  instrumentoPrincipal: string | null;
  habilidades: string | null;
  statusAcesso: StatusAcesso;
  isSuspended: boolean;
  perfil: PerfilUsuario;
  fotoPerfilUrl: string | null;
  ultimaAtividade: string | null; // ISO — usado para mostrar Online/Offline na equipe
  createdAt: string;
}

export type UpdateUsuario = Partial<
  Pick<
    Usuario,
    | "nome"
    | "telefone"
    | "instrumentoPrincipal"
    | "habilidades"
    | "statusAcesso"
    | "isSuspended"
    | "perfil"
    | "fotoPerfilUrl"
    | "ultimaAtividade"
  >
>;

export interface Musica {
  id: number;
  titulo: string;
  artista: string | null;
  tonalidade: string | null;
  linkCifra: string | null;
  createdAt: string;
}

export type NewMusica = Pick<
  Musica,
  "titulo" | "artista" | "tonalidade" | "linkCifra"
>;
export type UpdateMusica = Partial<NewMusica>;

export interface Repertorio {
  id: number;
  nome: string;
  descricao: string | null;
  musicaIds: number[];
  createdAt: string;
}

export type NewRepertorio = Pick<Repertorio, "nome" | "descricao">;
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
  usuarioIds: string[];
  musicaIds: number[];
  createdAt: string;
}

export type NewEscala = Pick<
  Escala,
  "titulo" | "dataEscala" | "status" | "observacoes" | "funcoesUsuarios" | "tonalidadesMusicas"
>;
export type UpdateEscala = Partial<NewEscala>;
