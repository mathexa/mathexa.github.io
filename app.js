const API_URL = "https://script.google.com/macros/s/AKfycbyI9-zOdLM8GwwZlZ6epSalg5lYtES8cwit0z3J4dbHaJneC36D_0MiobVmAz6-ZEXaTw/exec";

let currentUser = null;
let allVideos = [];

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function toggleInfo() {
  const box = document.getElementById('phoneInfo');
  box.style.display = box.style.display === 'block' ? 'none' : 'block';
}

function toggleSettings() {
  const box = document.getElementById('settingsBox');
  box.style.display = box.style.display === 'block' ? 'none' : 'block';
}

function setStatus(id, msg) {
  document.getElementById(id).innerText = msg;
}

async function register() {
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const phone = document.getElementById('phone').value;
  const role = document.getElementById('role').value;

  setStatus("registerStatus", "Kraunama...");

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
    loadVideos();
    showScreen('videos');
  } else {
    setStatus("registerStatus", data.error);
  }
}

async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  setStatus("loginStatus", "Kraunama...");

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
    loadVideos();
    showScreen('videos');
  } else {
    setStatus("loginStatus", "Neteisingi prisijungimo duomenys");
  }
}

async function loadVideos() {
  const res = await fetch('videos.json');
  allVideos = await res.json();
  renderVideos(allVideos);
}

function renderVideos(list) {
  const container = document.getElementById('videoList');
  container.innerHTML = "";

  list.forEach(v => {
    const div = document.createElement('div');

    div.innerHTML = `
      <p><strong>${v.title}</strong></p>
      <p>Kategorija: ${v.category}</p>
      <p>Kalba: ${v.language}</p>
      <p>Trukmė: ${v.duration}</p>
      <p>Platforma: ${v.platform}</p>
      <button onclick="watchVideo('${v.url}')">Žiūrėti</button>
    `;

    container.appendChild(div);
  });
}

function searchVideos() {
  const q = document.getElementById('search').value.toLowerCase();
  const filtered = allVideos.filter(v => v.title.toLowerCase().includes(q));
  renderVideos(filtered);
}

function filterCategory() {
  const cat = document.getElementById('categoryFilter').value;

  if (!cat) {
    renderVideos(allVideos);
    return;
  }

  const filtered = allVideos.filter(v => v.category === cat);
  renderVideos(filtered);
}

async function watchVideo(url) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "use",
      email: currentUser
    })
  });

  const data = await res.json();

  if (data.blocked) {
    alert("Limitas pasiektas");
    return;
  }

  window.open(url, '_blank');
}

async function activateCode() {
  const code = prompt("Įveskite kodą");

  if (!code || code.length < 4) {
    alert("Kodas turi būti bent 4 simbolių");
    return;
  }

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
    alert("Kodas aktyvuotas");
  } else {
    alert(data.error || "Klaida");
  }
}
