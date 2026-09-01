"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export function DeleteConfirmDialog({ open, title, description, onCancel, children }: {
  open: boolean;
  title: string;
  description: React.ReactNode;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") onCancel(); }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="delete-confirm-backdrop" role="presentation" onMouseDown={onCancel}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="delete-confirm-title" aria-describedby="delete-confirm-description" className="delete-confirm-dialog" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" onClick={onCancel} className="delete-confirm-close" aria-label="Fechar confirmação"><X size={17} /></button>
        <span className="delete-confirm-icon"><AlertTriangle size={22} /></span>
        <p className="delete-confirm-eyebrow">Confirmação necessária</p>
        <h2 id="delete-confirm-title">{title}</h2>
        <div id="delete-confirm-description" className="delete-confirm-description">{description}</div>
        <div className="delete-confirm-actions">
          <button type="button" onClick={onCancel} className="delete-confirm-cancel">Cancelar</button>
          {children}
        </div>
      </section>
    </div>,
    document.body
  );
}
