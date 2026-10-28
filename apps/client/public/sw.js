/**
 * App-shell service worker for Lanterns.
 *
 * Caches the static shell (HTML, JS, CSS, fonts, icons) so the game loads
 * offline or on a flaky connection. Match state never passes through here -
 * it arrives over the WebSocket at /ws - and /ws, /metrics and /health are
 * explicitly never cached.
 */
const SHELL_CACHE = "lanterns-shell-v1";
const RUNTIME_CACHE = "lanterns-runtime-v1";
const SHELL = ["/", "/lantern.svg", "/manifest.webmanifest", "/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Dynamic endpoints: never cached (the socket, metrics, health). */
const isDynamic = (path) =>
  path === "/ws" || path.startsWith("/metrics") || path.startsWith("/health");

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isDynamic(url.pathname)) return;

  if (request.mode === "navigate") {
    // Network first so each new deploy is picked up; shell fallback offline.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(SHELL_CACHE).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  // Static assets: cache first (build URLs are content-hashed and immutable).
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          void caches
            .open(RUNTIME_CACHE)
            .then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
