/* Gera segredos somente no .env.local ignorado pelo Git. Nunca imprime chaves. */
const fs = require("node:fs");
const { randomBytes } = require("node:crypto");
const webpush = require("web-push");
const target = ".env.local";
let url;
try { url = new URL(process.argv[2]); } catch { console.error("Uso: npm run notifications:configure -- https://seu-site.com.br"); process.exit(1); }
if (url.protocol !== "https:" || url.username || url.password || ["localhost", "127.0.0.1"].includes(url.hostname)) {
  console.error("Informe o endereço HTTPS público do WorshipFlow."); process.exit(1);
}
let content = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
const has = (key) => new RegExp(`^${key}=.+$`, "m").test(content);
if (has("WEB_PUSH_PUBLIC_KEY") !== has("WEB_PUSH_PRIVATE_KEY")) {
  console.error("Configuração parcial de chaves. Restaure o par original antes de continuar."); process.exit(1);
}
const additions = {};
if (!has("WEB_PUSH_PUBLIC_KEY")) {
  const keys = webpush.generateVAPIDKeys();
  additions.WEB_PUSH_PUBLIC_KEY = keys.publicKey;
  additions.WEB_PUSH_PRIVATE_KEY = keys.privateKey;
}
if (!has("WEB_PUSH_SUBJECT")) additions.WEB_PUSH_SUBJECT = url.origin;
if (!has("CRON_SECRET")) additions.CRON_SECRET = randomBytes(32).toString("hex");
content += "\n" + Object.entries(additions).map(([key, value]) => `${key}=${value}`).join("\n") + "\n";
fs.writeFileSync(target, content, { mode: 0o600 });
console.log("Configuração salva em .env.local. Cadastre as mesmas quatro variáveis no provedor de hospedagem; não compartilhe as chaves nem as versione.");
