const mysql = require("mysql2"); // Disarankan pakai mysql2

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "db_iot",
});

connection.connect((err) => {
  if (err) throw err;
  console.log("✅ Database Terhubung!");
});

module.exports = connection;
