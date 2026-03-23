const API = "https://script.google.com/macros/s/AKfycbznzEG3Y89F0mrA8NxxMne5C-UCPJAu1Ru-neMVnUZWf7qIlPQVlZV3UUnDDj9G0J9Xmw/exec";

let token = null;
let clicksRemaining = 0;
let subscriptionExpiry = null;
let lang = "lt";

// ===== TEXT =====
const TEXT = {
  lt: {
    title: "Mokymosi platforma",
    login: "Prisijungti",
    signup: "Registruotis",
    connecting: "Jungiamasi...",
    loading: "Kraunama...",
    limit: "Limitas pasiektas"
  },
  en: {
    title: "Learning Platform",
    login: "Login",
    signup: "Sign up",
    connecting: "Connecting...",
    loading: "Loading...",
    limit: "Limit reached"
  }
};

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  bindUI();
  setLang("lt");
});

// ===== UI BIND =====
function bindUI() {
  const el = id => document.getElementById(id);

  el("btnLogin").onclick = showLogin;
  el("btnSignup").onclick = showSignup;
  el("back1").onclick = back;
  el("back2").onclick = back;
  el("loginBtn").onclick = login;
  el("signupBtn").onclick = signup;
  el("langSwitch").onchange = e => setLang(e.target.value);

  // password validation
  el("password2").oninput = () => {
    const v = el("password2").value;
    el("passwordFeedback").innerText =
      v.length < 8 ? "Too short" :
      v.length > 24 ? "Too long" : "OK";
  };

  el("password3").oninput = () => {
    el("matchFeedback").innerText =
      el("password2").value === el("password3").value
        ? "Match" : "No match";
  };
}

// ===== LANGUAGE =====
function setLang(l) {
  lang = l;
  const t = TEXT[l];

  document.getElementById("title").innerText = t.title;
  document.getElementById("btnLogin").innerText = t.login;
  document.getElementById("btnSignup").innerText = t.signup;
  document.getElementById("loginTitle").innerText = t.login;
  document.getElementById("signupTitle").innerText = t.signup;
  document.getElementById("loginBtn").innerText = t.login;
  document.getElementById("signupBtn").innerText = t.signup;
}

// ===== NAV =====
function showLogin() {
  toggle("landing", false);
  toggle("login", true);
}

function showSignup() {
  toggle("landing", false);
  toggle("signup", true);
}

function back() {
  toggle("login", false);
  toggle("signup", false);
  toggle("landing", true);
}

function toggle(id, show) {
  document.getElementById(id).classList.toggle("hidden", !show);
}

// ===== API =====
async function api(data) {
  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify(data)
  });
  return res.json();
}

// ===== SIGNUP =====
async function signup() {
  const el = id => document.getElementById(id);

  if (!el("name").value || !el("email2").value || !el("password2").value) {
    alert("Fill required fields");
    return;
  }

  if (el("password2").value !== el("password3").value) {
    alert("Passwords mismatch");
    return;
  }

  const phone = el("prefix").value + el("phone").value;

  const res = await api({
    action: "signup",
    full_name: el("name").value,
    email: el("email2").value,
    phone,
    password: el("password2").value,
    role: el("role").value
  });

  alert(res.success ? "Created" : res.error);
}

// ===== LOGIN =====
async function login() {
  const el = id => document.getElementById(id);

  el("loginStatus").innerText = TEXT[lang].connecting;

  const res = await api({
    action: "login",
    email: el("email").value,
    password: el("password").value
  });

  if (res.success) {
    token = res.token;
    clicksRemaining = res.clicks_remaining;
    subscriptionExpiry = res.subscription_expiry;

    toggle("login", false);
    toggle("app", true);

    loadVideos();
  } else {
    el("loginStatus").innerText = res.error;
  }
}

// ===== SUB =====
function activeSub() {
  if (!subscriptionExpiry) return false;
  const [d,m,y] = subscriptionExpiry.split("/");
  return new Date(`${y}-${m}-${d}`) > new Date();
}

// ===== VIDEOS =====
async function loadVideos() {
  const el = id => document.getElementById(id);

  el("status").innerText = TEXT[lang].loading;

  const vids = await fetch("videos.json").then(r => r.json());

  el("videos").innerHTML = "";

  const active = activeSub();

  el("status").innerText = active
    ? "Subscription active"
    : "Clicks: " + clicksRemaining;

  vids.forEach(v => {
    const btn = document.createElement("button");
    btn.innerText = v.title;

    if (!token) btn.disabled = true;
    else if (!active && clicksRemaining <= 0) {
      btn.disabled = true;
      btn.innerText += " (" + TEXT[lang].limit + ")";
    }

    btn.onclick = async () => {
      btn.innerText = TEXT[lang].loading;

      const r = await api({ action: "watch", token });

      if (!r.allowed) {
        clicksRemaining = 0;
        loadVideos();
        return;
      }

      clicksRemaining = r.remaining;

      window.open(v.url, "_blank");
      loadVideos();
    };

    el("videos").appendChild(btn);
  });
}
