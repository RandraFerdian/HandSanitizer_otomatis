const db = require("../config/database");
const moment = require("moment");

const DEVICE_ID = "1";

// 1. HANDLE DISPENSE (Laporan dari ESP32)
exports.handleDispense = (req, res) => {
  const id_alat = req.params.id || DEVICE_ID;

  db.query(
    "SELECT * FROM devices WHERE device_id = ?",
    [id_alat],
    (err, results) => {
      if (err || results.length === 0) return res.json({});

      const device = results[0];

      // Jika status LOCKED (0), jangan kurangi stok (abaikan laporan)
      if (device.is_active === 0) {
        return res.json({ status: "ignored", msg: "Device is locked" });
      }

      let newVolume =
        parseFloat(device.current_volume_ml) -
        parseFloat(device.volume_per_pump_ml);
      if (newVolume < 0) newVolume = 0;
      const newPercent = (newVolume / device.tank_capacity_ml) * 100;
      const newCount = device.total_usage_recorded + 1;

      db.query(
        "UPDATE devices SET current_volume_ml=?, current_level=?, total_usage_recorded=?, last_update=NOW() WHERE device_id=?",
        [newVolume, newPercent, newCount, id_alat],
        () => {
          // Catat History
          const today = moment().format("YYYY-MM-DD");
          const cost =
            ((device.price_per_liter || 0) / 1000) * device.volume_per_pump_ml;

          const sqlHistory = `INSERT INTO daily_logs (device_id, log_date, total_usage, estimated_cost) VALUES (?, ?, 1, ?) 
                            ON DUPLICATE KEY UPDATE total_usage = total_usage + 1, estimated_cost = estimated_cost + ?`;

          db.query(sqlHistory, [id_alat, today, cost, cost]);
          res.json({ status: "success" });
        }
      );
    }
  );
};

// 2. GET DATA (Diakses oleh Dashboard & ESP32)
exports.getLatestData = (req, res) => {
  db.query(
    "SELECT * FROM devices WHERE device_id = ?",
    [DEVICE_ID],
    (err, results) => {
      if (err || results.length === 0) return res.json({});

      const data = results[0];

      // Logika Estimasi
      db.query(
        `SELECT AVG(total_usage) as avg FROM daily_logs WHERE device_id = ?`,
        [DEVICE_ID],
        (e, rAvg) => {
          const avg = rAvg[0].avg || 50;
          const mlDay = avg * data.volume_per_pump_ml;
          let daysLeft =
            mlDay > 0 ? Math.ceil(data.current_volume_ml / mlDay) : "-";

          res.json({
            sisa_cairan: data.current_level,
            volume: data.current_volume_ml,
            count: data.total_usage_recorded,
            estimasi: daysLeft,
            last_update: data.last_update,
            // INFO PENTING UTK ESP32
            is_active: data.is_active, // Status Kunci
            command: data.pending_command, // Perintah Pump

            config: {
              kapasitas: data.tank_capacity_ml,
              per_pump: data.volume_per_pump_ml,
              harga: data.price_per_liter,
            },
          });

          // BERSIHKAN PERINTAH SETELAH DIAMBIL (Supaya gak mompa terus)
          if (data.pending_command) {
            db.query(
              "UPDATE devices SET pending_command = NULL WHERE device_id = ?",
              [DEVICE_ID]
            );
          }
        }
      );
    }
  );
};

// 3. FITUR LOCK / UNLOCK (Baru)
exports.toggleLock = (req, res) => {
  const { status } = req.body; // 1 = Unlock, 0 = Lock
  db.query(
    "UPDATE devices SET is_active = ? WHERE device_id = ?",
    [status, DEVICE_ID],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ status: "success", new_state: status });
    }
  );
};

// 4. FITUR PUMP NOW (Baru)
exports.triggerPump = (req, res) => {
  db.query(
    "UPDATE devices SET pending_command = 'PUMP' WHERE device_id = ?",
    [DEVICE_ID],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ status: "success" });
    }
  );
};

// 5. REFILL & 6. SETTINGS (Sama seperti sebelumnya)
exports.refillDevice = (req, res) => {
  db.query(
    "UPDATE devices SET current_volume_ml = tank_capacity_ml, current_level = 100 WHERE device_id = ?",
    [DEVICE_ID],
    () => res.json({ status: "success" })
  );
};
exports.updateSettings = (req, res) => {
  const { kapasitas, per_pump, harga } = req.body;
  db.query(
    "UPDATE devices SET tank_capacity_ml=?, volume_per_pump_ml=?, price_per_liter=?, current_level=(current_volume_ml/?)*100 WHERE device_id=?",
    [kapasitas, per_pump, harga, kapasitas, DEVICE_ID],
    () => res.json({ status: "success" })
  );
};
