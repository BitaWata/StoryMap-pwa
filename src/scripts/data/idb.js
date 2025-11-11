const DB_NAME = "story-map-db";
const DB_VERSION = 1;
const STORE_NAME = "stories";

/**
 * Membuka koneksi IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = (err) => reject(err);
  });
}

/**
 * Simpan story offline
 */
export async function saveStoryOffline(story) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(story);
    req.onsuccess = () => resolve(true);
    req.onerror = (err) => reject(err);
  });
}

/**
 * Ambil semua story offline
 */
export async function getOfflineStories() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (err) => reject(err);
  });
}

/**
 * Hapus story offline berdasarkan id
 */
export async function deleteStoryOffline(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = (err) => reject(err);
  });
}

/**
 * Hapus semua story offline
 */
export async function clearOfflineStories() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = (err) => reject(err);
  });
}

/**
 * Sinkronisasi otomatis story offline ke server
 */
export async function syncOfflineStories(postDataFunc) {
  const offlineStories = await getOfflineStories();
  if (!offlineStories.length) return;

  for (const story of offlineStories) {
    try {
      let file;
      if (story.photoURL instanceof File) {
        file = story.photoURL;
      } else if (story.photoURL) {
        const res = await fetch(story.photoURL);
        const blob = await res.blob();
        file = new File([blob], "photo.jpg", { type: blob.type });
      }

      const result = await postDataFunc(story.description, file, story.lat, story.lon);
      if (!result.error) {
        await deleteStoryOffline(story.id);
        console.log(`✅ Story offline berhasil dikirim: ${story.description}`);

        // 🟢 Kirim pesan ke SW untuk tampilkan notifikasi
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "SHOW_NOTIFICATION",
            title: "Story berhasil terkirim!",
            body: story.description,
            icon: "/icons/192x192.png",
          });
        }
      }
    } catch (err) {
      console.warn("⚠️ Gagal sinkronisasi story offline:", err);
    }
  }
}

// Jalankan sinkronisasi otomatis saat online
window.addEventListener("online", async () => {
  console.log("🌐 Koneksi kembali, mencoba sinkronisasi story offline...");
  try {
    // postData harus diimport di tempat pemanggilan
    // syncOfflineStories(postData);
  } catch (err) {
    console.error("⚠️ Sinkronisasi otomatis gagal:", err);
  }
});