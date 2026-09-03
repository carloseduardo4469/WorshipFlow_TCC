"use client";

import { useEffect, useRef, useState } from "react";

const AUTO_SAVE_DELAY_MS = 2_000;
const SAVE_BUTTON_PATTERN = /^(salvar|adicionar música)/i;

type AutoSaveStatus = "idle" | "waiting" | "saving";

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
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const timerRef = useRef<number | null>(null);
  const statusTimerRef = useRef<number | null>(null);
  const signaturesRef = useRef(new WeakMap<HTMLFormElement, string>());
  const automaticSubmitRef = useRef(new WeakSet<HTMLFormElement>());

  useEffect(() => {
    const signatures = signaturesRef.current;

    function rememberVisibleForms() {
      document.querySelectorAll<HTMLFormElement>("form").forEach((form) => {
        if (getSaveButton(form) && !signatures.has(form)) {
          signatures.set(form, formSignature(form));
        }
      });
    }

    function clearSaveTimer() {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    function clearStatusLater() {
      if (statusTimerRef.current !== null) window.clearTimeout(statusTimerRef.current);
      statusTimerRef.current = window.setTimeout(() => setStatus("idle"), 2_500);
    }

    function schedule(event: Event) {
      const form = findEligibleForm(event.target);
      if (!form) return;

      // Aguarda o React atualizar campos controlados e inputs hidden derivados.
      window.setTimeout(() => {
        if (!form.isConnected) return;
        const currentSignature = formSignature(form);
        const previousSignature = signatures.get(form);
        if (previousSignature === undefined) {
          signatures.set(form, currentSignature);
          return;
        }
        if (currentSignature === previousSignature) return;

        clearSaveTimer();
        setStatus("waiting");
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          const saveButton = getSaveButton(form);
          if (!form.isConnected || !saveButton || saveButton.disabled || !form.checkValidity()) {
            setStatus("idle");
            return;
          }
          if (formSignature(form) === signatures.get(form)) return;

          automaticSubmitRef.current.add(form);
          form.requestSubmit(saveButton);
        }, AUTO_SAVE_DELAY_MS);
      });
    }

    function submitted(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || !getSaveButton(form)) return;
      clearSaveTimer();
      signatures.set(form, formSignature(form));

      if (automaticSubmitRef.current.has(form)) {
        automaticSubmitRef.current.delete(form);
        setStatus("saving");
        clearStatusLater();
      } else {
        setStatus("idle");
      }
    }

    rememberVisibleForms();
    const observer = new MutationObserver(rememberVisibleForms);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("input", schedule);
    document.addEventListener("change", schedule);
    document.addEventListener("click", schedule);
    document.addEventListener("submit", submitted, true);

    return () => {
      observer.disconnect();
      document.removeEventListener("input", schedule);
      document.removeEventListener("change", schedule);
      document.removeEventListener("click", schedule);
      document.removeEventListener("submit", submitted, true);
      clearSaveTimer();
      if (statusTimerRef.current !== null) window.clearTimeout(statusTimerRef.current);
    };
  }, []);

  if (status === "idle") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[150] rounded-xl border border-cyan-300/25 bg-[#07101e]/95 px-4 py-2.5 text-xs font-semibold text-cyan-100 shadow-xl backdrop-blur sm:bottom-6 sm:right-6"
    >
      {status === "waiting" ? "Alteração detectada · salvando em instantes…" : "Salvando automaticamente…"}
    </div>
  );
}
