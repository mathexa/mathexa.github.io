const API_URL = "https://script.google.com/macros/s/AKfycbyI9-zOdLM8GwwZlZ6epSalg5lYtES8cwit0z3J4dbHaJneC36D_0MiobVmAz6-ZEXaTw/exec";

let currentUser = null;
let allVideos = [];

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function toggleSettings(){
  const b=document.getElementById('settingsBox');
  b.style.display=b.style.display==='block'?'none':'block';
}

function openPolicy(){
  window.open("policy&terms of use.txt","_blank");
}

function validEmail(email){
  const regex=/^[^\s@]+@[^\s@]+\.(com|lt|net|org|edu|gov|io|co|info)$/i;
  return regex.test(email);
}

function checkPassword(){
  const p=document.getElementById('password').value;
  const fb=document.getElementById('passwordFeedback');

  if(p.length<8){
    fb.innerText="Mažiausiai 8 simboliai";
    fb.style.color="red";
  }else{
    fb.innerText="Tinkamas";
    fb.style.color="lightgreen";
  }
}

async function register(){
  const name=nameEl.value;
  const email=emailEl.value;
  const password=passwordEl.value;
  const phone=phoneEl.value;
  const role=roleEl.value;

  if(!validEmail(email)){
    registerStatus.innerText="Neteisingas el. paštas";
    return;
  }

  if(password.length<8){
    registerStatus.innerText="Slaptažodis per trumpas";
    return;
  }

  const res=await fetch(API_URL,{
    method:"POST",
    body:JSON.stringify({action:"register",name,email,password,phone,role})
  });

  const data=await res.json();

  if(data.success){
    currentUser=email;
    loadVideos();
    showScreen('videos');
  }else{
    registerStatus.innerText=data.error;
  }
}

async function login(){
  const email=loginEmail.value;
  const password=loginPassword.value;

  const res=await fetch(API_URL,{
    method:"POST",
    body:JSON.stringify({action:"login",email,password})
  });

  const data=await res.json();

  if(data.success){
    currentUser=email;
    loadVideos();
    showScreen('videos');
  }else{
    loginStatus.innerText="Blogi duomenys";
  }
}

async function loadVideos(){
  const res=await fetch('videos.json');
  const data=await res.json();
  allVideos=data;
  renderVideos(allVideos);
}

function renderVideos(list){
  const container=document.getElementById('videoList');
  container.innerHTML="";

  list.forEach(v=>{
    const d=document.createElement('div');
    d.className="video";

    d.innerHTML=`
      <b>${v.title}</b>
      <p>${v.language}</p>
      <button onclick="toggleDetails(this)">Išsamiau</button>
      <div class="details">
        <p>${v.platform}</p>
        <p>${v.duration}</p>
        <button onclick="watchVideo('${v.url}')">Žiūrėti</button>
      </div>
    `;

    container.appendChild(d);
  });
}

function toggleDetails(btn){
  const d=btn.nextElementSibling;
  d.style.display=d.style.display==='block'?'none':'block';
}

function searchVideos(){
  const q=search.value.toLowerCase();
  renderVideos(allVideos.filter(v=>v.title.toLowerCase().includes(q)));
}

function filterCategory(){
  const c=categoryFilter.value;
  if(!c)return renderVideos(allVideos);
  renderVideos(allVideos.filter(v=>v.category===c));
}

async function watchVideo(url){
  const res=await fetch(API_URL,{
    method:"POST",
    body:JSON.stringify({action:"use",email:currentUser})
  });

  const data=await res.json();

  if(data.blocked){
    alert("Limitas pasiektas");
    return;
  }

  window.open(url,'_blank');
}

async function activateCode(){
  const code=prompt("Kodas");

  const res=await fetch(API_URL,{
    method:"POST",
    body:JSON.stringify({action:"activate",email:currentUser,code})
  });

  const data=await res.json();

  alert(data.success?"Aktyvuota":data.error);
}
