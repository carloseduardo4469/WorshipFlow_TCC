import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SolicitacoesCadastro } from "./SolicitacoesCadastro";
import type { Usuario } from "@/types/domain";

vi.mock("@/lib/actions/usuarios", () => ({
  aprovarSolicitacaoCadastroAction: vi.fn(async () => null),
  negarSolicitacaoCadastroAction: vi.fn(async () => null),
}));

const pendente: Usuario = {
  id: "00000000-0000-4000-8000-000000000001",
  nome: "Estefani",
  email: "estefani@example.com",
  telefone: "11999999999",
  instrumentoPrincipal: null,
  habilidades: null,
  statusAcesso: "PENDENTE",
  isSuspended: false,
  perfil: "MEMBRO",
  fotoPerfilUrl: null,
  ultimaAtividade: null,
  createdAt: "2026-09-02T12:00:00.000Z",
};

describe("solicitacoes de cadastro", () => {
  it("abre os dados e oferece aceitar ou negar", async () => {
    const user = userEvent.setup();
    render(<SolicitacoesCadastro usuarios={[pendente]} />);

    await user.click(screen.getByRole("button", { name: /Solicitações de cadastro: 1 pendente/i }));

    expect(screen.getByRole("dialog", { name: "Solicitações de cadastro" })).toBeInTheDocument();
    expect(screen.getByText("Estefani")).toBeInTheDocument();
    expect(screen.getByText("estefani@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aceitar cadastro de Estefani" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Negar cadastro de Estefani" })).toBeInTheDocument();
  });
});
