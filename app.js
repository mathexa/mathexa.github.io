const API_URL = "https://script.google.com/macros/s/AKfycby4oaibD3PfUGJGO2dCTzXW5cjBIW-0g9V1dMH8GeIy6u08jTqGr1BJ_NOREyUZPLaPhw/exec";

// UI
function showRegister() {
  document.getElementById("landing").classList.add("hidden");
  document.getElementById("auth").classList.remove("hidden");
}

function showLogin() {
  showRegister();
}

// REGISTER
async function register() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const code = document.getElementById("code").value;

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
    alert("Jūsų unikalus kodas: " + data.token);

    if (code) {
      await redeemCode(email, code);
    }
  } else {
    alert(data.error);
  }
}

// REDEEM
async function redeemCode(email, code) {
  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "redeemCode",
      email,
      code
    })
  });
}

// LOGIN
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

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
    localStorage.setItem("email", email);
    loadVideos();
  } else {
    alert(data.error);
  }
}

// LOAD VIDEOS
async function loadVideos() {
  const res = await fetch("videos.json");
  const videos = await res.json();

  const container = document.getElementById("videos");
  container.innerHTML = "";

  videos.forEach(v => {
    const el = document.createElement("div");

    el.innerHTML = `
      <h3>${v.title}</h3>
      <p>${v.language} | ${v.duration} | ${v.category}</p>
      <button onclick="openVideo('${v.url}')">Žiūrėti</button>
    `;

    container.appendChild(el);
  });
}

// VIDEO ACCESS
async function openVideo(url) {
  const email = localStorage.getItem("email");

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "checkAccess",
      email
    })
  });

  const data = await res.json();

  if (!data.allowed) {
    document.getElementById("lockScreen").classList.remove("hidden");
    return;
  }

  const id = url.split("v=")[1];
  document.getElementById("player").src =
    `https://www.youtube.com/embed/${id}`;

  document.getElementById("playerModal").classList.remove("hidden");
}

// CLOSE PLAYER
function closePlayer() {
  document.getElementById("playerModal").classList.add("hidden");
  document.getElementById("player").src = "";
}
