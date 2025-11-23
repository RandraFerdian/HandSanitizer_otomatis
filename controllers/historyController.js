const db = require("../config/database");
const moment = require("moment");

exports.getHistory = (req, res) => {
  const sql = `SELECT log_date, total_usage, estimated_cost FROM daily_logs ORDER BY log_date DESC LIMIT 7`;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    const formatted = results.map((row) => ({
      tanggal: moment(row.log_date).format("DD MMM"),
      usage: row.total_usage,
      biaya: row.estimated_cost,
    }));
    res.json(formatted);
  });
};
