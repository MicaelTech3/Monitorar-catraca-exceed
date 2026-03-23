// ============================================================
//  app.js  —  Monitor de Catraca
//  Config Firebase embutida (sem import externo — evita 404
//  ao servir via Live Server / file:// / hosting simples)
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase, ref, onValue,
  query, orderByChild, limitToLast,
  set, remove
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ── Configuração Firebase ────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyBmefFVl9_2EMEUNnetGULfNkUrz3ojSAY",
  authDomain:        "exceed-contcatraca.firebaseapp.com",
  databaseURL:       "https://exceed-contcatraca-default-rtdb.firebaseio.com",
  projectId:         "exceed-contcatraca",
  storageBucket:     "exceed-contcatraca.firebasestorage.app",
  messagingSenderId: "728032480821",
  appId:             "1:728032480821:web:b2aa69a129a6f6781f6b7c",
};

// ── Firebase connect ─────────────────────────────────────────
window._fbConnect = function(config) {
  try {
    const app = initializeApp(config, "catraca-" + Date.now());
    const db  = getDatabase(app);

    window._zerarContagem = async () => {
      await set(ref(db, "/contador/total"), 0);
      await remove(ref(db, "/eventos"));
    };

    onValue(ref(db, "/contador/total"), snap => {
      const total = snap.val() || 0;
      const el = document.getElementById("contador-total");
      el.textContent = total.toLocaleString("pt-BR");
      el.classList.add("bump");
      setTimeout(() => el.classList.remove("bump"), 130);
      document.getElementById("meta-total-geral").textContent = total.toLocaleString("pt-BR");
      document.getElementById("card-total-geral").textContent = total.toLocaleString("pt-BR");
    });

    onValue(ref(db, "/status/arduino"), snap => {
      if (!snap.exists()) return;
      const s      = snap.val();
      const estado = s.estado   || "offline";
      const msg    = s.mensagem || "";
      const ts     = s.timestamp ? new Date(s.timestamp).toLocaleTimeString("pt-BR") : "";

      const pill = document.getElementById("arduino-pill");
      const lbl  = document.getElementById("arduino-label");
      pill.className = "arduino-pill " + estado;
      lbl.textContent = "Arduino " + (estado === "online" ? "online" : estado === "erro" ? "erro" : "offline");

      document.getElementById("meta-arduino").textContent =
        estado === "online" ? "✓ " + msg : "⚠ " + msg;

      const banner = document.getElementById("alert-banner");
      if (estado === "offline" || estado === "erro") {
        banner.className = "alert-banner show " + (estado === "erro" ? "warning" : "danger");
        document.getElementById("alert-icon").textContent = estado === "erro" ? "⚠️" : "🔌";
        document.getElementById("alert-msg").textContent  = msg;
        document.getElementById("alert-time").textContent = ts;
      } else {
        banner.className = "alert-banner";
      }
    });

    const evRef = query(ref(db, "/eventos"), orderByChild("timestamp"), limitToLast(200));
    onValue(evRef, snap => {
      if (!snap.exists()) return;
      const eventos = [];
      snap.forEach(c => eventos.push(c.val()));
      eventos.reverse();

      const feed = document.getElementById("feed");
      feed.innerHTML = "";
      document.getElementById("feed-count").textContent = eventos.length;

      eventos.slice(0, 100).forEach(ev => {
        const ms = ev.ms !== undefined ? ev.ms : (ev.hora_completa ? ev.hora_completa.split(".")[1] : "—");
        const row = document.createElement("div");
        row.className = "feed-row";
        row.innerHTML =
          '<span class="f-time">' + (ev.hora_completa || ev.hora || "—") + '</span>' +
          '<span class="f-date">' + (ev.data || "—") + '</span>' +
          '<span class="f-ms">'  + (ms !== "—" ? ms + " ms" : "—") + '</span>' +
          '<span class="f-idx">#' + ((ev.total_acumulado || "").toLocaleString("pt-BR")) + '</span>';
        feed.appendChild(row);
      });

      if (eventos.length > 0) {
        const u  = eventos[0];
        const ms = u.ms !== undefined ? u.ms : "—";
        document.getElementById("meta-ultima").textContent = u.hora_completa || u.hora || "—";
        document.getElementById("meta-data").textContent   = u.data || "—";
        document.getElementById("hero-ms").textContent     = "milissegundos: " + ms;
        document.getElementById("card-ms").textContent     = ms;
      }

      const agora     = new Date();
      const horaAtual = agora.toISOString().slice(0, 13);
      const desta_h   = eventos.filter(ev => ev.timestamp && ev.timestamp.startsWith(horaAtual)).length;
      document.getElementById("card-hora").textContent = desta_h;
      const hh = String(agora.getHours()).padStart(2, "0");
      document.getElementById("card-hora-range").textContent = hh + ":00 – " + hh + ":59";

      const hoje    = agora.toLocaleDateString("pt-BR");
      const de_hoje = eventos.filter(ev => ev.data === hoje).length;
      document.getElementById("card-total-hoje").textContent = de_hoje;
      document.getElementById("card-data-hoje").textContent  = hoje;

      const porDia = {};
      eventos.forEach(ev => { if (ev.data) porDia[ev.data] = (porDia[ev.data] || 0) + 1; });
      const dias = Object.keys(porDia).sort((a, b) => {
        const p = d => { const [dd, mm, yy] = d.split("/").map(Number); return new Date(yy, mm - 1, dd); };
        return p(b) - p(a);
      });
      const dayList = document.getElementById("day-list");
      dayList.innerHTML = "";
      dias.forEach(dia => {
        const isToday = dia === hoje;
        const item = document.createElement("div");
        item.className = "day-item" + (isToday ? " today" : "");
        item.innerHTML = '<span class="day-date">' + dia + '</span><span class="day-badge">' + porDia[dia] + '</span>';
        dayList.appendChild(item);
      });
    });

  } catch (e) {
    alert("Erro Firebase: " + e.message);
  }
};

