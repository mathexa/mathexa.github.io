const API = "https://script.google.com/macros/s/AKfycbznzEG3Y89F0mrA8NxxMne5C-UCPJAu1Ru-neMVnUZWf7qIlPQVlZV3UUnDDj9G0J9Xmw/exec";

let token = null;
let clicksRemaining = 0;
let subscriptionExpiry = null;

// ===== LANGUAGE =====
let lang = "lt";

const TEXT = {
  lt: {
    loading: "Kraunama...",
    connecting: "Jungiamasi su serveriu...",
    limit: "Limitas pasiektas"
  },
  en: {
    loading: "Loading...",
    connecting: "Connecting...",
    limit: "Limit reached"
  }
};

function setLang(l) {
  lang = l;
}

// ===== UI NAV =====
function showLogin() {
  landing.classList.add("hidden");
  login.classList.remove("hidden");
}

function showSignup() {
  landing.classList.add("hidden");
  signup.classList.remove("hidden");
}

function back() {
  login.classList.add("hidden");
  signup.classList.add("hidden");
  landing.classList.remove("hidden");
}

// ===== PASSWORD LIVE VALIDATION =====
password2.oninput = () => {
  const val = password2.value;

  if (val.length < 8)
    passwordFeedback.innerText = "Too short";
  else if (val.length > 24)
    passwordFeedback.innerText = "Too long";
  else
    passwordFeedback.innerText = "OK";
};

password3.oninput = () => {
  matchFeedback.innerText =
    password2.value === password3.value ? "Match" : "No match";
};

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
  if (!name.value || !email2.value || !password2.value) {
    alert("Fill required fields");
    return;
  }

  if (password2.value !== password3.value) {
    alert("Passwords do not match");
    return;
  }

  const phoneFull = prefix.value + phone.value;

  const res = await api({
    action: "signup",
    full_name: name.value,
    email: email2.value,
    phone: phoneFull,
    password: password2.value,
    role: role.value
  });

  alert(res.success ? "Created" : res.error);
}

// ===== LOGIN =====
async function login() {
  loginStatus.innerText = TEXT[lang].connecting;

  const res = await api({
    action: "login",
    email: email.value,
    password: password.value
  });

  if (res.success) {
    token = res.token;
    clicksRemaining = res.clicks_remaining;
    subscriptionExpiry = res.subscription_expiry;

    login.classList.add("hidden");
    app.classList.remove("hidden");

    loadVideos();
  } else {
    loginStatus.innerText = res.error;
  }
}

// ===== SUB CHECK =====
function activeSub() {
  if (!subscriptionExpiry) return false;
  const [d,m,y] = subscriptionExpiry.split("/");
  return new Date(`${y}-${m}-${d}`) > new Date();
}

// ===== LOAD VIDEOS =====
async function loadVideos() {
  status.innerText = TEXT[lang].loading;

  const res = await fetch("videos.json");
  const vids = await res.json();

  videos.innerHTML = "";

  const active = activeSub();

  status.innerText = active
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

      const r = await api({
        action: "watch",
        token
      });

      if (!r.allowed) {
        clicksRemaining = 0;
        loadVideos();
        return;
      }

      clicksRemaining = r.remaining;

      window.open(v.url, "_blank");

      loadVideos();
    };

    videos.appendChild(btn);
  });
}
