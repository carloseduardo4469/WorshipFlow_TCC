import { resolveBackend } from "@/lib/db/provider";
import { appConfig } from "@/content/app-config";

// Página temporária, só pra Fase 1 (camada de dados). As telas reais
// (login, dashboard, escalas...) chegam nas próximas fases.
export default async function Home() {
  const backend = await resolveBackend();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-6 text-center text-paper">
      <h1 className="font-display text-3xl font-bold">{appConfig.name}</h1>
      <p className="max-w-md text-muted">{appConfig.description}</p>
      <div className="rounded-full border border-paper/20 px-4 py-2 font-mono text-sm">
        backend ativo:{" "}
        <span className={backend === "supabase" ? "text-teal" : "text-amber"}>{backend}</span>
      </div>
      {backend === "local" && (
        <p className="max-w-md text-xs text-muted">
          Supabase inacessível nesta rede — usando SQLite local (.data/local.db).
        </p>
      )}
    </main>
  );
}
