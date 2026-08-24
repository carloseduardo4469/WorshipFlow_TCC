import type { StatusEscala } from "@/types/domain";

const STYLES: Record<StatusEscala, string> = {
  RASCUNHO: "db-badge-muted",
  PUBLICADA: "db-badge-teal",
  CONCLUIDA: "db-badge-amber",
  CANCELADA: "db-badge-red",
};

const LABELS: Record<StatusEscala, string> = {
  RASCUNHO: "Rascunho",
  PUBLICADA: "Publicada",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export function StatusBadge({ status }: { status: StatusEscala }) {
  return <span className={`db-badge ${STYLES[status]}`}>{LABELS[status]}</span>;
}
