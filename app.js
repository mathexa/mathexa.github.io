const API = "https://script.google.com/macros/s/AKfycby4oaibD3PfUGJGO2dCTzXW5cjBIW-0g9V1dMH8GeIy6u08jTqGr1BJ_NOREyUZPLaPhw/exec";

function el(id) {
  return document.getElementById(id);
}

// NAVIGATION
function goAuth() {
  el("landing").classList.add("hidden");
  el("auth").classList.remove("hidden");
}

// REGISTER
async function register() {
  const name = el("name").value.trim();
  const email = el("email").value.trim();
  const password = el("password").value;

  el("status").innerText = "Registruojama...";

  try {
    const res = await fetch(API, {
      method: "POST",
      body: JSON.stringify({
        action: "register",
        name,
        email,
        password
      })
    });

    const data = await res.json();

    if (data.success) {
      el("status").innerText = "Registracija sėkminga";
    } else {
      el("status").innerText = "Klaida registruojant";
    }

  } catch (err) {
    el("status").innerText = "Ryšio klaida";
  }
}

// LOGIN
async function login() {
  const email = el("email").value.trim();
  const password = el("password").value;

  el("status").innerText = "Jungiama...";

  try {
    const res = await fetch(API, {
      method: "POST",
      body: JSON.stringify({
        action: "login",
        email,
        password
      })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("email", email);

      el("auth").classList.add("hidden");
      loadVideos();
    } else {
      el("status").innerText = "Blogi prisijungimo duomenys";
    }

  } catch (err) {
    el("status").innerText = "Ryšio klaida";
  }
}

// LOAD VIDEOS
async function loadVideos() {
  try {
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

  } catch (err) {
    console.error(err);
  }
}

// WATCH + CLICK SYSTEM
async function watch(url) {
  const email = localStorage.getItem("email");

  try {
    const res = await fetch(API, {
      method: "POST",
      body: JSON.stringify({
        action: "use",
        email
      })
    });

    const data = await res.json();

    console.log("CLICK DATA:", data);

    if (data.blocked === true) {
      el("lock").classList.remove("hidden");
      return;
    }

    // OPEN VIDEO
    window.open(url, "_blank");

  } catch (err) {
    console.error(err);
  }
}
