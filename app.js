const API_URL = "https://script.google.com/macros/s/AKfycbyMbxnSOtD9kDn5TXyX_MKUgyg6Og2V6EoYK4gIw6zF8XThAz1Oq-OnAceVms4LytyQJA/exec";

let currentUser=null;
let allVideos=[];

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function toggleSettings(){
  const b=document.getElementById('settingsBox');
  b.style.display=b.style.display==='block'?'none':'block';
}

function checkPassword(){
  const p=document.getElementById('password').value;
  const f=document.getElementById('passFeedback');

  if(p.length<8) f.innerText="Mažiausiai 8 simboliai";
  else if(!/[A-Z]/.test(p)) f.innerText="Pridėkite didžiąją raidę";
  else if(!/[0-9]/.test(p)) f.innerText="Pridėkite skaičių";
  else f.innerText="Slaptažodis tinkamas";
}

function validEmail(email){
  return /^[^\s@]+@[^\s@]+\.(com|net|org|lt|edu|gov|io|co|me)$/i.test(email);
}

async function register(){
  const email=document.getElementById('email').value;
  const password=document.getElementById('password').value;

  if(!validEmail(email)) return alert("Netinkamas email");
  if(password.length<8) return alert("Per trumpas slaptažodis");

  const res=await fetch(API_URL,{
    method:"POST",
    body:JSON.stringify({
      action:"register",
      name:document.getElementById('name').value,
      email,
      password,
      phone:document.getElementById('phone').value,
      role:document.getElementById('role').value
    })
  });

  const data=await res.json();
  if(data.success){
    currentUser=email;
    loadVideos();
    showScreen('videos');
  }
}

async function login(){
  const res=await fetch(API_URL,{
    method:"POST",
    body:JSON.stringify({
      action:"login",
      email:document.getElementById('loginEmail').value,
      password:document.getElementById('loginPassword').value
    })
  });

  const data=await res.json();
  if(data.success){
    currentUser=document.getElementById('loginEmail').value;
    loadVideos();
    showScreen('videos');
  }
}

async function loadVideos(){
  const res=await fetch('videos.json');
  allVideos=await res.json();
  renderVideos(allVideos);
}

function renderVideos(list){
  const container=document.getElementById('videoList');
  container.innerHTML="";

  list.forEach((v,i)=>{
    const d=document.createElement('div');

    d.innerHTML=`
      <b>${v.title}</b>
      <p>${v.language}</p>

      <button onclick="toggleDetails(${i})">Išsamiau</button>

      <div id="d${i}" style="display:none">
        <p>${v.platform}</p>
        <p>${v.duration}</p>
      </div>

      <button onclick="watchVideo('${v.url}')">Žiūrėti</button>
      <hr>
    `;

    container.appendChild(d);
  });
}

function toggleDetails(i){
  const el=document.getElementById(`d${i}`);
  el.style.display=el.style.display==="none"?"block":"none";
}

function searchVideos(){
  const q=document.getElementById('search').value.toLowerCase();
  renderVideos(allVideos.filter(v=>v.title.toLowerCase().includes(q)));
}

function filterCategory(){
  const c=document.getElementById('categoryFilter').value;
  if(!c) return renderVideos(allVideos);
  renderVideos(allVideos.filter(v=>v.category===c));
}

async function watchVideo(url){
  const res=await fetch(API_URL,{
    method:"POST",
    body:JSON.stringify({action:"use",email:currentUser})
  });

  const data=await res.json();
  if(data.blocked) return alert("Limitas pasiektas");

  window.open(url,'_blank');
}

async function activateCode(){
  const code=prompt("Kodas");

  const res=await fetch(API_URL,{
    method:"POST",
    body:JSON.stringify({
      action:"activate",
      email:currentUser,
      code
    })
  });

  const data=await res.json();
  alert(data.success?"Aktyvuota":data.error);
}
