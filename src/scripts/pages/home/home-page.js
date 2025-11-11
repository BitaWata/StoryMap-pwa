import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getData } from "../../data/api.js";

export default class HomePage {
  async render() {
    return `
      <section class="container">
        <h1>Home Page</h1>
        <div id="map" style="height: 400px; border-radius: 12px; margin-bottom: 20px;"></div>
        <h2 style="color: #87CEFA;">Galeri Story</h2>
        <div id="stories-list" class="stories-list"></div>
      </section>
    `;
  }

  async afterRender() {
    const containerStories = document.querySelector("#stories-list");

    let dataStories;
    try {
      dataStories = await getData();
    } catch (err) {
      console.error("Gagal mengambil data:", err);
      containerStories.innerHTML = "<p>Gagal mengambil cerita.</p>";
      return;
    }

    if (!dataStories.listStory || dataStories.listStory.length === 0) {
      containerStories.innerHTML = `<p>Data cerita kosong. Silakan masuk untuk melihat galeri cerita.</p>`;
      return;
    }

    const layers = {
      OpenStreetMap: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }),
      Satellite: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles © Esri",
      }),
    };

    const mapInstance = L.map("map", {
      center: [-2.5, 118],
      zoom: 5,
      layers: [layers.OpenStreetMap],
    });

    L.control.layers(layers).addTo(mapInstance);

    // Icon custom
    const customIcon = L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
      iconSize: [35, 45],
      iconAnchor: [17, 45],
    });

    const markerList = [];

    dataStories.listStory.forEach((story) => {
      const { name, description, photoUrl, lat, lon } = story;

      if (lat && lon) {
        const marker = L.marker([lat, lon], { icon: customIcon }).addTo(mapInstance);
        marker.bindPopup(`
          <b>${name}</b><br>${description}<br>
          <img src="${photoUrl}" width="100" />
        `);
        markerList.push({ marker, lat, lon });
      }

      const storyCard = document.createElement("div");
      storyCard.className = "story-card";
      storyCard.setAttribute("tabindex", "0");
      storyCard.innerHTML = `
        <img src="${photoUrl}" alt="${name}" loading="lazy" />
        <div class="story-info">
          <h3>${name}</h3>
          <p>${description}</p>
          ${lat && lon ? `<small>Koordinat: ${lat.toFixed(2)}, ${lon.toFixed(2)}</small>` : ""}
        </div>
      `;

      if (lat && lon) {
        storyCard.addEventListener("click", () => {
          mapInstance.setView([lat, lon], 10, { animate: true });
          const target = markerList.find((m) => m.lat === lat && m.lon === lon);
          if (target) target.marker.openPopup();

          document.querySelectorAll(".story-card").forEach((c) => c.classList.remove("active"));
          storyCard.classList.add("active");
        });
      }

      containerStories.appendChild(storyCard);
    });
  }
}