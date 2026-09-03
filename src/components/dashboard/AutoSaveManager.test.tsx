import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AutoSaveManager } from "./AutoSaveManager";

afterEach(() => {
  vi.useRealTimers();
});

describe("AutoSaveManager", () => {
  it("salva um formulário alterado quando o usuário clica fora dele", () => {
    vi.useFakeTimers();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());

    render(
      <>
        <AutoSaveManager />
        <form onSubmit={onSubmit}>
          <input name="nome" defaultValue="Antes" required />
          <button type="submit">Salvar</button>
          <button type="button">Cancelar</button>
        </form>
        <button type="button">Fechar tela</button>
      </>
    );

    fireEvent.input(screen.getByRole("textbox"), { target: { value: "Depois" } });
    act(() => vi.runOnlyPendingTimers());

    fireEvent.pointerDown(screen.getByRole("button", { name: "Cancelar" }));
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.pointerDown(screen.getByRole("button", { name: "Fechar tela" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("Salvando alterações antes de sair");
  });

  it("não envia ações destrutivas automaticamente", () => {
    vi.useFakeTimers();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());

    render(
      <>
        <AutoSaveManager />
        <form onSubmit={onSubmit}>
          <input name="confirmacao" defaultValue="" />
          <button type="submit">Sim, excluir conta</button>
        </form>
        <button type="button">Fechar tela</button>
      </>
    );

    fireEvent.input(screen.getByRole("textbox"), { target: { value: "excluirminhaconta" } });
    act(() => vi.runOnlyPendingTimers());
    fireEvent.pointerDown(screen.getByRole("button", { name: "Fechar tela" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
