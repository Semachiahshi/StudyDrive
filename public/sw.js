// StudyDrive service worker.
// - Immutable build assets are cached forever (cache-first).
// - App pages are network-first: every page that loads online is stored as the
//   "last online version" and shown read-only when the network or the server
//   is unavailable. Signing out wipes the stored pages.
const CACHE = "studydrive-v1";
const PAGES = "studydrive-pages-v1";
const OFFLINE_URL = "/offline";

// Pages that must never be stored: auth flows, setup, APIs and downloads.
const NEVER_STORE = ["/login", "/auth/", "/setup", "/offline", "/api/", "/files/"];

function isStorable(url) {
  if (url.pathname === "/files") return true;
  return !NEVER_STORE.some((p) => url.pathname === p || url.pathname.startsWith(p));
}

function isHtml(response) {
  return (response.headers.get("content-type") || "").includes("text/html");
}

async function storePage(request, response) {
  if (!response.ok || response.redirected || response.type !== "basic" || !isHtml(response)) return;
  const headers = new Headers(response.headers);
  headers.set("x-studydrive-saved-at", String(Date.now()));
  const body = await response.blob();
  const cache = await caches.open(PAGES);
  await cache.put(request.url.split("#")[0], new Response(body, { status: 200, headers }));
}

// Marks the stored copy so the page can tell it is showing an offline snapshot.
async function servePage(url) {
  const cache = await caches.open(PAGES);
  const hit = (await cache.match(url)) || (await cache.match(url, { ignoreSearch: true }));
  if (!hit) return caches.match(OFFLINE_URL);
  const savedAt = hit.headers.get("x-studydrive-saved-at") || "0";
  const html = (await hit.text()).replace("<html", `<html data-snapshot="${savedAt}"`);
  return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
}

async function navigate(event) {
  const { request } = event;
  const url = new URL(request.url);
  try {
    const response = await fetch(request);
    if (isStorable(url)) {
      if (response.status >= 500) return servePage(request.url);
      event.waitUntil(storePage(request, response.clone()));
    }
    return response;
  } catch {
    return isStorable(url) ? servePage(request.url) : caches.match(OFFLINE_URL);
  }
}

// Fetches the main pages in the background so they are available offline even
// before the student opens them.
async function warm(urls) {
  await Promise.all(
    urls.map(async (path) => {
      const url = new URL(path, self.location.origin);
      if (url.origin !== self.location.origin || !isStorable(url)) return;
      try {
        const response = await fetch(url, { credentials: "same-origin" });
        await storePage(new Request(url), response);
      } catch {
        // Offline or failed: keep the previous copy.
      }
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== PAGES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "warm" && Array.isArray(data.urls)) event.waitUntil(warm(data.urls));
  if (data.type === "clear") event.waitUntil(caches.delete(PAGES));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.method === "POST" && url.pathname === "/auth/signout") {
    event.waitUntil(caches.delete(PAGES));
    return;
  }
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(navigate(event));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
