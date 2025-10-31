const APP_CACHE = "app-shell-v1";
const API_CACHE = "api-cache-v1";

const APP_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icons-128.png",
  "./icons/icons-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(APP_CACHE).then(c => c.addAll(APP_ASSETS)).then(self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => ![APP_CACHE, API_CACHE].includes(k)).map(k => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;


  if (APP_ASSETS.some(path => req.url.includes(path.replace("./", "")))) {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
    return;
  }


  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
