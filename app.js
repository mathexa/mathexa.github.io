const API = "https://script.google.com/macros/s/AKfycbyKBn6UyMgb2Kw-JB8egQjA17Os4q6fiseaCL36LyMiYtrWUyFgIiBRGolNmUCjaIU_mw/exec";
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

    document.getElementById("password2").oninput = (e) => {
        const fb = document.getElementById("passwordFeedback");
        if(e.target.value.length >= 8) { fb.innerText = "Tinkamas"; fb.style.color = "#80ff80"; }
        else { fb.innerText = "8+ simboliai"; fb.style.color = "#ff8080"; }
    };
    document.getElementById("password3").oninput = (e) => {
        const fb = document.getElementById("matchFeedback");
        const p2 = document.getElementById("password2").value;
        if(e.target.value === p2 && p2 !== "") { fb.innerText = "Sutampa"; fb.style.color = "#80ff80"; }
        else { fb.innerText = "Nesutampa"; fb.style.color = "#ff8080"; }
    };

    document.getElementById("btnRedeem").onclick = redeem;
}

async function checkSession() {
    let s = JSON.parse(localStorage.getItem('mathexa_session'));
    if(!s) return;
    if(!s.permanent && Date.now() > s.expiresAt) return logout();
    try {
        const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"validateToken", token: s.token }) });
        const data = await res.json();
        if(data.success) { 
            updateUI(data.clicks_remaining, data.expiry, data.support_id); 
            showApp(); 
            document.getElementById("stayLoginSettings").checked = s.permanent;
        } else logout();
    } catch(e) {}
}

async function login(u, p) {
    const email = u || document.getElementById("email").value;
    const password = p || document.getElementById("password").value;
    const status = document.getElementById("loginStatus");
    status.innerText = "Jungiamasi...";

    const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"login", email, password })});
    const data = await res.json();
    if(data.success) {
        localStorage.setItem('mathexa_session', JSON.stringify({ token: data.token, expiresAt: Date.now() + (3*3600000), permanent: false }));
        updateUI(data.clicks_remaining, data.expiry, data.support_id);
        showApp();
    } else { status.innerText = data.error; }
}

async function signup() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email2").value;
    const p2 = document.getElementById("password2").value;
    const p3 = document.getElementById("password3").value;
    const phone = document.getElementById("prefix").value + document.getElementById("phone").value;
    const role = document.getElementById("role").value;

    if(p2.length < 8 || p2 !== p3) return alert("Klaida slaptažodžio laukuose!");

    const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"signup", full_name:name, email, password:p2, phone, role })});
    const data = await res.json();
    if(data.success) login(email, p2); else alert(data.error);
}

async function redeem() {
    const code = document.getElementById("subCode").value;
    const status = document.getElementById("subStatus");
    const s = JSON.parse(localStorage.getItem('mathexa_session'));
    if(!code) return;

    status.innerText = "Tikrinama...";
    const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"redeemCode", token: s.token, code })});
    const data = await res.json();
    if(data.success) {
        status.innerText = "Aktyvuota!"; status.style.color = "#80ff80";
        updateUI(null, data.expiry, null);
    } else { status.innerText = data.error; status.style.color = "#ff8080"; }
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
        div.innerHTML = `<h3>${v.title}</h3><p>${v.category}</p>`;
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
    ["landing","login","signup","app","settings"].forEach(i => { if(document.getElementById(i)) document.getElementById(i).classList.add("hidden"); });
    if(id !== "none") document.getElementById(id).classList.remove("hidden");
}
function back() { show("landing"); }
