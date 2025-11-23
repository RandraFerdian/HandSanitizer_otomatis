const db = require("../config/database");
const PDFDocument = require("pdfkit");
const moment = require("moment");

exports.downloadPDF = (req, res) => {
  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Laporan_${moment().format("YYYY-MM-DD")}.pdf`
  );
  doc.pipe(res);

  // Desain Header
  doc.fontSize(20).text("SMART SANITIZER REPORT", { align: "center" });
  doc.moveDown();
  doc
    .fontSize(12)
    .text(`Tanggal Cetak: ${moment().format("DD MMMM YYYY")}`, {
      align: "center",
    });
  doc.moveDown(2);

  // Ambil Data Database
  db.query(
    "SELECT * FROM daily_logs ORDER BY log_date DESC LIMIT 30",
    (err, rows) => {
      if (err) {
        doc.text("Gagal ambil data");
        return doc.end();
      }

      // Header Tabel Manual
      let y = doc.y;
      doc
        .font("Helvetica-Bold")
        .text("Tanggal", 50, y)
        .text("Usage", 200, y)
        .text("Biaya", 350, y);
      doc.moveDown();

      // Isi Tabel
      doc.font("Helvetica");
      rows.forEach((row) => {
        y = doc.y;
        doc.text(moment(row.log_date).format("DD MMM YYYY"), 50, y);
        doc.text(row.total_usage + " x", 200, y);
        doc.text("Rp " + row.estimated_cost.toLocaleString(), 350, y);
        doc.moveDown();
      });

      doc.end();
    }
  );
};
