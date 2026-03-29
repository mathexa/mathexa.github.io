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

    // Check 7 hour limit for existing session
    if (s && s.token) {
        try {
            const tokenData = atob(s.token.replace(/-/g, '+').replace(/_/g, '/'));
            const timestamp = parseInt(tokenData.split("|")[1]);
            const hoursPassed = (Date.now() - timestamp) / (1000 * 60 * 60);
            
            if (hoursPassed < 7) {
                showApp();
                return;
            } else {
                localStorage.removeItem('mathexa_session');
            }
        } catch(e) { localStorage.removeItem('mathexa_session'); }
    }

    // Attempt Auto-login with Support ID (still checks for bans/strikes)
    if (stay && sid) {
        document.getElementById("loadingBanner").classList.remove("hidden");
        try {
            const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"login", support_id: sid })});
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('mathexa_session', JSON.stringify({ token: data.token }));
                updateUI(data.clicks_remaining, data.expiry, data.support_id);
                showApp();
            } else {
                localStorage.removeItem('mathexa_support');
                show("landing");
            }
        } catch(e) { show("landing"); }
        finally { document.getElementById("loadingBanner").classList.add("hidden"); }
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
    const search = document.getElementById("searchInput");
    const filter = document.getElementById("langFilter");

    const render = () => {
        grid.innerHTML = "";
        const q = search.value.toLowerCase();
        const l = filter.value;
        
        const filtered = VIDEOS_DB.filter(v => 
            v.title.toLowerCase().includes(q) && (l === "all" || v.lang === l)
        );

        filtered.forEach(v => {
            const div = document.createElement("div");
            div.className = "video-card";
            div.innerHTML = `<div class="v-meta">${v.platform} • ${v.category}</div><h3>${v.title}</h3><div class="v-footer"><span class="v-tag">Video</span></div>`;
            
            div.onclick = async () => {
                const tag = div.querySelector(".v-tag");
                const oldText = tag.innerText;
                tag.innerText = "Kraunama...";
                tag.style.background = "#ffa500";

                try {
                    const s = JSON.parse(localStorage.getItem('mathexa_session'));
                    const r = await fetch(API, { method:"POST", body: JSON.stringify({ action:"watch", token: s.token })});
                    const d = await r.json();
                    if(d.allowed) {
                        updateUI(d.remaining, null, null);
                        if(isIOS()) window.location.href = v.url; else window.open(v.url, "_blank");
                    } else alert(d.error);
                } catch(e) { alert("Klaida."); }
                tag.innerText = oldText;
                tag.style.background = "";
            };
            grid.appendChild(div);
        });
    };

    if (VIDEOS_DB.length === 0) {
        try {
            const res = await fetch('videos.json');
            VIDEOS_DB = await res.json();
        } catch(e) { grid.innerHTML = "Klaida."; return; }
    }
    
    search.oninput = render;
    filter.onchange = render;
    render();
}

function updateUI(c, e, id) {
    const isP = e && new Date(e) > new Date();
    document.getElementById("headerClicks").innerText = isP ? "∞" : "Liko: " + c;
    document.getElementById("clicksInfo").innerText = isP ? "∞" : c;
    if(id) document.getElementById("supportIdView").innerText = "ID: " + id;
    const expDiv = document.getElementById("expiryInfo");
    if(e) expDiv.innerText = "Galioja iki: " + new Date(e).toLocaleDateString();
    else expDiv.innerText = "Nėra prenumeratos";
}

async function signup() {
    const p2 = document.getElementById("password2").value, p3 = document.getElementById("password3").value;
    if(p2.length < 8 || p2 !== p3) { alert("Slaptažodžiai nesutampa!"); return; }
    const data = { action: "signup", full_name: document.getElementById("name").value, email: document.getElementById("email2").value, password: p2, role: document.getElementById("role").value };
    const res = await fetch(API, { method:"POST", body: JSON.stringify(data)});
    const resData = await res.json();
    if(resData.success) { alert("Sukurta!"); show("login"); } else alert(resData.error);
}

async function redeem() {
    const code = document.getElementById("subCode").value;
    const s = JSON.parse(localStorage.getItem('mathexa_session'));
    if(!code || !s) return;
    document.getElementById("subStatus").innerText = "Tikrinama...";
    const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"redeemCode", token: s.token, code })});
    const data = await res.json();
    if(data.success) { document.getElementById("subStatus").innerText = "Aktyvuota!"; setTimeout(() => location.reload(), 1000); }
    else document.getElementById("subStatus").innerText = data.error;
}

async function fetchNotifications() {
    try {
        const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"getNotifications" }) });
        const data = await res.json();
        notificationsDB = data.notifications || [];
    } catch(e) {}
}

function show(id) {
    ["landing","login","signup","app","settings"].forEach(d => document.getElementById(d)?.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
    const locMap = { "login": "log.in", "app": "m.s", "settings": "s" };
    if(locMap[id]) displayNotif(locMap[id]);
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
