/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cache de navegação no cliente (Client Router Cache): páginas dinâmicas já
  // visitadas ficam em memória por 60s, e links pré-buscados (prefetch) por
  // 5min — voltar pra uma página vista recentemente NÃO dispara novo render
  // no servidor. Toda mutation passa por revalidatePath nas Server Actions,
  // que invalida esse cache na hora, então dado alterado aparece na próxima
  // visita à página.
  experimental: {
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
  // Turbopack é o bundler padrão do Next.js 16 (não há pacote npm separado
  // para instalar nem flag para ativar — `next dev` e `next build` já usam).
  //
  // better-sqlite3 é um módulo nativo (binário) — precisa rodar fora do
  // bundle do servidor, senão o build falha ou o runtime quebra em prod.
  serverExternalPackages: ["better-sqlite3"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
