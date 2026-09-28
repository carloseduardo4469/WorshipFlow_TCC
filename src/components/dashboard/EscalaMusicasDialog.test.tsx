import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EscalaMusicasDialog, type RepertorioRascunho } from "./EscalaMusicasDialog";
import { isTonalidadeValida, tomParaSelecao } from "@/lib/music/tonalidades";
import type { Escala } from "@/types/domain";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/actions/escalas", () => ({ adicionarMusicasNaEscalaAction: vi.fn() }));
vi.mock("@/lib/actions/musicas", () => ({
  criarMusicaNaEscalaAction: vi.fn(), buscarMusicas: vi.fn(async () => []), buscarMusicasPorIds: vi.fn(async () => []),
}));
vi.mock("./usePaginacaoDeslizante", () => ({ usePaginacaoDeslizante: () => ({
  itensVisiveis: [{ id: 7, titulo: "Musica teste", artista: "Artista", tonalidade: "C" }],
  totalCarregado: 1, topoAltura: 0, fundoAltura: 0, refLinha: () => undefined,
}) }));
const escala: Escala = { id: 1, titulo: "Culto", musicaIds: [], usuarioIds: [], funcoesUsuarios: [], tonalidadesMusicas: [], dataEscala: null, observacoes: null, status: "PUBLICADA", createdAt: "" };
function Harness() {
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState<RepertorioRascunho>();
  return <><button onClick={() => setOpen(true)}>Reabrir</button>{open && <EscalaMusicasDialog escala={escala} rascunho={draft} onRascunho={setDraft} onClose={() => setOpen(false)} />}</>;
}

describe("rascunho do repertorio", () => {
  it("preserva campos e selecao ao fechar os dois pop-ups pelo fundo", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Nova música" }));
    let novo = screen.getByRole("dialog", { name: "Nova música" });
    const titulo = within(novo).getByRole("textbox", { name: "Título" });
    await user.type(titulo, "Meu rascunho");
    await user.click(within(novo).getByRole("heading", { name: "Nova música" }));
    expect(novo).toBeInTheDocument();
    await user.click(within(novo).getByRole("button", { name: "Tonalidade" }));
    await user.click(within(novo).getByRole("option", { name: "Indefinido" }));
    fireEvent.mouseDown(novo.parentElement!);
    expect(screen.queryByRole("dialog", { name: "Nova música" })).not.toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("dialog", { name: "Adicionar músicas" }).parentElement!);
    await user.click(screen.getByRole("button", { name: "Reabrir" }));
    expect(screen.getByRole("checkbox")).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Nova música" }));
    novo = screen.getByRole("dialog", { name: "Nova música" });
    expect(within(novo).getByRole("textbox", { name: "Título" })).toHaveValue("Meu rascunho");
    expect(within(novo).getByRole("button", { name: "Tonalidade" })).toHaveTextContent("Indefinido");
  });
  it("aceita Indefinido e preserva a normalizacao de tons existentes", () => {
    expect(isTonalidadeValida("Indefinido")).toBe(true);
    expect(tomParaSelecao("Indefinido")).toBe("Indefinido");
    expect(tomParaSelecao("C#m")).toBe("E");
    expect(isTonalidadeValida("invalido")).toBe(false);
  });
});
