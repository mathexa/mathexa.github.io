const API = "https://script.google.com/macros/s/AKfycbyoy2rodLYK_SKIP92ON32rRZl3ignaZBbYVbbo0El2J0wyVPSjXIwj3IOfg87VTPiS8g/exec";
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

let notificationsDB = [];

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnLogin").onclick = () => show("login");
    document.getElementById("btnSignup").onclick = () => show("signup");
    document.getElementById("loginBtn").onclick = login;
    document.getElementById("signupBtn").onclick = signup;
    document.getElementById("btnRedeem").onclick = redeem;
    document.getElementById("settingsBtn").onclick = () => show("settings");
    document.getElementById("closeSettings").onclick = () => show("app");
    document.getElementById("logoutBtn").onclick = () => { localStorage.clear(); location.reload(); };
    
    const stayToggle = document.getElementById("stayLogged");
    stayToggle.onchange = () => localStorage.setItem('mathexa_stay', stayToggle.checked);
    stayToggle.checked = localStorage.getItem('mathexa_stay') === 'true';

    fetchNotifications();
    checkSession();
});

async function fetchNotifications() {
    try {
        const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"getNotifications" }) });
        const data = await res.json();
        notificationsDB = data.notifications || [];
    } catch(e) {}
}

function displayNotif(loc) {
    const notif = notificationsDB.find(n => n.location === loc);
    if(!notif || !notif.message) return;
    const seenList = JSON.parse(localStorage.getItem('seen_notifs') || "[]");
    if (seenList.includes(notif.message)) return;

    if(notif.importance === "v.imp") {
        document.getElementById('vImpText').innerText = notif.message;
        document.getElementById('vImpNotif').classList.remove('hidden');
    } else {
        document.getElementById('nImpText').innerText = notif.message;
        document.getElementById('nImpNotif').classList.remove('hidden');
    }
}

function updateUI(c, e, id) {
    const isP = e && new Date(e) > new Date();
    const isToday = e && new Date(e).toDateString() === new Date().toDateString();
    
    const displayVal = isP ? "∞" : c;
    document.getElementById("headerClicks").innerText = isP ? "∞" : "Liko: " + c;
    document.getElementById("clicksInfo").innerText = displayVal;
    
    if(id) document.getElementById("supportIdView").innerText = "ID: " + id;
    
    const expDiv = document.getElementById("expiryInfo");
    if(e) {
        const d = new Date(e).toLocaleDateString();
        expDiv.innerText = "Galioja iki: " + d;
        if(isToday) alert("Dėmesio: Jūsų prenumerata baigiasi šiandien!");
    } else {
        expDiv.innerText = "Nėra aktyvios prenumeratos";
    }
}

async function login() {
    const email = document.getElementById("email").value, password = document.getElementById("password").value;
    if(!email || !password) return;
    document.getElementById("loginStatus").innerText = "Jungiamasi...";
    try {
        const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"login", email, password })});
        const data = await res.json();
        if(data.success) {
            localStorage.setItem('mathexa_session', JSON.stringify({ token: data.token }));
            localStorage.setItem('mathexa_support', data.support_id);
            updateUI(data.clicks_remaining, data.expiry, data.support_id);
            showApp();
        } else document.getElementById("loginStatus").innerText = data.error;
    } catch(e) { document.getElementById("loginStatus").innerText = "Ryšio klaida."; }
}

async function showApp() {
    show("app");
    const grid = document.getElementById("videos");
    try {
        const res = await fetch('videos.json');
        const VIDEOS_DB = await res.json();
        const render = (list) => {
            grid.innerHTML = "";
            list.forEach(v => {
                const div = document.createElement("div");
                div.className = "video-card";
                div.innerHTML = `<div class="v-meta">${v.platform} • ${v.category}</div><h3>${v.title}</h3><div class="v-footer"><span class="v-tag">Video</span></div>`;
                div.onclick = async () => {
                    document.getElementById("videoOverlay").classList.remove("hidden");
                    const s = JSON.parse(localStorage.getItem('mathexa_session'));
                    const r = await fetch(API, { method:"POST", body: JSON.stringify({ action:"watch", token: s.token })});
                    const d = await r.json();
                    document.getElementById("videoOverlay").classList.add("hidden");
                    if(d.allowed) {
                        updateUI(d.remaining, null, null);
                        if(isIOS()) window.location.href = v.url; else window.open(v.url, "_blank");
                    } else alert(d.error);
                };
                grid.appendChild(div);
            });
        };
        render(VIDEOS_DB);
    } catch (err) { grid.innerHTML = "<p>Klaida kraunant.</p>"; }
}

async function checkSession() {
    const stay = localStorage.getItem('mathexa_stay') === 'true';
    const s = JSON.parse(localStorage.getItem('mathexa_session'));
    const sid = localStorage.getItem('mathexa_support');

    if(!stay && !s) return;
    
    // Auto-login logic
    if(stay && !s && sid) {
        document.getElementById("loadingBanner").classList.remove("hidden");
        try {
            const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"login", support_id: sid })});
            const data = await res.json();
            document.getElementById("loadingBanner").classList.add("hidden");
            if(data.success) {
                localStorage.setItem('mathexa_session', JSON.stringify({ token: data.token }));
                updateUI(data.clicks_remaining, data.expiry, data.support_id);
                showApp();
            }
        } catch(e) { document.getElementById("loadingBanner").classList.add("hidden"); }
        return;
    }

    if(!s) return;

    // 1 in 10 chance to re-validate expiry/ban status
    if(Math.random() < 0.1) {
        try {
            const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"validateToken", token: s.token }) });
            const data = await res.json();
            if(data.success && data.banned !== "yes") { 
                updateUI(data.clicks_remaining, data.expiry, data.support_id); 
                showApp(); 
            } else { localStorage.clear(); location.reload(); }
        } catch(e) {}
    } else {
        showApp();
    }
}

function show(id) {
    ["landing","login","signup","app","settings"].forEach(d => document.getElementById(d)?.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
    const locMap = { "login": "log.in", "app": "m.s", "settings": "s" };
    if(locMap[id]) displayNotif(locMap[id]);
}
function back() { show("landing"); }
function closeNotif(id) { document.getElementById(id).classList.add('hidden'); }
