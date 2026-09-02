const fs = require("node:fs");
const { createClient } = require("@supabase/supabase-js");

const envFiles = process.argv[2] ? [process.argv[2]] : [".env.local", ".env"];
for (const file of envFiles) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRole) throw new Error("Credenciais do Supabase não configuradas.");

const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

async function executar() {
  const [{ data: integrantes, error: integrantesError }, { data: musicas, error: musicasError }] = await Promise.all([
    supabase.from("profiles").select("id,nome,instrumento_principal").eq("is_suspended", false).order("nome").limit(6),
    supabase.from("musicas").select("id,titulo,tonalidade").order("titulo").limit(8),
  ]);
  if (integrantesError) throw integrantesError;
  if (musicasError) throw musicasError;
  if (!integrantes || integrantes.length < 2) throw new Error("São necessários ao menos 2 integrantes ativos no Supabase.");
  if (!musicas || musicas.length < 4) throw new Error("São necessárias ao menos 4 músicas no Supabase.");

  const modelos = [
    { titulo: "Culto de Celebração — 09/08/2026", data: "2026-08-09", integrantes: integrantes.slice(0, Math.min(4, integrantes.length)), musicas: musicas.slice(0, 4) },
    { titulo: "Culto de Celebração — 23/08/2026", data: "2026-08-23", integrantes: integrantes.slice(Math.max(0, integrantes.length - 4)), musicas: musicas.slice(2, Math.min(7, musicas.length)) },
  ];

  for (const modelo of modelos) {
    const funcoesUsuarios = modelo.integrantes.map((integrante) => ({
      usuarioId: integrante.id,
      funcao: integrante.instrumento_principal || "Ministração",
    }));
    const tonalidadesMusicas = modelo.musicas.map((musica) => ({
      musicaId: musica.id,
      tonalidade: musica.tonalidade || "G",
    }));

    const { data: existentes, error: buscaError } = await supabase
      .from("escalas")
      .select("id")
      .eq("titulo", modelo.titulo)
      .limit(1);
    if (buscaError) throw buscaError;

    let escalaId = existentes?.[0]?.id;
    if (escalaId) {
      const { error } = await supabase.from("escalas").update({
        data_escala: modelo.data,
        status: "CONCLUIDA",
        observacoes: "Escala fictícia para teste do histórico.",
        funcoes_usuarios: funcoesUsuarios,
        tonalidades_musicas: tonalidadesMusicas,
      }).eq("id", escalaId);
      if (error) throw error;
    } else {
      const { data: escala, error } = await supabase.from("escalas").insert({
        titulo: modelo.titulo,
        data_escala: modelo.data,
        status: "CONCLUIDA",
        observacoes: "Escala fictícia para teste do histórico.",
        funcoes_usuarios: funcoesUsuarios,
        tonalidades_musicas: tonalidadesMusicas,
      }).select("id").single();
      if (error) throw error;
      escalaId = escala.id;
    }

    const { error: limparUsuariosError } = await supabase.from("escala_usuarios").delete().eq("escala_id", escalaId);
    const { error: limparMusicasError } = await supabase.from("escala_musicas").delete().eq("escala_id", escalaId);
    if (limparUsuariosError) throw limparUsuariosError;
    if (limparMusicasError) throw limparMusicasError;

    const { error: usuariosError } = await supabase.from("escala_usuarios").insert(
      modelo.integrantes.map((integrante) => ({ escala_id: escalaId, usuario_id: integrante.id }))
    );
    const { error: relacoesMusicasError } = await supabase.from("escala_musicas").insert(
      modelo.musicas.map((musica) => ({ escala_id: escalaId, musica_id: musica.id }))
    );
    if (usuariosError) throw usuariosError;
    if (relacoesMusicasError) throw relacoesMusicasError;
    console.log(`${modelo.data}: ${modelo.integrantes.length} integrante(s), ${modelo.musicas.length} música(s).`);
  }

  console.log("Histórico criado no Supabase com integrantes e músicas da equipe.");
}

executar().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
