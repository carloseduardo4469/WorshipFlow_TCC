import { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

export function Input({ label, error, id, className = "", ...rest }: InputProps) {
  const inputId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-paper/80">
        {label}
      </label>
      <input
        id={inputId}
        className={`rounded-lg border border-paper/20 bg-ink px-4 py-2.5 text-paper placeholder:text-muted focus:border-amber focus:outline-none ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
