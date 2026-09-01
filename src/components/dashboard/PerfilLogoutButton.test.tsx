import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PerfilLogoutButton } from "./PerfilLogoutButton";

vi.mock("@/lib/actions/auth", () => ({
  logoutAction: vi.fn(async () => undefined),
}));

describe("saída da conta", () => {
  it("exige confirmação e pode ser cancelada pelo teclado", async () => {
    const user = userEvent.setup();
    render(<PerfilLogoutButton />);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sair da conta" }));
    expect(screen.getByRole("alertdialog", { name: "Sair da conta?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Sair$/ })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
