import { supabase } from './supabase.js';

document.addEventListener("DOMContentLoaded", () => {
  const calendarDates = document.getElementById("calendar-dates");
  const calendarDay = document.getElementById("calendar-day");
  const calendarDate = document.getElementById("calendar-date");
  const timeSlots = document.getElementById("time-slots");
  const goToStep2 = document.getElementById("goToStep2");
  const step1 = document.querySelector(".step-1");
  const step2 = document.querySelector(".step-2");
  const step3 = document.querySelector(".step-3");
  const recap = document.getElementById("recapitulatif");

  const prevMonthBtn = document.getElementById("prevMonth");
  const nextMonthBtn = document.getElementById("nextMonth");

  let current = new Date();
  let selectedDate = null;
  let selectedHour = null;

  const horaires = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00"
  ];

  const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const mois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function updateCalendar(dateToShow) {
  calendarDates.innerHTML = "";

  const year = dateToShow.getFullYear();
  const month = dateToShow.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);

    const li = document.createElement("li");
    li.textContent = day;
    li.setAttribute("data-full-date", date.toISOString());

    li.addEventListener("click", () => selectDate(year, month, day));
    calendarDates.appendChild(li);

    // Si c'est aujourd'hui et on affiche ce mois
    if (isCurrentMonth && day === today.getDate()) {
      li.classList.add("active");
    }
  }

  // Sélectionne aujourd’hui si dans le mois affiché, sinon jour 1
  if (isCurrentMonth) {
    selectDate(today.getFullYear(), today.getMonth(), today.getDate());
  } else {
    selectDate(year, month, 1);
  }
}


  

  function selectDate(year, month, day) {
    selectedDate = new Date(year, month, day);
    calendarDay.textContent = jours[selectedDate.getDay()];
    calendarDate.textContent = `${day} ${mois[month]} ${year}`;

    document.querySelectorAll(".card__body--dates li").forEach(el => el.classList.remove("selected"));
    const li = Array.from(calendarDates.children).find(el => el.textContent == day && !el.classList.contains("prev"));
    if (li) li.classList.add("selected");

    generateTimeSlots();
  }

  function generateTimeSlots() {
    timeSlots.innerHTML = "";
    selectedHour = null;
    goToStep2.style.display = "none";

    horaires.forEach(hour => {
      const btn = document.createElement("button");
      btn.className = "slot-btn";
      btn.textContent = hour;
      btn.addEventListener("click", () => {
        document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        selectedHour = hour;
        goToStep2.style.display = "inline-block";
      });
      timeSlots.appendChild(btn);
    });
  }

  function formatDateToISO(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  prevMonthBtn.addEventListener("click", () => {
    current.setMonth(current.getMonth() - 1);
    updateCalendar(current);
  });

  nextMonthBtn.addEventListener("click", () => {
    current.setMonth(current.getMonth() + 1);
    updateCalendar(current);
  });

  goToStep2.addEventListener("click", () => {
    step1.style.display = "none";
    step2.style.display = "block";
  });

  document.getElementById("valider-reservation").addEventListener("click", async () => {
    const nom = document.getElementById("client-nom")?.value.trim();
    const prenom = document.getElementById("client-prenom")?.value.trim();
    const telephone = document.getElementById("telephone")?.value.trim() || null;
    const categorie = document.querySelector('input[name="categorie"]:checked')?.value || "Non spécifiée";
    const coupe = document.getElementById("coupe")?.value.trim() || "Coupe";
    const commentaire = document.getElementById("commentaire")?.value.trim();
    const email = document.getElementById("email")?.value.trim() || null
    const heure = selectedHour;
    const date = selectedDate ? formatDateToISO(selectedDate) : null;

    if (!nom || !prenom || !date || !heure) {
      alert("Merci de remplir tous les champs.");
      return;
    }

    const coiffeurId = localStorage.getItem('selectedCoiffeurId');
    const { data, error } = await supabase.from("reservations").insert({
      client_nom: nom,
      client_prenom: prenom,
      telephone: telephone,
      categorie: categorie,
      email: email,
      coupe: coupe,
      commentaire: commentaire,
      date: date,
      heure: heure + ":00",
      coiffeur_id: coiffeurId 

    });

    if (error) {
      console.error("Erreur Supabase complète :", error);
      alert("Une erreur est survenue : " + (error.message || "Erreur inconnue"));
    } else {
      step2.style.display = "none";
      step3.style.display = "block";
      recap.innerHTML = `
        <p><strong>Date :</strong> ${date}</p>
        <p><strong>Heure :</strong> ${heure}</p>
        <p><strong>Nom :</strong> ${nom}</p>
        <p><strong>Prénom :</strong> ${prenom}</p>
        ${email ? `<p><strong>Email :</strong> ${email}</p>` : ""}
        ${telephone ? `<p><strong>Téléphone :</strong> ${telephone}</p>` : ""}
        <p><strong>Catégorie :</strong> ${categorie}</p>
        <p><strong>Coupe :</strong> ${coupe}</p>
        <p><strong>Commentaire :</strong> ${commentaire || "Aucun"}</p>
      `;
    }
  });

  // Lancement initial
  updateCalendar(current);
});


