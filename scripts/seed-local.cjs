const Database = require("better-sqlite3");

const db = new Database(".data/local.db");
db.pragma("foreign_keys = ON");

db.transaction(() => {
  const ministry = db.prepare("SELECT id FROM ministerios WHERE nome = ?").get("Bola de Neve Bragança Paulista");
  const ministryId = ministry?.id ?? db.prepare(
    "INSERT INTO ministerios (nome, descricao, ativo) VALUES (?, ?, 1)"
  ).run("Bola de Neve Bragança Paulista", "Dados de teste do ministério de louvor.").lastInsertRowid;

  const members = [
    ["Lucas Martins", "lucas.martins@worshipflow.local", "Vocal", "Vocal principal"],
    ["Ana Beatriz Souza", "ana.souza@worshipflow.local", "Teclado", "Teclado e backing vocal"],
    ["Rafael Oliveira", "rafael.oliveira@worshipflow.local", "Guitarra", "Guitarra base e violão"],
    ["Mariana Costa", "mariana.costa@worshipflow.local", "Bateria", "Bateria e percussão"],
    ["João Pedro Lima", "joao.lima@worshipflow.local", "Baixo", "Contrabaixo"],
  ];
  const memberIds = members.map(([nome, email, instrumento, habilidades], index) => {
    const current = db.prepare("SELECT id FROM usuarios WHERE email = ?").get(email);
    if (current) return current.id;
    const id = `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
    db.prepare(`INSERT INTO usuarios
      (id, nome, email, instrumento_principal, habilidades, status_ministerio, perfil, ministerio_id)
      VALUES (?, ?, ?, ?, ?, 'ATIVO', 'MEMBRO', ?)`).run(id, nome, email, instrumento, habilidades, ministryId);
    return id;
  });

  const songs = [
    ["Aquieta Minh'alma", "Ministério Zoe", "G"],
    ["Ousado Amor", "Isaias Saad", "G"],
    ["Me Atraiu", "Gabriela Rocha", "C"],
    ["Lugar Secreto", "Gabriela Rocha", "A"],
    ["Oceanos", "Hillsong United", "D"],
    ["Que Se Abram os Céus", "Nívea Soares", "E"],
  ];
  const songIds = songs.map(([titulo, artista, tonalidade]) => {
    const current = db.prepare("SELECT id FROM musicas WHERE titulo = ? AND ministerio_id = ?").get(titulo, ministryId);
    if (current) return current.id;
    return db.prepare("INSERT INTO musicas (titulo, artista, tonalidade, link_cifra, ministerio_id) VALUES (?, ?, ?, ?, ?)")
      .run(titulo, artista, tonalidade, `https://www.cifraclub.com.br/${titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-")}/`, ministryId).lastInsertRowid;
  });

  const schedules = [
    ["Culto de Celebração — 09/08/2026", "2026-08-09", [0, 1, 2], [0, 1, 4], ["G", "G", "D"]],
    ["Culto de Celebração — 23/08/2026", "2026-08-23", [0, 2, 3, 4], [2, 3, 4, 0], ["C", "A", "D", "G"]],
  ];
  for (const [title, date, memberIndexes, songIndexes, keys] of schedules) {
    const current = db.prepare("SELECT id FROM escalas WHERE titulo = ?").get(title);
    if (current) continue;
    const memberLinks = memberIndexes.map((index) => ({ usuarioId: memberIds[index], funcao: members[index][3] }));
    const songKeys = songIndexes.map((index, position) => ({ musicaId: Number(songIds[index]), tonalidade: keys[position] }));
    const id = db.prepare(`INSERT INTO escalas
      (titulo, data_escala, status, observacoes, funcoes_usuarios, tonalidades_musicas, ministerio_id)
      VALUES (?, ?, 'CONCLUIDA', ?, ?, ?, ?)`).run(
      title, date, "Escala fictícia para teste do histórico.", JSON.stringify(memberLinks), JSON.stringify(songKeys), ministryId
    ).lastInsertRowid;
    const addMember = db.prepare("INSERT INTO escala_usuarios (escala_id, usuario_id) VALUES (?, ?)");
    memberIndexes.forEach((index) => addMember.run(id, memberIds[index]));
    const addSong = db.prepare("INSERT INTO escala_musicas (escala_id, musica_id) VALUES (?, ?)");
    songIndexes.forEach((index) => addSong.run(id, songIds[index]));
  }
})();

console.log("Seed local concluído: 2 escalas de agosto/2026 com integrantes, músicas e tons.");
db.close();
