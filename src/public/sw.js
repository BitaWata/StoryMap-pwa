const CACHE_NAME = "story-app-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/styles/styles.css",
  "/scripts/index.js",
  "/scripts/app.js",
  "/manifest.json",
  "/icons/72x72.png",
  "/icons/512x512.png",
];

// Install: cache semua file
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Fetch: ambil dari cache jika offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((res) => res || fetch(event.request))
      .catch(() => caches.match("/"))
  );
});

// Push notification
self.addEventListener("push", (event) => {
  const data = event.data
    ? event.data.json()
    : { title: "Story Map", body: "Ada cerita baru!" };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data: { url: "/" },
    })
  );
});

// Klik notifikasi
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});

// Uji notifikasi dari halaman
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHOW_TEST_NOTIFICATION") {
    console.log("📨 Pesan diterima di SW:", event.data);
    event.waitUntil(
      self.registration.showNotification("Tes Notifikasi Story Map", {
        body: "Notifikasi ini muncul dari Service Worker!",
        icon: "/icons/192x192.png",
        data: { url: "/" },
      })
    );
  }

  // Notifikasi story berhasil terkirim
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    const { title, body, icon } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, { body, icon })
    );
  }
});