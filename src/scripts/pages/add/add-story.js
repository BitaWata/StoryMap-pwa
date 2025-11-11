import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { postData } from "../../data/api.js";
import { saveStoryOffline, getOfflineStories, deleteStoryOffline } from "../../data/idb.js";

export default class AddStoryPage {
  #map = null;
  #lat = null;
  #lon = null;

  async render() {
    return `
      <section class="container">
        <h1>Tambah Story Baru</h1>
        <form id="add-story-form" aria-label="Form Tambah Story" class="add-story-form">
          <div>
            <label for="description">Deskripsi:</label><br>
            <textarea id="description" required></textarea>
          </div>
          <div>
            <label for="photo">Foto:</label><br>
            <input type="file" id="photo" accept="image/*" required />
            <div style="margin-top:10px;">
              <button type="button" id="open-camera">Gunakan Kamera</button>
              <button type="button" id="capture-photo" disabled>Ambil Foto</button>
              <button type="button" id="close-camera" disabled>Tutup Kamera</button>
            </div>
            <video id="camera-preview" autoplay playsinline style="display:none;width:100%;border-radius:8px;margin-top:10px;"></video>
            <canvas id="photo-canvas" style="display:none;"></canvas>
            <img id="photo-preview" alt="Preview foto" style="display:none;width:100%;border-radius:8px;margin-top:10px;" />
          </div>
          <div id="map" style="height:300px;margin-top:10px;"></div>
          <p id="coords">Klik pada peta untuk memilih lokasi.</p>
          <button type="submit" style="margin-top:15px;">Kirim Story</button>
        </form>
        <p id="message"></p>

        <!-- Offline Stories Section -->
        <div id="offline-stories-section" style="margin-top:30px;">
          <h2>Offline Stories</h2>
          <div id="offline-stories-list"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#map = L.map("map").setView([-6.2, 106.8], 10);
    const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(this.#map);

    const customIcon = L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
      iconSize: [35, 45],
      iconAnchor: [17, 45],
    });

    const videoEl = document.getElementById("camera-preview");
    const canvasEl = document.getElementById("photo-canvas");
    const photoPreview = document.getElementById("photo-preview");
    let cameraStream = null;

    // Camera controls
    document.getElementById("open-camera").addEventListener("click", async () => {
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoEl.srcObject = cameraStream;
        videoEl.style.display = "block";
        document.getElementById("capture-photo").disabled = false;
        document.getElementById("close-camera").disabled = false;
        document.getElementById("open-camera").disabled = true;
      } catch (err) {
        alert("Tidak dapat mengakses kamera: " + err.message);
      }
    });

    document.getElementById("capture-photo").addEventListener("click", () => {
      if (!cameraStream) return;
      const ctx = canvasEl.getContext("2d");
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
      ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

      canvasEl.toBlob((blob) => {
        const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
        const dt = new DataTransfer();
        dt.items.add(file);
        document.getElementById("photo").files = dt.files;

        const photoURL = URL.createObjectURL(blob);
        photoPreview.src = photoURL;
        photoPreview.style.display = "block";
      }, "image/jpeg");

      cameraStream.getTracks().forEach((t) => t.stop());
      cameraStream = null;
      videoEl.style.display = "none";
      document.getElementById("capture-photo").disabled = true;
      document.getElementById("close-camera").disabled = true;
      document.getElementById("open-camera").disabled = false;
      alert("📸 Foto berhasil diambil.");
    });

    document.getElementById("close-camera").addEventListener("click", () => {
      if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
      cameraStream = null;
      videoEl.style.display = "none";
      document.getElementById("capture-photo").disabled = true;
      document.getElementById("close-camera").disabled = true;
      document.getElementById("open-camera").disabled = false;
    });

    // Map click
    this.#map.on("click", (e) => {
      this.#lat = e.latlng.lat;
      this.#lon = e.latlng.lng;
      L.marker([this.#lat, this.#lon], { icon: customIcon }).addTo(this.#map);
      document.getElementById("coords").textContent = `Titik lokasi terpilih: ${this.#lat}, ${this.#lon}`;
    });

    // Form submit
    document.getElementById("add-story-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const description = document.getElementById("description").value;
      const photo = document.getElementById("photo").files[0];
      const messageEl = document.getElementById("message");

      if (!this.#lat || !this.#lon) {
        messageEl.textContent = "Silakan klik peta untuk menentukan lokasi.";
        return;
      }

      try {
        messageEl.textContent = "Proses upload data, mohon menunggu...";
        const res = await postData(description, photo, this.#lat, this.#lon);
        if (res.error) throw new Error(res.message);

        messageEl.textContent = "Story berhasil ditambahkan!";
        event.target.reset();
        this.#map.eachLayer((l) => { if (l instanceof L.Marker) this.#map.removeLayer(l); });
        document.getElementById("coords").textContent = "Klik pada peta untuk memilih lokasi.";

        // Jika online, jangan tampilkan offline section
        renderOfflineStories();

        setTimeout(() => location.hash = "/", 1500);
      } catch (err) {
        console.warn("Gagal upload, simpan offline:", err);
        messageEl.textContent = "Gagal upload, story akan disimpan offline.";

        const saveOffline = async (photoFile) => {
          let photoData = null;
          if (photoFile) {
            const reader = new FileReader();
            photoData = await new Promise((resolve) => {
              reader.onload = () => resolve(reader.result);
              reader.readAsDataURL(photoFile);
            });
          }
          await saveStoryOffline({
            description,
            photoURL: photoData,
            lat: this.#lat,
            lon: this.#lon,
            createdAt: new Date().toISOString(),
          });
          console.log("✅ Story disimpan offline di IndexedDB");
          renderOfflineStories();
        };

        await saveOffline(photo);
      }
    });

    // Render Offline Stories
    const renderOfflineStories = async () => {
      const section = document.getElementById("offline-stories-section");
      const container = document.getElementById("offline-stories-list");

      if (navigator.onLine) {
        section.style.display = "none";
        return;
      } else {
        section.style.display = "block";
      }

      const stories = await getOfflineStories();
      container.innerHTML = "";

      if (!stories.length) {
        container.innerHTML = "<p>Tidak ada story offline.</p>";
        return;
      }

      stories.forEach((story) => {
        const div = document.createElement("div");
        div.className = "offline-story-card";
        div.innerHTML = `
          <p>${story.description}</p>
          ${story.photoURL ? `<img src="${story.photoURL}" width="100">` : ""}
          <p><small>${new Date(story.createdAt).toLocaleString()}</small></p>
          <button class="delete-btn">Hapus</button>
        `;
        div.querySelector(".delete-btn").addEventListener("click", async () => {
          await deleteStoryOffline(story.id);
          renderOfflineStories();
        });
        container.appendChild(div);
      });
    };

    // Render offline stories saat awal load
    renderOfflineStories();

    // Update offline stories saat koneksi berubah
    window.addEventListener("online", renderOfflineStories);
    window.addEventListener("offline", renderOfflineStories);

    window.addEventListener("beforeunload", () => {
      if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
    });
  }
}