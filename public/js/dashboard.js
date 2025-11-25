const API_URL = "/api"; //ganti menjadi ip laptop

// Variabel global untuk Chart agar bisa di-update
let historyChart = null;

// 1. FUNGSI UTAMA: Mengambil data Real-time
async function fetchData() {
  try {
    const response = await fetch(`${API_URL}/get_latest`);
    const data = await response.json();

    if (data && data.config) {
      // A. Update Lingkaran Persentase
      const persen = Math.round(data.sisa_cairan);
      const levelText = document.getElementById("level-text");
      const ring = document.getElementById("progress-ring");
      const statusLabel = document.getElementById("status-label");

      levelText.innerText = persen + "%";
      ring.style.setProperty("--percent", persen);

      // Logika Warna: Merah jika < 20%, Biru jika aman
      if (persen <= 20) {
        levelText.className =
          "text-6xl font-bold text-red-500 tracking-tighter";
        ring.style.setProperty("--color", "#EF4444"); // Merah Tailwind
        statusLabel.innerText = "Segera Isi Ulang!";
        statusLabel.className =
          "text-red-400 text-sm font-bold mt-1 animate-pulse";
      } else {
        levelText.className =
          "text-6xl font-bold text-blue-600 tracking-tighter";
        ring.style.setProperty("--color", "#3B82F6"); // Biru Tailwind
        statusLabel.innerText = "Kondisi Aman";
        statusLabel.className = "text-slate-400 text-sm font-medium mt-1";
      }

      // B. Update Teks Volume
      const sisa = parseFloat(data.volume).toFixed(0);
      const total = data.config.kapasitas;
      document.getElementById(
        "volume-text"
      ).innerText = `${sisa} / ${total} ml`;

      // C. Update Estimasi
      // Jika estimasi 0 atau minus, tampilkan tanda strip
      const estimasi = data.estimasi > 0 ? data.estimasi : "-";
      document.getElementById("est-text").innerText = estimasi;

      // D. Update Total Counter
      document.getElementById("usage-text").innerText = data.count;

      // E. Isi Form Modal (Hanya jika user tidak sedang mengetik)
      if (document.activeElement.tagName !== "INPUT") {
        document.getElementById("inputKapasitas").value = data.config.kapasitas;
        document.getElementById("inputPerPump").value = data.config.per_pump;
        document.getElementById("inputHarga").value = data.config.harga;
      }
    }
  } catch (error) {
    console.error("Gagal mengambil data:", error);
  }
}

// 2. FUNGSI MEMUAT GRAFIK (Chart.js)
async function loadHistoryChart() {
  try {
    const response = await fetch(`${API_URL}/get_history`);
    const historyData = await response.json();

    const ctx = document.getElementById("historyChart").getContext("2d");

    // Hapus chart lama sebelum gambar baru (agar tidak tumpang tindih)
    if (historyChart) {
      historyChart.destroy();
    }

    historyChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: historyData.labels, // Tanggal
        datasets: [
          {
            label: "Kali Dispense",
            data: historyData.data, // Jumlah Pakai
            backgroundColor: "#3B82F6", // Warna Biru
            borderRadius: 8, // Sudut tumpul batang
            barThickness: 25, // Ketebalan batang
            hoverBackgroundColor: "#2563EB",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }, // Sembunyikan legenda
          tooltip: {
            backgroundColor: "#1E293B",
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "#F1F5F9", borderDash: [5, 5] }, // Garis putus-putus halus
            ticks: { font: { family: "Poppins" }, color: "#94A3B8" },
            border: { display: false },
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: "Poppins" }, color: "#64748B" },
            border: { display: false },
          },
        },
      },
    });
  } catch (error) {
    console.error("Gagal load grafik:", error);
  }
}

// 3. FUNGSI TOMBOL AKSI
async function doRefill() {
  if (
    confirm("Apakah Anda yakin sudah mengisi botol sampai penuh? (Reset 100%)")
  ) {
    await fetch(`${API_URL}/refill`, { method: "POST" });
    alert("Berhasil Reset!");
    closeModal();
    fetchData(); // Refresh data
  }
}

async function saveSettings() {
  const kapasitas = document.getElementById("inputKapasitas").value;
  const per_pump = document.getElementById("inputPerPump").value;
  const harga = document.getElementById("inputHarga").value;

  await fetch(`${API_URL}/update_settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kapasitas, per_pump, harga }),
  });

  alert("Pengaturan Disimpan!");
  closeModal();
  fetchData();
}

function downloadReport() {
  window.open(`${API_URL}/download_report`, "_blank");
}

// 4. LOGIKA MODAL POPUP
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

// Tutup modal jika klik area gelap di luar
window.onclick = function (event) {
  if (event.target == modal) {
    closeModal();
  }
};

// 5. JALANKAN OTOMATIS
loadHistoryChart(); // Gambar grafik saat pertama buka
setInterval(fetchData, 2000); // Update data angka tiap 2 detik
fetchData(); // Panggil sekali di awal
