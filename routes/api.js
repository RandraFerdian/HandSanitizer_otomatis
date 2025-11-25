const express = require("express");
const router = express.Router();
const deviceController = require("../controllers/deviceController");
const historyController = require("../controllers/historyController");
const reportController = require("../controllers/reportController");

// Routes
router.post("/device/dispense/:id", deviceController.handleDispense);
router.get("/get_latest", deviceController.getLatestData);
router.get("/get_history", historyController.getHistory);
router.get("/download_report", reportController.downloadPDF);

router.post("/refill", deviceController.refillDevice);
router.post("/update_settings", deviceController.updateSettings);

// --- FITUR BARU ---
router.post("/toggle_lock", deviceController.toggleLock); // Tombol Kunci
router.post("/remote_pump", deviceController.triggerPump); // Tombol Pump

module.exports = router;
