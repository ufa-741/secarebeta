import { supabase } from './supabase.js';

const container = document.querySelector(".coiffeur-list");

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

let clientLatitude = null;
let clientLongitude = null;

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
        afficherBoutonReessayer(); // 👉 Proposer de réessayer
        resolve(false); // on continue, mais sans position
      }
    );
  });
}

function afficherBoutonReessayer() {
  const retryBtn = document.createElement("button");
  retryBtn.textContent = "📍 Autoriser la géolocalisation pour trier par distance";
  retryBtn.style.margin = "1em auto";
  retryBtn.style.display = "block";

  retryBtn.addEventListener("click", async () => {
    retryBtn.remove();
    await chargerCoiffeurs(true); // 👈 forcer une nouvelle tentative
  });

  container.prepend(retryBtn);
}

function calculerDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 🚀 Chargement des coiffeurs
async function chargerCoiffeurs(forceRetry = false) {
  if (forceRetry || (clientLatitude === null && clientLongitude === null)) {
    await obtenirPositionClient();
  }

  const { data, error } = await supabase
    .from("coiffeurs")
    .select("id, nom, prenom, photo_url, description, ville, latitude, longitude");

  if (error) {
    container.innerHTML = "<p>❌ Erreur de chargement des coiffeurs.</p>";
    return;
  }

  if (clientLatitude && clientLongitude) {
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

document.addEventListener("DOMContentLoaded", () => chargerCoiffeurs());
