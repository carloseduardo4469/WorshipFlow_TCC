import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

function TestDialog({ onConfirm = vi.fn() }: { onConfirm?: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <DeleteConfirmDialog
      open={open}
      title="Excluir música?"
      description="Esta ação não pode ser desfeita."
      onCancel={() => setOpen(false)}
    >
      <button type="button" onClick={onConfirm}>Confirmar exclusão</button>
    </DeleteConfirmDialog>
  );
}

describe("confirmação de exclusão", () => {
  it("não confirma antes da ação explícita do usuário", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<TestDialog onConfirm={onConfirm} />);

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirmar exclusão" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("fecha pelo Escape e libera a rolagem", () => {
    render(<TestDialog />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });
});
