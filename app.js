const API = "https://script.google.com/macros/s/AKfycbznzEG3Y89F0mrA8NxxMne5C-UCPJAu1Ru-neMVnUZWf7qIlPQVlZV3UUnDDj9G0J9Xmw/exec";

let token = null;
let clicksRemaining = 0;
let allVideos = [];
let supportId = null;

// INIT
document.addEventListener("DOMContentLoaded", () => {

  // prefixes
  const prefixes = ["+370","+371","+372","+49","+33","+34","+39","+48","+31","+32","+43","+45","+46","+47","+358","+353","+420","+421","+386","+385","+36","+40","+359","+30","+357","+356","+351","+352","+354","+423","+377"];
  const p = document.getElementById("prefix");
  prefixes.forEach(x=>{
    const o=document.createElement("option");
    o.value=x; o.innerText=x;
    p.appendChild(o);
  });

  bind();

  // restore session
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

  el("toggleSupport").onclick=()=>{
    const box = el("supportBox");
    box.classList.toggle("hidden");
    box.innerText = supportId || "";
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

  el("search").oninput = (e)=>{
    const q=e.target.value.toLowerCase();
    renderVideos(allVideos.filter(v =>
      v.title.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q)
    ));
  };

  // restore simple mode
  if(localStorage.getItem("simpleUI")==="true"){
    document.body.classList.add("simple");
    el("simpleUI").checked = true;
  }
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

// LOGIN
async function login(){
  const res = await api({
    action:"login",
    email:email.value,
    password:password.value
  });

  if(res.success){
    token = res.token;
    clicksRemaining = res.clicks_remaining;
    supportId = res.support_id;

    if(document.getElementById("stayLogin").checked){
      localStorage.setItem("session", JSON.stringify({
        token,
        time: Date.now()
      }));
    }

    showApp();
    loadVideos();
  } else {
    loginStatus.innerText = res.error;
  }
}

// SIGNUP
async function signup(){
  const res = await api({
    action:"signup",
    full_name:name.value,
    email:email2.value,
    phone:prefix.value+phone.value,
    password:password2.value,
    role:role.value
  });

  if(res.success){
    alert("Jūsų ID: " + res.support_id);

    await login(); // auto login
  } else {
    alert(res.error);
  }
}

// SETTINGS
function openSettings(){
  clicksInfo.innerText =
    clicksRemaining > 1000
      ? "Peržiūros: ∞"
      : "Liko: " + clicksRemaining;

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
    alert("Aktyvuota");
    clicksRemaining = 99999;
    loadVideos();
  } else {
    alert(res.error);
  }
}

// LOAD VIDEOS (NON-FREEZE)
async function loadVideos(){
  videos.innerHTML="Kraunama...";
  allVideos = await fetch("videos.json").then(r=>r.json());
  renderVideos(allVideos);
}

// RENDER (CHUNKED)
function renderVideos(list){
  videos.innerHTML="";
  let i=0;

  function chunk(){
    for(let j=0;j<10 && i<list.length;j++,i++){
      videos.appendChild(card(list[i]));
    }
    if(i<list.length){
      requestAnimationFrame(chunk);
    }
  }
  chunk();
}

// CARD
function card(v){
  const d=document.createElement("div");
  d.className="videoCard";

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

  d.innerHTML=`
    <b>${v.title}</b>
    <div>${v.category}</div>
    <div>${v.platform}</div>
  `;

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

// SHOW APP
function showApp(){
  toggle("landing",false);
  toggle("login",false);
  toggle("signup",false);
  toggle("app",true);
}
