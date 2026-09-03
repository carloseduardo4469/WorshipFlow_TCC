import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AutoSaveManager } from "./AutoSaveManager";

afterEach(() => {
  vi.useRealTimers();
});

describe("AutoSaveManager", () => {
  it("envia um formulário válido após dois segundos sem alterações", () => {
    vi.useFakeTimers();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());

    render(
      <>
        <AutoSaveManager />
        <form onSubmit={onSubmit}>
          <input name="nome" defaultValue="Antes" required />
          <button type="submit">Salvar</button>
        </form>
      </>
    );

    fireEvent.input(screen.getByRole("textbox"), { target: { value: "Depois" } });
    act(() => vi.advanceTimersByTime(1_999));
    expect(onSubmit).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("Salvando automaticamente");
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
      </>
    );

    fireEvent.input(screen.getByRole("textbox"), { target: { value: "excluirminhaconta" } });
    act(() => vi.advanceTimersByTime(3_000));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
