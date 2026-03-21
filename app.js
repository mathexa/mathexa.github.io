const API = "https://script.google.com/macros/s/AKfycby4oaibD3PfUGJGO2dCTzXW5cjBIW-0g9V1dMH8GeIy6u08jTqGr1BJ_NOREyUZPLaPhw/exec";

function el(id){ return document.getElementById(id); }

function goAuth(){
  el("landing").classList.add("hidden");
  el("auth").classList.remove("hidden");
}

// REGISTER
async function register(){
  const name = el("name").value;
  const email = el("email").value;
  const password = el("password").value;

  el("status").innerText="Registruojama...";

  const res = await fetch(API,{
    method:"POST",
    body:JSON.stringify({action:"register",name,email,password})
  });

  const data = await res.json();

  if(data.success){
    el("status").innerText="Registracija sėkminga";
  } else {
    el("status").innerText=data.error;
  }
}

// LOGIN
async function login(){
  const email = el("email").value;
  const password = el("password").value;

  el("status").innerText="Jungiama...";

  const res = await fetch(API,{
    method:"POST",
    body:JSON.stringify({action:"login",email,password})
  });

  const data = await res.json();

  if(data.success){
    localStorage.setItem("email",email);
    el("auth").classList.add("hidden");
    loadVideos();
  } else {
    el("status").innerText="Blogi duomenys";
  }
}

// LOAD VIDEOS
async function loadVideos(){
  const res = await fetch("videos.json");
  const list = await res.json();

  const v = el("videos");
  v.classList.remove("hidden");
  v.innerHTML="";

  list.forEach(x=>{
    const d=document.createElement("div");
    d.innerHTML=`<h3>${x.title}</h3>
    <button onclick="watch('${x.url}')">Žiūrėti</button>`;
    v.appendChild(d);
  });
}

// WATCH + CLICK UPDATE
async function watch(url){
  const email = localStorage.getItem("email");

  const res = await fetch(API,{
    method:"POST",
    body:JSON.stringify({action:"use",email})
  });

  const data = await res.json();

  if(data.blocked){
    el("lock").classList.remove("hidden");
    return;
  }

  alert("Video opened");
}
