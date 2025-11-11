// Request permission & subscribe to push
export async function subscribePush() {
  if (!("serviceWorker" in navigator)) return;

  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: "<YOUR_PUBLIC_VAPID_KEY>"
  });

  console.log("Push subscription:", subscription);
  // Simpan subscription ke server jika perlu
}