const API = "https://script.google.com/macros/s/AKfycbxbEPiviIb9bhOP9EFFUTsczWXISql08paCSVS4aKOMme1l8BJ01E0EoCyWo1DFgWa02g/exec";

let token = null;
let clicksRemaining = 0;
let subscriptionExpiry = null;

async function api(data) {
  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify(data)
  });
  return res.json();
}

async function signup() {
  const res = await api({
    action: "signup",
    full_name: name.value,
    email: email2.value,
    phone: phone.value,
    password: password2.value,
    role: role.value
  });

  alert(res.success ? "Account created" : res.error);
}

async function login() {
  const res = await api({
    action: "login",
    email: email.value,
    password: password.value
  });

  if (res.success) {
    token = res.token;
    clicksRemaining = res.clicks_remaining;
    subscriptionExpiry = res.subscription_expiry;

    auth.style.display = "none";
    app.style.display = "block";

    loadVideos();
  } else {
    alert(res.error);
  }
}

function isActive() {
  if (!subscriptionExpiry) return false;

  const [d,m,y] = subscriptionExpiry.split("/");
  return new Date(`${y}-${m}-${d}`) > new Date();
}

async function loadVideos() {
  const res = await fetch("videos.json");
  const vids = await res.json();

  videos.innerHTML = "";

  const active = isActive();

  const info = document.createElement("div");
  info.innerText = active
    ? "Subscription active"
    : "Clicks remaining: " + clicksRemaining;

  videos.appendChild(info);

  vids.forEach(v => {
    const btn = document.createElement("button");
    btn.innerText = "Žiūrėti " + v.title;

    if (!token) {
      btn.disabled = true;
      btn.innerText += " (login required)";
    } else if (!active && clicksRemaining <= 0) {
      btn.disabled = true;
      btn.innerText += " (limit reached)";
    }

    btn.onclick = async () => {
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

    videos.appendChild(btn);
  });
}
