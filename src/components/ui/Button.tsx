import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "ghost";
};

export function Button({ children, variant = "primary", className = "", ...rest }: ButtonProps) {
  const styles =
    variant === "primary"
      ? "db-cta"
      : "db-ghost rounded-full px-6 py-2.5";

  return (
    <button className={`inline-flex items-center justify-center gap-2 transition-transform duration-300 hover:-translate-y-0.5 focus-visible:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}
