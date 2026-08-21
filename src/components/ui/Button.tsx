import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "ghost";
};

export function Button({ children, variant = "primary", className = "", ...rest }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-transform duration-300 hover:-translate-y-0.5 focus-visible:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0";

  const styles =
    variant === "primary"
      ? "bg-amber text-ink hover:bg-amber/90"
      : "border border-paper/20 text-paper hover:border-paper/50";

  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}
