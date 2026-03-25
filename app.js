const API = "https://script.google.com/macros/s/AKfycbxFdfhpSSGl5T5nsv8-tjkzGHHy01d72lNudier_e6VXKlTH5-47HNBPxzDzenWGmBWXw/exec";

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function formatTime(s) {
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

document.addEventListener("DOMContentLoaded", () => {
    const pref = document.getElementById("prefix");
    ["+370","+371","+372","+44","+49"].forEach(c => { const o = document.createElement("option"); o.value = c; o.innerText = c; pref.appendChild(o); });
    
    document.getElementById("btnLogin").onclick = () => show("login");
    document.getElementById("btnSignup").onclick = () => show("signup");
    document.getElementById("loginBtn").onclick = login;
    document.getElementById("signupBtn").onclick = signup;
    document.getElementById("btnRedeem").onclick = redeem;
    document.getElementById("settingsBtn").onclick = () => show("settings");
    document.getElementById("closeSettings").onclick = () => show("app");
    document.getElementById("logoutBtn").onclick = () => { localStorage.clear(); location.reload(); };

    const p2 = document.getElementById("password2"), p3 = document.getElementById("password3"), fb = document.getElementById("signupStatus");
    const valPass = () => {
        if (p2.value.length < 8) { fb.innerText = "Bent 8 simboliai"; fb.style.color = "#ff8080"; }
        else if (p3.value && p2.value !== p3.value) { fb.innerText = "Slaptažodžiai nesutampa"; fb.style.color = "#ff8080"; }
        else if (p2.value === p3.value) { fb.innerText = "Sutampa ir tinka"; fb.style.color = "#80ff80"; }
    };
    p2.oninput = valPass; p3.oninput = valPass;

    checkSession();
});

async function login() {
    const email = document.getElementById("email").value, password = document.getElementById("password").value;
    if(!email || !password) return;
    document.getElementById("loginStatus").innerText = "Jungiamasi...";
    try {
        const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"login", email, password })});
        const data = await res.json();
        if(data.success) {
            localStorage.setItem('mathexa_session', JSON.stringify({ token: data.token }));
            updateUI(data.clicks_remaining, data.expiry, data.support_id);
            showApp();
        } else document.getElementById("loginStatus").innerText = data.error;
    } catch(e) { document.getElementById("loginStatus").innerText = "Ryšio klaida. Rašykite: mathexa.dev@gmail.com"; }
}

async function signup() {
    const p2 = document.getElementById("password2").value, p3 = document.getElementById("password3").value;
    if(p2.length < 8 || p2 !== p3) return;
    const data = { action: "signup", full_name: document.getElementById("name").value, email: document.getElementById("email2").value, password: p2, phone: document.getElementById("prefix").value + document.getElementById("phone").value, role: document.getElementById("role").value };
    const res = await fetch(API, { method:"POST", body: JSON.stringify(data)});
    const resData = await res.json();
    if(resData.success) { alert("Sukurta! Prisijunkite."); show("login"); } else alert(resData.error);
}

async function redeem() {
    const code = document.getElementById("subCode").value;
    const s = JSON.parse(localStorage.getItem('mathexa_session'));
    const status = document.getElementById("subStatus");
    if(!code || !s) return;
    status.innerText = "Tikrinama...";
    status.style.color = "white";
    try {
        const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"redeemCode", token: s.token, code })});
        const data = await res.json();
        if(data.success) {
            status.innerText = "Aktyvuota iki " + data.expiry;
            status.style.color = "#80ff80";
            updateUI(999, data.expiry, null);
        } else {
            status.innerText = data.error;
            status.style.color = "#ff8080";
        }
    } catch(err) {
        status.innerText = "Ryšio klaida. Rašykite: mathexa.dev@gmail.com";
        status.style.color = "#ff8080";
    }
}

function updateUI(c, e, id) {
    const isP = e && new Date(e) > new Date();
    const txt = isP ? "PREMIUM" : "Liko: " + c;
    document.getElementById("headerClicks").innerText = txt;
    document.getElementById("clicksInfo").innerText = isP ? "PREMIUM" : c;
    if(id) document.getElementById("supportIdView").innerText = "ID: " + id;
}

async function showApp() {
    show("app");
    const res = await fetch('videos.json');
    const VIDEOS_DB = await res.json();
    const grid = document.getElementById("videos"), fragment = document.createDocumentFragment();
    grid.innerHTML = "";
    VIDEOS_DB.forEach(v => {
        const div = document.createElement("div");
        div.className = "video-card";
        div.innerHTML = `<div class="v-meta">${v.platform} • ${v.category}</div><h3>${v.title}</h3><div class="v-footer"><span class="v-tag">Video</span><span class="v-dur">⏱ ${formatTime(v.length)}</span></div>`;
        div.onclick = async () => {
            const h = div.innerHTML; div.innerHTML = "<h3>Kraunama...</h3>";
            const s = JSON.parse(localStorage.getItem('mathexa_session'));
            const r = await fetch(API, { method:"POST", body: JSON.stringify({ action:"watch", token: s.token })});
            const d = await r.json();
            div.innerHTML = h;
            if(d.allowed) {
                updateUI(d.remaining, null, null);
                if(isIOS()) window.location.href = v.url; else window.open(v.url, "_blank");
            } else alert(d.error);
        };
        fragment.appendChild(div);
    });
    grid.appendChild(fragment);
}

function show(id) {
    ["landing","login","signup","app","settings"].forEach(div => document.getElementById(div).classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}
function back() { show("landing"); }
async function checkSession() {
    let s = JSON.parse(localStorage.getItem('mathexa_session'));
    if(!s) return;
    try {
        const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"validateToken", token: s.token }) });
        const data = await res.json();
        if(data.success) { updateUI(data.clicks_remaining, data.expiry, data.support_id); showApp(); }
    } catch(e) { localStorage.clear(); }
}
