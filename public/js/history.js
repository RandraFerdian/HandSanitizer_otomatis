let myChart = null;

/* =========================================
   FUNCTION: TOGGLE HISTORY PANEL
   Deskripsi: Membuka/Menutup panel samping
   ========================================= */
function toggleHistory(show) {
  const panel = document.getElementById("historyPanel");
  if (show) {
    panel.classList.add("panel-visible");
    loadHistory();
  } else {
    panel.classList.remove("panel-visible");
  }
}

/* =========================================
   FUNCTION: LOAD HISTORY DATA
   Deskripsi: Mengambil data 7 hari terakhir & Render Grafik
   ========================================= */
async function loadHistory() {
  const list = document.getElementById("historyList");

  try {
    const res = await fetch("/api/get_history");
    const data = await res.json();

    // 1. Render List
    list.innerHTML = "";
    if (data.length === 0) {
      list.innerHTML =
        '<p class="text-center text-sm text-gray-400">Belum ada data.</p>';
    } else {
        data.forEach((item) => {
        list.innerHTML += `
                <div class="flex justify-between bg-white/50 dark:bg-gray-800/50 p-4 rounded-2xl items-center border border-gray-100/50 dark:border-gray-700/50 backdrop-blur-sm transition hover:bg-white/80 dark:hover:bg-gray-800/80">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold">
                            ${item.usage}
                        </div>
                        <div>
                            <p class="font-extrabold text-sm text-gray-900 dark:text-white">${
                            item.tanggal
                            }</p>
                            <p class="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold mt-0.5">Total Pakai</p>
                        </div>
                    </div>
                    <p class="font-bold text-gray-900 dark:text-white text-sm">Rp ${parseInt(
                    item.biaya
                    ).toLocaleString()}</p>
                </div>`;
});
    }

    // 2. Render Grafik
    renderChart(data);
  } catch (e) {
    console.log(e);
  }
}

/* =========================================
   FUNCTION: RENDER CHART
   Deskripsi: Menggambar grafik batang dengan Chart.js
   ========================================= */
function renderChart(apiData) {
  const ctx = document.getElementById("usageChart").getContext("2d");
  const isDark = document.documentElement.classList.contains("dark");
  const textColor = isDark ? "#9ca3af" : "#9ca3af";

  const sortedData = [...apiData].reverse();
  const labels = sortedData.map((item) => item.tanggal);
  const values = sortedData.map((item) => item.usage);

  if (myChart) myChart.destroy();

  myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: "#3b82f6",
          borderRadius: 4,
          barThickness: 12,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: "#1f2937", padding: 10, cornerRadius: 8 },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: textColor },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6",
            borderDash: [5, 5],
          },
          ticks: { display: false },
        },
      },
    },
  });
}

// Auto Load saat Web Dibuka
loadHistory();
