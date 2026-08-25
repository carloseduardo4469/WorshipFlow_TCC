import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { cachedData } from "@/lib/db/cache";
import { PageHeader } from "@/components/ui/PageHeader";
import { UsuarioRow } from "@/components/dashboard/UsuarioRow";

export default async function RegistrosUsuariosPage() {
  await requireAdmin();
  const repos = await getRepositories();
  const [usuarios, ministerios] = await Promise.all([
    cachedData("usuarios:list", () => repos.usuarios.list()),
    cachedData("ministerios:list", () => repos.ministerios.list()),
  ]);

  return <div className="mx-auto max-w-[1240px]"><PageHeader title="Registros de usuários" description="Gerencie papel, status e vínculo de cada pessoa." />{usuarios.length === 0 ? <div className="db-empty db-empty-modern">Ninguém se cadastrou ainda.</div> : <div className="flex flex-col gap-3">{usuarios.map((usuario) => <UsuarioRow key={usuario.id} usuario={usuario} ministerios={ministerios} />)}</div>}</div>;
}
