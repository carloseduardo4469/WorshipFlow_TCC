// Popula o SQLite local com dados de teste.
// Rode com: npm run db:seed:local
//
// Útil pra testar o app inteiro sem depender do Supabase estar acessível.

import { getLocalDb } from "../src/lib/db/local/client";
import {
  escalaMusicas,
  escalaUsuarios,
  escalas,
  ministerios,
  musicas,
  repertorioMusicas,
  repertorios,
  usuarios,
} from "../src/lib/db/local/schema";

// 10 usuários fixos (1 ADMIN + 9 membros), com ids no formato uuid do Supabase.
const usuariosSeed = [
  { id: "00000000-0000-0000-0000-0000000000a1", nome: "Eduardo Martins", email: "admin@worshipflow.local", telefone: "(11) 99999-0001", instrumento: "Violão", habilidades: "Harmonia e direção de louvor", perfil: "ADMIN" },
  { id: "00000000-0000-0000-0000-0000000000a2", nome: "Ana Beatriz Souza", email: "ana@worshipflow.local", telefone: "(11) 99999-0002", instrumento: "Vocal", habilidades: "Vocal principal, back vocal", perfil: "MEMBRO" },
  { id: "00000000-0000-0000-0000-0000000000a3", nome: "Felipe Ribeiro", email: "felipe@worshipflow.local", telefone: "(11) 99999-0003", instrumento: "Baixo", habilidades: "Baixo, linha e groove", perfil: "MEMBRO" },
  { id: "00000000-0000-0000-0000-0000000000a4", nome: "Gabriela Lima", email: "gabriela@worshipflow.local", telefone: "(11) 99999-0004", instrumento: "Vocal", habilidades: "Back vocal, ministração", perfil: "MEMBRO" },
  { id: "00000000-0000-0000-0000-0000000000a5", nome: "João Pedro Santos", email: "joao@worshipflow.local", telefone: "(11) 99999-0005", instrumento: "Bateria", habilidades: "Bateria e percussão", perfil: "MEMBRO" },
  { id: "00000000-0000-0000-0000-0000000000a6", nome: "Juliana Castro", email: "juliana@worshipflow.local", telefone: "(11) 99999-0006", instrumento: "Teclado", habilidades: "Teclado, piano e arranjos", perfil: "MEMBRO" },
  { id: "00000000-0000-0000-0000-0000000000a7", nome: "Marcos Oliveira", email: "marcos@worshipflow.local", telefone: "(11) 99999-0007", instrumento: "Guitarra", habilidades: "Guitarra, solo e efeitos", perfil: "MEMBRO" },
  { id: "00000000-0000-0000-0000-0000000000a8", nome: "Paula Nogueira", email: "paula@worshipflow.local", telefone: "(11) 99999-0008", instrumento: "Vocal", habilidades: "Vocal de apoio", perfil: "MEMBRO" },
  { id: "00000000-0000-0000-0000-0000000000a9", nome: "Rafael Silva", email: "rafael@worshipflow.local", telefone: "(11) 99999-0009", instrumento: "Violão", habilidades: "Violão e acompanhamento", perfil: "MEMBRO" },
  { id: "00000000-0000-0000-0000-0000000000aa", nome: "Victor Hugo", email: "victor@worshipflow.local", telefone: "(11) 99999-0010", instrumento: "Teclado", habilidades: "Teclado e áudio", perfil: "MEMBRO" },
];

