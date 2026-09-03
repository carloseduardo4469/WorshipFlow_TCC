import type {
  Escala,
  Musica,
  NewEscala,
  NewMusica,
  NewRepertorio,
  Repertorio,
  UpdateEscala,
  UpdateMusica,
  UpdateRepertorio,
  UpdateUsuario,
  Usuario,
} from "@/types/domain";

export type Backend = "supabase" | "local";

export interface MusicasRepository {
  list(): Promise<Musica[]>;
  count(): Promise<number>;
  getById(id: number): Promise<Musica | null>;
  /**
   * Busca paginada por título/artista (case-insensitive). Sem `busca`,
   * retorna o catálogo ordenado por título. `offset`/`limit` controlam a página.
   * `campo` restringe a busca a uma coluna (ex.: filtro "Tom").
   */
  search(params: {
    busca?: string;
    offset?: number;
    limit?: number;
    campo?: "titulo" | "artista" | "tonalidade";
  }): Promise<Musica[]>;
  /** Busca várias músicas de uma vez pelos IDs (ex.: itens já selecionados). */
  getByIds(ids: number[]): Promise<Musica[]>;
  create(data: NewMusica): Promise<Musica>;
  update(id: number, data: UpdateMusica): Promise<Musica>;
  remove(id: number): Promise<void>;
}

export interface RepertoriosRepository {
  list(): Promise<Repertorio[]>;
  count(): Promise<number>;
  getById(id: number): Promise<Repertorio | null>;
  create(data: NewRepertorio): Promise<Repertorio>;
  update(id: number, data: UpdateRepertorio): Promise<Repertorio>;
  remove(id: number): Promise<void>;
  setMusicas(repertorioId: number, musicaIds: number[]): Promise<void>;
}

export interface UsuariosRepository {
  list(): Promise<Usuario[]>;
  /** Inclui contas pendentes; uso exclusivo de telas administrativas. */
  listAll(): Promise<Usuario[]>;
  search(params: { offset?: number; limit?: number }): Promise<Usuario[]>;
  getByIds(ids: string[]): Promise<Usuario[]>;
  count(): Promise<number>;
  getById(id: string): Promise<Usuario | null>;
  getByEmail(email: string): Promise<Usuario | null>;
  update(id: string, data: UpdateUsuario): Promise<Usuario>;
  remove(id: string): Promise<void>;
  /** Só usado em modo local (seed/dev), sem trigger de auth disponível. */
  createLocal(data: Omit<Usuario, "id" | "createdAt"> & { id?: string }): Promise<Usuario>;
}

export interface EscalasRepository {
  list(): Promise<Escala[]>;
  count(statuses?: Escala["status"][]): Promise<number>;
  getById(id: number): Promise<Escala | null>;
  create(data: NewEscala): Promise<Escala>;
  update(id: number, data: UpdateEscala): Promise<Escala>;
  remove(id: number): Promise<void>;
  setUsuarios(escalaId: number, usuarioIds: string[]): Promise<void>;
  setMusicas(escalaId: number, musicaIds: number[]): Promise<void>;
}

export interface Repositories {
  backend: Backend;
  musicas: MusicasRepository;
  repertorios: RepertoriosRepository;
  usuarios: UsuariosRepository;
  escalas: EscalasRepository;
}
