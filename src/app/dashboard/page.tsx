import Link from "next/link";
import { ArrowUpRight, CalendarDays, Check, ListMusic } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";

function monthLabel() { return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date()); }

export default async function DashboardHomePage() {
  const { profile } = await requireAuth(); const repos = await getRepositories();
  const [escalas, musicas, repertorios, usuarios] = await Promise.all([repos.escalas.list(), repos.musicas.list(), repos.repertorios.list(), repos.usuarios.list()]);
  const activeSchedules = escalas.filter((item) => item.status !== "CANCELADA"); const team = usuarios.filter((item) => item.statusMinisterio === "ATIVO");
  const completeProfile = Boolean(profile.instrumentoPrincipal);
  const overview = [
    { label: "Membros ativos", value: `${team.length} ${team.length === 1 ? "cadastro" : "cadastros"}`, text: "Equipe disponível para escalas e ensaios.", href: "/dashboard/usuarios", tint: "cyan" },
    { label: "Músicas", value: `${musicas.length} ${musicas.length === 1 ? "item" : "itens"}`, text: "Repertório pronto para culto e ensaio.", href: "/dashboard/musicas", tint: "blue" },
    { label: "Escalas", value: `${activeSchedules.length} ${activeSchedules.length === 1 ? "escala" : "escalas"}`, text: "Planejamento consolidado da operação.", href: "/dashboard/escalas", tint: "purple" },
    { label: "Favoritos", value: `${repertorios.length} ${repertorios.length === 1 ? "louvor" : "louvores"}`, text: "Repertório pessoal salvo para consulta rápida.", href: "/dashboard/repertorios", tint: "cyan" },
  ];
  return <div className="mx-auto max-w-[1240px]">
    <section className="db-hero relative overflow-hidden px-5 py-7 sm:px-8 sm:py-10 lg:px-10 lg:py-10"><div className="db-hero-light db-hero-light-left" /><div className="db-hero-light db-hero-light-right" />
      {!completeProfile && <Link href="/dashboard/perfil" className="db-profile-nudge relative z-10 ml-auto mb-8 flex max-w-[290px] items-center gap-3 lg:fixed lg:right-7 lg:top-[5.65rem]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ffea9a] to-[#c8962d] text-[#3a2a06]"><Check size={18} strokeWidth={3} /></span><span><strong className="db-nudge-title block text-sm">Complete seu cadastro</strong><small className="db-nudge-copy mt-0.5 block text-xs font-medium">Abra o perfil e informe seu instrumento principal.</small></span><ArrowUpRight size={16} className="ml-auto text-[#f1d366]" /></Link>}
      <div className="relative z-10 max-w-[760px]"><p className="db-label text-[#55d7eb]">Soundcheck concluído</p><h2 className="db-title mt-5 max-w-[750px] text-[clamp(2.8rem,6vw,5rem)] leading-[0.89] text-[#f8f7f1]">Organize o louvor sem depender de <span className="text-[#54d9ed]">planilhas soltas.</span></h2><p className="mt-6 max-w-[640px] text-base font-medium leading-relaxed text-[#c5ced9] sm:text-lg">Centralize equipe, repertório, escalas e próximos passos em um painel preparado para a rotina real do ministério.</p><div className="mt-8 grid max-w-[620px] grid-cols-1 gap-2.5 sm:grid-cols-3"><MiniStat label="Escalas ativas" value={activeSchedules.length} /><MiniStat label="Louvores prontos" value={musicas.length} /><MiniStat label="Equipe disponível" value={team.length} /></div></div>
    </section>
    <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{overview.map((item) => <Link key={item.label} href={item.href} className={`db-overview db-overview-${item.tint}`}><p className="db-label !text-[9px] text-[#c0cada]">{item.label}</p><h3 className="db-title mt-4 text-[35px] leading-none text-[#f7f6f1]">{item.value}</h3><p className="mt-3 text-sm font-medium leading-snug text-[#c1cad6]">{item.text}</p></Link>)}</section>
    <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2"><DashboardPanel eyebrow="Mês" title={`Escalas de ${monthLabel()}`} href="/dashboard/escalas" empty={activeSchedules.length === 0 ? "Nenhuma escala prevista até o fim deste mês." : `${activeSchedules.length} escala(s) ativa(s) para acompanhar.`} icon={<CalendarDays size={18} />} /><DashboardPanel eyebrow="Repertório" title="Top louvores" href="/dashboard/repertorios" empty={musicas.length === 0 ? "Nenhum louvor foi usado em escalas ainda." : `${musicas.length} música(s) cadastrada(s) no repertório.`} icon={<ListMusic size={18} />} /></section>
  </div>;
}
function MiniStat({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-white/15 bg-white/[0.08] px-4 py-3 backdrop-blur"><p className="text-[11px] font-semibold text-[#bdc8d5]">{label}</p><p className="db-title mt-1 text-3xl leading-none text-[#fff0ad]">{value}</p></div>; }
function DashboardPanel({ eyebrow, title, href, empty, icon }: { eyebrow: string; title: string; href: string; empty: string; icon: React.ReactNode }) { return <Link href={href} className="db-section-panel"><div className="flex items-center justify-between"><div><p className="db-label !text-[9px] text-[#50d8ea]">{eyebrow}</p><h2 className="db-title mt-2 text-[31px] leading-none text-[#f7f6f1]">{title}</h2></div><span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-300/10 text-[#59dcec]">{icon}</span></div><div className="mt-6 flex min-h-[92px] items-center justify-center rounded-2xl border border-dashed border-white/15 px-5 text-center text-sm font-semibold text-[#c4ced9]">{empty}</div></Link>; }
