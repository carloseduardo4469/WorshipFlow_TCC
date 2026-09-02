import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { UsuarioRow } from "@/components/dashboard/UsuarioRow";
import { listUsuariosCached } from "@/lib/db/queries";

export default async function RegistrosUsuariosPage() {
  await requireAdmin();
  const repos = await getRepositories();
  const usuarios = await listUsuariosCached(repos);

  return <div className="mx-auto max-w-[1240px]"><PageHeader title="Registros de usuários" description="Gerencie papel e status de cada pessoa." />{usuarios.length === 0 ? <div className="db-empty db-empty-modern">Ninguém se cadastrou ainda.</div> : <div className="flex flex-col gap-3">{usuarios.map((usuario) => <UsuarioRow key={usuario.id} usuario={usuario} />)}</div>}</div>;
}
