
const DEFAULT_API_URL = "https://backend-horaxhora.onrender.com/api/peticiones";


const apiUrlInput = document.getElementById("apiUrl");
const saveApiUrlBtn = document.getElementById("saveApiUrl");
const fetchBtn = document.getElementById("fetchBtn");
const listEl = document.getElementById("list");
const statusEl = document.getElementById("status");
const offlineBanner = document.getElementById("offline-banner");

function getApiUrl() {
  return localStorage.getItem("API_URL") || DEFAULT_API_URL;
}
function setApiUrl(url) {
  localStorage.setItem("API_URL", url);
  apiUrlInput.value = url;
}

function updateOnlineStatus() {
  const online = navigator.onLine;
  offlineBanner.hidden = online;
  if (!online) {
    status("⚠️ Sin conexión. Mostrando datos en caché...");
  } else {
    status("");
  }
}
window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);
updateOnlineStatus();


apiUrlInput.value = getApiUrl();
saveApiUrlBtn.addEventListener("click", () => {
  if (apiUrlInput.value.trim().length < 10) return alert("URL inválida");
  setApiUrl(apiUrlInput.value.trim());
  status("✅ URL guardada correctamente.");
});


function renderItems(items) {
  listEl.innerHTML = "";
  if (!items || !items.length) {
    listEl.innerHTML = `<li class="item"><div class="title">Sin resultados</div><p class="desc">No hay peticiones disponibles.</p></li>`;
    return;
  }
  for (const it of items) {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <div class="title">${it.titulo || it.title || "Petición sin título"}</div>
      <p class="desc">${it.descripcion || it.description || "Sin descripción"}</p>
    `;
    listEl.appendChild(li);
  }
}
function status(msg) {
  statusEl.textContent = msg || "";
}


async function fetchData() {
  const url = getApiUrl();
  status("🔄 Cargando peticiones...");
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status + " " + res.statusText);
    const data = await res.json();


    const cache = await caches.open("api-cache-v1");
    await cache.put(url, new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    }));

    renderItems(Array.isArray(data) ? data : data.items || []);
    status("✅ Datos actualizados desde la red");
  } catch (err) {
    status("⚠️ Error de red, mostrando caché...");
    try {
      const cache = await caches.open("api-cache-v1");
      const cached = await cache.match(url);
      if (cached) {
        const data = await cached.json();
        renderItems(Array.isArray(data) ? data : data.items || []);
        status("📦 Datos cargados desde caché");
      } else {
        renderItems([]);
        status("Sin datos guardados.");
      }
    } catch {
      renderItems([]);
      status("No fue posible cargar datos.");
    }
  }
}
fetchBtn.addEventListener("click", fetchData);


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("SW registrado correctamente"))
      .catch(err => console.error("SW error:", err));
  });
}


(async () => {
  const url = getApiUrl();
  try {
    const cache = await caches.open("api-cache-v1");
    const cached = await cache.match(url);
    if (cached) {
      const data = await cached.json();
      renderItems(data);
      status("📦 Mostrando datos desde caché inicial");
    }
  } catch {}
  if (navigator.onLine) fetchData();
})();