// 50 músicas reais de louvor/adoração (título, artista, tonalidade, bpm).
const musicasSeed: Array<{ titulo: string; artista: string; tonalidade: string; bpm: number }> = [
  { titulo: "Grande é o Senhor", artista: "Diante do Trono", tonalidade: "G", bpm: 76 },
  { titulo: "Ousado Amor", artista: "Isaías Saad", tonalidade: "E", bpm: 68 },
  { titulo: "Águas Purificadoras", artista: "Gabriela Rocha", tonalidade: "A", bpm: 64 },
  { titulo: "Lugar Secreto", artista: "Gabriela Rocha", tonalidade: "G", bpm: 70 },
  { titulo: "Ressuscita-Me", artista: "Aline Barros", tonalidade: "D", bpm: 74 },
  { titulo: "Sobre as Águas", artista: "Ana Nóbrega", tonalidade: "C", bpm: 66 },
  { titulo: "Ninguém Explica Deus", artista: "Preto no Branco", tonalidade: "C", bpm: 90 },
  { titulo: "Restitui", artista: "Nívea Soares", tonalidade: "A", bpm: 72 },
  { titulo: "Tu És Fiel", artista: "Paulo César Baruk", tonalidade: "B", bpm: 78 },
  { titulo: "Ele é Exaltado", artista: "Vineyard", tonalidade: "C", bpm: 74 },
  { titulo: "Mais Alto que os Céus", artista: "Diante do Trono", tonalidade: "G", bpm: 84 },
  { titulo: "Confio em Ti", artista: "Renascer Praise", tonalidade: "E", bpm: 80 },
  { titulo: "É o Espírito", artista: "Kemuel", tonalidade: "E", bpm: 78 },
  { titulo: "Só Tu És Santo", artista: "Julia Vitória", tonalidade: "A", bpm: 70 },
  { titulo: "Deus de Promessas", artista: "Davi Sacer", tonalidade: "B", bpm: 88 },
  { titulo: "Me Atrai", artista: "Nívea Soares", tonalidade: "G", bpm: 72 },
  { titulo: "A Ele a Glória", artista: "Paulo César Baruk", tonalidade: "A", bpm: 76 },
  { titulo: "Só o Seu Amor", artista: "Aline Barros", tonalidade: "C", bpm: 82 },
  { titulo: "Alpha e Ômega", artista: "Ministro? ", tonalidade: "C", bpm: 70 },
  { titulo: "Nada Vai Calar", artista: "Anderson Freire", tonalidade: "D", bpm: 88 },
  { titulo: "Deus é Fiel", artista: "Aline Barros", tonalidade: "G", bpm: 78 },
  { titulo: "Esconderijo", artista: "Os Arrais", tonalidade: "A", bpm: 72 },
  { titulo: "Ele se Lembra", artista: "Gabriela Rocha", tonalidade: "C", bpm: 90 },
  { titulo: "Ao Único", artista: "Márcio Correia", tonalidade: "A", bpm: 76 },
  { titulo: "Minha História", artista: "Casa Worship", tonalidade: "A", bpm: 82 },
  { titulo: "A Cruz de Cristo", artista: "Cassiane", tonalidade: "C", bpm: 84 },
  { titulo: "Manifesto", artista: "Daniel Juan", tonalidade: "D", bpm: 70 },
  { titulo: "Cheio de Graça", artista: "Eli Soares", tonalidade: "B", bpm: 74 },
  { titulo: "Quão Lindo Esse Nome É", artista: "Hillsong United", tonalidade: "B", bpm: 70 },
  { titulo: "Vim Para Adorar-te", artista: "Vineyard", tonalidade: "C", bpm: 72 },
  { titulo: "O Rei Está Entre Nós", artista: "Vineyard", tonalidade: "G", bpm: 74 },
  { titulo: "Espírito Santo", artista: "Vineyard", tonalidade: "A", bpm: 68 },
  { titulo: "Aclame ao Senhor", artista: "Vineyard", tonalidade: "G", bpm: 80 },
  { titulo: "Este é o Dia", artista: "Vineyard", tonalidade: "C", bpm: 78 },
  { titulo: "Poderoso Deus", artista: "Vineyard", tonalidade: "D", bpm: 76 },
  { titulo: "Maravilhosa Graça", artista: "Vineyard", tonalidade: "G", bpm: 72 },
  { titulo: "Grandioso És Tu", artista: "Vineyard", tonalidade: "A", bpm: 70 },
  { titulo: "Deus Cuida de Mim", artista: "Fernandinho", tonalidade: "A", bpm: 74 },
  { titulo: "Deus de Milagres", artista: "Gabriela Rocha", tonalidade: "C", bpm: 84 },
  { titulo: "Ousadia", artista: "Fernandinho", tonalidade: "G", bpm: 88 },
  { titulo: "Ele Venceu", artista: "Fernandinho", tonalidade: "A", bpm: 82 },
  { titulo: "Lindo És", artista: "Rose Nascimento", tonalidade: "C", bpm: 76 },
  { titulo: "Maravilhas", artista: "Damares", tonalidade: "D", bpm: 90 },
  { titulo: "Eu Me Rendo", artista: "Kemuel", tonalidade: "E", bpm: 72 },
  { titulo: "Dependente", artista: "Fernandinho", tonalidade: "D", bpm: 80 },
  { titulo: "Grandioso", artista: "Ministério Zoe", tonalidade: "C", bpm: 84 },
  { titulo: "Sonda-nos", artista: "Ministério Zoe", tonalidade: "G", bpm: 78 },
  { titulo: "Onde os Sonhos Moram", artista: "Ministério Adoração", tonalidade: "A", bpm: 76 },
  { titulo: "Tu És o Rei", artista: "Somos Um", tonalidade: "B", bpm: 74 },
  { titulo: "Vem me Buscar", artista: "Adoração Central", tonalidade: "D", bpm: 70 },
];

