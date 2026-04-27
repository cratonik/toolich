// ---------------------------------------------------------------------------
// Toolich Service Worker — offline-capable PWA
// ---------------------------------------------------------------------------

const CACHE_VERSION = "toolich-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Assets to pre-cache on install (app shell)
const PRE_CACHE = ["/", "/offline"];

// ---------------------------------------------------------------------------
// Install — pre-cache app shell
// ---------------------------------------------------------------------------
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => cache.addAll(PRE_CACHE))
            .then(() => self.skipWaiting()),
    );
});

// ---------------------------------------------------------------------------
// Activate — clean old caches
// ---------------------------------------------------------------------------
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
                        .map((k) => caches.delete(k)),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

// ---------------------------------------------------------------------------
// Fetch — stale-while-revalidate for pages, cache-first for static assets
// ---------------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
    const { request } = event;

    // Skip non-GET and chrome-extension requests
    if (request.method !== "GET" || !request.url.startsWith("http")) return;

    const url = new URL(request.url);

    // Static assets — cache-first
    if (
        url.pathname.match(
            /\.(js|css|svg|png|jpg|jpeg|webp|woff2?|ttf|ico|json)$/,
        ) &&
        !url.pathname.endsWith("manifest.json")
    ) {
        event.respondWith(
            caches.match(request).then(
                (cached) =>
                    cached ||
                    fetch(request).then((response) => {
                        if (response.ok) {
                            const clone = response.clone();
                            caches
                                .open(RUNTIME_CACHE)
                                .then((cache) => cache.put(request, clone));
                        }
                        return response;
                    }),
            ),
        );
        return;
    }

    // HTML pages — network-first, fallback to cache
    if (request.headers.get("accept")?.includes("text/html")) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches
                            .open(RUNTIME_CACHE)
                            .then((cache) => cache.put(request, clone));
                    }
                    return response;
                })
                .catch(() => caches.match(request).then((cached) => cached || caches.match("/"))),
        );
        return;
    }

    // Everything else — network-first
    event.respondWith(
        fetch(request).catch(() => caches.match(request)),
    );
});
