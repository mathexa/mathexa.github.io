const API = "https://script.google.com/macros/s/AKfycbyoy2rodLYK_SKIP92ON32rRZl3ignaZBbYVbbo0El2J0wyVPSjXIwj3IOfg87VTPiS8g/exec";

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

let notificationsDB = [];

function formatTime(s) {
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

document.addEventListener("DOMContentLoaded", () => {
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
    if(p2) { p2.oninput = valPass; p3.oninput = valPass; }

    fetchNotifications();
    checkSession();
});

async function fetchNotifications() {
    try {
        const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"getNotifications" }) });
        const data = await res.json();
        if(data.notifications) notificationsDB = data.notifications;
    } catch(e) {}
}

function displayNotif(loc) {
    // Hidden by default
    document.getElementById('vImpNotif').classList.add('hidden');
    document.getElementById('nImpNotif').classList.add('hidden');
    
    const notif = notificationsDB.find(n => n.location === loc);
    if(!notif || !notif.message) return;

    // Show-once logic: Check if this specific message was already seen
    const seenList = JSON.parse(localStorage.getItem('seen_notifs') || "[]");
    if (seenList.includes(notif.message)) return;

    if(notif.importance === "v.imp") {
        document.getElementById('vImpText').innerText = notif.message;
        document.getElementById('vImpNotif').classList.remove('hidden');
    } else if(notif.importance === "n.imp") {
        document.getElementById('nImpText').innerText = notif.message;
        document.getElementById('nImpNotif').classList.remove('hidden');
    }
}

function closeNotif(id) {
    // When closed, add to seen list so it doesn't show again
    const textElementId = id === 'vImpNotif' ? 'vImpText' : 'nImpText';
    const msg = document.getElementById(textElementId).innerText;
    const seenList = JSON.parse(localStorage.getItem('seen_notifs') || "[]");
    if (!seenList.includes(msg)) {
        seenList.push(msg);
        localStorage.setItem('seen_notifs', JSON.stringify(seenList));
    }
    document.getElementById(id).classList.add('hidden');
}

function show(id) {
    ["landing","login","signup","app","settings"].forEach(div => {
        const el = document.getElementById(div);
        if(el) el.classList.add("hidden");
    });
    document.getElementById(id).classList.remove("hidden");
    
    const locMap = { "login": "log.in", "signup": "sign.up", "app": "m.s", "settings": "s" };
    if(locMap[id]) displayNotif(locMap[id]);
}

function back() { show("landing"); }

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
    } catch(e) { document.getElementById("loginStatus").innerText = "Ryšio klaida."; }
}

async function signup() {
    const p2 = document.getElementById("password2").value, p3 = document.getElementById("password3").value;
    if(p2.length < 8 || p2 !== p3) return;
    const data = { 
        action: "signup", 
        full_name: document.getElementById("name").value, 
        email: document.getElementById("email2").value, 
        password: p2, 
        role: document.getElementById("role").value 
    };
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
    } catch(err) { status.innerText = "Ryšio klaida."; }
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
    const grid = document.getElementById("videos");
    const searchInput = document.getElementById("searchInput");
    const langFilter = document.getElementById("langFilter");
    
    try {
        const res = await fetch('videos.json');
        const VIDEOS_DB = await res.json();

        const render = (list) => {
            grid.innerHTML = "";
            list.forEach(v => {
                const div = document.createElement("div");
                div.className = "video-card";
                div.innerHTML = `<div class="v-meta">${v.platform} • ${v.category}</div><h3>${v.title}</h3><div class="v-footer"><span class="v-tag">Video</span><span class="v-dur">⏱ ${formatTime(v.length)}</span></div>`;
                div.onclick = async () => {
                    const s = JSON.parse(localStorage.getItem('mathexa_session'));
                    const r = await fetch(API, { method:"POST", body: JSON.stringify({ action:"watch", token: s.token })});
                    const d = await r.json();
                    if(d.allowed) {
                        updateUI(d.remaining, null, null);
                        if(isIOS()) window.location.href = v.url; else window.open(v.url, "_blank");
                    } else alert(d.error);
                };
                grid.appendChild(div);
            });
        };

        render(VIDEOS_DB);
        const filterLogic = () => {
            const query = searchInput.value.toLowerCase();
            const lang = langFilter.value;
            const filtered = VIDEOS_DB.filter(v => (v.title.toLowerCase().includes(query) || v.category.toLowerCase().includes(query)) && (lang === "all" || v.language === lang));
            render(filtered);
        };
        searchInput.oninput = filterLogic;
        langFilter.onchange = filterLogic;
    } catch (err) { grid.innerHTML = "<p>Klaida kraunant video.</p>"; }
}

async function checkSession() {
    let s = JSON.parse(localStorage.getItem('mathexa_session'));
    if(!s) return;
    try {
        const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"validateToken", token: s.token }) });
        const data = await res.json();
        if(data.success) { updateUI(data.clicks_remaining, data.expiry, data.support_id); showApp(); }
    } catch(e) { localStorage.clear(); }
}
