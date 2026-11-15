const router = require("express").Router();
const { pool } = require("../database/db");
const verifyAdminToken = require("../middleware/auth");

router.get("/api/events", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, day, month, title, icon
      FROM events
      ORDER BY month ASC, day ASC, id ASC
    `);
    return res.json(result.rows);
  } catch (error) {
    console.error("Lỗi lấy danh sách sự kiện:", error);
    return res.status(500).json({
      message: "Không thể tải danh sách sự kiện.",
    });
  }
});

router.get("/api/events/today", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, day, month, title, icon
      FROM events
      WHERE
        day = EXTRACT(
          DAY FROM (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')
        )::integer
        AND
        month = EXTRACT(
          MONTH FROM (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')
        )::integer
      ORDER BY id ASC
    `);
    return res.json(result.rows);
  } catch (error) {
    console.error("Lỗi lấy sự kiện hôm nay:", error);
    return res.status(500).json({
      message: "Không thể tải sự kiện hôm nay.",
    });
  }
});

router.get(
  "/api/admin/events",
  verifyAdminToken,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT id, day, month, title, icon
        FROM events
        ORDER BY month ASC, day ASC, id ASC
      `);
      return res.json(result.rows);
    } catch (error) {
      console.error("Lỗi lấy danh sách sự kiện admin:", error);
      return res.status(500).json({
        message: "Không thể tải danh sách sự kiện.",
      });
    }
  }
);

router.post(
  "/api/admin/events",
  verifyAdminToken,
  async (req, res) => {
    try {
      const day = Number(req.body.day);
      const month = Number(req.body.month);
      const title = String(req.body.title || "").trim();
      const icon = String(req.body.icon || "📅").trim();
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        return res.status(400).json({
          message: "Ngày không hợp lệ.",
        });
      }
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        return res.status(400).json({
          message: "Tháng không hợp lệ.",
        });
      }
      if (!title) {
        return res.status(400).json({
          message: "Tiêu đề sự kiện không được để trống.",
        });
      }
      const result = await pool.query(
        `
        INSERT INTO events (day, month, title, icon)
        VALUES ($1, $2, $3, $4)
        RETURNING id, day, month, title, icon
        `,
        [day, month, title, icon || "📅"]
      );
      return res.status(201).json({
        message: "Thêm sự kiện thành công.",
        event: result.rows[0],
      });
    } catch (error) {
      console.error("Lỗi thêm sự kiện:", error);
      return res.status(500).json({
        message: "Không thể thêm sự kiện.",
      });
    }
  }
);

router.put(
  "/api/admin/events/:id",
  verifyAdminToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const day = Number(req.body.day);
      const month = Number(req.body.month);
      const title = String(req.body.title || "").trim();
      const icon = String(req.body.icon || "📅").trim();
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "ID sự kiện không hợp lệ.",
        });
      }
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        return res.status(400).json({
          message: "Ngày không hợp lệ.",
        });
      }
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        return res.status(400).json({
          message: "Tháng không hợp lệ.",
        });
      }
      if (!title) {
        return res.status(400).json({
          message: "Tiêu đề sự kiện không được để trống.",
        });
      }
      const result = await pool.query(
        `
        UPDATE events
        SET
          day = $1,
          month = $2,
          title = $3,
          icon = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING id, day, month, title, icon
        `,
        [day, month, title, icon || "📅", id]
      );
      if (!result.rows[0]) {
        return res.status(404).json({
          message: "Không tìm thấy sự kiện.",
        });
      }
      return res.json({
        message: "Cập nhật sự kiện thành công.",
        event: result.rows[0],
      });
    } catch (error) {
      console.error("Lỗi sửa sự kiện:", error);
      return res.status(500).json({
        message: "Không thể cập nhật sự kiện.",
      });
    }
  }
);

router.delete(
  "/api/admin/events/:id",
  verifyAdminToken,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "ID sự kiện không hợp lệ.",
        });
      }
      const result = await pool.query(
        `
        DELETE FROM events
        WHERE id = $1
        RETURNING id
        `,
        [id]
      );
      if (!result.rows[0]) {
        return res.status(404).json({
          message: "Không tìm thấy sự kiện.",
        });
      }
      return res.json({
        message: "Xóa sự kiện thành công.",
      });
    } catch (error) {
      console.error("Lỗi xóa sự kiện:", error);
      return res.status(500).json({
        message: "Không thể xóa sự kiện.",
      });
    }
  }
);

module.exports = router;
