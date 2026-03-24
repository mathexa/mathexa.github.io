const API = "https://script.google.com/macros/s/AKfycbwqHsQ88kSO9FdD8En9xepi79t8sL6L-rQ5diy8AtiWxNGFFU6JNm3B9GJpu-IwvS9OoQ/exec";

// Your video DB (I truncated it slightly here for brevity, paste your full 50 videos here)
const VIDEOS_DB = [
  { "id":"1","title":"Algebra Basics 1","category":"algebra","url":"https://youtube.com","platform":"YouTube","length":300 },
  { "id":"2","title":"Algebra Basics 2","category":"algebra","url":"https://youtube.com","platform":"YouTube","length":420 },
  { "id":"3","title":"Algebra Basics 3","category":"algebra","url":"https://youtube.com","platform":"YouTube","length":360 },
  { "id":"4","title":"Algebra Basics 4","category":"algebra","url":"https://youtube.com","platform":"YouTube","length":280 },
  { "id":"5","title":"Algebra Basics 5","category":"algebra","url":"https://youtube.com","platform":"YouTube","length":500 }
  // ... Paste the rest of your video array here
];

let isSubmitting = false;
let currentClicks = "--";

// ---------------- ANONYMOUS CRASH LOGGING ----------------
window.onerror = function(message, source, lineno, colno, error) {
  fetch(API, { method: "POST", body: JSON.stringify({ action: "crash_log", message: `${message} (Line: ${lineno})` }) }).catch(()=>{});
  return false;
};
window.onunhandledrejection = function(event) {
  fetch(API, { method: "POST", body: JSON.stringify({ action: "crash_log", message: "Promise: " + event.reason }) }).catch(()=>{});
};

// ---------------- INIT & SESSION ----------------
document.addEventListener("DOMContentLoaded", () => {
  loadPrefixes();
  bind();
  checkSession();
});

async function checkSession() {
  const sessionData = JSON.parse(localStorage.getItem('mathexa_session'));
  if (!sessionData) return;

  if (Date.now() > sessionData.expiresAt) {
    localStorage.removeItem('mathexa_session');
    return;
  }

  try {
    const res = await fetch(API, {
      method: "POST", body: JSON.stringify({ action: "validateToken", token: sessionData.token })
    });
    const data = await res.json();
    if (data.success) {
      updateClicksUI(data.clicks_remaining, data.expiry);
      showApp();
    } else {
      localStorage.removeItem('mathexa_session');
    }
  } catch(e) { console.warn("Session check failed."); }
}

function loadPrefixes(){
  ["+370","+371","+372"].forEach(p=>{
    const o=document.createElement("option"); o.value=p; o.innerText=p; prefix.appendChild(o);
  });
}

function bind(){
  btnLogin.onclick=()=>show("login");
  btnSignup.onclick=()=>show("signup");
  back1.onclick=back; back2.onclick=back;
  
  loginBtn.onclick=() => login();
  signupBtn.onclick=signup;
  
  settingsBtn.onclick=() => { toggle("app", false); toggle("settings", true); };
  closeSettings.onclick=() => { toggle("settings", false); toggle("app", true); };
  logoutBtn.onclick=() => { localStorage.removeItem('mathexa_session'); location.reload(); };

  password2.oninput = ()=> passwordFeedback.innerText = password2.value.length < 8 ? "Per trumpas" : "Tinkamas";
  password3.oninput = ()=> matchFeedback.innerText = password2.value === password3.value ? "Sutampa" : "Nesutampa";
}

