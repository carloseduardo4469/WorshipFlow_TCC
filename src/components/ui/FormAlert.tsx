export function FormAlert({ kind = "error", children }: { kind?: "error" | "success"; children: React.ReactNode }) {
  const styles =
    kind === "error"
      ? "border-red-400/30 bg-red-400/10 text-red-300"
      : "border-teal/30 bg-teal/10 text-teal";

  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}
