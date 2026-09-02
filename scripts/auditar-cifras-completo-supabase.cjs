const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const aplicarNomes = process.argv.includes("--apply-names");
const somenteMetadados = process.argv.includes("--metadata-only");
const idsArgumento = process.argv.find((argumento) => argumento.startsWith("--ids="));
const somenteIds = idsArgumento
  ? new Set(
      idsArgumento
        .slice("--ids=".length)
        .split(",")
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0)
    )
  : null;

for (const arquivo of [".env.local", ".env"]) {
  if (!fs.existsSync(arquivo)) continue;
  for (const linha of fs.readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    const match = linha.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const chave = match[1].trim();
    const valor = match[2].trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[chave]) process.env[chave] = valor;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRole) {
  throw new Error("Credenciais do Supabase não configuradas em .env.local ou .env.");
}

const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36";
const TOM_PADRAO = /Tom(?:<!--\s*-->)?\s*:\s*<\/span>\s*<button[^>]*>\s*([A-G][#b]?m?)/i;

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requisitar(url, options = {}) {
  let ultimoErro;
  for (let tentativa = 1; tentativa <= 3; tentativa += 1) {
    try {
      const resposta = await fetch(url, {
        ...options,
        headers: {
          "User-Agent": USER_AGENT,
          "Accept-Language": "pt-BR,pt;q=0.9",
          ...(options.headers ?? {}),
        },
        redirect: "follow",
        signal: AbortSignal.timeout(15000),
      });
      if (resposta.status !== 429 && resposta.status < 500) return resposta;
      ultimoErro = new Error(`HTTP ${resposta.status}`);
    } catch (error) {
      ultimoErro = error;
    }
    await esperar(250 * tentativa);
  }
  throw ultimoErro;
}

async function buscarTodasAsMusicas() {
  const todas = [];
  for (let inicio = 0; ; inicio += 500) {
    const { data, error } = await supabase
      .from("musicas")
      .select("id,titulo,artista,tonalidade,link_cifra,created_at")
      .order("id")
      .range(inicio, inicio + 499);
    if (error) throw error;
    todas.push(...(data ?? []));
    if (!data || data.length < 500) break;
  }
  return todas;
}

function urlBase(link) {
  const valor = String(link ?? "").trim();
  const markdown = valor.match(/^\[[^\]]*\]\((https?:\/\/[^)\s]+)\)$/i);
  const url = new URL(markdown?.[1] ?? valor);
  if (!["cifraclub.com.br", "www.cifraclub.com.br"].includes(url.hostname.toLowerCase())) {
    throw new Error(`domínio inválido: ${url.hostname}`);
  }
  url.protocol = "https:";
  url.hostname = "www.cifraclub.com.br";
  url.search = "";
  url.hash = "";
  return url;
}

function textoLimpo(valor) {
  return String(valor ?? "").replace(/\s+/g, " ").trim();
}

function extrairMetadados(html) {
  const scripts = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  for (const match of scripts) {
    try {
      const dados = JSON.parse(match[1]);
      const itens = Array.isArray(dados) ? dados : [dados];
      for (const item of itens) {
        const artistaBruto = Array.isArray(item?.byArtist) ? item.byArtist[0] : item?.byArtist;
        const artista = textoLimpo(artistaBruto?.name);
        const nome = textoLimpo(item?.name);
        if (!artista || !nome) continue;
        const prefixo = `${artista} - `;
        const titulo = nome.startsWith(prefixo) ? nome.slice(prefixo.length).trim() : nome;
        return { artista, titulo };
      }
    } catch {
      // Algumas páginas possuem outros JSON-LD que não descrevem a música.
    }
  }
  return null;
}

