const API = "https://script.google.com/macros/s/AKfycbz69pxvZ942vatBifEhS34_EDxkg-j62WKfIQKdiHnrNrSMLC_2f7O9K7NBIm6ZlQEOAg/exec";
let VIDEOS_DB = [];

document.addEventListener("DOMContentLoaded", () => {
    loadPrefixes();
    bindEvents();
    checkSession();
});

function loadPrefixes() {
    const pref = document.getElementById("prefix");
    const codes = ["+370","+371","+372","+44","+49","+33","+373"];
    codes.forEach(c => { const o = document.createElement("option"); o.value = c; o.innerText = c; pref.appendChild(o); });
}

function bindEvents() {
    document.getElementById("btnLogin").onclick = () => show("login");
    document.getElementById("btnSignup").onclick = () => show("signup");
    document.getElementById("loginBtn").onclick = login;
    document.getElementById("signupBtn").onclick = signup;
    document.getElementById("settingsBtn").onclick = () => { show("none"); document.getElementById("settings").classList.remove("hidden"); };
    document.getElementById("closeSettings").onclick = () => { document.getElementById("settings").classList.add("hidden"); document.getElementById("app").classList.remove("hidden"); };
    document.getElementById("logoutBtn").onclick = () => { localStorage.clear(); location.reload(); };
    document.getElementById("btnRedeem").onclick = redeem;

    document.getElementById("password2").oninput = (e) => {
        const fb = document.getElementById("passwordFeedback");
        if(e.target.value.length >= 8) { fb.innerText = "Tinkamas"; fb.style.color = "#80ff80"; }
        else { fb.innerText = "Bent 8 simboliai"; fb.style.color = "#ff8080"; }
    };
    document.getElementById("password3").oninput = (e) => {
        const fb = document.getElementById("matchFeedback");
        const p2 = document.getElementById("password2").value;
        if(e.target.value === p2 && p2 !== "") { fb.innerText = "Sutampa"; fb.style.color = "#80ff80"; }
        else { fb.innerText = "Nesutampa"; fb.style.color = "#ff8080"; }
    };
}

async function checkSession() {
    let s = JSON.parse(localStorage.getItem('mathexa_session'));
    if(!s) return;
    try {
        const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"validateToken", token: s.token }) });
        const data = await res.json();
        if(data.success) { updateUI(data.clicks_remaining, data.expiry, data.support_id); showApp(); }
        else { localStorage.clear(); }
    } catch(e) {}
}

async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const status = document.getElementById("loginStatus");
    if(!email || !password) return;
    status.innerText = "Kraunama...";
    const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"login", email, password })});
    const data = await res.json();
    if(data.success) {
        localStorage.setItem('mathexa_session', JSON.stringify({ token: data.token, permanent: document.getElementById("stayLoginSettings")?.checked }));
        updateUI(data.clicks_remaining, data.expiry, data.support_id);
        showApp();
    } else status.innerText = data.error;
}

async function signup() {
    const p2 = document.getElementById("password2").value;
    const p3 = document.getElementById("password3").value;
    if(p2.length < 8 || p2 !== p3) return;
    const data = {
        action: "signup",
        full_name: document.getElementById("name").value,
        email: document.getElementById("email2").value,
        password: p2,
        phone: document.getElementById("prefix").value + document.getElementById("phone").value,
        role: document.getElementById("role").value
    };
    const res = await fetch(API, { method:"POST", body: JSON.stringify(data)});
    const resData = await res.json();
    if(resData.success) { alert("Paskyra sukurta! Prisijunkite."); show("login"); }
    else alert(resData.error);
}

async function redeem() {
    const code = document.getElementById("subCode").value;
    const status = document.getElementById("subStatus");
    const s = JSON.parse(localStorage.getItem('mathexa_session'));
    if(!code || !s) return;
    status.innerText = "Tikrinama...";
    const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"redeemCode", token: s.token, code })});
    const data = await res.json();
    if(data.success) {
        status.innerText = "Aktyvuota iki " + data.expiry;
        status.style.color = "#80ff80";
        updateUI(999, data.expiry, null);
    } else { status.innerText = data.error; status.style.color = "#ff8080"; }
}

function updateUI(c, e, id) {
    const isP = e && new Date(e) > new Date();
    const txt = isP ? "PREMIUM" : "Liko: " + c;
    document.getElementById("headerClicks").innerText = txt;
    document.getElementById("clicksInfo").innerText = "Liko peržiūrų: " + txt;
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
        div.onclick = async () => {
            const s = JSON.parse(localStorage.getItem('mathexa_session'));
            const r = await fetch(API, { method:"POST", body: JSON.stringify({ action:"watch", token: s.token })});
            const d = await r.json();
            if(d.allowed) { window.open(v.url, "_blank"); updateUI(d.remaining, null, null); }
            else alert(d.error);
        };
        grid.appendChild(div);
    });
}

function show(id) {
    ["landing","login","signup","app","settings"].forEach(div => document.getElementById(div).classList.add("hidden"));
    if(id !== "none") document.getElementById(id).classList.remove("hidden");
}
function back() { show("landing"); }
