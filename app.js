const API = "https://script.google.com/macros/s/AKfycbwV9VieSzHrdJp5_jahzqqzAPv6Lv-h-jAncTmzKnGFo0YbN0qxw3P0mumwCkzv3WAnQA/exec";
let VIDEOS_DB = [];

document.addEventListener("DOMContentLoaded", () => {
    loadPrefixes();
    bindEvents();
    checkSession();
});

function loadPrefixes() {
    const pref = document.getElementById("prefix");
    const eu = ["+370","+371","+372","+43","+32","+359","+385","+357","+420","+45","+358","+33","+49","+30","+36","+353","+39","+352","+356","+31","+48","+351","+40","+421","+386","+34","+46"];
    eu.sort().forEach(c => { const o = document.createElement("option"); o.value = c; o.innerText = c; pref.appendChild(o); });
}

function bindEvents() {
    document.getElementById("btnLogin").onclick = () => show("login");
    document.getElementById("btnSignup").onclick = () => show("signup");
    document.getElementById("loginBtn").onclick = () => login();
    document.getElementById("signupBtn").onclick = signup;
    document.getElementById("settingsBtn").onclick = () => { show("none"); document.getElementById("settings").classList.remove("hidden"); };
    document.getElementById("closeSettings").onclick = () => { document.getElementById("settings").classList.add("hidden"); document.getElementById("app").classList.remove("hidden"); };
    document.getElementById("logoutBtn").onclick = logout;
    document.getElementById("clearCacheBtn").onclick = () => { localStorage.clear(); location.reload(); };
    document.getElementById("stayLoginSettings").onchange = (e) => {
        let s = JSON.parse(localStorage.getItem('mathexa_session'));
        if(s) { s.permanent = e.target.checked; localStorage.setItem('mathexa_session', JSON.stringify(s)); }
    };
}

async function checkSession() {
    let s = JSON.parse(localStorage.getItem('mathexa_session'));
    if(!s) return;
    if(!s.permanent && Date.now() > s.expiresAt) return logout();
    try {
        const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"validateToken", token: s.token }) });
        const data = await res.json();
        if(data.success) { updateUI(data.clicks_remaining, data.expiry, data.support_id); showApp(); }
        else logout();
    } catch(e) {}
}

async function login(u, p) {
    const email = u || document.getElementById("email").value;
    const password = p || document.getElementById("password").value;
    const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"login", email, password })});
    const data = await res.json();
    if(data.success) {
        localStorage.setItem('mathexa_session', JSON.stringify({ token: data.token, expiresAt: Date.now() + (3*60*60*1000), permanent: false }));
        updateUI(data.clicks_remaining, data.expiry, data.support_id);
        showApp();
    } else alert(data.error);
}

async function signup() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email2").value;
    const pass = document.getElementById("password2").value;
    const phone = document.getElementById("prefix").value + document.getElementById("phone").value;
    const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"signup", full_name:name, email, password:pass, phone })});
    const data = await res.json();
    if(data.success) login(email, pass); else alert(data.error);
}

function updateUI(c, e, id) {
    const isP = e && new Date(e) > new Date();
    const text = isP ? "Premium" : `Liko: ${c}`;
    document.getElementById("headerClicks").innerText = text;
    document.getElementById("clicksInfo").innerText = "Liko peržiūrų: " + text;
    if(id) document.getElementById("supportIdView").innerText = "ID: " + id;
}

async function showApp() {
    show("none"); document.getElementById("app").classList.remove("hidden");
    const res = await fetch('videos.json');
    VIDEOS_DB = await res.json();
    const grid = document.getElementById("videos");
    grid.innerHTML = "";
    VIDEOS_DB.forEach(v => {
        const div = document.createElement("div");
        div.className = "video-card";
        div.innerHTML = `<h3>${v.title}</h3><p>${v.category} • ${Math.floor(v.length/60)} min</p>`;
        div.onclick = () => handleWatch(v.url);
        grid.appendChild(div);
    });
}

async function handleWatch(url) {
    const s = JSON.parse(localStorage.getItem('mathexa_session'));
    const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"watch", token: s.token })});
    const data = await res.json();
    if(data.allowed) { window.open(url, "_blank"); updateUI(data.remaining, data.expiry, null); }
    else alert(data.error);
}

function logout() { localStorage.clear(); location.reload(); }
function show(id) { 
    ["landing","login","signup","app","settings"].forEach(i => document.getElementById(i).classList.add("hidden"));
    if(id !== "none") document.getElementById(id).classList.remove("hidden");
}
function back() { show("landing"); }
