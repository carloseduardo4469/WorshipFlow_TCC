const supabaseHostname = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "";
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cache de navegação no cliente (Client Router Cache): páginas dinâmicas já
  // visitadas ficam em memória por 10min, e links pré-buscados (prefetch) por
  // 30min — trocar de tela NÃO re-renderiza a página nem re-consulta o banco.
  // Toda mutation passa por revalidatePath nas Server Actions, que invalida
  // esse cache na hora, então o dado alterado aparece na próxima visita.
  experimental: {
    serverActions: {
      // 5 MB para a imagem, mais a pequena sobrecarga do multipart/form-data.
      bodySizeLimit: "6mb",
    },
    staleTimes: {
      dynamic: 600,
      static: 1800,
    },
  },
  // Turbopack é o bundler padrão do Next.js 16 (não há pacote npm separado
  // para instalar nem flag para ativar — `next dev` e `next build` já usam).
  // Mantido externo enquanto os adaptadores legados são retirados do bundle.
  serverExternalPackages: ["better-sqlite3"],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(supabaseHostname ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }] : []),
    ],
  },
};

export default nextConfig;
