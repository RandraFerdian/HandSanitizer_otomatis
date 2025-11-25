const db = require("../config/database");
const moment = require("moment");

exports.getHistory = (req, res) => {
  const device_id = "1"; // Sesuaikan ID alat kamu

  // Ambil 7 hari terakhir
  const sql = `
        SELECT log_date, total_usage 
        FROM daily_logs 
        WHERE device_id = ? 
        ORDER BY log_date ASC 
        LIMIT 7
    `;

  db.query(sql, [device_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    // Format data agar mudah dibaca Chart.js
    const labels = results.map((row) => moment(row.log_date).format("DD MMM")); // Sumbu X (Tanggal)
    const data = results.map((row) => row.total_usage); // Sumbu Y (Jumlah)

    res.json({ labels, data });
  });
};
