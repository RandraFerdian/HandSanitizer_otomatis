const express = require("express");
const router = express.Router();

const deviceController = require("../controllers/deviceController");
const historyController = require("../controllers/historyController");
const reportController = require("../controllers/reportController");

// DEVICE
router.post("/save_data", deviceController.saveData);
router.get("/get_latest", deviceController.getLatestData);
router.post("/update_settings", deviceController.updateSettings); // NEW

// HISTORY & REPORT
router.get("/get_history", historyController.getHistory);
router.get("/download_report", reportController.downloadPDF);

module.exports = router;
