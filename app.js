const API_URL = "https://script.google.com/macros/s/AKfycby4oaibD3PfUGJGO2dCTzXW5cjBIW-0g9V1dMH8GeIy6u08jTqGr1BJ_NOREyUZPLaPhw/exec";

let loggedIn = false;

// SCREEN CONTROL
function show(screen) {
  document.getElementById("landing").classList.add("hidden");
  document.getElementById("auth").classList.add("hidden");
  document.getElementById("videos").classList.add("hidden");

  document.getElementById(screen).classList.remove("hidden");
}

// NAV
function goAuth() {
  document.getElementById("lockScreen").classList.add("hidden");
  show("auth");
}

// REGISTER
async function register() {
  const name = nameInput.value;
  const email = emailInput.value;
  const password = passwordInput.value;

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
    alert("Kodas: " + data.token);
  } else {
    alert(data.error);
  }
}

// LOGIN
async function login() {
  const email = emailInput.value;
  const password = passwordInput.value;

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

    show("videos");
    loadVideos();
  } else {
    alert(data.error);
  }
}

// LOAD VIDEOS
async function loadVideos() {
  const res = await fetch("videos.json");
  const list = await res.json();

  const container = document.getElementById("videos");
  container.innerHTML = "";

  list.forEach(v => {
    const el = document.createElement("div");

    el.innerHTML = `
      <h3>${v.title}</h3>
      <p>${v.language} | ${v.duration}</p>
      <button onclick="watch('${v.url}')">Žiūrėti</button>
    `;

    container.appendChild(el);
  });
}

// WATCH
async function watch(url) {
  if (!loggedIn) {
    alert("Prisijunkite");
    return;
  }

  const email = localStorage.getItem("email");

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "checkAccess",
      email
    })
  });

  const data = await res.json();

  // ONLY trigger lock when actually blocked
  if (data.allowed === false) {
    document.getElementById("lockScreen").classList.remove("hidden");
    return;
  }

  const id = url.split("v=")[1];

  player.src = `https://www.youtube.com/embed/${id}`;
  playerModal.classList.remove("hidden");
}

// CLOSE PLAYER
function closePlayer() {
  playerModal.classList.add("hidden");
  player.src = "";
}
