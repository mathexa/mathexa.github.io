const API_URL = "https://script.google.com/macros/s/AKfycbwMUvkMEXE7bqegMfB0OUiAQUpsPxjpxntOVaLdbDg5IDLdiXXX6Ht6xW_T_5jnj6Wl/exec";

let currentUser = null;
let allVideos = [];

/* =========================
   NAVIGATION
========================= */
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* =========================
   SETTINGS
========================= */
function toggleSettings(){
  const box = document.getElementById('settingsBox');
  if (!box) return;
  box.style.display = box.style.display === 'block' ? 'none' : 'block';
}

/* =========================
   POLICY LINK
========================= */
function openPolicy(){
  window.open("policy&terms of use.txt", "_blank");
}

/* =========================
   PASSWORD CHECK
========================= */
function checkPassword(){
  const p = document.getElementById('password').value;
  const f = document.getElementById('passFeedback');

  if (!f) return;

  if (p.length < 8) {
    f.innerText = "Per trumpas (min. 8 simboliai)";
  } else if (!/[A-Z]/.test(p)) {
    f.innerText = "Pridėkite didžiąją raidę";
  } else if (!/[0-9]/.test(p)) {
    f.innerText = "Pridėkite skaičių";
  } else {
    f.innerText = "Slaptažodis tinkamas";
  }
}

/* =========================
   EMAIL VALIDATION
========================= */
function validEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* =========================
   REGISTER
========================= */
async function register(){
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const phone = document.getElementById('phone').value.trim();
  const role = document.getElementById('role').value;

  if (!name) return alert("Įveskite vardą");
  if (!validEmail(email)) return alert("Blogas el. paštas");
  if (password.length < 8) return alert("Slaptažodis per trumpas");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "register",
        name,
        email,
        password,
        phone,
        role
      })
    });

    const data = await res.json();

    if (data.success) {
      currentUser = email;
      await loadVideos();
      showScreen('videos');
    } else {
      alert(data.error || "Klaida registruojantis");
    }

  } catch (err) {
    alert("Serverio klaida");
  }
}

/* =========================
   LOGIN
========================= */
async function login(){
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!validEmail(email)) return alert("Blogas el. paštas");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "login",
        email,
        password
      })
    });

    const data = await res.json();

    if (data.success) {
      currentUser = email;
      await loadVideos();
      showScreen('videos');
    } else {
      alert("Neteisingi duomenys");
    }

  } catch (err) {
    alert("Serverio klaida");
  }
}

/* =========================
   LOAD VIDEOS
========================= */
async function loadVideos(){
  try {
    const res = await fetch('videos.json');
    allVideos = await res.json();
    renderVideos(allVideos);
  } catch (err) {
    alert("Nepavyko užkrauti vaizdo įrašų");
  }
}

/* =========================
   RENDER VIDEOS
========================= */
function renderVideos(list){
  const container = document.getElementById('videoList');
  container.innerHTML = "";

  list.forEach((v, i) => {
    const d = document.createElement('div');
    d.className = "video";

    d.innerHTML = `
      <b>${v.title}</b>
      <p>Kalba: ${v.language}</p>

      <button onclick="toggleDetails(${i})">Išsamiau</button>

      <div id="details-${i}" style="display:none">
        <p>Platforma: ${v.platform}</p>
        <p>Trukmė: ${v.duration}</p>
      </div>

      <button onclick="watchVideo('${v.url}')">Žiūrėti</button>
    `;

    container.appendChild(d);
  });
}

/* =========================
   TOGGLE DETAILS
========================= */
function toggleDetails(i){
  const el = document.getElementById(`details-${i}`);
  if (!el) return;

  el.style.display = el.style.display === "none" ? "block" : "none";
}

/* =========================
   SEARCH
========================= */
function searchVideos(){
  const q = document.getElementById('search').value.toLowerCase();

  const filtered = allVideos.filter(v =>
    v.title.toLowerCase().includes(q)
  );

  renderVideos(filtered);
}

/* =========================
   FILTER CATEGORY
========================= */
function filterCategory(){
  const c = document.getElementById('categoryFilter').value;

  if (!c) return renderVideos(allVideos);

  const filtered = allVideos.filter(v => v.category === c);
  renderVideos(filtered);
}

/* =========================
   WATCH VIDEO (LIMIT SYSTEM)
========================= */
async function watchVideo(url){
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "use",
        email: currentUser
      })
    });

    const data = await res.json();

    if (data.blocked) {
      alert("Pasiektas limitas");
      return;
    }

    window.open(url, '_blank');

  } catch (err) {
    alert("Klaida tikrinant limitą");
  }
}

/* =========================
   ACTIVATE CODE
========================= */
async function activateCode(){
  const code = prompt("Įveskite kodą");
  if (!code) return;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "activate",
        email: currentUser,
        code
      })
    });

    const data = await res.json();

    if (data.success) {
      alert("Aktyvuota");
    } else {
      alert(data.error || "Klaida");
    }

  } catch (err) {
    alert("Serverio klaida");
  }
}
