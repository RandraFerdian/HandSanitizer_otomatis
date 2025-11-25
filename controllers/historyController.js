const db = require("../config/database");
const moment = require("moment");

exports.getHistory = (req, res) => {
  // ID alat (Pastikan sama dengan yang di database, biasanya '1' atau 'esp32-01')
  const device_id = "1";

  // Query: Ambil data 7 hari terakhir dari tabel daily_logs
  const sql = `
        SELECT log_date, total_usage 
        FROM daily_logs 
        WHERE device_id = ? 
        ORDER BY log_date ASC 
        LIMIT 7
    `;

  db.query(sql, [device_id], (err, results) => {
    if (err) {
      console.error("Error History:", err);
      return res.status(500).json({ error: err.message });
    }

    // Format data agar mudah dibaca oleh Chart.js di Frontend
    // Sumbu X: Tanggal (contoh: 25 Nov)
    const labels = results.map((row) => moment(row.log_date).format("DD MMM"));

    // Sumbu Y: Jumlah Pemakaian
    const data = results.map((row) => row.total_usage);

    res.json({
      labels: labels,
      data: data,
    });
  });
};
