const API = "https://script.google.com/macros/s/AKfycbwqHsQ88kSO9FdD8En9xepi79t8sL6L-rQ5diy8AtiWxNGFFU6JNm3B9GJpu-IwvS9OoQ/exec";

let isSubmitting = false;

// ---------------- ANONYMOUS CRASH LOGGING ----------------
window.onerror = function(message, source, lineno, colno, error) {
  const anonymousLog = `${message} (Line: ${lineno})`;
  fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "crash_log", message: anonymousLog })
  }).catch(() => {}); // Fail silently
  return false;
};

window.onunhandledrejection = function(event) {
  fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "crash_log", message: "Unhandled Promise: " + event.reason })
  }).catch(() => {});
};

// ---------------- INIT & SESSION CHECK ----------------
document.addEventListener("DOMContentLoaded", () => {
  loadPrefixes();
  bind();
  checkSession();
});

async function checkSession() {
  const sessionData = JSON.parse(localStorage.getItem('mathexa_session'));
  if (!sessionData) return;

  // Check if 3 hours have passed
  if (Date.now() > sessionData.expiresAt) {
    localStorage.removeItem('mathexa_session');
    return;
  }

  // Validate existing token silently
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "validateToken", token: sessionData.token })
    });
    const data = await res.json();
    
    if (data.success) {
      showApp();
    } else {
      localStorage.removeItem('mathexa_session');
    }
  } catch(e) {
    console.warn("Could not validate session on load.");
  }
}

function loadPrefixes(){
  ["+370","+371","+372"].forEach(p=>{
    const o=document.createElement("option");
    o.value=p;
    o.innerText=p;
    prefix.appendChild(o);
  });
}

function bind(){
  btnLogin.onclick=()=>show("login");
  btnSignup.onclick=()=>show("signup");

  back1.onclick=back;
  back2.onclick=back;

  loginBtn.onclick=() => login();
  signupBtn.onclick=signup;

  password2.oninput = ()=>{
    passwordFeedback.innerText =
      password2.value.length < 8 ? "Per trumpas" : "Tinkamas";
  };

  password3.oninput = ()=>{
    matchFeedback.innerText =
      password2.value === password3.value ? "Sutampa" : "Nesutampa";
  };
}

// ---------------- SIGNUP ----------------
async function signup(){
  if(isSubmitting) return;
  isSubmitting = true;
  signupStatus.innerText = "Kuriama paskyra...";

  const full_name = name.value.trim();
  const emailVal = email2.value.trim();
  const phoneVal = prefix.value + phone.value.trim();
  const pass = password2.value;
  const roleVal = role.value;

  if(!full_name || !emailVal || !phoneVal || !pass){
    signupStatus.innerText = "Užpildykite visus laukus";
    isSubmitting = false;
    return;
  }

  if(pass !== password3.value){
    signupStatus.innerText = "Slaptažodžiai nesutampa";
    isSubmitting = false;
    return;
  }

  try {
    const res = await fetch(API,{
      method:"POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action:"signup",
        full_name,
        email:emailVal,
        phone:phoneVal,
        password:pass,
        role:roleVal
      })
    });

    const data = await res.json();

    if(data.success){
      signupStatus.style.color="#80ff80";
      signupStatus.innerText="Sukurta, jungiamasi...";
      // Force "stay logged in" checked for brand new users optionally
      document.getElementById('stayLogin').checked = true;
      await login(emailVal, pass);
    } else {
      signupStatus.innerText = data.error || "Serverio klaida";
    }
  } catch (e){
    signupStatus.innerText = "Ryšio klaida (API neveikia)";
  }

  isSubmitting = false;
}

// ---------------- LOGIN ----------------
async function login(emailOverride, passOverride){
  // Check which DOM element to use to show status
  const statusEl = (emailOverride) ? signupStatus : loginStatus;
  statusEl.innerText = "Jungiamasi...";

  try {
    const res = await fetch(API,{
      method:"POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action:"login",
        email:(emailOverride || email.value),
        password:(passOverride || password.value)
      })
    });

    const data = await res.json();

    if(data.success){
      // Token logic - 3 Hours (10800000 milliseconds)
      const shouldStay = document.getElementById('stayLogin').checked || emailOverride; 
      
      if(shouldStay) {
        const expiresAt = Date.now() + (3 * 60 * 60 * 1000);
        localStorage.setItem('mathexa_session', JSON.stringify({
          token: data.token,
          expiresAt: expiresAt
        }));
      }

      showApp();
    } else {
      statusEl.innerText=data.error || "Klaida";
    }

  } catch(e){
    statusEl.innerText="Ryšio klaida";
  }
}

// ---------------- NAV ----------------
function show(id){
  ["landing","login","signup"].forEach(x=>toggle(x,false));
  toggle(id,true);
}
function back(){
  ["login","signup"].forEach(x=>toggle(x,false));
  toggle("landing",true);
}
function toggle(id,show){
  document.getElementById(id).classList.toggle("hidden",!show);
}
function showApp(){
  toggle("landing",false);
  toggle("login",false);
  toggle("signup",false);
  toggle("app",true);
}
