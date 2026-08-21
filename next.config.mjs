/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
