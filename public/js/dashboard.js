const API_URL = "/api";
let historyChart = null;

// === 1. FETCH DATA UTAMA ===
async function fetchData() {
  try {
    const response = await fetch(`${API_URL}/get_latest`);
    const data = await response.json();

    if (data && data.config) {
      // A. Update Lingkaran & Warna
      const persen = Math.round(data.sisa_cairan);
      const ring = document.getElementById("progress-ring");
      const levelText = document.getElementById("level-text");

      levelText.innerText = persen + "%";
      ring.style.setProperty("--percent", persen);

      // Warna: Merah jika < 20%
      if (persen <= 20) {
        ring.style.setProperty("--color", "#EF4444");
        levelText.className =
          "text-5xl font-bold text-red-500 tracking-tighter";
      } else {
        ring.style.setProperty("--color", "#3B82F6");
        levelText.className =
          "text-5xl font-bold text-blue-600 tracking-tighter";
      }

      // B. Update Teks Info
      const sisa = parseFloat(data.volume).toFixed(0);
      document.getElementById(
        "volume-text"
      ).innerText = `${sisa} / ${data.config.kapasitas} ml`;
      document.getElementById("usage-text").innerText = data.count;
      document.getElementById("est-text").innerText =
        data.estimasi > 0 ? data.estimasi : "-";

      // C. Update Tombol LOCK di Modal (Agar sinkron dengan HP lain)
      updateLockButton(data.is_active);

      // D. Update Indikator Online/Offline
      updateOnlineStatus(data.last_update);

      // E. Isi Form (Jika tidak sedang diketik)
      if (document.activeElement.tagName !== "INPUT") {
        document.getElementById("inputKapasitas").value = data.config.kapasitas;
        document.getElementById("inputPerPump").value = data.config.per_pump;
        document.getElementById("inputHarga").value = data.config.harga;
      }
    }
  } catch (error) {
    console.error("Gagal:", error);
  }
}

// === 2. UPDATE TAMPILAN LOCK ===
function updateLockButton(isActive) {
  const btn = document.getElementById("btn-lock");
  const icon = document.getElementById("icon-lock");
  const text = document.getElementById("text-lock");

  if (isActive === 1) {
    // UNLOCKED (Hijau)
    btn.className =
      "py-4 bg-green-100 text-green-700 hover:bg-green-200 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 transition";
    icon.className = "fa-solid fa-lock-open text-2xl mb-1";
    text.innerText = "Unlocked";
  } else {
    // LOCKED (Merah)
    btn.className =
      "py-4 bg-red-500 text-white hover:bg-red-600 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 transition shadow-lg shadow-red-200";
    icon.className = "fa-solid fa-lock text-2xl mb-1";
    text.innerText = "LOCKED";
  }
}

// === 3. UPDATE STATUS ONLINE ===
function updateOnlineStatus(lastUpdate) {
  // Sederhana: Jika update terakhir < 1 menit lalu, anggap online
  // (Perlu library moment.js atau hitung manual)
  // Disini kita pakai hitungan manual sederhana
  const lastTime = new Date(lastUpdate).getTime();
  const now = new Date().getTime();
  const diffSeconds = (now - lastTime) / 1000;

  const dot = document.getElementById("status-dot");
  const text = document.getElementById("status-text-header");

  if (diffSeconds < 60) {
    // 60 detik toleransi
    dot.className = "w-2 h-2 rounded-full bg-green-500 animate-pulse";
    text.innerText = "Online";
    text.className = "text-green-600 text-xs font-medium";
  } else {
    dot.className = "w-2 h-2 rounded-full bg-red-400";
    text.innerText = "Offline";
    text.className = "text-red-400 text-xs font-medium";
  }
}

// === 4. FUNGSI KONTROL (API CALLS) ===

async function toggleLock() {
  // Cek status teks tombol sekarang
  const isLocked = document.getElementById("text-lock").innerText === "LOCKED";
  const newState = isLocked ? 1 : 0; // Balik status

  await fetch(`${API_URL}/toggle_lock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: newState }),
  });
  fetchData(); // Refresh agar langsung berubah
}

async function remotePump() {
  if (confirm("Awas! Pastikan ada wadah. Lanjutkan pompa?")) {
    await fetch(`${API_URL}/remote_pump`, { method: "POST" });
    alert("Perintah dikirim! Tunggu sebentar.");
  }
}

async function doRefill() {
  if (confirm("Yakin sudah isi penuh?")) {
    await fetch(`${API_URL}/refill`, { method: "POST" });
    alert("Berhasil Reset!");
    closeModal();
    fetchData();
  }
}

async function saveSettings() {
  const body = {
    kapasitas: document.getElementById("inputKapasitas").value,
    per_pump: document.getElementById("inputPerPump").value,
    harga: document.getElementById("inputHarga").value,
  };
  await fetch(`${API_URL}/update_settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  alert("Tersimpan!");
  closeModal();
  fetchData();
}

function downloadReport() {
  window.open(`${API_URL}/download_report`, "_blank");
}

// === 5. CHART ===
async function loadHistoryChart() {
  try {
    const res = await fetch(`${API_URL}/get_history`);
    const hData = await res.json();
    const ctx = document.getElementById("historyChart").getContext("2d");

    if (historyChart) historyChart.destroy();

    historyChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: hData.labels,
        datasets: [
          {
            label: "Dispense",
            data: hData.data,
            backgroundColor: "#3B82F6",
            borderRadius: 6,
            barThickness: 20,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { display: true, borderDash: [5, 5] } },
          x: { grid: { display: false } },
        },
      },
    });
  } catch (e) {
    console.error(e);
  }
}

// === 6. MODAL HELPER ===
const modal = document.getElementById("settingsModal");
const modalContent = modal.querySelector("div");

function openModal() {
  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.remove("opacity-0");
    modalContent.classList.remove("scale-95");
    modalContent.classList.add("scale-100");
  }, 10);
}

function closeModal() {
  modal.classList.add("opacity-0");
  modalContent.classList.remove("scale-100");
  modalContent.classList.add("scale-95");
  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300);
}
window.onclick = (e) => {
  if (e.target == modal) closeModal();
};

// START
loadHistoryChart();
setInterval(fetchData, 2000);
fetchData();
