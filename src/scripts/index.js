import "../styles/styles.css";
import App from "./pages/app";
import { syncOfflineStories } from "./data/idb.js";
import { postData } from "./data/api.js";

document.addEventListener("DOMContentLoaded", async () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const token = localStorage.getItem("token");

  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) logoutLink.style.display = isLoggedIn ? "block" : "none";

  if (!isLoggedIn || !token) window.location.hash = "#/login";

  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  await app.renderPage(app);

  window.addEventListener("hashchange", async () => {
    if (!document.startViewTransition) await app.renderPage(); 
    else document.startViewTransition(async () => { await app.renderPage(); });
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js")
        .then((registration) => {
          console.log("✅ Service Worker terdaftar:", registration.scope);
          requestNotificationPermission();
        })
        .catch((err) => console.error("❌ Service Worker gagal didaftarkan:", err));
    });
  }

  function requestNotificationPermission() {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        console.log(permission === "granted" ? "✅ Izin notifikasi diberikan" : "❌ Izin notifikasi ditolak");
      });
    }
  }

  // PWA install
  let deferredPrompt;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById("install-button");
    if (installBtn) installBtn.style.display = "block";
  });
  const installBtn = document.getElementById("install-button");
  if (installBtn) installBtn.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      console.log("Install outcome:", choiceResult.outcome);
      deferredPrompt = null;
      installBtn.style.display = "none";
    }
  });

  window.addEventListener("load", async () => {
    if (navigator.onLine) await syncOfflineStories(postData);
  });
  window.addEventListener("online", async () => await syncOfflineStories(postData));

  // ==============================
  // Push Subscription
  // ==============================
  async function subscribePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const registration = await navigator.serviceWorker.ready;

    // Ambil public key dari server
    const response = await fetch("http://localhost:3000/vapidPublicKey");
    const vapidPublicKey = await response.text();

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    await fetch("http://localhost:3000/subscribe", {
      method: "POST",
      body: JSON.stringify(subscription),
      headers: { "Content-Type": "application/json" },
    });

    console.log("✅ Push subscription berhasil!");
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }

  subscribePush();

  // ==============================
  // Tombol uji notifikasi hanya di beranda
  // ==============================
  const testButton = document.getElementById("test-notification");
  if (testButton && window.location.hash !== "#/login") {
    testButton.addEventListener("click", async () => {
      if (Notification.permission !== "granted") {
        alert("Aktifkan izin notifikasi dulu ya 🔕");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({
          type: "SHOW_TEST_NOTIFICATION",
        });
      } else {
        alert("Service Worker belum siap, reload halaman dulu");
      }
    });
  }
});