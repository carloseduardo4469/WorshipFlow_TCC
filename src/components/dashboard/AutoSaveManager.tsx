"use client";

import { useEffect, useRef, useState } from "react";

const SAVE_BUTTON_PATTERN = /^(salvar|adicionar música)/i;

function getSaveButton(form: HTMLFormElement): HTMLButtonElement | null {
  const buttons = form.querySelectorAll<HTMLButtonElement>('button[type="submit"]');
  return Array.from(buttons).find((button) => SAVE_BUTTON_PATTERN.test(button.textContent?.trim() ?? "")) ?? null;
}

function formSignature(form: HTMLFormElement): string {
  const entries: string[] = [];
  new FormData(form).forEach((value, key) => {
    const serialized = value instanceof File
      ? `${value.name}:${value.size}:${value.type}:${value.lastModified}`
      : value;
    entries.push(`${key}=${serialized}`);
  });
  return entries.sort().join("&");
}

function findEligibleForm(target: EventTarget | null): HTMLFormElement | null {
  if (!(target instanceof Element)) return null;
  const form = target.closest("form");
  return form instanceof HTMLFormElement && getSaveButton(form) ? form : null;
}

export function AutoSaveManager() {
  const [saving, setSaving] = useState(false);
  const statusTimerRef = useRef<number | null>(null);
  const signaturesRef = useRef(new WeakMap<HTMLFormElement, string>());
  const dirtyFormsRef = useRef(new Set<HTMLFormElement>());
  const automaticSubmitRef = useRef(new WeakSet<HTMLFormElement>());

  useEffect(() => {
    const signatures = signaturesRef.current;
    const dirtyForms = dirtyFormsRef.current;

    function rememberVisibleForms() {
      document.querySelectorAll<HTMLFormElement>("form").forEach((form) => {
        if (getSaveButton(form) && !signatures.has(form)) {
          signatures.set(form, formSignature(form));
        }
      });
      dirtyForms.forEach((form) => {
        if (!form.isConnected) dirtyForms.delete(form);
      });
    }

    function markAsChanged(event: Event) {
      const form = findEligibleForm(event.target);
      if (!form) return;

      window.setTimeout(() => {
        if (!form.isConnected) return;
        const currentSignature = formSignature(form);
        const initialSignature = signatures.get(form);
        if (initialSignature === undefined) {
          signatures.set(form, currentSignature);
        } else if (currentSignature !== initialSignature) {
          dirtyForms.add(form);
        } else {
          dirtyForms.delete(form);
        }
      });
    }

    function saveWhenLeaving(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;

      for (const form of dirtyForms) {
        if (!form.isConnected) {
          dirtyForms.delete(form);
          continue;
        }
        if (form.contains(target)) continue;

        const saveButton = getSaveButton(form);
        if (!saveButton || saveButton.disabled) continue;
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
          form.reportValidity();
          return;
        }

        // Impede que o mesmo clique feche/desmonte o modal antes de a Server
        // Action terminar. No sucesso, o callback do formulário fecha a tela.
        event.preventDefault();
        event.stopPropagation();
        automaticSubmitRef.current.add(form);
        dirtyForms.delete(form);
        signatures.set(form, formSignature(form));
        form.requestSubmit(saveButton);
      }
    }

    function submitted(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !getSaveButton(form)) return;
      dirtyForms.delete(form);
      signatures.set(form, formSignature(form));

      if (!automaticSubmitRef.current.has(form)) return;
      automaticSubmitRef.current.delete(form);
      setSaving(true);
      if (statusTimerRef.current !== null) window.clearTimeout(statusTimerRef.current);
      statusTimerRef.current = window.setTimeout(() => setSaving(false), 2_500);
    }

    rememberVisibleForms();
    const observer = new MutationObserver(rememberVisibleForms);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("input", markAsChanged);
    document.addEventListener("change", markAsChanged);
    document.addEventListener("click", markAsChanged);
    document.addEventListener("pointerdown", saveWhenLeaving, true);
    document.addEventListener("submit", submitted, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("input", markAsChanged);
      document.removeEventListener("change", markAsChanged);
      document.removeEventListener("click", markAsChanged);
      document.removeEventListener("pointerdown", saveWhenLeaving, true);
      document.removeEventListener("submit", submitted, true);
      if (statusTimerRef.current !== null) window.clearTimeout(statusTimerRef.current);
    };
  }, []);

  if (!saving) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[150] rounded-xl border border-cyan-300/25 bg-[#07101e]/95 px-4 py-2.5 text-xs font-semibold text-cyan-100 shadow-xl backdrop-blur sm:bottom-6 sm:right-6"
    >
      Salvando alterações antes de sair…
    </div>
  );
}
