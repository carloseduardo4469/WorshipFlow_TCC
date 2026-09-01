import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AuthField } from "./AuthUi";

describe("campo de senha", () => {
  it("mostra e volta a esconder a senha sem submeter o formulário", async () => {
    const user = userEvent.setup();
    render(<AuthField label="Senha" name="senha" type="password" />);
    const input = screen.getByLabelText("Senha");

    expect(input).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(input).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Ocultar senha" }));
    expect(input).toHaveAttribute("type", "password");
  });
});
