import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EscalaForm } from "./EscalaForm";
import { EscalaDetailsDialog } from "./EscalaDetailsDialog";
import { EscalasManager } from "./EscalasManager";
import type { Escala, Usuario } from "@/types/domain";

vi.mock("@/lib/actions/escalas", () => ({
  removerEscalaAction: vi.fn(async () => undefined),
}));

vi.mock("./EscalaForm", () => ({
  EscalaForm: vi.fn(() => <div data-testid="escala-form" />),
}));

vi.mock("./EscalaDetailsDialog", () => ({
  EscalaDetailsDialog: vi.fn(() => <div data-testid="escala-details" />),
}));

const carlos: Usuario = {
  id: "usuario-carlos",
  nome: "Carlos",
  email: "carlos@example.com",
  telefone: null,
  instrumentoPrincipal: "violao",
  habilidades: "violao",
  isSuspended: false,
  perfil: "MEMBRO",
  fotoPerfilUrl: null,
  ultimaAtividade: null,
  createdAt: "2026-09-01T00:00:00.000Z",
};

const estefani: Usuario = {
  ...carlos,
  id: "usuario-estefani",
  nome: "Estefani",
  email: "estefani@example.com",
};

const escala: Escala = {
  id: 1,
  titulo: "Culto de domingo",
  dataEscala: "2026-09-06",
  status: "PUBLICADA",
  observacoes: null,
  funcoesUsuarios: [{ usuarioId: carlos.id, funcao: "violao" }],
  tonalidadesMusicas: [],
  usuarioIds: [carlos.id],
  musicaIds: [],
  createdAt: "2026-09-01T00:00:00.000Z",
};

describe("gestao de escalas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("oferece na nova escala usuarios sem vinculo e preserva os referenciados nos detalhes", async () => {
    const user = userEvent.setup();
    render(
      <EscalasManager
        escalas={[escala]}
        usuariosReferenciados={[carlos]}
        usuariosIniciais={[carlos, estefani]}
        temMaisUsuariosInicial
      />
    );

    expect(screen.getByText("Carlos")).toBeInTheDocument();
    expect(screen.queryByText("Estefani")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Nova escala" }));

    const propriedadesFormulario = vi.mocked(EscalaForm).mock.calls.at(-1)?.[0];
    expect(propriedadesFormulario).toEqual(expect.objectContaining({
      escala: undefined,
      usuarios: [carlos, estefani],
      temMaisUsuariosInicial: true,
    }));

    await user.click(screen.getByRole("button", { name: /Fechar formul.rio/i }));
    await user.click(screen.getByText("Culto de domingo"));

    const propriedadesDetalhes = vi.mocked(EscalaDetailsDialog).mock.calls.at(-1)?.[0];
    expect(propriedadesDetalhes).toEqual(expect.objectContaining({
      escala,
      usuarios: [carlos],
    }));
  });
});
