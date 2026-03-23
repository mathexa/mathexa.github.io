const API = "https://script.google.com/macros/s/AKfycbznzEG3Y89F0mrA8NxxMne5C-UCPJAu1Ru-neMVnUZWf7qIlPQVlZV3UUnDDj9G0J9Xmw/exec";

let token = null;
let clicksRemaining = 0;
let subscriptionExpiry = null;

// ===== EMAIL VALIDATION =====
function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// ===== EU PREFIXES =====
const prefixes = [
  "+370","+371","+372","+49","+33","+34","+39","+48","+31","+32","+43",
  "+45","+46","+47","+358","+353","+420","+421","+386","+385","+36",
  "+40","+359","+30","+357","+356","+351","+352","+354","+423","+377"
];

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  const prefixEl = document.getElementById("prefix");
  prefixes.forEach(p=>{
    const o=document.createElement("option");
    o.value=p;
    o.innerText=p;
    prefixEl.appendChild(o);
  });

  bind();
});

// ===== BIND =====
function bind() {
  const el=id=>document.getElementById(id);

  el("btnLogin").onclick=()=>show("login");
  el("btnSignup").onclick=()=>show("signup");
  el("back1").onclick=back;
  el("back2").onclick=back;

  el("loginBtn").onclick=login;
  el("signupBtn").onclick=signup;

  el("applyCodeBtn").onclick=applyCode;
  el("settingsBtn").onclick=()=>showOnly("settings");
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

// ===== SIGNUP =====
async function signup(){
  const name=document.getElementById("name").value;
  const email=document.getElementById("email2").value;
  const pass=document.getElementById("password2").value;
  const pass2=document.getElementById("password3").value;

  if(!name||!email||!pass) return alert("Required fields");

  if(!validEmail(email)) return alert("Invalid email");

  if(pass!==pass2) return alert("Passwords mismatch");

  const phone=document.getElementById("prefix").value+
              document.getElementById("phone").value;

  const res=await api({
    action:"signup",
    full_name:name,
    email,
    phone,
    password:pass,
    role:document.getElementById("role").value
  });

  alert(res.success?"Created":res.error);
}

// ===== LOGIN =====
async function login(){
  const el=id=>document.getElementById(id);
  el("loginStatus").innerText="Connecting...";

  const res=await api({
    action:"login",
    email:el("email").value,
    password:el("password").value
  });

  if(res.success){
    token=res.token;
    clicksRemaining=res.clicks_remaining;
    subscriptionExpiry=res.subscription_expiry;

    toggle("login",false);
    toggle("app",true);

    loadVideos();
  }else{
    el("loginStatus").innerText=res.error;
  }
}

// ===== APPLY CODE =====
async function applyCode(){
  const code=document.getElementById("codeInput").value;

  const res=await api({
    action:"applyCode",
    code,
    token
  });

  alert(res.success?"Activated":"Invalid code");
}

// ===== VIDEO RENDER (NO FREEZE) =====
async function loadVideos(){
  const container=document.getElementById("videos");
  container.innerHTML="Loading...";

  const vids=await fetch("videos.json").then(r=>r.json());

  container.innerHTML="";

  let i=0;

  function renderChunk(){
    const chunk=10;
    for(let j=0;j<chunk && i<vids.length;j++,i++){
      container.appendChild(createCard(vids[i]));
    }
    if(i<vids.length){
      requestAnimationFrame(renderChunk);
    }
  }

  renderChunk();
}

// ===== CARD =====
function createCard(v){
  const d=document.createElement("div");
  d.className="videoCard";

  const min=Math.floor(v.length/60);
  const sec=(v.length%60).toString().padStart(2,"0");

  d.innerHTML=`
    <b>${v.title}</b><br>
    Platform: ${v.platform}<br>
    Duration: ${min}:${sec}
  `;

  const btn=document.createElement("button");
  btn.innerText="Išsamiau (Open)";

  btn.onclick=async()=>{
    btn.innerText="Loading...";

    const r=await api({action:"watch",token});

    if(!r.allowed){
      clicksRemaining=0;
      btn.disabled=true;
      btn.innerText="Limit reached";
      return;
    }

    clicksRemaining=r.remaining;
    window.open(v.url,"_blank");
  };

  d.appendChild(btn);
  return d;
}

// ===== API =====
async function api(data){
  const res=await fetch(API,{
    method:"POST",
    body:JSON.stringify(data)
  });
  return res.json();
}
