const API_URL = "https://script.google.com/macros/s/AKfycby4oaibD3PfUGJGO2dCTzXW5cjBIW-0g9V1dMH8GeIy6u08jTqGr1BJ_NOREyUZPLaPhw/exec";

function el(id) {
  return document.getElementById(id);
}

function goAuth() {
  el("landing").classList.add("hidden");
  el("auth").classList.remove("hidden");
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(p) {
  return p.length >= 6;
}

// REGISTER
async function register() {
  const name = el("name").value.trim();
  const email = el("email").value.trim();
  const password = el("password").value;

  el("status").innerText = "";

  if (!validateEmail(email)) {
    el("status").innerText = "Blogas email";
    return;
  }

  if (!validatePassword(password)) {
    el("status").innerText = "Per trumpas slaptažodis";
    return;
  }

  el("status").innerText = "Siunčiama...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "register",
        name,
        email,
        password
      })
    });

    const text = await res.text();
    console.log("RAW:", text);

    const data = JSON.parse(text);

    if (data.success) {
      el("status").innerText = "Registruota! Kodas: " + data.token;
    } else {
      el("status").innerText = data.error;
    }

  } catch (err) {
    el("status").innerText = "ERROR: " + err;
    console.error(err);
  }
}

// LOGIN
async function login() {
  const email = el("email").value.trim();
  const password = el("password").value;

  el("status").innerText = "Jungiama...";

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
    console.log("RAW:", text);

    const data = JSON.parse(text);

    if (data.success) {
      el("status").innerText = "Prisijungta!";
      loadVideos();
      el("auth").classList.add("hidden");
    } else {
      el("status").innerText = data.error;
    }

  } catch (err) {
    el("status").innerText = "ERROR: " + err;
  }
}

// VIDEOS
async function loadVideos() {
  const res = await fetch("videos.json");
  const list = await res.json();

  const container = el("videos");
  container.classList.remove("hidden");
  container.innerHTML = "";

  list.forEach(v => {
    const d = document.createElement("div");
    d.innerHTML = `
      <h3>${v.title}</h3>
      <button onclick="watch('${v.url}')">Žiūrėti</button>
    `;
    container.appendChild(d);
  });
}

async function watch(url) {
  alert("Video works (test stage)");
}
