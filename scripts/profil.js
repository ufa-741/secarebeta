import { supabase } from './supabase.js';

const inputNom = document.getElementById('nom');
const inputPrenom = document.getElementById('prenom');
const inputDescription = document.getElementById('description');
const inputPhoto = document.getElementById('photo');
const btnValider = document.getElementById('valider-profil');
const previewPhoto = document.getElementById('preview-photo');
const inputVille = document.getElementById("ville");
const previewCoords = document.getElementById("preview-coords");

let userId = '';
let photo_url = '';

const LOCATIONIQ_API_KEY = 'pk.01275215fd313e9689e45fb24c088ec0';

// ✅ Chargement du profil existant
document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    alert("🔒 Vous devez être connecté.");
    window.location.href = "login.html";
    return;
  }

  userId = session.user.id;

  const { data: coiffeur, error: fetchError } = await supabase
    .from('coiffeurs')
    .select('nom, prenom, description, photo_url, ville')
    .eq('user_id', userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error("Erreur chargement profil :", fetchError.message);
    alert("Erreur lors du chargement du profil.");
    return;
  }

  if (coiffeur) {
    inputNom.value = coiffeur.nom || '';
    inputPrenom.value = coiffeur.prenom || '';
    inputDescription.value = coiffeur.description || '';
    inputVille.value = coiffeur.ville || '';
    previewPhoto.src = coiffeur.photo_url || 'picture/default.jpg';
    photo_url = coiffeur.photo_url || '';
  }
});

// 🖼️ Prévisualisation instantanée de la nouvelle photo
inputPhoto.addEventListener('change', () => {
  const file = inputPhoto.files[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      alert("❌ Le fichier doit être une image.");
      inputPhoto.value = '';
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("❌ L’image ne doit pas dépasser 2 Mo.");
      inputPhoto.value = '';
      return;
    }

    const url = URL.createObjectURL(file);
    previewPhoto.src = url;
  }
});

// 📍 Fonction : convertir ville → coordonnées GPS avec LocationIQ
async function getCoordinatesFromVille(ville) {
  const url = `https://eu1.locationiq.com/v1/search.php?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(ville)}&format=json&limit=1`;

  const response = await fetch(url);
  if (!response.ok) {
    console.error("❌ Erreur API LocationIQ :", await response.text());
    throw new Error("Erreur API LocationIQ");
  }

  const results = await response.json();
  if (results.length > 0) {
    return {
      latitude: parseFloat(results[0].lat),
      longitude: parseFloat(results[0].lon)
    };
  } else {
    throw new Error("Ville non trouvée");
  }
}

// 📝 Enregistrement ou mise à jour du profil
btnValider.addEventListener('click', async (e) => {
  e.preventDefault();

  const nom = inputNom.value.trim();
  const prenom = inputPrenom.value.trim();
  const description = inputDescription.value.trim();
  const ville = inputVille.value.trim();
  const file = inputPhoto.files[0];

  if (!prenom || !nom || !description) {
    alert("⚠️ Merci de remplir les champs obligatoires.");
    return;
  }

  // 📤 Upload image si sélectionnée
  if (file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;

    const { data, error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Erreur upload image :', uploadError.message);
      alert('❌ Une erreur est survenue lors de l’upload de la photo.');
      return;
    }

    const { data: publicUrlData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(data.path);

    photo_url = publicUrlData.publicUrl;
  }

  let latitude = null;
  let longitude = null;

  if (ville) {
    try {
      const coords = await getCoordinatesFromVille(ville);
      latitude = coords.latitude;
      longitude = coords.longitude;
      if (previewCoords) {
        previewCoords.innerHTML = `📍 Latitude : ${latitude.toFixed(4)} / Longitude : ${longitude.toFixed(4)}`;
      }
    } catch (e) {
      if (previewCoords) previewCoords.innerHTML = "❌ Ville non trouvée.";
      return;
    }
  }

  const profilData = {
    user_id: userId,
    nom,
    prenom,
    description,
    photo_url,
    ville
  };

  if (latitude && longitude) {
    profilData.latitude = latitude;
    profilData.longitude = longitude;
  }

  const { error: upsertError } = await supabase
    .from('coiffeurs')
    .upsert(profilData, { onConflict: ['user_id'] });

  if (upsertError) {
    console.error("❌ Erreur BDD :", upsertError.message);
    alert("❌ Une erreur est survenue lors de l'enregistrement.");
  } else {
    alert("✅ Profil mis à jour avec succès !");
    window.location.href = "planningcoiffeur.html";
  }
});
