const router = require("express").Router();
const { pool } = require("../database/db");
const verifyAdminToken = require("../middleware/auth");
const ExcelJS = require("exceljs");

router.get(
  "/api/admin/export-excel",
  verifyAdminToken,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          id,
          name,
          birthday,
          "deathDate",
          gender,
          class,
          phone,
          address,
          avatar,
          album
        FROM people
        ORDER BY id DESC
      `);
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Pixel Album";
      workbook.created = new Date();
      const worksheet = workbook.addWorksheet("Danh sách album");
      worksheet.columns = [
        { header: "STT", key: "stt", width: 8 },
        { header: "Họ và tên", key: "name", width: 28 },
        { header: "Ngày sinh", key: "birthday", width: 16 },
        { header: "Ngày mất", key: "deathDate", width: 16 },
        { header: "Giới tính", key: "gender", width: 12 },
        { header: "Lớp", key: "className", width: 16 },
        { header: "Số điện thoại", key: "phone", width: 18 },
        { header: "Địa chỉ", key: "address", width: 35 },
        { header: "Ảnh đại diện", key: "avatar", width: 45 },
        { header: "Liên kết album", key: "album", width: 45 },
      ];
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF16A34A" },
      };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.height = 25;
      const formatDate = (value) => {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString("vi-VN");
      };
      result.rows.forEach((person, index) => {
        worksheet.addRow({
          stt: index + 1,
          name: person.name || "",
          birthday: formatDate(person.birthday),
          deathDate: formatDate(person.deathDate),
          gender: person.gender || "",
          className: person.class || "",
          phone: person.phone || "",
          address: person.address || "",
          avatar: person.avatar || "",
          album: person.album || "",
        });
      });
      worksheet.autoFilter = { from: "A1", to: "J1" };
      worksheet.views = [{ state: "frozen", ySplit: 1 }];
      worksheet.eachRow((row, rowNumber) => {
        row.alignment = {
          vertical: "middle",
          horizontal: rowNumber === 1 ? "center" : "left",
          wrapText: true,
        };
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD1D5DB" } },
            left: { style: "thin", color: { argb: "FFD1D5DB" } },
            bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
            right: { style: "thin", color: { argb: "FFD1D5DB" } },
          };
        });
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `DanhSachAlbum-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      res.status(200);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );
      res.setHeader("Content-Length", buffer.length);
      return res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Lỗi xuất Excel:", error);
      return res.status(500).json({
        message: "Không thể xuất file Excel",
        error: error.message,
      });
    }
  }
);

module.exports = router;
