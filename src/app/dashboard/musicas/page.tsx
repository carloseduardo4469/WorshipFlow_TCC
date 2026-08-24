import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { removerMusicaAction } from "@/lib/actions/musicas";

export default async function MusicasPage() {
  const { profile } = await requireAuth();
  const repos = await getRepositories();
  const musicas = await repos.musicas.list();
  const isAdmin = profile.perfil === "ADMIN";

  return (
    <div>
      <div className="mb-7 flex items-center justify-between gap-4">
        <PageHeader title="Músicas" description="Repertório musical do ministério." />
        {isAdmin && (
          <Link href="/dashboard/musicas/novo" className="db-cta">
            <Plus size={16} />
            Nova música
          </Link>
        )}
      </div>

      <DataTable
        headers={["Título", "Artista", "Tom", "BPM", ""]}
        isEmpty={musicas.length === 0}
        emptyMessage="Nenhuma música cadastrada ainda."
      >
        {musicas.map((m) => (
          <tr key={m.id}>
            <td className="px-4 py-3.5 text-paper font-medium">
              {m.linkCifra ? (
                <a href={m.linkCifra} target="_blank" rel="noreferrer" className="hover:underline">
                  {m.titulo}
                </a>
              ) : (
                m.titulo
              )}
            </td>
            <td className="px-4 py-3.5 text-muted">{m.artista ?? "—"}</td>
            <td className="px-4 py-3.5 font-mono text-amber">{m.tonalidade ?? "—"}</td>
            <td className="px-4 py-3.5 text-muted">{m.bpm ?? "—"}</td>
            <td className="px-4 py-3.5 text-right">
              {isAdmin && (
                <div className="flex justify-end gap-3">
                  <Link href={`/dashboard/musicas/${m.id}`} className="db-btn-sm">
                    Editar
                  </Link>
                  <form action={removerMusicaAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <button type="submit" className="text-xs font-semibold text-red-400 hover:text-red-300">
                      Excluir
                    </button>
                  </form>
                </div>
              )}
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
