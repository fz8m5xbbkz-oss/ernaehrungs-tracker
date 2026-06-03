/* Service Worker v2 — relative Pfade (funktioniert unter jedem Unterordner) */
const CACHE = "tracker-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.umd.js",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const req = e.request;

  // Seitenaufrufe: erst Netz (frische Version), dann Cache (offline) — so kommen Updates sofort an.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(r => { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(req, c)); return r; })
        .catch(() => caches.match(req).then(m => m || caches.match("./index.html")))
    );
    return;
  }

  // Alles andere: erst Cache, dann Netz (und neu Geladenes cachen).
  e.respondWith(
    caches.match(req).then(m =>
      m || fetch(req).then(r => {
        if (req.method === "GET" && r.ok) {
          const c = r.clone(); caches.open(CACHE).then(ca => ca.put(req, c));
        }
        return r;
      })
    )
  );
});
