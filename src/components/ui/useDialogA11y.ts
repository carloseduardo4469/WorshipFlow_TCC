"use client";

import { useEffect, useRef } from "react";

const openDialogs: HTMLElement[] = [];
let bodyLockCount = 0;
let previousBodyOverflow = "";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function useDialogA11y(open: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    openDialogs.push(dialog);
    if (bodyLockCount++ === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }

    const focusFirst = window.requestAnimationFrame(() => {
      const preferred = dialog.querySelector<HTMLElement>("[autofocus]");
      const first = preferred ?? dialog.querySelector<HTMLElement>(FOCUSABLE) ?? dialog;
      first.focus({ preventScroll: true });
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (openDialogs.at(-1) !== dialog) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter((element) => !element.hasAttribute("disabled") && element.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFirst);
      document.removeEventListener("keydown", handleKeyDown);
      const index = openDialogs.lastIndexOf(dialog);
      if (index >= 0) openDialogs.splice(index, 1);
      bodyLockCount = Math.max(0, bodyLockCount - 1);
      if (bodyLockCount === 0) document.body.style.overflow = previousBodyOverflow;
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [open]);

  return dialogRef;
}
