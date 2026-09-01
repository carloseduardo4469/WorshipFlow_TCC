import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CadastroPage from "./page";

vi.mock("@/lib/actions/auth", () => ({
  cadastroAction: vi.fn(async () => null),
  loginComGoogleAction: vi.fn(async () => undefined),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string | { src: string }; alt: string }) =>
    React.createElement("img", { src: typeof src === "string" ? src : src.src, alt, ...props }),
}));

describe("cadastro em tela mobile", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 320 });
  });

  it("mantém todos os campos acessíveis e sanitiza o telefone", async () => {
    const user = userEvent.setup();
    render(<CadastroPage />);

    expect(screen.getByRole("heading", { name: "Criar conta" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nome/)).toHaveAttribute("maxlength", "32");
    const telefone = screen.getByLabelText(/^Telefone/);
    expect(telefone).not.toBeRequired();
    fireEvent.change(telefone, { target: { value: "(11) 98552-0784😀" } });
    expect(telefone).toHaveValue("11985520784");

    const senha = screen.getByLabelText(/^Senha/);
    expect(senha).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(senha).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Cadastrar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar com google/i })).toBeInTheDocument();
  });
});
