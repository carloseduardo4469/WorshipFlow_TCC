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
  getById(id: number): Promise<Musica | null>;
  create(data: NewMusica): Promise<Musica>;
  update(id: number, data: UpdateMusica): Promise<Musica>;
  remove(id: number): Promise<void>;
}

export interface RepertoriosRepository {
  list(ministerioId?: number): Promise<Repertorio[]>;
  getById(id: number): Promise<Repertorio | null>;
  create(data: NewRepertorio): Promise<Repertorio>;
  update(id: number, data: UpdateRepertorio): Promise<Repertorio>;
  remove(id: number): Promise<void>;
  setMusicas(repertorioId: number, musicaIds: number[]): Promise<void>;
}

export interface UsuariosRepository {
  list(ministerioId?: number): Promise<Usuario[]>;
  getById(id: string): Promise<Usuario | null>;
  getByEmail(email: string): Promise<Usuario | null>;
  update(id: string, data: UpdateUsuario): Promise<Usuario>;
  remove(id: string): Promise<void>;
  /** Só usado em modo local (seed/dev), sem trigger de auth disponível. */
  createLocal(data: Omit<Usuario, "id" | "createdAt"> & { id?: string }): Promise<Usuario>;
}

export interface EscalasRepository {
  list(ministerioId?: number): Promise<Escala[]>;
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
