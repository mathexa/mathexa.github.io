const API_URL = "https://script.google.com/macros/s/AKfycbzqGJrzgTiEqSe4J4kPW6FX-Jp6uXwocXhxeaKyiT2vv9JnYyIqZUAGW79ihCMobvyLMQ/exec";

let currentUser = null;

const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const phoneInput = document.getElementById('phone');
const roleInput = document.getElementById('role');

const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const phoneError = document.getElementById('phoneError');
const roleError = document.getElementById('roleError');

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function toggleInfo() {
  const box = document.getElementById('phoneInfo');
  box.style.display = box.style.display === 'block' ? 'none' : 'block';
}

function validate() {
  let valid = true;

  nameError.innerText = "";
  emailError.innerText = "";
  passwordError.innerText = "";
  phoneError.innerText = "";
  roleError.innerText = "";

  if (nameInput.value.trim().split(" ").length < 2) {
    nameError.innerText = "Įveskite vardą ir pavardę";
    valid = false;
  }

  if (!/^\S+@\S+\.\S+$/.test(emailInput.value)) {
    emailError.innerText = "Neteisingas el. paštas";
    valid = false;
  }

  if (passwordInput.value.length < 6) {
    passwordError.innerText = "Mažiausiai 6 simboliai";
    valid = false;
  }

  const phone = phoneInput.value.trim();
  if (phone !== "" && phone !== "+370") {
    if (!/^\+?[0-9]{8,15}$/.test(phone)) {
      phoneError.innerText = "Neteisingas numeris";
      valid = false;
    }
  }

  if (!roleInput.value) {
    roleError.innerText = "Pasirinkite rolę";
    valid = false;
  }

  return valid;
}

function setStatus(msg) {
  document.getElementById('status').innerText = msg;
}

async function register() {
  if (!validate()) return;

  setStatus("Kraunama...");

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "register",
      name: nameInput.value,
      email: emailInput.value,
      password: passwordInput.value,
      phone: phoneInput.value,
      role: roleInput.value
    })
  });

  const data = await res.json();

  if (data.success) {
    setStatus("Sėkminga registracija");
  } else {
    setStatus(data.error);
  }
}

async function login() {
  if (!validate()) return;

  setStatus("Kraunama...");

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "login",
      email: emailInput.value,
      password: passwordInput.value
    })
  });

  const data = await res.json();

  if (data.success) {
    currentUser = emailInput.value;
    loadVideos();
    showScreen('videos');
  } else {
    setStatus("Neteisingi duomenys");
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
    msg.innerText = "Free credits used. Please buy a subscription to continue using";
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
      code: code
    })
  });

  const data = await res.json();

  if (data.success) {
    alert("Aktyvuota");
  } else {
    alert(data.error);
  }
}
