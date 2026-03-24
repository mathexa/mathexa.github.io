const API = "https://script.google.com/macros/s/AKfycbwqHsQ88kSO9FdD8En9xepi79t8sL6L-rQ5diy8AtiWxNGFFU6JNm3B9GJpu-IwvS9OoQ/exec";

let VIDEOS_DB = [];
let isSubmitting = false;

document.addEventListener("DOMContentLoaded", () => {
    loadPrefixes();
    bindEvents();
    checkSession();
});

function loadPrefixes() {
    const pref = document.getElementById("prefix");
    const euCodes = ["+370", "+371", "+372", "+43", "+32", "+359", "+385", "+357", "+420", "+45", "+358", "+33", "+49", "+30", "+36", "+353", "+39", "+352", "+356", "+31", "+48", "+351", "+40", "+421", "+386", "+34", "+46"];
    euCodes.sort().forEach(code => {
        const opt = document.createElement("option");
        opt.value = code;
        opt.innerText = code;
        pref.appendChild(opt);
    });
}

function bindEvents() {
    document.getElementById("btnLogin").onclick = () => show("login");
    document.getElementById("btnSignup").onclick = () => show("signup");
    document.getElementById("back1").onclick = () => show("landing");
    document.getElementById("back2").onclick = () => show("landing");
    
    document.getElementById("settingsBtn").onclick = () => {
        document.getElementById("app").classList.add("hidden");
        document.getElementById("settings").classList.remove("hidden");
    };
    
    document.getElementById("closeSettings").onclick = () => {
        document.getElementById("settings").classList.add("hidden");
        document.getElementById("app").classList.remove("hidden");
    };

    document.getElementById("loginBtn").onclick = () => login();
    document.getElementById("signupBtn").onclick = signup;
    document.getElementById("logoutBtn").onclick = logout;
    
    document.getElementById("clearCacheBtn").onclick = () => {
        localStorage.clear();
        alert("Atmintis išvalyta. Puslapis bus perkrautas.");
        location.reload();
    };
}

async function checkSession() {
    const session = JSON.parse(localStorage.getItem('mathexa_session'));
    if (!session) return;

    // 3 Hour Expiry Logic
    if (!session.permanent && Date.now() > session.expiresAt) {
        localStorage.removeItem('mathexa_session');
        return;
    }

    try {
        const res = await fetch(API, { 
            method: "POST", 
            body: JSON.stringify({ action: "validateToken", token: session.token }) 
        });
        const data = await res.json();
        if (data.success) {
            updateUI(data.clicks_remaining, data.expiry, data.support_id);
            showApp();
        }
    } catch(e) { console.error("Session failed"); }
}

async function signup() {
    if(isSubmitting) return;
    const status = document.getElementById("signupStatus");
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email2").value.trim();
    const pass = document.getElementById("password2").value;
    const phone = document.getElementById("phone").value.trim() ? document.getElementById("prefix").value + document.getElementById("phone").value.trim() : "";

    if(!name || !email || !pass) { status.innerText = "Užpildykite duomenis"; return; }

    isSubmitting = true;
    status.innerText = "Kuriama...";

    try {
        const res = await fetch(API, {
            method: "POST",
            body: JSON.stringify({ action: "signup", full_name: name, email: email, password: pass, phone: phone })
        });
        const data = await res.json();
        if(data.success) await login(email, pass);
        else { status.innerText = data.error; isSubmitting = false; }
    } catch(e) { status.innerText = "Ryšio klaida"; isSubmitting = false; }
}

async function login(u, p) {
    const email = u || document.getElementById("email").value;
    const pass = p || document.getElementById("password").value;
    const status = u ? document.getElementById("signupStatus") : document.getElementById("loginStatus");

    try {
        const res = await fetch(API, { 
            method: "POST", 
            body: JSON.stringify({ action: "login", email, password: pass }) 
        });
        const data = await res.json();
        if(data.success) {
            localStorage.setItem('mathexa_session', JSON.stringify({
                token: data.token,
                expiresAt: Date.now() + (3 * 60 * 60 * 1000),
                permanent: false
            }));
            updateUI(data.clicks_remaining, data.expiry, data.support_id);
            showApp();
        } else { status.innerText = data.error; }
    } catch(e) { status.innerText = "Klaida prisijungiant"; }
}

function updateUI(clicks, expiry, supportId) {
    const isPremium = expiry && new Date(expiry) > new Date();
    const val = isPremium ? "Premium (Neribota)" : clicks;
    document.getElementById("headerClicks").innerText = "Limitas: " + val;
    document.getElementById("clicksInfo").innerText = "Liko peržiūrų: " + val;
    if(supportId) document.getElementById("supportIdDisplay").innerText = "ID: " + supportId;
}

async function showApp() {
    show("none");
    document.getElementById("app").classList.remove("hidden");
    
    // Fetch videos from JSON file
    try {
        const res = await fetch('videos.json');
        VIDEOS_DB = await res.json();
        renderVideos();
    } catch(e) { console.error("Could not load videos.json"); }
}

function renderVideos() {
    const grid = document.getElementById("videos");
    grid.innerHTML = "";
    VIDEOS_DB.forEach(v => {
        const card = document.createElement("div");
        card.className = "video-card";
        card.innerHTML = `<h3>${v.title}</h3><p>${v.category} • ${Math.floor(v.length/60)} min</p>`;
        card.onclick = () => handleWatch(v.url);
        grid.appendChild(card);
    });
}

async function handleWatch(url) {
    const session = JSON.parse(localStorage.getItem('mathexa_session'));
    const res = await fetch(API, { 
        method: "POST", 
        body: JSON.stringify({ action: "watch", token: session.token }) 
    });
    const data = await res.json();
    if(data.allowed) {
        updateUI(data.remaining, data.expiry, null);
        window.open(url, "_blank");
    } else { alert(data.error); }
}

function logout() {
    localStorage.removeItem('mathexa_session');
    location.reload();
}

function show(id) {
    ["landing","login","signup","app","settings"].forEach(div => {
        const el = document.getElementById(div);
        if(el) el.classList.add("hidden");
    });
    if(id !== "none") document.getElementById(id).classList.remove("hidden");
}
