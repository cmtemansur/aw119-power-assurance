const CACHE = "aw119-power-check-v5";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./apple-touch-icon.png"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  // Always prefer the network for HTML navigation so a GitHub Pages update
  // is not hidden behind an old cached index.html.
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put("./index.html", copy));
      return response;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request).then(networkResponse => {
    const copy = networkResponse.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return networkResponse;
  })));
});
