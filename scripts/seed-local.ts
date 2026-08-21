// Popula o SQLite local com dados de teste.
// Rode com: npm run db:seed:local
//
// Útil pra testar o app inteiro sem depender do Supabase estar acessível.

import { getLocalDb } from "../src/lib/db/local/client";
import {
  ministerios,
  musicas,
  repertorioMusicas,
  repertorios,
  usuarios,
} from "../src/lib/db/local/schema";

async function seed() {
  const localDb = getLocalDb();

  console.log("Seed local: limpando tabelas...");
  await localDb.delete(repertorioMusicas);
  await localDb.delete(repertorios);
  await localDb.delete(musicas);
  await localDb.delete(usuarios);
  await localDb.delete(ministerios);

  console.log("Seed local: inserindo ministério...");
  const [ministerio] = await localDb
    .insert(ministerios)
    .values({ nome: "Louvor - Culto Principal", descricao: "Ministério de louvor", ativo: true })
    .returning();

  console.log("Seed local: inserindo usuário admin de teste...");
  await localDb.insert(usuarios).values({
    id: "00000000-0000-0000-0000-000000000001",
    nome: "Admin Teste",
    email: "admin@worshipflow.local",
    perfil: "ADMIN",
    statusMinisterio: "ATIVO",
    ministerioId: ministerio.id,
  });

  console.log("Seed local: inserindo músicas...");
  const musicasInseridas = await localDb
    .insert(musicas)
    .values([
      { titulo: "Grande é o Senhor", artista: "Diante do Trono", tonalidade: "G", bpm: 76, ministerioId: ministerio.id },
      { titulo: "Ousado Amor", artista: "Isaías Saad", tonalidade: "E", bpm: 68, ministerioId: ministerio.id },
      { titulo: "Águas Purificadoras", artista: "Gabriela Rocha", tonalidade: "A", bpm: 64, ministerioId: ministerio.id },
    ])
    .returning();

  console.log("Seed local: inserindo repertório...");
  const [repertorio] = await localDb
    .insert(repertorios)
    .values({ nome: "Repertório Domingo Manhã", descricao: "Repertório padrão", ministerioId: ministerio.id })
    .returning();

  await localDb.insert(repertorioMusicas).values(
    musicasInseridas.map((m) => ({ repertorioId: repertorio.id, musicaId: m.id }))
  );

  console.log("Seed local concluído. Banco em .data/local.db");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
