import Link from "next/link";
import { ArrowUpRight, CalendarDays, Check, History } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { concluirEscalasVencidas, hojeEmSaoPaulo } from "@/lib/escalas/status-automatico";
import { listEscalasCached } from "@/lib/db/queries";

function mesParaExibir(hoje: string) {
  const [ano, mes, dia] = hoje.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(ano, mes, 0));
  const ultimoDomingo = ultimoDia.getUTCDate() - ultimoDia.getUTCDay();
  const data = new Date(Date.UTC(ano, mes - 1 + (dia > ultimoDomingo ? 1 : 0), 1));
  const nome = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(data);
  return { prefixo: `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}`, nome: nome.charAt(0).toUpperCase() + nome.slice(1) };
}

function formatarData(data: string | null) {
  if (!data) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(new Date(`${data}T00:00:00Z`));
}

export default async function DashboardHomePage() {
  const { profile, authId } = await requireAuth();
  const repos = await getRepositories();
  const escalas = await concluirEscalasVencidas(repos, await listEscalasCached(repos, profile.ministerioId ?? -1));
  const hoje = hojeEmSaoPaulo();
  const mes = mesParaExibir(hoje);
  const minhasEscalas = escalas.filter((escala) => escala.status === "PUBLICADA" && escala.usuarioIds.includes(authId) && escala.dataEscala?.startsWith(mes.prefixo)).sort((a, b) => (a.dataEscala ?? "").localeCompare(b.dataEscala ?? ""));
  const perfilIncompleto = !profile.habilidades;
  return <div className="mx-auto max-w-[1240px]">
    {perfilIncompleto && <Link href="/dashboard/perfil" className="db-profile-nudge relative z-10 ml-auto mb-8 flex max-w-[290px] items-center gap-3 lg:absolute lg:right-7 lg:top-[5.65rem]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffea9a] to-[#c8962d] text-[#3a2a06]"><Check size={18} strokeWidth={3} /></span><span><strong className="db-nudge-title block text-sm">Complete seu cadastro</strong><small className="db-nudge-copy mt-0.5 block text-xs font-medium">Abra o perfil e informe seu instrumento principal.</small></span><ArrowUpRight size={16} className="ml-auto text-[#f1d366]" /></Link>}
    <section className="db-hero relative overflow-hidden px-5 py-7 sm:px-8 sm:py-10 lg:px-10 lg:py-10"><div className="db-hero-light db-hero-light-left" /><div className="db-hero-light db-hero-light-right" /><div className="relative z-10 max-w-[760px]"><h2 className="db-title max-w-[750px] text-[clamp(2.8rem,6vw,5rem)] leading-[0.89] text-[#f8f7f1]">Organize o louvor sem depender de <span className="db-hero-accent">planilhas soltas.</span></h2><p className="mt-6 max-w-[640px] text-base font-medium leading-relaxed text-[#c5ced9] sm:text-lg">Centralize equipe, repertório, escalas e próximos passos em um painel preparado para a rotina real do ministério.</p></div></section>
    <section className="db-card db-upcoming-panel mt-5 p-4 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="db-label !text-[9px] text-[#f6c85f]">Minha agenda</p><h2 className="db-title mt-2 text-2xl text-paper">Escalas de {mes.nome}</h2></div><span className="db-highlight-icon"><CalendarDays size={18} /></span></div><div className="mt-4 divide-y divide-[color:rgba(246,198,83,.18)]">{minhasEscalas.length === 0 ? <p className="py-5 text-sm text-muted">Você não possui escalas neste mês.</p> : minhasEscalas.map((escala) => <Link key={escala.id} href="/dashboard/escalas" className="db-home-schedule-row flex items-center justify-between gap-4 py-3"><strong className="min-w-0 truncate text-sm text-paper">{escala.titulo}</strong><time dateTime={escala.dataEscala ?? undefined} className="shrink-0 text-sm font-semibold text-muted">{formatarData(escala.dataEscala)}</time></Link>)}</div><Link href="/dashboard/escalas" className="db-outline-action mt-4"><ArrowUpRight size={15} /> Ver todas as escalas</Link></section>
    <section className="mt-5"><DashboardPanel eyebrow="Histórico" title="Escalas anteriores" href="/dashboard/historico" empty="Clique para ver escalas concluídas ou com data já passada." icon={<History size={18} />} /></section>
  </div>;
}

function DashboardPanel({ eyebrow, title, href, empty, icon }: { eyebrow: string; title: string; href: string; empty: string; icon: React.ReactNode }) { return <Link href={href} className="db-section-panel db-history-panel"><div className="flex items-center justify-between"><div><p className="db-label !text-[9px] text-[#f6c85f]">{eyebrow}</p><h2 className="db-title mt-2 text-[31px] leading-none text-[#f7f6f1]">{title}</h2></div><span className="db-history-panel-icon flex h-10 w-10 items-center justify-center rounded-full">{icon}</span></div><div className="db-history-panel-action mt-6 flex min-h-[92px] items-center justify-center rounded-2xl px-5 text-center text-sm font-bold"><ArrowUpRight size={16} /> <span>{empty}</span></div></Link>; }
