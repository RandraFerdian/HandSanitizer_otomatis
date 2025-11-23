/* =========================================
    MODULE: DATABASE CONFIGURATION
    Fungsi: Mengatur koneksi ke MySQL XAMPP
   ========================================= */

const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "db_iot",
});

db.connect((err) => {
    if (err) {
        console.error("❌ ERROR: Gagal konek ke Database:", err.message);
    } else {
        console.log("✅ SUCCESS: Database MySQL Terhubung!");
    }
});

module.exports = db;
