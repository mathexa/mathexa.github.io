const API_URL = "https://script.google.com/macros/s/AKfycby4oaibD3PfUGJGO2dCTzXW5cjBIW-0g9V1dMH8GeIy6u08jTqGr1BJ_NOREyUZPLaPhw/exec";

let loggedIn = false;

// NAV
function goAuth() {
  landing.classList.add("hidden");
  auth.classList.remove("hidden");
}

// VALIDATION
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(p) {
  return p.length >= 6;
}

// REGISTER
async function register() {
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  emailError.innerText = "";
  passError.innerText = "";
  status.innerText = "";

  let valid = true;

  if (!validateEmail(email)) {
    emailError.innerText = "Neteisingas el. paštas";
    valid = false;
  }

  if (!validatePassword(password)) {
    passError.innerText = "Mažiausiai 6 simboliai";
    valid = false;
  }

  if (!valid) return;

  status.innerText = "Kuriama...";

  const res = await fetch(API_URL, {
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
    status.innerText = "Sėkminga registracija. Kodas: " + data.token;
  } else {
    status.innerText = data.error;
  }
}

// LOGIN
async function login() {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  status.innerText = "Jungiama...";

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
    loggedIn = true;
    localStorage.setItem("email", email);

    auth.classList.add("hidden");
    loadVideos();
  } else {
    status.innerText = data.error;
  }
}

// VIDEOS
async function loadVideos() {
  const res = await fetch("videos.json");
  const list = await res.json();

  videos.classList.remove("hidden");
  videos.innerHTML = "";

  list.forEach(v => {
    const el = document.createElement("div");

    el.innerHTML = `
      <h3>${v.title}</h3>
      <p>${v.language} | ${v.duration}</p>
      <button onclick="watch('${v.url}')">Žiūrėti</button>
    `;

    videos.appendChild(el);
  });
}

// WATCH
async function watch(url) {
  const email = localStorage.getItem("email");

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "checkAccess",
      email
    })
  });

  const data = await res.json();

  if (data.allowed === false) {
    lockScreen.classList.remove("hidden");
    return;
  }

  const id = url.split("v=")[1];
  player.src = `https://www.youtube.com/embed/${id}`;
  playerModal.classList.remove("hidden");
}

function closePlayer() {
  playerModal.classList.add("hidden");
  player.src = "";
}
