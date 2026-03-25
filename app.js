const API = "https://script.google.com/macros/s/AKfycbye2gT0gCj3DeCplIDAFB-JZE0DYDUIE3fejyYtHwApo6Us7jf_1LqRhhu5JyeHOyd8Rg/exec";
let VIDEOS_DB = [];

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

document.addEventListener("DOMContentLoaded", () => {
    loadPrefixes();
    bindEvents();
    checkSession();
});

function loadPrefixes() {
    const pref = document.getElementById("prefix");
    const codes = ["+370","+371","+372","+44","+49","+33"];
    codes.forEach(c => { const o = document.createElement("option"); o.value = c; o.innerText = c; pref.appendChild(o); });
}

function bindEvents() {
    document.getElementById("btnLogin").onclick = () => show("login");
    document.getElementById("btnSignup").onclick = () => show("signup");
    document.getElementById("loginBtn").onclick = login;
    document.getElementById("signupBtn").onclick = signup;
    document.getElementById("btnRedeem").onclick = redeem;
    document.getElementById("settingsBtn").onclick = () => show("settings");
    document.getElementById("closeSettings").onclick = () => show("app");
    document.getElementById("logoutBtn").onclick = () => { localStorage.clear(); location.reload(); };

    // Real-time Password Feedback
    const p2 = document.getElementById("password2");
    const p3 = document.getElementById("password3");
    const fb = document.getElementById("signupStatus");

    const validate = () => {
        if (p2.value.length < 8) { fb.innerText = "Bent 8 simboliai"; fb.style.color = "#ff8080"; }
        else if (p2.value !== p3.value && p3.value !== "") { fb.innerText = "Slaptažodžiai nesutampa"; fb.style.color = "#ff8080"; }
        else if (p2.value === p3.value && p2.value !== "") { fb.innerText = "Sutampa ir tinka"; fb.style.color = "#80ff80"; }
    };
    p2.oninput = validate;
    p3.oninput = validate;
}

async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    if(!email || !password) return;
    document.getElementById("loginStatus").innerText = "Jungiamasi...";
    const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"login", email, password })});
    const data = await res.json();
    if(data.success) {
        localStorage.setItem('mathexa_session', JSON.stringify({ token: data.token }));
        updateUI(data.clicks_remaining, data.expiry, data.support_id);
        showApp();
    } else document.getElementById("loginStatus").innerText = data.error;
}

async function signup() {
    const p2 = document.getElementById("password2").value;
    const p3 = document.getElementById("password3").value;
    if(p2.length < 8 || p2 !== p3) return;
    const data = { action: "signup", full_name: document.getElementById("name").value, email: document.getElementById("email2").value, password: p2, phone: document.getElementById("prefix").value + document.getElementById("phone").value, role: document.getElementById("role").value };
    const res = await fetch(API, { method:"POST", body: JSON.stringify(data)});
    const resData = await res.json();
    if(resData.success) { alert("Sukurta! Prisijunkite."); show("login"); } else alert(resData.error);
}

async function redeem() {
    const code = document.getElementById("subCode").value;
    const s = JSON.parse(localStorage.getItem('mathexa_session'));
    document.getElementById("subStatus").innerText = "Tikrinama...";
    const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"redeemCode", token: s.token, code })});
    const data = await res.json();
    if(data.success) {
        document.getElementById("subStatus").innerText = "Aktyvuota iki " + data.expiry;
        document.getElementById("subStatus").style.color = "#80ff80";
        updateUI(999, data.expiry, null);
    } else { document.getElementById("subStatus").innerText = data.error; document.getElementById("subStatus").style.color = "#ff8080"; }
}

function updateUI(c, e, id) {
    const isP = e && new Date(e) > new Date();
    const val = isP ? "PREMIUM" : "Liko: " + c;
    document.getElementById("headerClicks").innerText = val;
    document.getElementById("clicksInfo").innerText = isP ? "PREMIUM" : c;
    if(id) document.getElementById("supportIdView").innerText = "ID: " + id;
}

async function showApp() {
    show("app");
    const res = await fetch('videos.json');
    VIDEOS_DB = await res.json();
    const grid = document.getElementById("videos");
    grid.innerHTML = "";
    VIDEOS_DB.forEach(v => {
        const div = document.createElement("div");
        div.className = "video-card";
        div.innerHTML = `<div class="v-meta">${v.platform} • ${v.language || 'LT'}</div><h3>${v.title}</h3><div class="v-tag">${v.category}</div>`;
        div.onclick = async () => {
            const h = div.innerHTML;
            div.innerHTML = "<h3>Prašome palaukti...</h3><p>Jungiamasi prie serverio</p>";
            const s = JSON.parse(localStorage.getItem('mathexa_session'));
            const r = await fetch(API, { method:"POST", body: JSON.stringify({ action:"watch", token: s.token })});
            const d = await r.json();
            div.innerHTML = h;
            if(d.allowed) {
                updateUI(d.remaining, null, null);
                if(isIOS()) window.location.href = v.url; else window.open(v.url, "_blank");
            } else alert(d.error);
        };
        grid.appendChild(div);
    });
}

function show(id) {
    ["landing","login","signup","app","settings"].forEach(div => document.getElementById(div).classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}
function back() { show("landing"); }
async function checkSession() {
    let s = JSON.parse(localStorage.getItem('mathexa_session'));
    if(!s) return;
    const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"validateToken", token: s.token }) });
    const data = await res.json();
    if(data.success) { updateUI(data.clicks_remaining, data.expiry, data.support_id); showApp(); }
}
