/* =========================================
   MODULE: DASHBOARD CONTROLLER
   Fungsi: Mengatur data realtime & modal settings
   ========================================= */

async function fetchDashboard() {
  try {
    const res = await fetch("/api/get_latest");
    const data = await res.json();

    // 1. Update Angka Monitoring
    document.getElementById("valSisa").innerText =
      (data.sisa_cairan || 0) + "%";
    document.getElementById("valCount").innerText = data.jumlah_pakai || 0;
    document.getElementById("valCost").innerText =
      "Rp " + parseInt(data.biaya_hari_ini || 0).toLocaleString("id-ID");

    // 2. Update Progress Bar
    const bar = document.getElementById("progressBar");
    bar.style.width = (data.sisa_cairan || 0) + "%";

    // 3. Logika Kartu Forecasting
    const forecastEl = document.getElementById("valForecastCard");
    const daysLeft = parseInt(data.estimasi_hari);

    if (isNaN(daysLeft)) {
      forecastEl.innerText = "Menghitung...";
      forecastEl.className =
        "text-xl md:text-2xl font-extrabold text-gray-400 mt-1 tracking-tight truncate";
    } else if (daysLeft > 30) {
      forecastEl.innerText = "> 1 Bulan";
      forecastEl.className =
        "text-xl md:text-2xl font-extrabold text-green-600 dark:text-green-400 mt-1 tracking-tight truncate";
    } else if (daysLeft > 5) {
      forecastEl.innerText = daysLeft + " Hari Lagi";
      forecastEl.className =
        "text-xl md:text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1 tracking-tight truncate";
    } else if (daysLeft > 0) {
      forecastEl.innerText = daysLeft + " Hari (Kritis)";
      forecastEl.className =
        "text-xl md:text-2xl font-extrabold text-orange-500 animate-pulse mt-1 tracking-tight truncate";
    } else {
      forecastEl.innerText = "Habis Hari Ini";
      forecastEl.className =
        "text-xl md:text-2xl font-extrabold text-red-500 animate-pulse mt-1 tracking-tight truncate";
    }

    // 4. Alert Level
    if ((data.sisa_cairan || 0) <= 20) {
      document.getElementById("alertBox").classList.remove("hidden");
      bar.classList.remove("from-blue-500", "to-blue-400");
      bar.classList.add("from-red-500", "to-red-400");
    } else {
      document.getElementById("alertBox").classList.add("hidden");
      bar.classList.add("from-blue-500", "to-blue-400");
      bar.classList.remove("from-red-500", "to-red-400");
    }
  } catch (e) {
    console.log(e);
  }
}

// --- SETTINGS MODAL LOGIC ---
const modal = document.getElementById("settingsModal");
const modalCard = document.getElementById("modalCard");

function openSettings() {
  modal.classList.remove("opacity-0", "pointer-events-none");
  modalCard.classList.remove("scale-95");
  modalCard.classList.add("scale-100");

  // Ambil config saat ini
  fetch("/api/get_latest")
    .then((res) => res.json())
    .then((data) => {
      if (data.config) {
        document.getElementById("inputHarga").value = data.config.harga;
        document.getElementById("inputKapasitas").value = data.config.kapasitas;
      }
    });
}

function closeSettings() {
  modal.classList.add("opacity-0", "pointer-events-none");
  modalCard.classList.remove("scale-100");
  modalCard.classList.add("scale-95");
}

async function saveSettings() {
  const harga = document.getElementById("inputHarga").value;
  const kapasitas = document.getElementById("inputKapasitas").value;

  if (!harga || !kapasitas) {
    alert("Harap isi semua kolom!");
    return;
  }

  try {
    const res = await fetch("/api/update_settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ harga, kapasitas }),
    });

    const result = await res.json();
    if (result.status === "success") {
      // Animasi Tombol Sukses
      const btn = document.querySelector(
        '#settingsModal button[onclick="saveSettings()"]'
      );
      const oriHTML = btn.innerHTML;
      btn.innerHTML = `<i class="ph-bold ph-check-circle text-xl"></i> Berhasil Disimpan!`;
      btn.classList.replace("bg-blue-600", "bg-green-500");

      setTimeout(() => {
        closeSettings();
        btn.innerHTML = oriHTML;
        btn.classList.replace("bg-green-500", "bg-blue-600");
        fetchDashboard(); // Refresh data
      }, 1200);
    } else {
      alert("Gagal: " + result.message);
    }
  } catch (e) {
    alert("Error koneksi ke server");
  }
}

setInterval(fetchDashboard, 2000);
fetchDashboard();