// ---------------- AUTHENTICATION ----------------
async function signup(){
  if(isSubmitting) return;
  isSubmitting = true;
  signupStatus.innerText = "Kuriama paskyra...";

  const full_name = name.value.trim();
  const emailVal = email2.value.trim();
  const phoneVal = prefix.value + phone.value.trim();
  const pass = password2.value;

  if(!full_name || !emailVal || !phoneVal || !pass){
    signupStatus.innerText = "Užpildykite visus laukus";
    isSubmitting = false; return;
  }
  if(pass !== password3.value){
    signupStatus.innerText = "Slaptažodžiai nesutampa";
    isSubmitting = false; return;
  }

  try {
    const res = await fetch(API,{ method:"POST", body: JSON.stringify({ action:"signup", full_name, email:emailVal, phone:phoneVal, password:pass }) });
    const data = await res.json();

    if(data.success){
      signupStatus.style.color="#80ff80";
      signupStatus.innerText="Sukurta, jungiamasi...";
      await login(emailVal, pass, true); // Force stay-logged in on signup
    } else {
      signupStatus.innerText = data.error || "Serverio klaida";
    }
  } catch (e){ signupStatus.innerText = "Ryšio klaida"; }
  isSubmitting = false;
}

async function login(emailOverride, passOverride, forceStayLogin = false){
  const statusEl = (emailOverride) ? signupStatus : loginStatus;
  statusEl.innerText = "Jungiamasi...";

  try {
    const res = await fetch(API,{
      method:"POST", body: JSON.stringify({ action:"login", email:(emailOverride || email.value), password:(passOverride || password.value) })
    });
    const data = await res.json();

    if(data.success){
      const loginCheck = document.getElementById('stayLogin');
      const shouldStay = forceStayLogin || (loginCheck && loginCheck.checked);
      
      if(shouldStay) {
        localStorage.setItem('mathexa_session', JSON.stringify({ token: data.token, expiresAt: Date.now() + (3*60*60*1000) }));
      }
      
      updateClicksUI(data.clicks_remaining, data.expiry);
      showApp();
    } else { statusEl.innerText=data.error || "Klaida"; }
  } catch(e){ statusEl.innerText="Ryšio klaida"; }
}

// ---------------- APP & VIDEO LOGIC ----------------
function updateClicksUI(clicks, expiry) {
  let display = expiry && new Date(expiry) > new Date() ? "Neribota" : clicks;
  document.getElementById("headerClicks").innerText = `Limitas: ${display}`;
  document.getElementById("clicksInfo").innerText = `Liko peržiūrų: ${display}`;
}

function renderVideos() {
  const container = document.getElementById('videos');
  container.innerHTML = ""; 
  
  // Use DocumentFragment so we don't freeze the DOM drawing 50+ items
  const fragment = document.createDocumentFragment();

  VIDEOS_DB.forEach(vid => {
    const card = document.createElement("div");
    card.className = "video-card";
    card.innerHTML = `
      <h3>${vid.title}</h3>
      <div class="video-meta">
        <span>${vid.category.toUpperCase()}</span>
        <span>${Math.floor(vid.length / 60)} min</span>
      </div>
    `;
    
    card.onclick = () => handleVideoClick(vid.url);
    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

async function handleVideoClick(url) {
  const sessionData = JSON.parse(localStorage.getItem('mathexa_session'));
  if(!sessionData) return alert("Prašome prisijungti.");

  const prevText = document.getElementById("headerClicks").innerText;
  document.getElementById("headerClicks").innerText = "Kraunama...";

  try {
    const res = await fetch(API, {
      method:"POST", body: JSON.stringify({ action: "watch", token: sessionData.token })
    });
    const data = await res.json();

    if(data.allowed) {
      updateClicksUI(data.remaining, null);
      window.open(url, "_blank"); // Open video
    } else {
      document.getElementById("headerClicks").innerText = prevText;
      alert(data.error || "Baigėsi limitas!");
    }
  } catch(e) {
    document.getElementById("headerClicks").innerText = prevText;
    alert("Klaida susisiekiant su serveriu.");
  }
}

// ---------------- NAV ----------------
function show(id){ ["landing","login","signup"].forEach(x=>toggle(x,false)); toggle(id,true); }
function back(){ ["login","signup"].forEach(x=>toggle(x,false)); toggle("landing",true); }
function toggle(id,show){ document.getElementById(id).classList.toggle("hidden",!show); }

function showApp(){
  toggle("landing",false); toggle("login",false); toggle("signup",false); toggle("app",true);
  renderVideos();
}
