import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { removerEscalaAction } from "@/lib/actions/escalas";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

export default async function RegistrosEscalasPage() {
  await requireAdmin();
  const repos = await getRepositories();
  const [escalas, usuarios] = await Promise.all([repos.escalas.list(), repos.usuarios.list()]);
  const nomesPorId = new Map(usuarios.map((usuario) => [usuario.id, usuario.nome]));

  return (
    <div className="mx-auto max-w-[1240px]">
      <div className="db-page-toolbar"><PageHeader title="Registro de escalas" description="Crie, edite e acompanhe a programação das equipes." /><Link href="/dashboard/admin/escalas/novo" className="db-cta"><Plus size={16} />Nova escala</Link></div>
      <DataTable headers={["Título", "Data", "Status", "Equipe", ""]} isEmpty={escalas.length === 0} emptyMessage="Nenhuma escala cadastrada ainda.">
        {escalas.map((escala) => <tr key={escala.id}><td className="px-4 py-3.5 text-paper font-medium">{escala.titulo}</td><td className="px-4 py-3.5 text-muted">{formatDate(escala.dataEscala)}</td><td className="px-4 py-3.5"><StatusBadge status={escala.status} /></td><td className="px-4 py-3.5 text-muted">{escala.usuarioIds.length === 0 ? "—" : escala.usuarioIds.map((id) => nomesPorId.get(id) ?? "?").join(", ")}</td><td className="px-4 py-3.5 text-right"><div className="db-row-actions"><Link href={`/dashboard/admin/escalas/${escala.id}`} className="db-btn-sm">Editar</Link><form action={removerEscalaAction}><input type="hidden" name="id" value={escala.id} /><button type="submit" className="text-xs font-semibold text-red-400 hover:text-red-300">Excluir</button></form></div></td></tr>)}
      </DataTable>
    </div>
  );
}
