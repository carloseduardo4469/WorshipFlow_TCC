import type { StatusEscala } from "@/types/domain";

const STYLES: Record<StatusEscala, string> = {
  RASCUNHO: "bg-paper/10 text-muted",
  PUBLICADA: "bg-teal/15 text-teal",
  CONCLUIDA: "bg-amber/15 text-amber",
  CANCELADA: "bg-red-400/15 text-red-400",
};

const LABELS: Record<StatusEscala, string> = {
  RASCUNHO: "Rascunho",
  PUBLICADA: "Publicada",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export function StatusBadge({ status }: { status: StatusEscala }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${STYLES[status]}`}>{LABELS[status]}</span>
  );
}
