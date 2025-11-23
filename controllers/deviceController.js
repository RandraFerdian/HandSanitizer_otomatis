const db = require("../config/database");
const moment = require("moment");

exports.saveData = (req, res) => {
  // ... (LOGIKA SAVE DATA SAMA SEPERTI SEBELUMNYA, TIDAK BERUBAH) ...
  // Copy paste bagian saveData dari versi sebelumnya
  const { sisa, count, custom_date } = req.body;
  const device_id = "esp32-01";

  db.query(
    "SELECT * FROM devices WHERE device_id = ?",
    [device_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });

      const oldData = result[0];
      const oldLevel = oldData ? oldData.current_level : 100;
      const oldCount = oldData ? oldData.total_usage_recorded : count;
      const price = oldData ? oldData.price_per_liter : 20000;

      if (oldLevel - sisa > 5 && count === oldCount) {
        console.log("⚠️ ANOMALI TERDETEKSI!");
        db.query(
          "INSERT INTO events (device_id, event_type, description) VALUES (?, 'ANOMALY', ?)",
          [
            device_id,
            `Level turun ${oldLevel}% -> ${sisa}% tanpa aktivitas pump.`,
          ]
        );
      }

      db.query(
        "UPDATE devices SET current_level = ?, total_usage_recorded = ?, last_update = NOW() WHERE device_id = ?",
        [sisa, count, device_id]
      );

      let logDate = custom_date
        ? moment(custom_date).format("YYYY-MM-DD")
        : moment().format("YYYY-MM-DD");
      const mlPerPump = 2.0;
      const mlUsed = count * mlPerPump;
      const cost = (mlUsed / 1000) * price;

      const sqlHistory = `
            INSERT INTO daily_logs (device_id, log_date, total_usage, total_ml_used, estimated_cost)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE total_usage = VALUES(total_usage), estimated_cost = VALUES(estimated_cost)
        `;

      db.query(sqlHistory, [device_id, logDate, count, mlUsed, cost]);
      res.json({ status: "success", received_date: logDate });
    }
  );
};

/* --- MODIFIKASI: GET LATEST DATA --- */
exports.getLatestData = (req, res) => {
  const device_id = "esp32-01";

  // Tambahkan kolom config ke query
  const sqlDevice = `
        SELECT d.current_level, d.tank_capacity_ml, d.price_per_liter,
               l.total_usage, l.estimated_cost
        FROM devices d 
        LEFT JOIN daily_logs l ON d.device_id = l.device_id AND l.log_date = CURDATE()
        WHERE d.device_id = ?`;

  const sqlAvg = `
        SELECT AVG(total_usage) as avg_usage 
        FROM daily_logs 
        WHERE device_id = ? AND log_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;

  db.query(sqlDevice, [device_id], (err, resDevice) => {
    if (err) return res.status(500).json({ error: err });

    db.query(sqlAvg, [device_id], (err2, resAvg) => {
      const data = resDevice[0] || {};
      const avgUsage = resAvg[0].avg_usage || 10;

      const dropPerPump = (2.0 / (data.tank_capacity_ml || 500)) * 100;
      const safeAvgUsage = avgUsage < 1 ? 1 : avgUsage;
      const dailyDropPercent = safeAvgUsage * dropPerPump;

      let daysLeft = 0;
      if (dailyDropPercent > 0) {
        daysLeft = Math.ceil(data.current_level / dailyDropPercent);
      }
      if (data.current_level > 20 && daysLeft < 1) daysLeft = 1;

      res.json({
        sisa_cairan: data.current_level || 0,
        jumlah_pakai: data.total_usage || 0,
        biaya_hari_ini: data.estimated_cost || 0,
        estimasi_hari: daysLeft,
        // Kirim config ke frontend
        config: {
          harga: data.price_per_liter,
          kapasitas: data.tank_capacity_ml,
        },
      });
    });
  });
};

/* --- MODIFIKASI: UPDATE SETTINGS --- */
exports.updateSettings = (req, res) => {
  const { harga, kapasitas } = req.body;
  const device_id = "esp32-01";

  const sql =
    "UPDATE devices SET price_per_liter = ?, tank_capacity_ml = ? WHERE device_id = ?";

  db.query(sql, [harga, kapasitas, device_id], (err, result) => {
    if (err)
      return res.status(500).json({ status: "error", message: err.message });
    res.json({ status: "success", message: "Konfigurasi disimpan" });
  });
};
