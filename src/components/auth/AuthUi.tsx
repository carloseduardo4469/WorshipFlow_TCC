import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import logo from "@/app/icon.png";

/* ============ Logo ============ */

/** Badge circular com a logo do WorshipFlow. */
export function AuthBadge({ size = 88 }: { size?: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full shadow-[0_10px_40px_-10px_rgba(56,189,248,0.45)] ring-1 ring-white/10"
      style={{ width: size, height: size }}
    >
      <Image src={logo} alt="Logotipo WorshipFlow" fill sizes={`${size}px`} className="object-cover" />
    </div>
  );
}

/* ============ Campos ============ */

type AuthFieldProps = {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
  maxLength?: number;
  inputMode?: "text" | "numeric" | "tel" | "email";
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
}: AuthFieldProps) {
  const inputId = `field-${name}`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="af-label">
        {label}
        {required && <span className="af-required">*</span>}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
        maxLength={maxLength}
        inputMode={inputMode}
        defaultValue={defaultValue}
        className="af-input"
      />
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
