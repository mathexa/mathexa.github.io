const API = "https://script.google.com/macros/s/AKfycbwqHsQ88kSO9FdD8En9xepi79t8sL6L-rQ5diy8AtiWxNGFFU6JNm3B9GJpu-IwvS9OoQ/exec";

// Video Database
const VIDEOS_DB = [
  { "id":"1","title":"Algebra Basics 1","category":"algebra","url":"https://youtube.com","platform":"YouTube","length":300 },
  { "id":"2","title":"Algebra Basics 2","category":"algebra","url":"https://youtube.com","platform":"YouTube","length":420 },
  { "id":"3","title":"Algebra Basics 3","category":"algebra","url":"https://youtube.com","platform":"YouTube","length":360 },
  { "id":"4","title":"Algebra Basics 4","category":"algebra","url":"https://youtube.com","platform":"YouTube","length":280 },
  { "id":"5","title":"Algebra Basics 5","category":"algebra","url":"https://youtube.com","platform":"YouTube","length":500 }
  // ... (Add your other 45 videos here)
];

let isSubmitting = false;

// ---------------- INIT ----------------
document.addEventListener("DOMContentLoaded", () => {
  loadPrefixes();
  bindEvents();
  checkSession();
});

function loadPrefixes(){
  const pref = document.getElementById("prefix");
  ["+370","+371","+372"].forEach(p=>{
    const o=document.createElement("option"); o.value=p; o.innerText=p; pref.appendChild(o);
  });
}

function bindEvents(){
  // Navigation
  document.getElementById("btnLogin").onclick = () => show("login");
  document.getElementById("btnSignup").onclick = () => show("signup");
  document.getElementById("back1").onclick = back;
  document.getElementById("back2").onclick = back;
  document.getElementById("settingsBtn").onclick = () => { toggle("app", false); toggle("settings", true); };
  document.getElementById("closeSettings").onclick = () => { toggle("settings", false); toggle("app", true); };
  
  // Actions
  document.getElementById("loginBtn").onclick = () => login();
  document.getElementById("signupBtn").onclick = signup;
  
  // Settings
  document.getElementById("stayLoginSettings").onchange = (e) => {
    const session = JSON.parse(localStorage.getItem('mathexa_session'));
    if(session) {
      session.permanent = e.target.checked;
      localStorage.setItem('mathexa_session', JSON.stringify(session));
    }
  };

  // Feedback
  document.getElementById("password2").oninput = (e) => {
    document.getElementById("passwordFeedback").innerText = e.target.value.length < 8 ? "Per trumpas" : "Tinkamas";
  };
  document.getElementById("password3").oninput = (e) => {
    const p2 = document.getElementById("password2").value;
    document.getElementById("matchFeedback").innerText = p2 === e.target.value ? "Sutampa" : "Nesutampa";
  };
}

// ---------------- SESSION ----------------
async function checkSession() {
  const session = JSON.parse(localStorage.getItem('mathexa_session'));
  if (!session) return;

  // If not set to permanent in settings, check 3h expiry
  if (!session.permanent && Date.now() > session.expiresAt) {
    localStorage.removeItem('mathexa_session');
    return;
  }

  try {
    const res = await fetch(API, { method: "POST", body: JSON.stringify({ action: "validateToken", token: session.token }) });
    const data = await res.json();
    if (data.success) {
      updateUI(data.clicks_remaining, data.expiry);
      showApp();
      document.getElementById("stayLoginSettings").checked = !!session.permanent;
    }
  } catch(e) { console.error("Session invalid"); }
}

// ---------------- SIGNUP (FIXED) ----------------
async function signup(){
  if(isSubmitting) return;
  const status = document.getElementById("signupStatus");
  
  const nameVal = document.getElementById("name").value.trim();
  const emailVal = document.getElementById("email2").value.trim();
  const phoneVal = document.getElementById("prefix").value + document.getElementById("phone").value.trim();
  const passVal = document.getElementById("password2").value;

  if(!nameVal || !emailVal || !passVal) {
    status.innerText = "Užpildykite pagrindinius laukus";
    return;
  }

  isSubmitting = true;
  status.innerText = "Kuriama paskyra...";
  status.style.color = "white";

  try {
    const res = await fetch(API, {
      method: "POST",
      body: JSON.stringify({ action: "signup", full_name: nameVal, email: emailVal, phone: phoneVal, password: passVal })
    });
    const data = await res.json();

    if(data.success){
      status.style.color = "#80ff80";
      status.innerText = "Sukurta! Jungiamasi...";
      // Auto login
      await login(emailVal, passVal);
    } else {
      status.innerText = data.error || "Klaida";
      isSubmitting = false;
    }
  } catch(e) {
    status.innerText = "Ryšio klaida. Patikrinkite internetą.";
    isSubmitting = false;
  }
}

// ---------------- LOGIN ----------------
async function login(u, p){
  const user = u || document.getElementById("email").value;
  const pass = p || document.getElementById("password").value;
  const status = u ? document.getElementById("signupStatus") : document.getElementById("loginStatus");

  status.innerText = "Tikrinama...";

  try {
    const res = await fetch(API, {
      method: "POST",
      body: JSON.stringify({ action: "login", email: user, password: pass })
    });
    const data = await res.json();

    if(data.success) {
      // Create 3h session by default
      localStorage.setItem('mathexa_session', JSON.stringify({
        token: data.token,
        expiresAt: Date.now() + (3 * 60 * 60 * 1000),
        permanent: false
      }));
      updateUI(data.clicks_remaining, data.expiry);
      showApp();
    } else {
      status.innerText = data.error || "Neteisingi duomenys";
    }
  } catch(e) { status.innerText = "Klaida"; }
  isSubmitting = false;
}

// ---------------- APP LOGIC ----------------
function updateUI(clicks, expiry) {
  const isSub = expiry && new Date(expiry) > new Date();
  const text = isSub ? "Premium (Neribota)" : `Liko: ${clicks}`;
  document.getElementById("headerClicks").innerText = text;
  document.getElementById("clicksInfo").innerText = "Liko peržiūrų: " + text;
}

function renderVideos() {
  const grid = document.getElementById("videos");
  grid.innerHTML = "";
  const frag = document.createDocumentFragment();

  VIDEOS_DB.forEach(v => {
    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `<h3>${v.title}</h3><p>${v.category} • ${Math.floor(v.length/60)} min</p>`;
    card.onclick = () => handleWatch(v.url);
    frag.appendChild(card);
  });
  grid.appendChild(frag);
}

async function handleWatch(url) {
  const session = JSON.parse(localStorage.getItem('mathexa_session'));
  const res = await fetch(API, { method: "POST", body: JSON.stringify({ action: "watch", token: session.token }) });
  const data = await res.json();

  if(data.allowed) {
    updateUI(data.remaining, data.expiry);
    window.open(url, "_blank");
  } else {
    alert(data.error || "Baigėsi limitas");
  }
}

function show(id){ ["landing","login","signup"].forEach(x=>toggle(x,false)); toggle(id,true); }
function back(){ ["login","signup"].forEach(x=>toggle(x,false)); toggle("landing",true); }
function toggle(id,s){ document.getElementById(id).classList.toggle("hidden",!s); }
function showApp(){ show("none"); toggle("app", true); renderVideos(); }
