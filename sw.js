const CACHE_NAME = "registro-vias-v3";

const ARQUIVOS_CACHE = [
  "./",
  "./index.html",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(ARQUIVOS_CACHE)
    )
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(chaves =>
      Promise.all(
        chaves
          .filter(chave => chave !== CACHE_NAME)
          .map(chave => caches.delete(chave))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Não interceptar a comunicação com o Google Apps Script
  if (url.hostname.includes("google.com") ||
      url.hostname.includes("googleusercontent.com")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(resposta => {

      if (resposta) return resposta;

      return fetch(event.request).then(rede => {

        if (rede && rede.ok && url.origin === self.location.origin) {
          const copia = rede.clone();

          caches.open(CACHE_NAME).then(cache =>
            cache.put(event.request, copia)
          );
        }

        return rede;

      }).catch(() => {

        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }

        return new Response("Conteúdo indisponível offline.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });

      });

    })
  );
});
