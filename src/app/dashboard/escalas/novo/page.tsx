import { requireAdmin } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { EscalaForm } from "@/components/dashboard/EscalaForm";
import { getRepositories } from "@/lib/db/repositories";
import { firstUsuariosPageCached } from "@/lib/db/queries";

const TAMANHO_PAGINA = 20;

export default async function NovaEscalaPage() {
  const { profile } = await requireAdmin();
  const repos = await getRepositories();
  const resultadoInicial = await firstUsuariosPageCached(
    repos,
    profile.ministerioId ?? -1,
    TAMANHO_PAGINA + 1
  );

  return (
    <div className="mx-auto max-w-[860px] lg:mx-0">
      <PageHeader title="Nova escala" />
      <EscalaForm
        usuarios={resultadoInicial.slice(0, TAMANHO_PAGINA)}
        temMaisUsuariosInicial={resultadoInicial.length > TAMANHO_PAGINA}
      />
    </div>
  );
}
