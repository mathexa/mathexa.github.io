const API = "https://script.google.com/macros/s/AKfycbz69pxvZ942vatBifEhS34_EDxkg-j62WKfIQKdiHnrNrSMLC_2f7O9K7NBIm6ZlQEOAg/exec";
let VIDEOS_DB = [];

const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

document.addEventListener("DOMContentLoaded", () => {
    loadPrefixes();
    bindEvents();
    checkSession();
});

function bindEvents() {
    document.getElementById("btnLogin").onclick = () => show("login");
    document.getElementById("btnSignup").onclick = () => show("signup");
    document.getElementById("loginBtn").onclick = login;
    document.getElementById("signupBtn").onclick = signup;
    document.getElementById("settingsBtn").onclick = () => { show("settings"); };
    document.getElementById("closeSettings").onclick = () => { show("app"); };
    document.getElementById("logoutBtn").onclick = () => { localStorage.clear(); location.reload(); };
}

function showLoader(visible) {
    const loader = document.getElementById("globalLoader");
    visible ? loader.classList.remove("hidden") : loader.classList.add("hidden");
}

async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    if(!email || !password) return;
    
    showLoader(true);
    const res = await fetch(API, { method:"POST", body: JSON.stringify({ action:"login", email, password })});
    const data = await res.json();
    showLoader(false);

    if(data.success) {
        localStorage.setItem('mathexa_session', JSON.stringify({ token: data.token }));
        updateUI(data.clicks_remaining, data.expiry, data.support_id);
        showApp();
    } else {
        document.getElementById("loginStatus").innerText = data.error;
    }
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
        div.innerHTML = `
            <div class="v-badge">${v.platform} • ${v.language || 'LT'}</div>
            <h3>${v.title}</h3>
            <div class="v-cat">${v.category}</div>
        `;
        
        div.onclick = async () => {
            showLoader(true);
            const s = JSON.parse(localStorage.getItem('mathexa_session'));
            const r = await fetch(API, { method:"POST", body: JSON.stringify({ action:"watch", token: s.token })});
            const d = await r.json();
            
            if(d.allowed) {
                updateUI(d.remaining, null, null);
                if(isIOS()) {
                    window.location.href = v.url;
                } else {
                    window.open(v.url, "_blank");
                    showLoader(false);
                }
            } else {
                showLoader(false);
                alert(d.error);
            }
        };
        grid.appendChild(div);
    });
}

function updateUI(c, e, id) {
    const isP = e && new Date(e) > new Date();
    const txt = isP ? "PREMIUM" : "Liko: " + c;
    document.getElementById("headerClicks").innerText = txt;
    document.getElementById("clicksInfo").innerText = txt;
    if(id) document.getElementById("supportIdView").innerText = "ID: " + id;
}

function show(id) {
    ["landing","login","signup","app","settings"].forEach(div => document.getElementById(div).classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

// ... rest of loadPrefixes, checkSession, back ...
