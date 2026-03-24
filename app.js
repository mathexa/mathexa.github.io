const API = "https://script.google.com/macros/s/AKfycbwOWGjM7tkAiwbuhtCziAGjubYERxrZV8FW-pk76GR2BH2RnMeuILCQOuFXv87zFrDM1w/exec";

let token = null;
let clicksRemaining = 0;
let allVideos = [];
let supportId = null;

const SESSION_LIMIT = 3 * 60 * 60 * 1000; // 3h

// INIT
document.addEventListener("DOMContentLoaded", () => {
  bind();
  restoreSession();
});

// ---------------- SESSION ----------------

async function restoreSession(){
  const raw = localStorage.getItem("session");

  if(!raw) return;

  try {
    const saved = JSON.parse(raw);

    // expired → clear
    if(Date.now() - saved.time > SESSION_LIMIT){
      localStorage.removeItem("session");
      return;
    }

    // validate token with backend
    const res = await api({
      action: "validateToken",
      token: saved.token
    });

    if(res.success){
      token = saved.token;
      clicksRemaining = res.clicks_remaining;
      supportId = res.support_id || null;

      showApp();
      loadVideos();
    } else {
      localStorage.removeItem("session");
    }

  } catch {
    localStorage.removeItem("session");
  }
}

// ---------------- BIND ----------------

function bind(){
  const el=id=>document.getElementById(id);

  el("btnLogin").onclick=()=>show("login");
  el("btnSignup").onclick=()=>show("signup");

  el("back1").onclick=back;
  el("back2").onclick=back;

  el("loginBtn").onclick=login;
  el("signupBtn").onclick=signup;

  el("applyCodeBtn").onclick=applyCode;
  el("settingsBtn").onclick=()=>showOnly("settings");
  el("closeSettings").onclick=()=>showOnly("app");

  // PASSWORD realtime
  el("password2").addEventListener("input", ()=>{
    const v = el("password2").value;

    if(v.length < 8){
      passwordFeedback.innerText="Per trumpas";
    } else if(v.length > 24){
      passwordFeedback.innerText="Per ilgas";
    } else {
      passwordFeedback.innerText="Tinkamas";
    }

    matchCheck();
  });

  el("password3").addEventListener("input", matchCheck);

  function matchCheck(){
    matchFeedback.innerText =
      password2.value === password3.value
        ? "Sutampa"
        : "Nesutampa";
  }

  // SEARCH
  el("search").oninput = (e)=>{
    const q = e.target.value.toLowerCase();

    renderVideos(allVideos.filter(v =>
      v.title.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q)
    ));
  };

  // SIMPLE UI
  el("simpleUI").onchange = (e)=>{
    document.body.classList.toggle("simple", e.target.checked);
    localStorage.setItem("simpleUI", e.target.checked);
  };

  if(localStorage.getItem("simpleUI")==="true"){
    document.body.classList.add("simple");
    el("simpleUI").checked = true;
  }
}

// ---------------- VALIDATION ----------------

function validEmail(email){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------- LOGIN ----------------

let loginLock = false;

async function login(emailOverride, passOverride){
  if(loginLock) return;
  loginLock = true;

  const emailVal = (emailOverride || email.value).trim();
  const passVal = (passOverride || password.value).trim();

  if(!validEmail(emailVal)){
    loginStatus.innerText="Neteisingas el. paštas";
    loginLock = false;
    return;
  }

  loginStatus.innerText="Jungiamasi...";

  const res = await api({
    action:"login",
    email: emailVal,
    password: passVal
  });

  if(res.success){
    token = res.token;
    clicksRemaining = res.clicks_remaining;
    supportId = res.support_id || null;

    if(stayLogin?.checked){
      localStorage.setItem("session", JSON.stringify({
        token,
        time: Date.now()
      }));
    }

    showApp();
    loadVideos();
  } else {
    loginStatus.innerText = res.error || "Klaida";
  }

  loginLock = false;
}

// ---------------- SIGNUP ----------------

let signupLock = false;

async function signup(){
  if(signupLock) return;
  signupLock = true;

  const emailVal = email2.value.trim();
  const passVal = password2.value;

  if(!validEmail(emailVal)){
    alert("Neteisingas el. paštas");
    signupLock = false;
    return;
  }

  if(passVal !== password3.value){
    alert("Slaptažodžiai nesutampa");
    signupLock = false;
    return;
  }

  const res = await api({
    action:"signup",
    full_name:name.value,
    email:emailVal,
    phone:prefix.value+phone.value,
    password:passVal,
    role:role.value
  });

  if(res.success){
    supportId = res.support_id;
    alert("Jūsų ID: " + supportId);

    // AUTO LOGIN (important)
    await login(emailVal, passVal);

  } else {
    alert(res.error || "Klaida");
  }

  signupLock = false;
}

// ---------------- APPLY CODE ----------------

async function applyCode(){
  const res = await api({
    action:"applyCode",
    code:codeInput.value,
    token
  });

  if(res.success){
    clicksRemaining = 99999;
    alert("Aktyvuota");
    loadVideos();
  } else {
    alert(res.error);
  }
}

// ---------------- VIDEOS ----------------

async function loadVideos(){
  videos.innerHTML="Kraunama...";
  allVideos = await fetch("videos.json").then(r=>r.json());
  renderVideos(allVideos);
}

function renderVideos(list){
  videos.innerHTML="";
  let i=0;

  function chunk(){
    for(let j=0;j<10 && i<list.length;j++,i++){
      videos.appendChild(makeCard(list[i]));
    }
    if(i<list.length){
      requestAnimationFrame(chunk);
    }
  }

  chunk();
}

function makeCard(v){
  const d=document.createElement("div");
  d.className="videoCard";

  d.innerHTML=`
    <b>${v.title}</b>
    <div>${v.category}</div>
    <div>${v.platform}</div>
  `;

  const btn=document.createElement("button");
  btn.innerText="Atidaryti";

  btn.onclick=async ()=>{
    const tab = window.open("", "_blank");
    tab.document.write("Kraunama...");

    const r = await api({ action:"watch", token });

    if(!r.allowed){
      tab.document.body.innerHTML="Limitas pasiektas";
      btn.disabled = true;
      return;
    }

    clicksRemaining = r.remaining;
    tab.location.href = v.url;
  };

  d.appendChild(btn);
  return d;
}

// ---------------- API ----------------

async function api(data){
  const res = await fetch(API,{
    method:"POST",
    body:JSON.stringify(data)
  });
  return res.json();
}

// ---------------- NAV ----------------

function show(id){
  ["landing","login","signup"].forEach(x=>toggle(x,false));
  toggle(id,true);
}

function showOnly(id){
  ["app","settings"].forEach(x=>toggle(x,false));
  toggle(id,true);
}

function back(){
  ["login","signup","settings"].forEach(x=>toggle(x,false));
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
