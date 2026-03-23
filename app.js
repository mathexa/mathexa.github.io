const API = "https://script.google.com/macros/s/AKfycbznzEG3Y89F0mrA8NxxMne5C-UCPJAu1Ru-neMVnUZWf7qIlPQVlZV3UUnDDj9G0J9Xmw/exec";

let token = null;
let clicksRemaining = 0;
let subscriptionExpiry = null;
let allVideos = [];

// EMAIL VALIDATION
function validEmail(e){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// PREFIXES
const prefixes = [
  "+370","+371","+372","+49","+33","+34","+39","+48","+31","+32","+43",
  "+45","+46","+47","+358","+353","+420","+421","+386","+385","+36",
  "+40","+359","+30","+357","+356","+351","+352","+354","+423","+377"
];

// INIT
document.addEventListener("DOMContentLoaded", () => {

  const p = document.getElementById("prefix");
  prefixes.forEach(x=>{
    const o=document.createElement("option");
    o.value=x;
    o.innerText=x;
    p.appendChild(o);
  });

  bind();
});

// BIND
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

  el("search").oninput=(e)=>{
    const q=e.target.value.toLowerCase();

    const filtered=allVideos.filter(v =>
      v.title.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q)
    );

    renderVideos(filtered);
  };

  // password feedback
  el("password2").oninput=()=>{
    const v=el("password2").value;
    document.getElementById("passwordFeedback").innerText =
      v.length<8?"Per trumpas":
      v.length>24?"Per ilgas":"Tinkamas";
  };

  el("password3").oninput=()=>{
    document.getElementById("matchFeedback").innerText =
      el("password2").value===el("password3").value
        ? "Sutampa" : "Nesutampa";
  };
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

// SIGNUP + AUTO LOGIN
async function signup(){
  const name=document.getElementById("name").value;
  const email=document.getElementById("email2").value;
  const pass=document.getElementById("password2").value;
  const pass2=document.getElementById("password3").value;

  if(!name||!email||!pass) return alert("Užpildykite visus laukus");
  if(!validEmail(email)) return alert("Neteisingas el. paštas");
  if(pass!==pass2) return alert("Slaptažodžiai nesutampa");

  const phone=document.getElementById("prefix").value +
              document.getElementById("phone").value;

  const res=await api({
    action:"signup",
    full_name:name,
    email,
    phone,
    password:pass,
    role:document.getElementById("role").value
  });

  if(!res.success){
    alert(res.error);
    return;
  }

  // AUTO LOGIN
  const loginRes = await api({
    action:"login",
    email,
    password:pass
  });

  if(loginRes.success){
    token=loginRes.token;
    clicksRemaining=loginRes.clicks_remaining;

    toggle("signup",false);
    toggle("app",true);

    loadVideos();
  }
}

// LOGIN
async function login(){
  const el=id=>document.getElementById(id);
  el("loginStatus").innerText="Jungiamasi...";

  const res=await api({
    action:"login",
    email:el("email").value,
    password:el("password").value
  });

  if(res.success){
    token=res.token;
    clicksRemaining=res.clicks_remaining;

    toggle("login",false);
    toggle("app",true);

    loadVideos();
  }else{
    el("loginStatus").innerText=res.error;
  }
}

// SETTINGS (SHOW CLICKS)
function openSettings(){
  const el=document.getElementById("clicksInfo");

  el.innerText =
    clicksRemaining > 1000
      ? "Peržiūros: ∞ (neribota)"
      : "Liko peržiūrų: " + clicksRemaining;

  showOnly("settings");
}

// APPLY CODE
async function applyCode(){
  const code=document.getElementById("codeInput").value;

  const res=await api({
    action:"applyCode",
    code,
    token
  });

  if(res.success){
    alert("Aktyvuota");
    clicksRemaining=99999;
    loadVideos();
  } else {
    alert("Neteisingas kodas");
  }
}

// LOAD VIDEOS
async function loadVideos(){
  const container=document.getElementById("videos");
  container.innerHTML="Kraunama...";

  allVideos = await fetch("videos.json").then(r=>r.json());
  renderVideos(allVideos);
}

// RENDER
function renderVideos(list){
  const container=document.getElementById("videos");
  container.innerHTML="";

  let i=0;

  function renderChunk(){
    for(let j=0;j<10 && i<list.length;j++,i++){
      container.appendChild(createCard(list[i]));
    }
    if(i<list.length){
      requestAnimationFrame(renderChunk);
    }
  }

  renderChunk();
}

// CARD (mobile safe)
function createCard(v){
  const d=document.createElement("div");
  d.className="videoCard";

  const min=Math.floor(v.length/60);
  const sec=(v.length%60).toString().padStart(2,"0");

  d.innerHTML=`
    <b>${v.title}</b>
    <div>Kategorija: ${v.category}</div>
    <div>Platforma: ${v.platform}</div>
    <div>Trukmė: ${min}:${sec}</div>
  `;

  const btn=document.createElement("button");
  btn.innerText="Atidaryti";

  btn.onclick = async () => {
    const newTab = window.open("", "_blank");

    if (!newTab) {
      alert("Popup užblokuotas");
      return;
    }

    newTab.document.write("Kraunama...");

    const r = await api({ action: "watch", token });

    if (!r.allowed) {
      newTab.document.body.innerHTML = "Limitas pasiektas";
      btn.disabled = true;
      btn.innerText = "Limitas";
      return;
    }

    clicksRemaining = r.remaining;
    newTab.location.href = v.url;
  };

  d.appendChild(btn);
  return d;
}

// API
async function api(data){
  const res=await fetch(API,{
    method:"POST",
    body:JSON.stringify(data)
  });
  return res.json();
}
