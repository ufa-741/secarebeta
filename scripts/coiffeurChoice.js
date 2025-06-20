import { supabase } from './supabase.js';

const container = document.querySelector(".coiffeur-list");
let clientLatitude = null;
let clientLongitude = null;
let geolocActive = false;

// 📍 Demande de géolocalisation
function obtenirPositionClient() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      alert("❌ La géolocalisation n'est pas supportée par votre navigateur.");
      return reject("Non supportée");
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        clientLatitude = position.coords.latitude;
        clientLongitude = position.coords.longitude;
        resolve(true);
      },
      err => {
        console.warn("⛔ Géolocalisation refusée ou échouée :", err.message);
        resolve(false); // On continue sans position
      }
    );
  });
}

// 🔍 Calcule la distance entre 2 points géographiques
function calculerDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 📸 Gère les images
function getOptimizedImage(url) {
  return url?.includes("supabase.co")
    ? `${url}?width=150&quality=70&format=webp`
    : "picture/default.jpg";
}

function preloadImage(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
  });
}

// 🚀 Charge les coiffeurs
async function chargerCoiffeurs() {
  if (geolocActive && (clientLatitude === null || clientLongitude === null)) {
    await obtenirPositionClient();
  }

  const { data, error } = await supabase
    .from("coiffeurs")
    .select("id, nom, prenom, photo_url, description, ville, latitude, longitude");

  if (error) {
    container.innerHTML = "<p>❌ Erreur de chargement des coiffeurs.</p>";
    return;
  }

  if (geolocActive && clientLatitude && clientLongitude) {
    data.forEach(c => {
      if (c.latitude && c.longitude) {
        c.distance = calculerDistance(clientLatitude, clientLongitude, c.latitude, c.longitude);
      } else {
        c.distance = Infinity;
      }
    });
    data.sort((a, b) => a.distance - b.distance);
  }

  container.innerHTML = "";

  for (const { id, nom, prenom, photo_url, description, ville, distance } of data) {
    const imgUrl = getOptimizedImage(photo_url);
    const imgElement = await preloadImage(imgUrl);

    const card = document.createElement("div");
    card.className = "coiffeur-card";

    card.innerHTML = `
      <img src="${imgElement?.src || 'picture/default.jpg'}" alt="${prenom}" width="120" height="120" />
      <h3>${prenom} ${nom}</h3>
      <p>${description || "Aucune description"}</p>
      <p><strong>Ville :</strong> ${ville || "Non précisée"}</p>
      ${
        distance !== undefined && distance !== Infinity
          ? `<p><strong>Distance :</strong> ${distance.toFixed(1)} km</p>`
          : ""
      }
      <button data-id="${id}">Choisir</button>
    `;

    card.querySelector("button").addEventListener("click", () => {
      localStorage.setItem("selectedCoiffeurId", id);
      window.location.href = "reservation.html";
    });

    container.appendChild(card);
  }
}

// ✅ Gestion du bouton ON/OFF
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggle-location");

  if (toggle) {
    toggle.addEventListener("change", async () => {
      geolocActive = toggle.checked;

      if (geolocActive) {
        await obtenirPositionClient();
      } else {
        clientLatitude = null;
        clientLongitude = null;
      }

      await chargerCoiffeurs();
    });
  }

  chargerCoiffeurs();
});
