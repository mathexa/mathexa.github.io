const API_URL = "https://script.google.com/macros/s/AKfycbyZmT5y3R39CNJDAA8vGsjM7eiuwLjFzs5jNLBl0t1PtJWpL8-g3tvV5vUpRkkIbDFbLQ/exec";

let currentUser = null;

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function toggleInfo() {
  const box = document.getElementById('phoneInfo');
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
      loadVideos();
      showScreen('videos');
    } else {
      setStatus("registerStatus", data.error);
    }

  } catch {
    setStatus("registerStatus", "Serverio klaida");
  }
}

async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  setStatus("loginStatus", "Kraunama...");

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "login",
        email,
        password
      })
    });

    const text = await res.text();
    const data = JSON.parse(text);

    if (data.success) {
      currentUser = email;
      loadVideos();
      showScreen('videos');
    } else {
      setStatus("loginStatus", "Neteisingi prisijungimo duomenys");
    }

  } catch {
    setStatus("loginStatus", "Serverio klaida");
  }
}

async function loadVideos() {
  const res = await fetch('videos.json');
  const videos = await res.json();

  const container = document.getElementById('videoList');
  container.innerHTML = "";

  videos.forEach(v => {
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
    document.querySelectorAll('#videoList div').forEach(el => {
      el.classList.add('blur');
    });

    const msg = document.createElement('p');
    msg.innerText = "Nemokami kreditai išnaudoti. Įsigykite prenumeratą";
    document.getElementById('videoList').appendChild(msg);
    return;
  }

  window.open(url, '_blank');
}

async function activateCode() {
  const code = prompt("Įveskite kodą");
  if (!code) return;

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
    alert(data.error);
  }
}
