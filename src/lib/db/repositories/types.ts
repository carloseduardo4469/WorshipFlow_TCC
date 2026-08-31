import type {
  Escala,
  Ministerio,
  Musica,
  NewEscala,
  NewMinisterio,
  NewMusica,
  NewRepertorio,
  Repertorio,
  UpdateEscala,
  UpdateMinisterio,
  UpdateMusica,
  UpdateRepertorio,
  UpdateUsuario,
  Usuario,
} from "@/types/domain";

export type Backend = "supabase" | "local";

export interface MinisteriosRepository {
  list(): Promise<Ministerio[]>;
  getById(id: number): Promise<Ministerio | null>;
  create(data: NewMinisterio): Promise<Ministerio>;
  update(id: number, data: UpdateMinisterio): Promise<Ministerio>;
  remove(id: number): Promise<void>;
}

export interface MusicasRepository {
  list(ministerioId?: number): Promise<Musica[]>;
  count(ministerioId?: number): Promise<number>;
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
    ministerioId?: number;
    campo?: "titulo" | "artista" | "tonalidade";
  }): Promise<Musica[]>;
  /** Busca várias músicas de uma vez pelos IDs (ex.: itens já selecionados). */
  getByIds(ids: number[]): Promise<Musica[]>;
  create(data: NewMusica): Promise<Musica>;
  update(id: number, data: UpdateMusica): Promise<Musica>;
  remove(id: number): Promise<void>;
}

export interface RepertoriosRepository {
  list(ministerioId?: number): Promise<Repertorio[]>;
  count(ministerioId?: number): Promise<number>;
  getById(id: number): Promise<Repertorio | null>;
  create(data: NewRepertorio): Promise<Repertorio>;
  update(id: number, data: UpdateRepertorio): Promise<Repertorio>;
  remove(id: number): Promise<void>;
  setMusicas(repertorioId: number, musicaIds: number[]): Promise<void>;
}

export interface UsuariosRepository {
  list(ministerioId?: number): Promise<Usuario[]>;
  search(params: { offset?: number; limit?: number; ministerioId?: number }): Promise<Usuario[]>;
  getByIds(ids: string[]): Promise<Usuario[]>;
  count(ministerioId?: number, statusMinisterio?: Usuario["statusMinisterio"]): Promise<number>;
  getById(id: string): Promise<Usuario | null>;
  getByEmail(email: string): Promise<Usuario | null>;
  update(id: string, data: UpdateUsuario): Promise<Usuario>;
  remove(id: string): Promise<void>;
  /** Só usado em modo local (seed/dev), sem trigger de auth disponível. */
  createLocal(data: Omit<Usuario, "id" | "createdAt"> & { id?: string }): Promise<Usuario>;
}

export interface EscalasRepository {
  list(ministerioId?: number): Promise<Escala[]>;
  count(ministerioId?: number, statuses?: Escala["status"][]): Promise<number>;
  getById(id: number): Promise<Escala | null>;
  create(data: NewEscala): Promise<Escala>;
  update(id: number, data: UpdateEscala): Promise<Escala>;
  remove(id: number): Promise<void>;
  setUsuarios(escalaId: number, usuarioIds: string[]): Promise<void>;
  setMusicas(escalaId: number, musicaIds: number[]): Promise<void>;
}

export interface Repositories {
  backend: Backend;
  ministerios: MinisteriosRepository;
  musicas: MusicasRepository;
  repertorios: RepertoriosRepository;
  usuarios: UsuariosRepository;
  escalas: EscalasRepository;
}
