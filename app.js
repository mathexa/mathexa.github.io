async function watch(url) {
  const email = localStorage.getItem("email");

  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "use",
      email
    })
  });

  const data = await res.json();

  // DEBUG (remove later if you want)
  console.log("CLICK DATA:", data);

  if (data.blocked === true) {
    el("lock").classList.remove("hidden");
    return;
  }

  // SUCCESS → open video
  window.open(url, "_blank");
}
