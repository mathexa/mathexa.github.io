const API_URL = "https://script.google.com/macros/s/AKfycbyI9-zOdLM8GwwZlZ6epSalg5lYtES8cwit0z3J4dbHaJneC36D_0MiobVmAz6-ZEXaTw/exec";

let currentUser = null;
let allVideos = [];

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function toggleInfo(){
  const b=document.getElementById('phoneInfo');
  b.style.display=b.style.display==='block'?'none':'block';
}

function toggleSettings(){
  const b=document.getElementById('settingsBox');
  b.style.display=b.style.display==='block'?'none':'block';
}

async function register(){
  const name=document.getElementById('name').value;
  const email=document.getElementById('email').value;
  const password=document.getElementById('password').value;
  const phone=document.getElementById('phone').value;
  const role=document.getElementById('role').value;

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
    document.getElementById('registerStatus').innerText=data.error;
  }
}

async function login(){
  const email=document.getElementById('loginEmail').value;
  const password=document.getElementById('loginPassword').value;

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
    document.getElementById('loginStatus').innerText="Blogi duomenys";
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

  const frag=document.createDocumentFragment();

  list.forEach(v=>{
    const d=document.createElement('div');
    d.innerHTML=`
      <p><b>${v.title}</b></p>
      <p>${v.category}</p>
      <button onclick="watchVideo('${v.url}')">Žiūrėti</button>
      <hr>
    `;
    frag.appendChild(d);
  });

  container.appendChild(frag);
}

function searchVideos(){
  const q=document.getElementById('search').value.toLowerCase();
  renderVideos(allVideos.filter(v=>v.title.toLowerCase().includes(q)));
}

function filterCategory(){
  const c=document.getElementById('categoryFilter').value;
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
