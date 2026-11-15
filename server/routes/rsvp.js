const router = require("express").Router();
const { pool } = require("../database/db");
const { getClientIp } = require("../services/visitorInfo");

router.post("/api/graduation-rsvp", async (req, res) => {
  try {
    const invitationId = String(
      req.body?.invitationId || req.body?.invitation_id || "graduation-01"
    ).trim();
    const name = String(req.body?.name || "").trim();
    const attendance = String(req.body?.attendance || "").trim();
    const guests = String(req.body?.guests || "alone").trim();
    const wishes = String(req.body?.wishes || "").trim();
    if (!invitationId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin thiệp mời.",
      });
    }
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập họ và tên.",
      });
    }
    if (!["yes", "maybe", "no"].includes(attendance)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái tham dự không hợp lệ.",
      });
    }
    if (!["alone", "plus_one", "group"].includes(guests)) {
      return res.status(400).json({
        success: false,
        message: "Thông tin người đi cùng không hợp lệ.",
      });
    }
    if (invitationId.length > 100) {
      return res.status(400).json({
        success: false,
        message: "ID thiệp không hợp lệ.",
      });
    }
    if (name.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Họ tên quá dài.",
      });
    }
    if (wishes.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Lời chúc không được vượt quá 2000 ký tự.",
      });
    }
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"] || null;
    const result = await pool.query(
      `
      INSERT INTO graduation_rsvps (
        invitation_id,
        name,
        attendance,
        guests,
        wishes,
        ip_address,
        user_agent
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )
      RETURNING
        id,
        invitation_id AS "invitationId",
        name,
        attendance,
        guests,
        wishes,
        submitted_at AS "submittedAt"
      `,
      [
        invitationId,
        name,
        attendance,
        guests,
        wishes || null,
        ipAddress,
        userAgent,
      ]
    );
    return res.status(201).json({
      success: true,
      message: "Xác nhận tham dự đã được gửi thành công.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Lỗi lưu xác nhận tham dự:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể lưu xác nhận tham dự.",
    });
  }
});

router.get("/api/admin/graduation-rsvps", async (req, res) => {
  try {
    const invitationId = String(
      req.query?.invitationId || req.query?.invitation_id || ""
    ).trim();
    let query = `
      SELECT
        id,
        invitation_id AS "invitationId",
        name,
        attendance,
        guests,
        wishes,
        ip_address AS "ipAddress",
        user_agent AS "userAgent",
        submitted_at AS "submittedAt"
      FROM graduation_rsvps
    `;
    const params = [];
    if (invitationId) {
      query += ` WHERE invitation_id = $1 `;
      params.push(invitationId);
    }
    query += ` ORDER BY submitted_at DESC `;
    const result = await pool.query(query, params);
    return res.status(200).json({
      success: true,
      total: result.rowCount,
      data: result.rows,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách xác nhận tham dự:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể tải danh sách xác nhận tham dự.",
      error: error.message,
    });
  }
});

router.delete(
  "/api/admin/graduation-rsvps/:id",
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({
          success: false,
          message: "ID phản hồi không hợp lệ.",
        });
      }
      const deleteResult = await pool.query(
        `
        DELETE FROM graduation_rsvps
        WHERE id = $1
        RETURNING id
        `,
        [id]
      );
      if (deleteResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy phản hồi cần xóa.",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Đã xóa phản hồi thành công.",
        deletedId: deleteResult.rows[0].id,
      });
    } catch (error) {
      console.error("Lỗi xóa xác nhận tham dự:", error);
      return res.status(500).json({
        success: false,
        message: "Không thể xóa phản hồi.",
        error: error.message,
      });
    }
  }
);

module.exports = router;
