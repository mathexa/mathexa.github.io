const API = "https://script.google.com/macros/s/AKfycbwqHsQ88kSO9FdD8En9xepi79t8sL6L-rQ5diy8AtiWxNGFFU6JNm3B9GJpu-IwvS9OoQ/exec";

let token = null;
let clicksRemaining = 0;
let allVideos = [];

// INIT
document.addEventListener("DOMContentLoaded", () => {
  bind();
  restoreSession();
});

// ---------------- SESSION ----------------
async function restoreSession(){
  const raw = localStorage.getItem("session");
  if(!raw) return;

  const saved = JSON.parse(raw);

  if(Date.now() - saved.time > 3*60*60*1000){
    localStorage.removeItem("session");
    return;
  }

  const res = await api({
    action:"validateToken",
    token:saved.token
  });

  if(res.success){
    token = saved.token;
    clicksRemaining = res.clicks_remaining;
    showApp();
    loadVideos();
  } else {
    localStorage.removeItem("session");
  }
}

// ---------------- BIND ----------------
function bind(){
  btnLogin.onclick=()=>show("login");
  btnSignup.onclick=()=>show("signup");

  back1.onclick=back;
  back2.onclick=back;

  loginBtn.onclick=login;
  signupBtn.onclick=signup;

  settingsBtn.onclick=()=>showOnly("settings");
  closeSettings.onclick=()=>showOnly("app");

  applyCodeBtn.onclick=applyCode;

  search.oninput = e=>{
    const q=e.target.value.toLowerCase();
    renderVideos(allVideos.filter(v =>
      v.title.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q)
    ));
  };

  // PASSWORD FEEDBACK
  password2.oninput = ()=>{
    if(password2.value.length < 8){
      passwordFeedback.innerText="Per trumpas";
    } else if(password2.value.length > 24){
      passwordFeedback.innerText="Per ilgas";
    } else {
      passwordFeedback.innerText="Tinkamas";
    }

    matchCheck();
  };

  password3.oninput = matchCheck;

  function matchCheck(){
    matchFeedback.innerText =
      password2.value === password3.value
        ? "Sutampa"
        : "Nesutampa";
  }
}

// ---------------- LOGIN ----------------
async function login(emailOverride, passOverride){

  loginStatus.innerText="Jungiamasi...";

  const emailVal = (emailOverride || email.value).trim();
  const passVal = (passOverride || password.value).trim();

  const res = await api({
    action:"login",
    email: emailVal,
    password: passVal
  });

  if(res.success){
    token = res.token;
    clicksRemaining = res.clicks_remaining;

    if(stayLogin && stayLogin.checked){
      localStorage.setItem("session", JSON.stringify({
        token,
        time: Date.now()
      }));
    }

    showApp();
    loadVideos();
    return;
  }

  // HANDLE ERRORS
  if(res.error.includes("užblokuota")){
    loginStatus.innerText="Paskyra užblokuota";
  } 
  else if(res.error.includes("Bandykite")){
    loginStatus.innerText="Per daug bandymų. Palaukite 15 min";
  } 
  else {
    loginStatus.innerText="Neteisingi duomenys";
  }
}

// ---------------- SIGNUP ----------------
async function signup(){

  if(password2.value !== password3.value){
    alert("Slaptažodžiai nesutampa");
    return;
  }

  const emailVal = email2.value.trim();
  const passVal = password2.value;

  const res = await api({
    action:"signup",
    full_name:name.value,
    email:emailVal,
    phone:prefix.value+phone.value,
    password:passVal,
    role:role.value
  });

  if(res.success){
    alert("Paskyra sukurta");

    // 🔥 FIX: pass values directly
    await login(emailVal, passVal);

  } else {
    alert(res.error);
  }
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
      btn.disabled=true;
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
