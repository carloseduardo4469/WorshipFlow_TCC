import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

function formatDate(iso: string | null) {
  if (!iso) return "sem data";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

export default async function DashboardHomePage() {
  const { profile } = await requireAuth();
  const repos = await getRepositories();

  const [escalas, musicas, repertorios] = await Promise.all([
    repos.escalas.list(),
    repos.musicas.list(),
    repos.repertorios.list(),
  ]);

  const minhasProximasEscalas = escalas
    .filter((e) => e.usuarioIds.includes(profile.id) && e.status !== "CANCELADA")
    .slice(0, 5);

  const cards = [
    { label: "Escalas", value: escalas.length, href: "/dashboard/escalas" },
    { label: "Músicas", value: musicas.length, href: "/dashboard/musicas" },
    { label: "Repertórios", value: repertorios.length, href: "/dashboard/repertorios" },
  ];

  return (
    <div>
      <PageHeader title={`Olá, ${profile.nome.split(" ")[0]}`} description="Resumo do ministério." />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-paper/10 p-5 transition-colors hover:border-amber/40"
          >
            <p className="text-2xl font-bold text-paper">{c.value}</p>
            <p className="text-sm text-muted">{c.label}</p>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-paper">Suas próximas escalas</h2>
        {minhasProximasEscalas.length === 0 ? (
          <p className="text-sm text-muted">Você não está escalado em nada no momento.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {minhasProximasEscalas.map((e) => (
              <Link
                key={e.id}
                href={`/dashboard/escalas/${e.id}`}
                className="flex items-center justify-between rounded-lg border border-paper/10 px-4 py-3 hover:border-amber/40"
              >
                <div>
                  <p className="text-sm text-paper">{e.titulo}</p>
                  <p className="text-xs text-muted">{formatDate(e.dataEscala)}</p>
                </div>
                <StatusBadge status={e.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
