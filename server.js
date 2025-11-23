/* =========================================
   MODULE: SERVER UTAMA
   Fungsi: Menjalankan server Node.js
   ========================================= */

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const apiRoutes = require("./routes/api");

const app = express();
const port = 3000;

// --- MIDDLEWARE SETUP ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // Folder Frontend

// --- ROUTING SETUP ---
app.use("/api", apiRoutes);

// --- START SERVER ---
app.listen(port, () => {
  console.log(`\n🚀 SERVER SIAP! Akses di: http://localhost:${port}\n`);
});
