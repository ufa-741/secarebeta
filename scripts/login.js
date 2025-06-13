 import { supabase } from './supabase.js';

const btnLogin = document.getElementById("show-login");
const btnSignup = document.getElementById("show-signup");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");





// Vérifie la session utilisateur
supabase.auth.getSession().then(({ data: { session } }) => {
  if (!session && !publicPages.includes(currentPage)) {
    // Redirige uniquement si ce n’est pas une page publique
    window.location.href = "index.html";
  }
});


// 🔁 Gestion du switch onglet Connexion / Inscription
btnLogin.addEventListener("click", () => {
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
  btnLogin.classList.add("active");
  btnSignup.classList.remove("active");
});

btnSignup.addEventListener("click", () => {
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  btnSignup.classList.add("active");
  btnLogin.classList.remove("active");
});

// 🔐 Connexion
document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("❌ Connexion échouée : " + error.message);
  } else {
    window.location.href = "planningcoiffeur.html";
  }
});

// 📝 Inscription
document.getElementById("signup-btn").addEventListener("click", async () => {
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });
  if (error) {
    alert("❌ Erreur d'inscription : " + error.message);
  } else {
    alert("✅ Compte créé avec succès ! Vérifie ton e-mail.");
    btnLogin.click();
    window.location.href="profil.html"; // bascule vers l’onglet Connexion
  }
});