async function seed() {
  const localDb = getLocalDb();

  console.log("Seed local: limpando tabelas...");
  await localDb.delete(escalaMusicas);
  await localDb.delete(escalaUsuarios);
  await localDb.delete(escalas);
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

  console.log("Seed local: inserindo 10 usuários...");
  await localDb.insert(usuarios).values(
    usuariosSeed.map((usuario) => ({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      instrumentoPrincipal: usuario.instrumento,
      habilidades: usuario.habilidades,
      perfil: usuario.perfil,
      statusMinisterio: "ATIVO",
      ministerioId: ministerio.id,
    }))
  );

  console.log("Seed local: inserindo 50 músicas...");
  const musicasInseridas = await localDb
    .insert(musicas)
    .values(musicasSeed.map((m) => ({ ...m, ministerioId: ministerio.id })))
    .returning();

  console.log("Seed local: inserindo repertório...");
  const [repertorio] = await localDb
    .insert(repertorios)
    .values({ nome: "Repertório Domingo Manhã", descricao: "Repertório padrão", ministerioId: ministerio.id })
    .returning();

  await localDb.insert(repertorioMusicas).values(
    musicasInseridas.slice(0, 8).map((m) => ({ repertorioId: repertorio.id, musicaId: m.id }))
  );

  console.log("Seed local: inserindo 5 escalas...");
  const musicIds = musicasInseridas.map((m) => m.id);
  const userIds = usuariosSeed.map((u) => u.id);

  const escalasSeed = [
    {
      titulo: "Equipe de Adoração — Culto de Domingo",
      dataEscala: "2026-09-06",
      status: "PUBLICADA",
      observacoes: "Escala do culto dominical com equipe completa.",
      funcoesUsuarios: [
        { usuarioId: userIds[0], funcao: "Direção / Vocal" },
        { usuarioId: userIds[1], funcao: "Vocal" },
        { usuarioId: userIds[2], funcao: "Baixo" },
        { usuarioId: userIds[4], funcao: "Bateria" },
        { usuarioId: userIds[5], funcao: "Teclado" },
      ],
      tonalidadesMusicas: [
        { musicaId: musicIds[0], tonalidade: "G" },
        { musicaId: musicIds[1], tonalidade: "E" },
        { musicaId: musicIds[2], tonalidade: "A" },
        { musicaId: musicIds[3], tonalidade: "C" },
        { musicaId: musicIds[4], tonalidade: "D" },
      ],
      usuarioIds: [userIds[0], userIds[1], userIds[2], userIds[4], userIds[5]],
      musicaIds: [musicIds[0], musicIds[1], musicIds[2], musicIds[3], musicIds[4]],
    },
    {
      titulo: "Ensaios — Quarta-feira",
      dataEscala: "2026-09-02",
      status: "RASCUNHO",
      observacoes: "Ensaio de repertório novo.",
      funcoesUsuarios: [
        { usuarioId: userIds[3], funcao: "Vocal" },
        { usuarioId: userIds[6], funcao: "Guitarra" },
        { usuarioId: userIds[7], funcao: "Vocal" },
        { usuarioId: userIds[9], funcao: "Teclado" },
      ],
      tonalidadesMusicas: [
        { musicaId: musicIds[5], tonalidade: "C" },
        { musicaId: musicIds[6], tonalidade: "G" },
        { musicaId: musicIds[7], tonalidade: "A" },
      ],
      usuarioIds: [userIds[3], userIds[6], userIds[7], userIds[9]],
      musicaIds: [musicIds[5], musicIds[6], musicIds[7]],
    },
    {
      titulo: "Culto de Ceia do Senhor",
      dataEscala: "2026-09-13",
      status: "PUBLICADA",
      observacoes: "Momentos de adoração e ministração da Palavra.",
      funcoesUsuarios: [
        { usuarioId: userIds[0], funcao: "Direção / Vocal" },
        { usuarioId: userIds[4], funcao: "Bateria" },
        { usuarioId: userIds[5], funcao: "Teclado" },
        { usuarioId: userIds[8], funcao: "Violão" },
      ],
      tonalidadesMusicas: [
        { musicaId: musicIds[8], tonalidade: "B" },
        { musicaId: musicIds[9], tonalidade: "A" },
        { musicaId: musicIds[10], tonalidade: "C" },
      ],
      usuarioIds: [userIds[0], userIds[4], userIds[5], userIds[8]],
      musicaIds: [musicIds[8], musicIds[9], musicIds[10]],
    },
    {
      titulo: "Reunião de Oração",
      dataEscala: "2026-09-09",
      status: "CANCELADA",
      observacoes: "Reunião cancelada por motivo de agenda da igreja.",
      funcoesUsuarios: [
        { usuarioId: userIds[1], funcao: "Vocal" },
        { usuarioId: userIds[2], funcao: "Baixo" },
        { usuarioId: userIds[6], funcao: "Guitarra" },
      ],
      tonalidadesMusicas: [
        { musicaId: musicIds[11], tonalidade: "E" },
        { musicaId: musicIds[12], tonalidade: "G" },
      ],
      usuarioIds: [userIds[1], userIds[2], userIds[6]],
      musicaIds: [musicIds[11], musicIds[12]],
    },
    {
      titulo: "Culto da Família — Sábado",
      dataEscala: "2026-09-19",
      status: "CONCLUIDA",
      observacoes: "Culto festivo com participação das crianças.",
      funcoesUsuarios: [
        { usuarioId: userIds[0], funcao: "Direção / Vocal" },
        { usuarioId: userIds[1], funcao: "Vocal" },
        { usuarioId: userIds[3], funcao: "Vocal" },
        { usuarioId: userIds[4], funcao: "Bateria" },
        { usuarioId: userIds[5], funcao: "Teclado" },
        { usuarioId: userIds[7], funcao: "Vocal" },
      ],
      tonalidadesMusicas: [
        { musicaId: musicIds[13], tonalidade: "C" },
        { musicaId: musicIds[14], tonalidade: "G" },
        { musicaId: musicIds[15], tonalidade: "D" },
        { musicaId: musicIds[16], tonalidade: "A" },
      ],
      usuarioIds: [userIds[0], userIds[1], userIds[3], userIds[4], userIds[5], userIds[7]],
      musicaIds: [musicIds[13], musicIds[14], musicIds[15], musicIds[16]],
    },
  ];

  for (const escala of escalasSeed) {
    const [inserida] = await localDb
      .insert(escalas)
      .values({
        titulo: escala.titulo,
        dataEscala: escala.dataEscala,
        status: escala.status,
        observacoes: escala.observacoes,
        funcoesUsuarios: escala.funcoesUsuarios,
        tonalidadesMusicas: escala.tonalidadesMusicas,
        ministerioId: ministerio.id,
      })
      .returning();

    await localDb.insert(escalaUsuarios).values(
      escala.usuarioIds.map((usuarioId) => ({ escalaId: inserida.id, usuarioId }))
    );
    await localDb.insert(escalaMusicas).values(
      escala.musicaIds.map((musicaId) => ({ escalaId: inserida.id, musicaId }))
    );
  }

  console.log("Seed local concluído. Banco em .data/local.db");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
