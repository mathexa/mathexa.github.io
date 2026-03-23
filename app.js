const API = "https://script.google.com/macros/s/AKfycbxbEPiviIb9bhOP9EFFUTsczWXISql08paCSVS4aKOMme1l8BJ01E0EoCyWo1DFgWa02g/exec";

let token = null;

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

  alert(JSON.stringify(res));
}

async function login() {
  const res = await api({
    action: "login",
    email: email.value,
    password: password.value
  });

  if (res.success) {
    token = res.token;
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadVideos();
  } else {
    alert(res.error);
  }
}

async function loadVideos() {
  const res = await fetch("videos.json");
  const videos = await res.json();

  const container = document.getElementById("videos");
  container.innerHTML = "";

  videos.forEach(v => {
    const btn = document.createElement("button");
    btn.innerText = "Žiūrėti " + v.title;

    btn.onclick = async () => {
      const check = await api({
        action: "watch",
        token
      });

      if (!check.allowed) {
        document.getElementById("overlay").classList.remove("hidden");
        return;
      }

      window.open(v.url, "_blank");
    };

    container.appendChild(btn);
  });
}