// ── Auto-inicializar ─────────────────────────────────────────
window.addEventListener("load", () => {
  document.getElementById("cfg-apiKey").value     = firebaseConfig.apiKey;
  document.getElementById("cfg-authDomain").value = firebaseConfig.authDomain;
  document.getElementById("cfg-dbUrl").value      = firebaseConfig.databaseURL;
  document.getElementById("cfg-projectId").value  = firebaseConfig.projectId;
  window._fbConnect(firebaseConfig);
});

// ── Relógio ──────────────────────────────────────────────────
function updateClock() {
  const n = new Date(), p = (v, d = 2) => String(v).padStart(d, "0");
  document.getElementById("topbar-clock").textContent =
    p(n.getHours()) + ":" + p(n.getMinutes()) + ":" + p(n.getSeconds()) + "." + p(n.getMilliseconds(), 3);
}
setInterval(updateClock, 10);
updateClock();

// ── UI helpers ───────────────────────────────────────────────
window.goTab = function(name, btn) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
  document.getElementById("tab-" + name).classList.add("active");
  btn.classList.add("active");
  if (window.innerWidth < 720) closeSidebar();
};

window.toggleSidebar = function() { document.getElementById("sidebar").classList.toggle("open"); };
window.closeSidebar  = function() { document.getElementById("sidebar").classList.remove("open"); };
window.toggleConfig  = function() { document.getElementById("config-panel").classList.toggle("open"); };

window.salvarConfig = function() {
  const config = {
    apiKey:            document.getElementById("cfg-apiKey").value.trim(),
    authDomain:        document.getElementById("cfg-authDomain").value.trim(),
    databaseURL:       document.getElementById("cfg-dbUrl").value.trim(),
    projectId:         document.getElementById("cfg-projectId").value.trim(),
    storageBucket:     firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId:             firebaseConfig.appId,
  };
  if (!config.apiKey || !config.databaseURL) { alert("Preencha API Key e Database URL."); return; }
  document.getElementById("config-panel").classList.remove("open");
  window._fbConnect(config);
};

window.openModal  = function() { document.getElementById("modal-overlay").classList.add("open"); };
window.closeModal = function() { document.getElementById("modal-overlay").classList.remove("open"); };

window.confirmarZerar = async function() {
  const btn = document.getElementById("btn-confirmar");
  btn.textContent = "Zerando...";
  btn.disabled    = true;
  try {
    await window._zerarContagem();
    ["contador-total", "card-total-geral", "card-hora", "card-total-hoje", "card-ms"]
      .forEach(id => document.getElementById(id).textContent = "0");
    document.getElementById("feed").innerHTML =
      '<div style="padding:2.5rem;text-align:center;font-family:var(--mono);font-size:.77rem;color:var(--text3)">contagem zerada</div>';
    document.getElementById("feed-count").textContent = "0";
    document.getElementById("day-list").innerHTML =
      '<div style="padding:.4rem;font-family:var(--mono);font-size:.7rem;color:var(--text3)">—</div>';
    document.getElementById("hero-ms").textContent     = "milissegundos: —";
    document.getElementById("meta-ultima").textContent = "—";
  } catch (e) { alert("Erro ao zerar: " + e.message); }
  btn.textContent = "Sim, zerar";
  btn.disabled    = false;
  closeModal();
};

window.toggleStep = function(e, card) {
  if (!e.target.closest(".step-hdr")) return;
  card.classList.toggle("open");
};