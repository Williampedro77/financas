/* Service worker do Controle financeiro da casa.
   Estratégia: rede primeiro, cache como reserva.
   Assim você sempre pega a versão mais nova quando há internet,
   e o app continua abrindo quando não há. */

const CACHE = "financas-v1";
const ARQUIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // nunca interceptar a sincronização com o GitHub
  if (req.url.includes("api.github.com")) return;

  e.respondWith(
    fetch(req)
      .then(resp => {
        if (resp && resp.status === 200 && resp.type === "basic") {
          const copia = resp.clone();
          caches.open(CACHE).then(c => c.put(req, copia));
        }
        return resp;
      })
      .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
  );
});
