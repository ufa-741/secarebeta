import { supabase } from './supabase.js';

supabase.auth.getSession().then(({ data: { session }}) =>{ 
  if(!session) { 
    window.location.href="login.html";
  }
});


supabase.auth.getSession().then(({ data: { session } }) => {
  if (!session) {
    window.location.href = "login.html"; // Redirige vers login si non connecté
  }
});

const grid = document.getElementById("calendar-grid");
const monthYear = document.getElementById("month-year");
const dispoModal = document.getElementById("dispo-modal");
const dispoForm = document.getElementById("dispo-form");
const modalDate = document.getElementById("modal-date");
const closeModal = document.getElementById("close-modal");
const saveDispo = document.getElementById("save-dispo");
const cancelRDV = document.getElementById("cancel-rdv");
const commentaireField = document.getElementById("commentaire");
const tbody = document.getElementById("table-reservations");



const jours = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const mois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const horaires = ["08h", "09h", "10h", "11h", "14h", "15h", "16h", "17h", "18h", "19h", "20h"];

let currentDate = new Date();
let reservationsSupabase = {};
let heuresASupprimer = [];

async function loadReservationsFromSupabase() {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    console.error("Erreur récupération utilisateur : ", userError);
    return;
  }

  // 1. Récupérer le coiffeur lié à l'utilisateur connecté
  const { data: coiffeurData, error: coiffeurError } = await supabase
    .from("coiffeurs")
    .select("id")
    .eq("user_id", userData.user.id)
    .single();

  if (coiffeurError || !coiffeurData) {
    console.error("Erreur récupération du coiffeur :", coiffeurError);
    return;
  }

  // 2. Récupérer uniquement SES réservations
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("coiffeur_id", coiffeurData.id)
    .order("date", { ascending: true })
    .order("heure", { ascending: true });

  if (error) {
    console.error("Erreur chargement Supabase:", error);
    return;
  }

  // 3. Affichage comme tu le fais déjà
  tbody.innerHTML = "";
  reservationsSupabase = {};

  data.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.date}</td>
      <td>${r.heure}</td>
      <td>${r.client_nom}</td>
      <td>${r.client_prenom || ""}</td>
      <td>${r.telephone || ""}</td>
      <td>${r.categorie}</td>
      <td>${r.coupe}</td>
      <td>${r.commentaire || ""}</td>
      <td>${r.email || ""}</td> 
    `;
    tbody.appendChild(tr);

    if (!reservationsSupabase[r.date]) {
      reservationsSupabase[r.date] = [];
    }
    reservationsSupabase[r.date].push(r);
  });
}


function updateCalendar() {
  grid.innerHTML = "";
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const today = new Date();
  const isSameMonth = today.getMonth() === month && today.getFullYear() === year;
  const dayText = isSameMonth ? ` - ${jours[today.getDay()]} ${today.getDate()}` : '';
  monthYear.textContent = `${dayText} ${mois[month]} ${year}`;

  



  const totalCells = startDay + lastDay.getDate();
  for (let i = 0; i < totalCells; i++) {
    const li = document.createElement("li");

    if (i < startDay) {
      li.classList.add("empty");
      grid.appendChild(li);
      continue;
    }

    const dayNum = i - startDay + 1;
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dateObj = new Date(year, month, dayNum);
    const jourNom = jours[dateObj.getDay()];
    const dateText = `${jourNom} ${dayNum} ${mois[month]}`;

    li.innerHTML = `
    <div class="day-cell">
    <div class="day-name">${jourNom}</div>
    <time datetime="${key}" class="day-number">${dayNum}</time>
    </div>
    `;


    if (reservationsSupabase[key]) {
      li.classList.add("booked");
      li.style.backgroundColor = "#00c853"; // vert
      const info = document.createElement("div");
      info.className = "label";
      info.innerHTML = reservationsSupabase[key]
        .map(r => `${r.heure?.slice(0, 5)} - ${r.client_nom}`)
        .join("<br>");
      li.appendChild(info);
    }

    li.addEventListener("click", () => openModal(key, dateText));
    grid.appendChild(li);
  }
}

function openModal(dateKey, displayDate) {
  dispoForm.innerHTML = "";
  modalDate.textContent = displayDate;
  dispoModal.dataset.date = dateKey;
  commentaireField.value = "";

  heuresASupprimer = [];

  horaires.forEach(h => {
    const heureFormatted = h.replace("h", "").padStart(2, '0') + ":00:00";
    const existe = (reservationsSupabase[dateKey] || []).some(r => r.heure === heureFormatted);

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = `${dateKey}_${h}`;
    input.checked = existe;

    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.textContent = h;
    label.prepend(input);

    dispoForm.appendChild(label);
  });

  dispoModal.style.display = "block";
}

cancelRDV.addEventListener("click", () => {
  heuresASupprimer = [];

  const checkboxes = dispoForm.querySelectorAll("input[type='checkbox']");
  checkboxes.forEach(cb => {
    if (!cb.checked) return;
    cb.checked = false;
    cb.parentElement.style.color = "red"; // effet visuel
    const heure = cb.id.split("_")[1];
    heuresASupprimer.push(heure);
  });

  alert("Heure(s) décochée(s). Cliquez sur 'Enregistrer' pour confirmer la suppression.");
});

saveDispo.addEventListener("click", async () => {
  const key = dispoModal.dataset.date;
  let suppressionEffectuee = false;

  for (let heure of heuresASupprimer) {
    const heureFormatted = heure.replace("h", "").padStart(2, '0') + ":00:00";

    const { error } = await supabase
      .from("reservations")
      .delete()
      .match({ date: key, heure: heureFormatted });

    if (error) {
      console.error(`Erreur lors de la suppression de ${heureFormatted}`, error);
    } else {
      suppressionEffectuee = true;
      console.log(`RDV supprimé à ${heureFormatted}`);
    }
  }

  dispoModal.style.display = "none";
  await loadReservationsFromSupabase();
  updateCalendar();

  if (suppressionEffectuee) {
    alert("Horaire(s) de rendez-vous supprimé(s).");
  }

  heuresASupprimer = [];
});

closeModal.addEventListener("click", () => {
  dispoModal.style.display = "none";
});

document.getElementById("prev-month").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateCalendar();
});

document.getElementById("next-month").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateCalendar();
});

document.addEventListener("DOMContentLoaded", async () => {
  await loadReservationsFromSupabase();
  updateCalendar();

  const logoutBtn = document.getElementById("logout-btn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erreur lors de la déconnexion :", error.message);
      } else {
        window.location.href = "index.html"; // redirection après déconnexion
      }
    });
  }
});



// Inscription
signupBtn.addEventListener("click", async () => {
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    alert("Erreur : " + error.message);
  } else {
    window.location.href = "coiffeur.html"; // redirection après inscription
  }
});











