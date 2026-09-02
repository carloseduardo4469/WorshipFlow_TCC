const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const aplicar = process.argv.includes("--apply");
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

const POSICOES = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const LINKS_CORRIGIDOS_POR_ID = new Map([
  [
    283,
    "https://www.cifraclub.com.br/ministerio-morada/so-tu-s-santo/simplificada.html",
  ],
  [
    328,
    "https://www.cifraclub.com.br/ministerio-morada/so-tu-s-santo/simplificada.html",
  ],
]);

function notaDaTonalidade(valor) {
  const normalizada = String(valor ?? "")
    .trim()
    .replaceAll("♯", "#")
    .replaceAll("♭", "b");
  const match = normalizada.match(/^([A-Ga-g])([#b]?)(?:m)?$/);
  return match ? `${match[1].toUpperCase()}${match[2]}` : null;
}

function construirUrlBase(musica) {
  let url;
  try {
    const valor = LINKS_CORRIGIDOS_POR_ID.get(musica.id) ?? String(musica.link_cifra ?? "");
    const markdown = valor.trim().match(/^\[[^\]]*\]\((https?:\/\/[^)\s]+)\)$/i);
    url = new URL(markdown?.[1] ?? valor);
  } catch {
    throw new Error("link_cifra não é uma URL válida");
  }

  const host = url.hostname.toLowerCase();
  if (host !== "cifraclub.com.br" && host !== "www.cifraclub.com.br") {
    throw new Error(`domínio não é o Cifra Club: ${host || "vazio"}`);
  }

  // Preserva o caminho exato que já funciona, inclusive versões como
  // /simplificada.html. Apenas substitui os parâmetros de execução da cifra.
  url.protocol = "https:";
  url.hostname = "www.cifraclub.com.br";
  url.hash = "";
  url.search = "";
  return url.toString();
}

async function buscarTodasAsMusicas() {
  const todas = [];
  const tamanho = 500;
  for (let inicio = 0; ; inicio += tamanho) {
    const { data, error } = await supabase
      .from("musicas")
      .select("id,titulo,artista,tonalidade,link_cifra,created_at")
      .order("id")
      .range(inicio, inicio + tamanho - 1);
    if (error) throw error;
    todas.push(...(data ?? []));
    if (!data || data.length < tamanho) break;
  }
  return todas;
}

function extrairTom(html) {
  const match = html.match(
    /Tom(?:<!--\s*-->)?\s*:\s*<\/span>\s*<button[^>]*>\s*([A-G][#b]?m?)/i
  );
  return match?.[1] ?? null;
}

async function validarLink(item) {
  try {
    const opcoes = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    };

    const respostaOriginal = await fetch(item.linkBase, opcoes);
    const htmlOriginal = await respostaOriginal.text();
    const paginaOriginalInexistente = /página não encontrada|cifra não encontrada|erro 404/i.test(htmlOriginal);
    const tomOriginal = extrairTom(htmlOriginal);
    const notaOriginal = notaDaTonalidade(tomOriginal);
    if (!respostaOriginal.ok || paginaOriginalInexistente || !notaOriginal) {
      return { ...item, erro: `página original inválida (HTTP ${respostaOriginal.status})` };
    }

    const urlFormaZero = new URL(item.linkBase);
    urlFormaZero.searchParams.set("capo", "0");
    urlFormaZero.searchParams.set("keyShape", "0");
    const respostaFormaZero = await fetch(urlFormaZero, opcoes);
    const htmlFormaZero = await respostaFormaZero.text();
    const tomFormaZero = extrairTom(htmlFormaZero);
    const notaFormaZero = notaDaTonalidade(tomFormaZero);
    if (!respostaFormaZero.ok || !notaFormaZero) {
      return { ...item, erro: "não foi possível calcular a forma sem capotraste" };
    }

    const keyShape = (POSICOES[notaOriginal] - POSICOES[notaFormaZero] + 12) % 12;
    const urlFinal = new URL(item.linkBase);
    urlFinal.searchParams.set("capo", "0");
    urlFinal.searchParams.set("keyShape", String(keyShape));

    const respostaFinal = await fetch(urlFinal, opcoes);
    const htmlFinal = await respostaFinal.text();
    const tomFinal = extrairTom(htmlFinal);
    if (!respostaFinal.ok || tomFinal !== tomOriginal) {
      return {
        ...item,
        erro: `tom final ${tomFinal ?? "não detectado"}; esperado ${tomOriginal}`,
      };
    }

    return {
      ...item,
      linkNovo: urlFinal.toString(),
      tonalidadeNova: tomOriginal,
      tomExibido: tomFinal,
    };
  } catch (error) {
    return { ...item, erro: error.message || String(error) };
  }
}

async function mapearComLimite(itens, limite, tarefa) {
  const resultados = new Array(itens.length);
  let proximo = 0;
  let concluidos = 0;

  async function trabalhador() {
    while (true) {
      const indice = proximo++;
      if (indice >= itens.length) return;
      resultados[indice] = await tarefa(itens[indice]);
      concluidos += 1;
      if (concluidos % 25 === 0 || concluidos === itens.length) {
        console.log(`Validadas ${concluidos}/${itens.length} cifras no Cifra Club.`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhador));
  return resultados;
}

function salvarBackup(musicas) {
  const pasta = path.resolve(".data", "backups");
  fs.mkdirSync(pasta, { recursive: true });
  const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
  const arquivo = path.join(pasta, `musicas-links-antes-${carimbo}.json`);
  fs.writeFileSync(arquivo, `${JSON.stringify(musicas, null, 2)}\n`, "utf8");
  return arquivo;
}

async function restaurar(atualizadas) {
  for (const musica of atualizadas.reverse()) {
    const { error } = await supabase
      .from("musicas")
      .update({ link_cifra: musica.link_cifra, tonalidade: musica.tonalidade })
      .eq("id", musica.id);
    if (error) console.error(`Falha ao restaurar música ${musica.id}: ${error.message}`);
  }
}

async function executar() {
  const todasAsMusicas = await buscarTodasAsMusicas();
  const musicas = somenteIds
    ? todasAsMusicas.filter((musica) => somenteIds.has(musica.id))
    : todasAsMusicas;
  console.log(`Banco consultado: ${todasAsMusicas.length} músicas; ${musicas.length} selecionadas.`);

  const preparadas = [];
  const problemasLocais = [];
  for (const musica of musicas) {
    try {
      preparadas.push({ musica, linkBase: construirUrlBase(musica) });
    } catch (error) {
      problemasLocais.push({ id: musica.id, titulo: musica.titulo, erro: error.message });
    }
  }

  if (problemasLocais.length > 0) {
    console.error("Registros que não podem ser migrados:");
    console.error(JSON.stringify(problemasLocais, null, 2));
    throw new Error(`${problemasLocais.length} registro(s) com link ou tonalidade inválida.`);
  }

  const validadas = await mapearComLimite(preparadas, 5, validarLink);
  const falhas = validadas.filter((item) => item.erro);
  const alteradas = validadas.filter(
    (item) =>
      item.linkNovo !== item.musica.link_cifra || item.tonalidadeNova !== item.musica.tonalidade
  );
  console.log(
    `Auditoria concluída: ${validadas.length - falhas.length} válidas, ${falhas.length} falhas, ${alteradas.length} links a alterar.`
  );
  if (alteradas.length > 0) {
    console.log(
      JSON.stringify(
        alteradas.map((item) => ({
          id: item.musica.id,
          titulo: item.musica.titulo,
          artista: item.musica.artista,
          tomAtual: item.musica.tonalidade,
          tomOficial: item.tonalidadeNova,
          linkMarkdown: /^\[/.test(String(item.musica.link_cifra ?? "").trim()),
        })),
        null,
        2
      )
    );
  }

  if (falhas.length > 0) {
    console.error("Falhas encontradas (nenhuma alteração foi feita):");
    console.error(
      JSON.stringify(
        falhas.map(({ musica, linkBase, erro }) => ({
          id: musica.id,
          titulo: musica.titulo,
          artista: musica.artista,
          tonalidade: musica.tonalidade,
          linkAtual: musica.link_cifra,
          linkBase,
          erro,
        })),
        null,
        2
      )
    );
    process.exitCode = 2;
    return;
  }

  if (!aplicar) {
    console.log("Modo de auditoria: banco não alterado. Use --apply após revisar o resultado.");
    return;
  }

  const backup = salvarBackup(musicas);
  console.log(`Backup salvo em ${backup}`);

  const atualizadas = [];
  try {
    for (const [indice, item] of alteradas.entries()) {
      const { error } = await supabase
        .from("musicas")
        .update({ link_cifra: item.linkNovo, tonalidade: item.tonalidadeNova })
        .eq("id", item.musica.id);
      if (error) throw error;
      atualizadas.push(item.musica);
      if ((indice + 1) % 25 === 0 || indice + 1 === alteradas.length) {
        console.log(`Atualizadas ${indice + 1}/${alteradas.length} músicas no Supabase.`);
      }
    }
  } catch (error) {
    console.error("Atualização interrompida; restaurando os registros já modificados.");
    await restaurar(atualizadas);
    throw error;
  }

  const depois = await buscarTodasAsMusicas();
  const valoresEsperados = new Map(
    validadas.map((item) => [
      item.musica.id,
      { link: item.linkNovo, tonalidade: item.tonalidadeNova },
    ])
  );
  const divergencias = depois.filter((musica) => {
    const esperado = valoresEsperados.get(musica.id);
    return esperado &&
      (esperado.link !== musica.link_cifra || esperado.tonalidade !== musica.tonalidade);
  });
  if (divergencias.length > 0) {
    console.error("A verificação final divergiu; restaurando o backup no Supabase.");
    await restaurar([...musicas]);
    throw new Error(`${divergencias.length} registro(s) divergiram na verificação final.`);
  }

  console.log(`Concluído: ${depois.length} músicas verificadas e sem capotraste.`);
}

executar().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
