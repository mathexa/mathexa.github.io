const API = "https://script.google.com/macros/s/AKfycbwOWGjM7tkAiwbuhtCziAGjubYERxrZV8FW-pk76GR2BH2RnMeuILCQOuFXv87zFrDM1w/exec";

let token = null;
let clicksRemaining = 0;
let allVideos = [];
let supportId = null;

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {

  // EU prefixes
  const prefixes = ["+370","+371","+372","+49","+33","+34","+39","+48","+31","+32","+43","+45","+46","+47","+358","+353","+420","+421","+386","+385","+36","+40","+359","+30","+357","+356","+351","+352","+354","+423","+377"];
  const p = document.getElementById("prefix");
  prefixes.forEach(x=>{
    const o=document.createElement("option");
    o.value=x; o.innerText=x;
    p.appendChild(o);
  });

  bind();

  // restore simple mode
  if(localStorage.getItem("simpleUI")==="true"){
    document.body.classList.add("simple");
    document.getElementById("simpleUI").checked = true;
  }

  // restore session (token only, 3h)
  const saved = JSON.parse(localStorage.getItem("session") || "null");
  if(saved){
    if(Date.now() - saved.time < 3*60*60*1000){
      token = saved.token;
      showApp();
      loadVideos();
    } else {
      localStorage.removeItem("session");
      alert("Sesija baigėsi");
    }
  }
});

// ===== BIND =====
function bind(){
  const el=id=>document.getElementById(id);

  el("btnLogin").onclick=()=>show("login");
  el("btnSignup").onclick=()=>show("signup");

  el("back1").onclick=back;
  el("back2").onclick=back;

  el("loginBtn").onclick=login;
  el("signupBtn").onclick=signup;

  el("applyCodeBtn").onclick=applyCode;
  el("settingsBtn").onclick=openSettings;
  el("closeSettings").onclick=()=>showOnly("app");

  // ===== PASSWORD REALTIME =====
  el("password2").addEventListener("input", ()=>{
    const v = el("password2").value;
    const fb = el("passwordFeedback");

    if(v.length === 0){
      fb.innerText = "";
    } else if(v.length < 8){
      fb.innerText = "Per trumpas";
    } else if(v.length > 24){
      fb.innerText = "Per ilgas";
    } else {
      fb.innerText = "Tinkamas";
    }

    // also update match in real time
    checkMatch();
  });

  el("password3").addEventListener("input", checkMatch);

  function checkMatch(){
    const p1 = el("password2").value;
    const p2 = el("password3").value;
    const fb = el("matchFeedback");

    if(p2.length === 0){
      fb.innerText = "";
    } else if(p1 === p2){
      fb.innerText = "Sutampa";
    } else {
      fb.innerText = "Nesutampa";
    }
  }

  // ===== SEARCH =====
  el("search").oninput = (e)=>{
    const q=e.target.value.toLowerCase();
    renderVideos(allVideos.filter(v =>
      v.title.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q)
    ));
  };

  // ===== SETTINGS =====
  el("toggleSupport").onclick=()=>{
    const box = el("supportBox");
    box.classList.toggle("hidden");
    box.innerText = supportId || "Nėra";
  };

  el("simpleUI").onchange = (e)=>{
    document.body.classList.toggle("simple", e.target.checked);
    localStorage.setItem("simpleUI", e.target.checked);
  };

  el("stayLogin").onchange = (e)=>{
    if(!e.target.checked){
      localStorage.removeItem("session");
    }
  };
}

// ===== NAV =====
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

// ===== LOGIN =====
async function login(emailOverride, passOverride){
  const emailVal = emailOverride || document.getElementById("email").value;
  const passVal = passOverride || document.getElementById("password").value;

  const status = document.getElementById("loginStatus");
  status.innerText = "Jungiamasi...";

  const res = await api({
    action:"login",
    email: emailVal,
    password: passVal
  });

  if(res.success){
    token = res.token;
    clicksRemaining = res.clicks_remaining;
    supportId = res.support_id || null;

    if(document.getElementById("stayLogin").checked){
      localStorage.setItem("session", JSON.stringify({
        token,
        time: Date.now()
      }));
    }

    showApp();
    loadVideos();
  } else {
    status.innerText = res.error;
  }
}

// ===== SIGNUP (FIXED AUTO LOGIN) =====
async function signup(){
  const nameVal = document.getElementById("name").value;
  const emailVal = document.getElementById("email2").value;
  const passVal = document.getElementById("password2").value;
  const pass2 = document.getElementById("password3").value;

  if(!nameVal || !emailVal || !passVal){
    alert("Užpildykite visus laukus");
    return;
  }

  if(passVal !== pass2){
    alert("Slaptažodžiai nesutampa");
    return;
  }

  const res = await api({
    action:"signup",
    full_name: nameVal,
    email: emailVal,
    phone: document.getElementById("prefix").value + document.getElementById("phone").value,
    password: passVal,
    role: document.getElementById("role").value
  });

  if(res.success){
    supportId = res.support_id || null;

    alert("Jūsų paskyros ID: " + supportId);

    // ✅ FIX: login with SAME credentials
    await login(emailVal, passVal);

  } else {
    alert(res.error);
  }
}

// ===== SETTINGS =====
function openSettings(){
  const el=document.getElementById("clicksInfo");

  el.innerText =
    clicksRemaining > 1000
      ? "Peržiūros: ∞"
      : "Liko: " + clicksRemaining;

  showOnly("settings");
}

// ===== APPLY CODE =====
async function applyCode(){
  const res = await api({
    action:"applyCode",
    code:document.getElementById("codeInput").value,
    token
  });

  if(res.success){
    alert("Aktyvuota");
    clicksRemaining = 99999;
    loadVideos();
  } else {
    alert(res.error);
  }
}

// ===== LOAD VIDEOS =====
async function loadVideos(){
  const container = document.getElementById("videos");
  container.innerHTML="Kraunama...";

  allVideos = await fetch("videos.json").then(r=>r.json());
  renderVideos(allVideos);
}

// ===== RENDER (NO FREEZE) =====
function renderVideos(list){
  const container=document.getElementById("videos");
  container.innerHTML="";

  let i=0;

  function chunk(){
    for(let j=0;j<10 && i<list.length;j++,i++){
      container.appendChild(card(list[i]));
    }
    if(i<list.length){
      requestAnimationFrame(chunk);
    }
  }

  chunk();
}

// ===== CARD =====
function card(v){
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

    if(!tab){
      alert("Popup užblokuotas");
      return;
    }

    tab.document.write("Kraunama...");

    const r = await api({ action:"watch", token });

    if(!r.allowed){
      tab.document.body.innerHTML="Limitas pasiektas";
      btn.disabled=true;
      return;
    }

    clicksRemaining = r.remaining;
    tab.location.href = v.url;
  };

  d.appendChild(btn);
  return d;
}

// ===== API =====
async function api(data){
  const res = await fetch(API,{
    method:"POST",
    body:JSON.stringify(data)
  });
  return res.json();
}

// ===== SHOW APP =====
function showApp(){
  toggle("landing",false);
  toggle("login",false);
  toggle("signup",false);
  toggle("app",true);
}
