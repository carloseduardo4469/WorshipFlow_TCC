import { requireAdmin } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { UsuarioRow } from "@/components/dashboard/UsuarioRow";
import { SolicitacoesCadastro } from "@/components/dashboard/SolicitacoesCadastro";
import { listTodosUsuariosCached } from "@/lib/db/queries";

export default async function RegistrosUsuariosPage() {
  await requireAdmin();
  const repos = await getRepositories();
  const usuarios = await listTodosUsuariosCached(repos);
  const usuariosPendentes = usuarios.filter((usuario) => usuario.statusAcesso === "PENDENTE");
  const usuariosAtivos = usuarios.filter((usuario) => usuario.statusAcesso === "ATIVO");

  return (
    <div className="mx-auto max-w-[1240px]">
      <PageHeader
        title="Registros de usuários"
        description="Gerencie papel, status e solicitações de entrada."
        action={<SolicitacoesCadastro usuarios={usuariosPendentes} />}
      />

      {usuariosAtivos.length === 0 ? (
        <div className="db-empty db-empty-modern">Nenhum usuário liberado ainda.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {usuariosAtivos.map((usuario) => <UsuarioRow key={usuario.id} usuario={usuario} />)}
        </div>
      )}
    </div>
  );
}
