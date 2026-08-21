import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db/repositories";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { removerMusicaAction } from "@/lib/actions/musicas";

export default async function MusicasPage() {
  const { profile } = await requireAuth();
  const repos = await getRepositories();
  const musicas = await repos.musicas.list();
  const isAdmin = profile.perfil === "ADMIN";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <PageHeader title="Músicas" description="Repertório musical do ministério." />
        {isAdmin && (
          <Link href="/dashboard/musicas/novo">
            <Button>Nova música</Button>
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
            <td className="px-4 py-3 text-paper">
              {m.linkCifra ? (
                <a href={m.linkCifra} target="_blank" rel="noreferrer" className="hover:underline">
                  {m.titulo}
                </a>
              ) : (
                m.titulo
              )}
            </td>
            <td className="px-4 py-3 text-muted">{m.artista ?? "—"}</td>
            <td className="px-4 py-3 font-mono text-muted">{m.tonalidade ?? "—"}</td>
            <td className="px-4 py-3 text-muted">{m.bpm ?? "—"}</td>
            <td className="px-4 py-3 text-right">
              {isAdmin && (
                <div className="flex justify-end gap-3">
                  <Link
                    href={`/dashboard/musicas/${m.id}`}
                    className="text-xs text-amber hover:underline"
                  >
                    Editar
                  </Link>
                  <form action={removerMusicaAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <button type="submit" className="text-xs text-red-400 hover:underline">
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
