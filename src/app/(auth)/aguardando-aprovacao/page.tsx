import { Clock3, LogOut, Mail } from "lucide-react";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthBadge } from "@/components/auth/AuthUi";
import { ApprovalRefresh } from "@/components/auth/ApprovalRefresh";

export default async function AguardandoAprovacaoPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.profile.statusAcesso === "ATIVO") redirect("/dashboard");

  return (
    <AuthShell>
      <AuthCard>
        <div className="flex flex-col text-center">
          <div className="mb-6 flex justify-center"><AuthBadge size={88} /></div>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber/35 bg-amber/10 text-amber">
            <Clock3 size={27} aria-hidden="true" />
          </div>
          <p className="af-label mb-3">Solicitação enviada</p>
          <h1 className="font-serif text-4xl font-black leading-tight af-text">Cadastro em análise</h1>
          <p className="mx-auto mt-4 max-w-md text-sm font-semibold leading-relaxed af-muted">
            Aguarde um administrador liberar seu acesso. Entre em contato com a liderança do ministério para avisar que seu cadastro foi enviado.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.035] px-4 py-4 text-left">
            <p className="text-sm font-bold af-text">{current.profile.nome}</p>
            <p className="mt-1 flex items-center gap-2 break-all text-xs af-muted">
              <Mail size={13} aria-hidden="true" /> {current.email}
            </p>
          </div>

          <p className="mt-5 text-xs font-semibold af-muted">Esta página verifica automaticamente quando o acesso for liberado.</p>
          <div className="mt-4"><ApprovalRefresh /></div>

          <form action={logoutAction} className="mt-6">
            <button type="submit" className="af-btn-underline inline-flex items-center justify-center gap-2">
              <LogOut size={15} aria-hidden="true" /> Sair da conta
            </button>
          </form>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
