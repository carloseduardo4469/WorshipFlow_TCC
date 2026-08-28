/* WorshipFlow Service Worker — cache de navegação tipo PWA
 *
 * Estratégia:
 *  - App Shell (HTML, JS, CSS, fontes, logo): cache-first, instalação
 *    imediata na primeira visita (PRECACHE).
 *  - Navegações (document): network-first com fallback em cache — se a rede
 *    estiver disponível busca o HTML novo (dados sempre frescos), se cair
 *    serve a última página visitada (offline).
 *  - Recursos de imagem/fonte: stale-while-revalidate (cache imediato +
 *    atualização em segundo plano).
 *
 * O Next.js gera hashes únicos nos nomes dos bundles, então o cache nunca
 * serve JS/CSS velho: ao publicar, os novos arquivos têm nomes diferentes
 * e são adicionados ao cache.
 */

const PRECACHE = "worshipflow-shell-v1";
const DYNAMIC_CACHE = "worshipflow-pages-v1";
const IMAGES_CACHE = "worshipflow-images-v1";

const PRECACHE_URLS = [
  "/",
  "/login",
  "/dashboard",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icon.webp",
  "/icon-512.webp",
];

const CACHEABLE_EXT = /\.(?:js|css|woff2?|webp|svg|ico|png)$/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map(async (url) => {
            try {
              // addAll falha com status não-2xx; páginas protegidas por auth
              // respondem redirect (3xx) para o login na primeira visita.
              // Cache manual tolerante mantém a instalação do SW estável.
              const response = await fetch(url, { cache: "no-store" });
              if (response.ok || response.type === "opaqueredirect") {
                await cache.put(url, response);
              }
            } catch {
              // Rede fora no momento da instalação: ignora e segue.
            }
          })
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== PRECACHE && key !== DYNAMIC_CACHE && key !== IMAGES_CACHE
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    // Imagens remotas (ex.: Unsplash) — nunca bloquear a navegação por elas.
    if (CACHEABLE_EXT.test(url.pathname)) {
      event.respondWith(staleWhileRevalidate(request, IMAGES_CACHE));
    }
    return;
  }

  // Navegação entre telas: network-first (dados sempre frescos), fallback em
  // cache para funcionar offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // Assets com hash (JS/CSS do Next) e imagens: cache-first com atualização
  // em segundo plano (stale-while-revalidate).
  if (CACHEABLE_EXT.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, PRECACHE));
  }
});

function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
}