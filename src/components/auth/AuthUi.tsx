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

export function GoogleAuthButton({ children }: { children: ReactNode }) {
  return (
    <button type="submit" className="af-btn-google">
      <svg className="af-google-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.32 2.98-7.39Z" />
        <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.38l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.61A10 10 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.39 13.92A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.92V7.47H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.53l3.35-2.61Z" />
        <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.82 1.5l2.88-2.87A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.47l3.35 2.61C7.18 7.71 9.39 5.95 12 5.95Z" />
      </svg>
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
