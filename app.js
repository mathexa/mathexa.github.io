const API = "https://script.google.com/macros/s/AKfycbwqHsQ88kSO9FdD8En9xepi79t8sL6L-rQ5diy8AtiWxNGFFU6JNm3B9GJpu-IwvS9OoQ/exec";

let token = null;
let clicksRemaining = 0;
let supportId = null;
let allVideos = [];

// INIT
document.addEventListener("DOMContentLoaded", () => {
  loadPrefixes();
  bind();
  restoreSession();
});

// PREFIXES
function loadPrefixes(){
  const list = ["+370","+371","+372","+49","+33","+34","+39","+48","+31","+32","+43","+45","+46","+47","+358","+353","+420","+421","+386","+385","+36","+40","+359","+30","+357","+356","+351","+352","+354"];

  list.forEach(p=>{
    const o=document.createElement("option");
    o.value=p;
    o.innerText=p;
    prefix.appendChild(o);
  });
}

// SESSION
async function restoreSession(){
  const raw = localStorage.getItem("session");
  if(!raw) return;

  const saved = JSON.parse(raw);

  if(Date.now() - saved.time > 3*60*60*1000){
    localStorage.removeItem("session");
    return;
  }

  const res = await api({ action:"validateToken", token:saved.token });

  if(res.success){
    token = saved.token;
    clicksRemaining = res.clicks_remaining;
    supportId = res.support_id;

    showApp();
    updateClicksUI();
    loadVideos();
  } else {
    localStorage.removeItem("session");
  }
}

// BIND
function bind(){
  btnLogin.onclick=()=>show("login");
  btnSignup.onclick=()=>show("signup");

  back1.onclick=back;
  back2.onclick=back;

  loginBtn.onclick=login;
  signupBtn.onclick=signup;

  settingsBtn.onclick=openSettings;
  closeSettings.onclick=()=>showOnly("app");

  applyCodeBtn.onclick=applyCode;

  stayLoginSettings.onchange = ()=>{
    if(!stayLoginSettings.checked){
      localStorage.removeItem("session");
    }
  };

  search.oninput = e=>{
    const q=e.target.value.toLowerCase();
    renderVideos(allVideos.filter(v =>
      v.title.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q)
    ));
  };

  password2.oninput = ()=>{
    passwordFeedback.innerText =
      password2.value.length < 8 ? "Per trumpas" : "Tinkamas";
  };

  password3.oninput = ()=>{
    matchFeedback.innerText =
      password2.value === password3.value ? "Sutampa" : "Nesutampa";
  };
}

// LOGIN
async function login(emailOverride, passOverride){
  loginStatus.innerText="Jungiamasi...";

  const emailVal = (emailOverride || email.value).trim();
  const passVal = (passOverride || password.value).trim();

  const res = await api({
    action:"login",
    email:emailVal,
    password:passVal
  });

  if(res.success){
    token = res.token;
    clicksRemaining = res.clicks_remaining;
    supportId = res.support_id;

    if(stayLogin && stayLogin.checked){
      localStorage.setItem("session", JSON.stringify({
        token,
        time: Date.now()
      }));
      stayLoginSettings.checked = true;
    }

    showApp();
    updateClicksUI();
    loadVideos();
    return;
  }

  loginStatus.innerText = res.error;
}

// SIGNUP
async function signup(){
  if(password2.value !== password3.value){
    alert("Slaptažodžiai nesutampa");
    return;
  }

  const res = await api({
    action:"signup",
    full_name:name.value, // ✅ FIXED
    email:email2.value.trim(),
    phone:prefix.value+phone.value,
    password:password2.value,
    role:role.value
  });

  if(res.success){
    await login(email2.value, password2.value);
  } else {
    alert(res.error);
  }
}

// SETTINGS
function openSettings(){
  clicksInfo.innerText =
    clicksRemaining > 1000 ? "Peržiūros: ∞" : "Liko: " + clicksRemaining;

  supportBox.innerText = "ID: " + supportId;

  showOnly("settings");
}

// APPLY CODE
async function applyCode(){
  const res = await api({
    action:"applyCode",
    code:codeInput.value,
    token
  });

  if(res.success){
    clicksRemaining = 99999;
    updateClicksUI();
    loadVideos();
  } else {
    alert(res.error);
  }
}

// CLICK UI
function updateClicksUI(){
  if(clicksRemaining <= 3){
    lowClicks.classList.remove("hidden");
    lowClicks.innerText = "Liko peržiūrų: " + clicksRemaining;
  } else {
    lowClicks.classList.add("hidden");
  }
}

// VIDEOS
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
    updateClicksUI();

    tab.location.href = v.url;
  };

  d.appendChild(btn);
  return d;
}

// API
async function api(data){
  const res = await fetch(API,{
    method:"POST",
    body:JSON.stringify(data)
  });
  return res.json();
}

// NAV
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