function slug(valor) {
  return textoLimpo(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function mapearComLimite(itens, limite, tarefa, progresso) {
  const resultados = new Array(itens.length);
  let proximo = 0;
  let concluidos = 0;
  async function trabalhador() {
    while (true) {
      const indice = proximo++;
      if (indice >= itens.length) return;
      resultados[indice] = await tarefa(itens[indice]);
      concluidos += 1;
      progresso?.(concluidos, itens.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhador));
  return resultados;
}

async function auditarMetadados(musica) {
  try {
    const base = urlBase(musica.link_cifra);
    const resposta = await requisitar(base);
    const html = await resposta.text();
    if (!resposta.ok || /página não encontrada|cifra não encontrada|erro 404/i.test(html)) {
      throw new Error(`página oficial retornou HTTP ${resposta.status}`);
    }
    const metadados = extrairMetadados(html);
    const tomOriginal = html.match(TOM_PADRAO)?.[1] ?? null;
    if (!metadados) throw new Error("metadados oficiais não encontrados");
    if (!tomOriginal) throw new Error("tom original não encontrado");
    return { musica, base: base.toString(), tomOriginal, ...metadados };
  } catch (error) {
    return { musica, erro: error.message || String(error) };
  }
}

async function auditarVariacao({ musicaId, titulo, url, keyShape }) {
  try {
    const resposta = await requisitar(url, { method: "HEAD" });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    return { musicaId, titulo, keyShape };
  } catch (error) {
    return { musicaId, titulo, keyShape, erro: error.message || String(error) };
  }
}

function salvarJson(pastaRelativa, prefixo, dados) {
  const pasta = path.resolve(pastaRelativa);
  fs.mkdirSync(pasta, { recursive: true });
  const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
  const arquivo = path.join(pasta, `${prefixo}-${carimbo}.json`);
  fs.writeFileSync(arquivo, `${JSON.stringify(dados, null, 2)}\n`, "utf8");
  return arquivo;
}

async function restaurar(musicas) {
  for (const musica of [...musicas].reverse()) {
    const { error } = await supabase
      .from("musicas")
      .update({
        titulo: musica.titulo,
        artista: musica.artista,
        tonalidade: musica.tonalidade,
        link_cifra: musica.link_cifra,
      })
      .eq("id", musica.id);
    if (error) console.error(`Falha ao restaurar ${musica.id}: ${error.message}`);
  }
}

async function executar() {
  const todasAsMusicas = await buscarTodasAsMusicas();
  const musicas = somenteIds
    ? todasAsMusicas.filter((musica) => somenteIds.has(musica.id))
    : todasAsMusicas;
  console.log(`Banco consultado: ${todasAsMusicas.length} músicas; ${musicas.length} selecionadas.`);

  const metadados = await mapearComLimite(musicas, 5, auditarMetadados, (feito, total) => {
    if (feito % 25 === 0 || feito === total) console.log(`Metadados: ${feito}/${total}.`);
  });
  const falhasMetadados = metadados.filter((item) => item.erro);
  if (falhasMetadados.length > 0) {
    console.error(JSON.stringify(falhasMetadados.map(({ musica, erro }) => ({ id: musica.id, titulo: musica.titulo, erro })), null, 2));
    throw new Error(`${falhasMetadados.length} página(s) sem metadados oficiais válidos.`);
  }

  const tonsDeTeste = [0, 6];
  const variacoes = somenteMetadados ? [] : metadados.flatMap((item) =>
    tonsDeTeste.map((keyShape) => {
      const url = new URL(item.base);
      url.searchParams.set("capo", "0");
      url.searchParams.set("keyShape", String(keyShape));
      return { musicaId: item.musica.id, titulo: item.musica.titulo, url, keyShape };
    })
  );
  const resultadosTons = await mapearComLimite(variacoes, 10, auditarVariacao, (feito, total) => {
    if (feito % 256 === 0 || feito === total) console.log(`Tons: ${feito}/${total}.`);
  });
  const falhasTons = resultadosTons.filter((item) => item.erro);

  const correcoes = metadados
    .filter(
      (item) =>
        item.musica.titulo !== item.titulo ||
        item.musica.artista !== item.artista ||
        item.musica.tonalidade !== item.tomOriginal
    )
    .map((item) => ({
      id: item.musica.id,
      antes: {
        titulo: item.musica.titulo,
        artista: item.musica.artista,
        tonalidade: item.musica.tonalidade,
      },
      depois: { titulo: item.titulo, artista: item.artista, tonalidade: item.tomOriginal },
    }));

  const aliases = {};
  const aliasesMusicas = {};
  for (const item of metadados) {
    const partes = new URL(item.base).pathname.split("/").filter(Boolean);
    const [artistSlug, songSlug] = partes;
    aliases[slug(item.artista)] = artistSlug;
    aliases[slug(item.musica.artista)] = artistSlug;
    const tituloSlug = slug(item.titulo);
    if (tituloSlug !== songSlug) aliasesMusicas[`${artistSlug}/${tituloSlug}`] = songSlug;
  }

  const relatorio = {
    geradoEm: new Date().toISOString(),
    totalMusicas: musicas.length,
    totalVariacoes: variacoes.length,
    falhasTons,
    correcoes,
    aliases: Object.fromEntries(Object.entries(aliases).sort(([a], [b]) => a.localeCompare(b))),
    aliasesMusicas: Object.fromEntries(
      Object.entries(aliasesMusicas).sort(([a], [b]) => a.localeCompare(b))
    ),
  };
  const arquivoRelatorio = salvarJson(".data/reports", "auditoria-cifras", relatorio);
  console.log(
    `Auditoria: ${somenteMetadados ? "tons não reexecutados" : `${variacoes.length - falhasTons.length}/${variacoes.length} tons acessíveis`}; ${correcoes.length} cadastro(s) divergente(s).`
  );
  console.log(`Relatório salvo em ${arquivoRelatorio}`);

  if (falhasTons.length > 0) {
    console.error(JSON.stringify(falhasTons.slice(0, 50), null, 2));
    throw new Error(`${falhasTons.length} combinação(ões) de tom falharam.`);
  }
  if (!aplicarNomes || correcoes.length === 0) {
    console.log(aplicarNomes ? "Nenhum nome precisa ser corrigido." : "Modo somente leitura; nomes não alterados.");
    return;
  }

  const backup = salvarJson(".data/backups", "musicas-antes-normalizar-nomes", musicas);
  console.log(`Backup salvo em ${backup}`);
  const porId = new Map(metadados.map((item) => [item.musica.id, item]));
  const atualizadas = [];
  try {
    for (const [indice, correcao] of correcoes.entries()) {
      const item = porId.get(correcao.id);
      const { error } = await supabase
        .from("musicas")
        .update({ titulo: item.titulo, artista: item.artista, tonalidade: item.tomOriginal })
        .eq("id", correcao.id);
      if (error) throw error;
      atualizadas.push(item.musica);
      if ((indice + 1) % 25 === 0 || indice + 1 === correcoes.length) {
        console.log(`Nomes corrigidos: ${indice + 1}/${correcoes.length}.`);
      }
    }
  } catch (error) {
    console.error("Falha na atualização; restaurando registros modificados.");
    await restaurar(atualizadas);
    throw error;
  }

  const depois = await buscarTodasAsMusicas();
  const divergencias = correcoes.filter((correcao) => {
    const atual = depois.find((musica) => musica.id === correcao.id);
    return !atual ||
      atual.titulo !== correcao.depois.titulo ||
      atual.artista !== correcao.depois.artista ||
      atual.tonalidade !== correcao.depois.tonalidade;
  });
  if (divergencias.length > 0) {
    console.error("Verificação final divergente; restaurando backup.");
    await restaurar(musicas);
    throw new Error(`${divergencias.length} correção(ões) divergiram.`);
  }
  console.log(`${correcoes.length} cadastro(s) normalizado(s) e verificado(s) no Supabase.`);
}

executar().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
