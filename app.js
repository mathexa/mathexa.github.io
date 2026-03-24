const API = "https://script.google.com/macros/s/AKfycbxWf86gFL6z0vZG5N4cdgUhR3I9NLmOMAUOpKzNxTK8bXiOWSFSn46WWFafeb4Soa0QZg/exec";

let VIDEOS_DB = [];
let isSubmitting = false;

document.addEventListener("DOMContentLoaded", () => {
  loadPrefixes();
  bindEvents();
  checkSession();
  fetchVideos();
});

async function fetchVideos() {
  try {
    const res = await fetch('videos.json');
    VIDEOS_DB = await res.json();
    if(document.getElementById("app").classList.contains("hidden") === false) renderVideos();
  } catch (e) { console.error("Failed to load videos.json"); }
}

function loadPrefixes(){
  const pref = document.getElementById("prefix");
  // All EU Prefixes (sample set, add more as needed)
  const eu = ["+370","+371","+372","+43","+32","+359","+385","+357","+420","+45","+358","+33","+49","+30","+36","+353","+39","+352","+356","+31","+48","+351","+40","+421","+386","+34","+46"];
  eu.sort().forEach(p => {
    const o = document.createElement("option"); o.value = p; o.innerText = p; pref.appendChild(o);
  });
}

function bindEvents(){
  document.getElementById("btnLogin").onclick = () => show("login");
  document.getElementById("btnSignup").onclick = () => show("signup");
  document.getElementById("back1").onclick = back;
  document.getElementById("back2").onclick = back;
  document.getElementById("settingsBtn").onclick = () => { toggle("app", false); toggle("settings", true); };
  document.getElementById("closeSettings").onclick = () => { toggle("settings", false); toggle("app", true); };
  
  document.getElementById("loginBtn").onclick = () => login();
  document.getElementById("signupBtn").onclick = signup;
  document.getElementById("logoutBtn").onclick = logout;
  
  document.getElementById("clearCacheBtn").onclick = () => {
    localStorage.clear();
    location.reload();
  };

  document.getElementById("stayLoginSettings").onchange = (e) => {
    const session = JSON.parse(localStorage.getItem('mathexa_session'));
    if(session) {
      session.permanent = e.target.checked;
      localStorage.setItem('mathexa_session', JSON.stringify(session));
    }
  };
}

async function checkSession() {
  const session = JSON.parse(localStorage.getItem('mathexa_session'));
  if (!session) return;

  // 3-hour expiry check if NOT permanent
  if (!session.permanent && Date.now() > session.expiresAt) {
    logout();
    return;
  }

  try {
    const res = await fetch(API, { method: "POST", body: JSON.stringify({ action: "validateToken", token: session.token }) });
    const data = await res.json();
    if (data.success) {
      updateUI(data.clicks_remaining, data.expiry, data.support_id);
      showApp();
      document.getElementById("stayLoginSettings").checked = !!session.permanent;
    } else {
        logout();
    }
  } catch(e) { console.error("Session error"); }
}

async function signup(){
  if(isSubmitting) return;
  const status = document.getElementById("signupStatus");
  const nameVal = document.getElementById("name").value.trim();
  const emailVal = document.getElementById("email2").value.trim();
  const phoneVal = document.getElementById("phone").value.trim() ? document.getElementById("prefix").value + document.getElementById("phone").value.trim() : "";
  const passVal = document.getElementById("password2").value;

  if(!nameVal || !emailVal || !passVal) { status.innerText = "Užpildykite laukus"; return; }

  isSubmitting = true;
  status.innerText = "Kuriama...";

  try {
    const res = await fetch(API, {
      method: "POST",
      body: JSON.stringify({ action: "signup", full_name: nameVal, email: emailVal, phone: phoneVal, password: passVal })
    });
    const data = await res.json();
    if(data.success) await login(emailVal, passVal);
    else { status.innerText = data.error; isSubmitting = false; }
  } catch(e) { status.innerText = "Klaida"; isSubmitting = false; }
}

async function login(u, p){
  const user = u || document.getElementById("email").value;
  const pass = p || document.getElementById("password").value;
  const status = u ? document.getElementById("signupStatus") : document.getElementById("loginStatus");

  try {
    const res = await fetch(API, { method: "POST", body: JSON.stringify({ action: "login", email: user, password: pass }) });
    const data = await res.json();

    if(data.success) {
      localStorage.setItem('mathexa_session', JSON.stringify({
        token: data.token,
        expiresAt: Date.now() + (3 * 60 * 60 * 1000),
        permanent: false
      }));
      updateUI(data.clicks_remaining, data.expiry, data.support_id);
      showApp();
    } else { status.innerText = data.error; }
  } catch(e) { status.innerText = "Klaida"; }
}

function updateUI(clicks, expiry, supportId) {
  const isSub = expiry && new Date(expiry) > new Date();
  const text = isSub ? "Premium" : `Liko: ${clicks}`;
  document.getElementById("headerClicks").innerText = text;
  document.getElementById("clicksInfo").innerText = "Liko peržiūrų: " + text;
  document.getElementById("supportIdView").innerText = "Support ID: " + supportId + " (reikės susisiekiant)";
}

function renderVideos() {
  const grid = document.getElementById("videos");
  grid.innerHTML = "";
  VIDEOS_DB.forEach(v => {
    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `<h3>${v.title}</h3><p>${v.category} • ${Math.floor(v.length/60)} min</p>`;
    card.onclick = () => handleWatch(v.url);
    grid.appendChild(card);
  });
}

async function handleWatch(url) {
  const session = JSON.parse(localStorage.getItem('mathexa_session'));
  const res = await fetch(API, { method: "POST", body: JSON.stringify({ action: "watch", token: session.token }) });
  const data = await res.json();

  if(data.allowed) {
    updateUI(data.remaining, data.expiry, ""); // supportId update not needed here
    window.open(url, "_blank");
  } else { alert(data.error || "Baigėsi limitas"); }
}

function logout() { localStorage.removeItem('mathexa_session'); location.reload(); }
function show(id){ ["landing","login","signup"].forEach(x=>toggle(x,false)); toggle(id,true); }
function back(){ show("landing"); }
function toggle(id,s){ document.getElementById(id).classList.toggle("hidden",!s); }
function showApp(){ show("none"); toggle("app", true); renderVideos(); }
