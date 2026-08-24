import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { UsuarioRow } from "@/components/dashboard/UsuarioRow";

export default async function UsuariosPage() {
  await requireAdmin();
  const repos = await getRepositories();
  const [usuarios, ministerios] = await Promise.all([repos.usuarios.list(), repos.ministerios.list()]);

  return (
    <div className="mx-auto max-w-[1240px]">
      <PageHeader
        title="Equipe"
        description="Perfis são criados automaticamente quando alguém se cadastra. Aqui você define papel, status e ministério."
      />

      {usuarios.length === 0 ? (
        <div className="db-empty">Ninguém se cadastrou ainda.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {usuarios.map((u) => (
            <UsuarioRow key={u.id} usuario={u} ministerios={ministerios} />
          ))}
        </div>
      )}
    </div>
  );
}
