"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import logo from "@/app/icon.webp";

/* ============ Logo ============ */

/** Badge circular com a logo do WorshipFlow. */
export function AuthBadge({ size = 88 }: { size?: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full shadow-[0_10px_40px_-10px_rgba(56,189,248,0.45)] ring-1 ring-white/10"
      style={{ width: size, height: size }}
    >
      <Image src={logo} alt="Logotipo WorshipFlow" width={size} height={size} sizes={`${size}px`} className="object-cover" />
    </div>
  );
}

/* ============ Campos ============ */

type AuthFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "type" | "defaultValue"> & {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  defaultValue?: string;
};

/** Campo com label mono espaçada, asterisco vermelho e texto de ajuda. */
export function AuthField({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
  autoComplete,
  minLength,
  maxLength,
  inputMode,
  hint,
  defaultValue,
  ...rest
}: AuthFieldProps) {
  const inputId = `field-${name}`;
  const passwordField = type === "password";
  const [mostrarSenha, setMostrarSenha] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="af-label">
        {label}
        {required && <span className="af-required">*</span>}
      </label>
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={passwordField && mostrarSenha ? "text" : type}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          inputMode={inputMode}
          defaultValue={defaultValue}
          className={`af-input w-full ${passwordField ? "!pr-12" : ""}`}
          {...rest}
        />
        {passwordField && (
          <button
            type="button"
            onClick={() => setMostrarSenha((atual) => !atual)}
            aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={mostrarSenha}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[color:var(--af-muted)] transition hover:bg-white/10 hover:text-[color:var(--af-text)]"
          >
            {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {hint && <p className="af-hint">{hint}</p>}
    </div>
  );
}

/* ============ Botões ============ */

/** Botão principal amarelo (submit). */
export function PrimaryButton({ disabled = false, children }: { disabled?: boolean; children: ReactNode }) {
  return (
    <button type="submit" disabled={disabled} className="af-btn-primary">
      {children}
    </button>
  );
}

/** Link pill vazado centralizável (Esqueci minha senha, Voltar para login…). */
export function GhostPillLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="af-btn-pill">
      {children}
    </Link>
  );
}

/** Link de largura total com texto sublinhado (Cadastre-se / Entrar). */
export function GhostUnderlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="af-btn-underline">
      {children}
    </Link>
  );
}
