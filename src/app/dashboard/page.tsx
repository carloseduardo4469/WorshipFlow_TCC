import Link from "next/link";
import { CalendarDays, ListMusic, UsersRound } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

function formatDate(iso: string | null) {
  if (!iso) return "sem data";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    weekday: "short",
    year: "numeric",
  });
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
    .sort((a, b) => (a.dataEscala ?? "").localeCompare(b.dataEscala ?? ""))
    .slice(0, 4);

  const cards = [
    { label: "Escalas", value: escalas.length, href: "/dashboard/escalas", icon: CalendarDays },
    { label: "Músicas", value: musicas.length, href: "/dashboard/musicas", icon: ListMusic },
    { label: "Repertórios", value: repertorios.length, href: "/dashboard/repertorios", icon: UsersRound },
  ];

  return (
    <div>
      <PageHeader
        title={`Olá, ${profile.nome.split(" ")[0]}.`}
        description="Bem-vindo de volta — este é o resumo do seu ministério de louvor."
      />

      <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="db-panel group flex items-center justify-between gap-4 p-6 transition hover:border-amber/40 hover:-translate-y-1"
            >
              <div>
                <p className="db-title text-4xl font-black leading-none text-paper">{c.value}</p>
                <p className="db-label mt-2">{c.label}</p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber/12 text-amber transition group-hover:scale-1.06">
                <Icon size={22} />
              </div>
            </Link>
          );
        })}
      </div>

      <div id="proximas-escalas" className="scroll-mt-8">
        <h2 className="mb-4 flex items-center gap-3">
          <span className="db-title text-2xl font-extrabold text-paper">Próximas escalas</span>
          <span className="h-px flex-1 bg-[color:rgba(148,163,184,0.14)]" />
          <Link href="/dashboard/escalas" className="text-xs font-semibold text-amber hover:underline">
            Ver todas →
          </Link>
        </h2>

        {minhasProximasEscalas.length === 0 ? (
          <div className="db-empty">Você não está escalado em nada no momento.</div>
        ) : (
          <div className="db-card overflow-hidden flex flex-col gap-3 p-6">
            {minhasProximasEscalas.map((e) => (
              <Link
                key={e.id}
                href={`/dashboard/escalas/${e.id}`}
                className="group flex items-center justify-between rounded-xl border border-[color:rgba(148,163,184,0.14)] bg-[color:#0c1428] px-4 py-3.5 transition hover:border-amber/40"
              >
                <div className="min-w-0">
                  <p className="font-medium text-paper">{e.titulo}</p>
                  <p className="mt-0.5 text-xs text-muted">{formatDate(e.dataEscala)}</p>
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
