const router = require("express").Router();
const { pool } = require("../database/db");
const verifyAdminToken = require("../middleware/auth");

router.get("/api/announcement", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        content,
        updated_at AS "updatedAt"
      FROM announcements
      WHERE id = 1
      LIMIT 1
    `);
    if (result.rows.length === 0) {
      return res.json({
        content: "",
        updatedAt: null,
      });
    }
    return res.json({
      content: result.rows[0].content || "",
      updatedAt: result.rows[0].updatedAt || null,
    });
  } catch (error) {
    console.error("Lỗi lấy thông báo:", error);
    return res.status(500).json({
      message: "Không thể tải thông báo.",
    });
  }
});

router.put(
  "/api/admin/announcement",
  verifyAdminToken,
  async (req, res) => {
    try {
      const content = String(req.body?.content || "").trim();
      const result = await pool.query(
        `
        INSERT INTO announcements (
          id,
          content,
          updated_at
        )
        VALUES (
          1,
          $1,
          NOW()
        )
        ON CONFLICT (id)
        DO UPDATE SET
          content = EXCLUDED.content,
          updated_at = NOW()
        RETURNING
          content,
          updated_at AS "updatedAt"
        `,
        [content || null]
      );
      return res.json({
        message: content
          ? "Đã cập nhật thông báo."
          : "Đã xóa thông báo.",
        content: result.rows[0].content || "",
        updatedAt: result.rows[0].updatedAt,
      });
    } catch (error) {
      console.error("Lỗi cập nhật thông báo:", error);
      return res.status(500).json({
        message: "Không thể cập nhật thông báo.",
      });
    }
  }
);

module.exports = router;
