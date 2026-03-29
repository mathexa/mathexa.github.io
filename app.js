const API = "https://script.google.com/macros/s/AKfycbzPJmUfl2klgpQ2u8F2z8_Z0nnvNo-FYguxqwej83SNkIZTVzPE8ACIAFP7jsOUAedymQ/exec"; 
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

let notificationsDB = [];
let VIDEOS_DB = [];

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

async function checkSession() {
    const stay = localStorage.getItem('mathexa_stay') === 'true';
    const s = JSON.parse(localStorage.getItem('mathexa_session'));
    const sid = localStorage.getItem('mathexa_support');

    if (!s && !stay) return;

    // 7-Hour session limit check
    if (s && s.token) {
        try {
            const time = parseInt(atob(s.token.replace(/-/g, '+').replace(/_/g, '/')).split("|")[1]);
            if ((Date.now() - time) / 3600000 > 7) {
                localStorage.removeItem('mathexa_session');
                if (!stay) return;
            } else {
                // 1 in 10 chance to refresh subscription data from server
                if (Math.random() < 0.1) await validateSession(s.token);
                else showApp();
                return;
            }
        } catch(e) { localStorage.removeItem('mathexa_session'); }
    }

    if (stay && sid) {
        document.getElementById("loadingBanner").classList.remove("hidden");
        try {
            const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"login", support_id: sid })});
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('mathexa_session', JSON.stringify({ token: data.token }));
                updateUI(data.clicks_remaining, data.expiry, data.support_id);
                showApp();
            } else { show("landing"); }
        } catch(e) { show("landing"); }
        finally { document.getElementById("loadingBanner").classList.add("hidden"); }
    }
}

async function validateSession(token) {
    try {
        const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"validateToken", token })});
        const d = await res.json();
        if (d.success && d.banned !== "yes") {
            updateUI(d.clicks_remaining, d.expiry, d.support_id);
            showApp();
        } else { localStorage.clear(); location.reload(); }
    } catch(e) { showApp(); }
}

async function showApp() {
    show("app");
    const grid = document.getElementById("videos");
    const search = document.getElementById("searchInput");
    const filter = document.getElementById("langFilter");

    const render = () => {
        grid.innerHTML = "";
        const q = search.value.toLowerCase();
        const l = filter.value;
        VIDEOS_DB.filter(v => v.title.toLowerCase().includes(q) && (l === "all" || v.lang === l)).forEach(v => {
            const div = document.createElement("div");
            div.className = "video-card";
            div.innerHTML = `<div class="v-meta">${v.platform} • ${v.category}</div><h3>${v.title}</h3><div class="v-footer"><span class="v-tag">Žiūrėti</span></div>`;
            div.onclick = async () => {
                const tag = div.querySelector(".v-tag");
                tag.innerText = "Kraunama...";
                try {
                    const s = JSON.parse(localStorage.getItem('mathexa_session'));
                    const r = await fetch(API, { method:"POST", body: JSON.stringify({ action:"watch", token: s.token })});
                    const d = await r.json();
                    if(d.allowed) {
                        updateUI(d.remaining, null, null);
                        if(isIOS()) window.location.href = v.url; else window.open(v.url, "_blank");
                    } else alert(d.error);
                } catch(e) { alert("Klaida."); }
                tag.innerText = "Žiūrėti";
            };
            grid.appendChild(div);
        });
    };

    if (VIDEOS_DB.length === 0) {
        try {
            const res = await fetch('videos.json');
            VIDEOS_DB = await res.json();
        } catch(e) { grid.innerHTML = "Nepavyko užkrauti video."; return; }
    }
    search.oninput = render; filter.onchange = render; render();
}

function updateUI(c, e, id) {
    const now = new Date();
    const exp = e ? new Date(e) : null;
    const isToday = exp && exp.toDateString() === now.toDateString();
    const isExpired = exp && exp < now && !isToday;

    document.getElementById("headerClicks").innerText = (exp && exp > now) ? "∞" : "Liko: " + c;
    document.getElementById("clicksInfo").innerText = (exp && exp > now) ? "∞" : c;
    if(id) document.getElementById("supportIdView").innerText = "ID: " + id;
    
    const expDiv = document.getElementById("expiryInfo");
    if (isExpired) expDiv.innerText = "Prenumerata baigėsi";
    else if (isToday) { expDiv.innerText = "Baigiasi šiandien!"; alert("Dėmesio: Jūsų prenumerata baigiasi šiandien!"); }
    else if (exp) expDiv.innerText = "Galioja iki: " + exp.toLocaleDateString();
    else expDiv.innerText = "Nėra aktyvios prenumeratos";
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

async function signup() {
    const p2 = document.getElementById("password2").value, p3 = document.getElementById("password3").value;
    const name = document.getElementById("name").value, email = document.getElementById("email2").value;
    if(!name || !email || p2.length < 8) { alert("Užpildykite visus laukus (Slaptažodis min. 8)"); return; }
    if(p2 !== p3) { alert("Slaptažodžiai nesutampa!"); return; }
    const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"signup", full_name: name, email, password: p2, role: document.getElementById("role").value })});
    const d = await res.json();
    if(d.success) { alert("Paskyra sukurta!"); show("login"); } else alert(d.error);
}

async function redeem() {
    const code = document.getElementById("subCode").value;
    const s = JSON.parse(localStorage.getItem('mathexa_session'));
    if(!code || !s) return;
    document.getElementById("subStatus").innerText = "Tikrinama...";
    const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"redeemCode", token: s.token, code })});
    const d = await res.json();
    if(d.success) { document.getElementById("subStatus").innerText = "Aktyvuota!"; setTimeout(() => location.reload(), 1000); }
    else document.getElementById("subStatus").innerText = d.error;
}

function show(id) {
    ["landing","login","signup","app","settings"].forEach(d => document.getElementById(d)?.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
    const locMap = { "login": "log.in", "app": "m.s", "settings": "s" };
    if(locMap[id]) displayNotif(locMap[id]);
}

async function fetchNotifications() {
    try {
        const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"getNotifications" }) });
        const d = await res.json();
        notificationsDB = d.notifications || [];
    } catch(e) {}
}

function displayNotif(loc) {
    const notif = notificationsDB.find(n => n.location === loc);
    if(!notif || !notif.message) return;
    const seen = JSON.parse(localStorage.getItem('seen_notifs') || "[]");
    if (seen.includes(notif.message)) return;
    if(notif.importance === "v.imp") {
        document.getElementById('vImpText').innerText = notif.message;
        document.getElementById('vImpNotif').classList.remove('hidden');
    } else {
        document.getElementById('nImpText').innerText = notif.message;
        document.getElementById('nImpNotif').classList.remove('hidden');
    }
}

function closeNotif(id) { 
    const tid = id === 'vImpNotif' ? 'vImpText' : 'nImpText';
    const msg = document.getElementById(tid).innerText;
    const seen = JSON.parse(localStorage.getItem('seen_notifs') || "[]");
    if (!seen.includes(msg)) { seen.push(msg); localStorage.setItem('seen_notifs', JSON.stringify(seen)); }
    document.getElementById(id).classList.add('hidden'); 
}
function back() { show("landing"); }
