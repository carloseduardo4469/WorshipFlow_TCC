import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationBell, NotificationsProvider } from "./NotificationsProvider";
import { ativarPush, listarNotificacoes, marcarNotificacoesLidas } from "@/lib/actions/notifications";
vi.mock("@/lib/actions/notifications", () => ({ ativarPush: vi.fn(), desativarPush: vi.fn(), listarNotificacoes: vi.fn(), marcarNotificacoesLidas: vi.fn() }));
vi.mock("next/image", () => ({ default: (props: { alt: string }) => <span role="img" aria-label={props.alt} /> }));
const result = { items: [{ id: "11111111-1111-4111-a111-111111111111", usuario_id: "user", escala_id: 3, tipo: "nova" as const, titulo: "Nova escala para você", mensagem: "Domingo · 04/10/2026 · Guitarra", created_at: "2026-09-28T18:00:00Z", read_at: null }], unread: 1, enabled: false, publicKey: "key" };
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listarNotificacoes).mockResolvedValue(result);
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
});
describe("central de notificações", () => {
  it("exibe sino, identidade visual e avisos sem pedir permissão automaticamente", async () => {
    const user = userEvent.setup();
    render(<NotificationsProvider><NotificationBell /></NotificationsProvider>);
    await user.click(await screen.findByRole("button", { name: "Notificações, 1 não lidas" }));
    expect(screen.getByRole("dialog", { name: "Suas notificações" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "WorshipFlow" })).toBeInTheDocument();
    expect(screen.getByText("Domingo · 04/10/2026 · Guitarra")).toBeInTheDocument();
    expect(ativarPush).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Fechar notificações" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("marca apenas avisos apresentados e mantém a navegação para escalas", async () => {
    const user = userEvent.setup();
    vi.mocked(marcarNotificacoesLidas).mockResolvedValue({ success: true });
    render(<NotificationsProvider><NotificationBell /></NotificationsProvider>);
    await user.click(await screen.findByRole("button", { name: "Notificações, 1 não lidas" }));
    expect(screen.getByRole("link")).toHaveAttribute("href", "/dashboard/escalas");
    await user.click(screen.getByRole("button", { name: "Marcar como lidas" }));
    await waitFor(() => expect(marcarNotificacoesLidas).toHaveBeenCalledWith([result.items[0].id]));
  });
});
