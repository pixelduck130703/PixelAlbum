const router = require("express").Router();
const { pool } = require("../database/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

router.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tài khoản và mật khẩu.",
      });
    }
    const validUsername = process.env.ADMIN_USERNAME || "admin";
    if (username !== validUsername) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản hoặc mật khẩu không đúng.",
      });
    }
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_passwords (
          id SERIAL PRIMARY KEY,
          password_hash VARCHAR(255) NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    let passResult = await pool.query(
      `SELECT id, password_hash FROM admin_passwords ORDER BY id DESC LIMIT 1`
    );
    let currentPassHash;
    if (passResult.rowCount === 0) {
      const defaultPassword = process.env.ADMIN_PASSWORD || "admin123";
      currentPassHash = await bcrypt.hash(defaultPassword, 10);
      await pool.query(
        `INSERT INTO admin_passwords (password_hash) VALUES ($1)`,
        [currentPassHash]
      );
    } else {
      currentPassHash = passResult.rows[0].password_hash;
    }
    const isMatch = await bcrypt.compare(password, currentPassHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản hoặc mật khẩu không đúng.",
      });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server chưa cấu hình JWT_SECRET.",
      });
    }
    const token = jwt.sign(
      {
        role: "admin",
        username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );
    return res.json({
      success: true,
      message: "Đăng nhập thành công.",
      token,
    });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể đăng nhập do lỗi máy chủ.",
      error: error.message,
    });
  }
});

router.put("/api/admin/change-password", async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ mật khẩu cũ và mới.",
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự.",
      });
    }
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_passwords (
          id SERIAL PRIMARY KEY,
          password_hash VARCHAR(255) NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    let passResult = await pool.query(
      `SELECT id, password_hash FROM admin_passwords ORDER BY id DESC LIMIT 1`
    );
    let currentPassHash;
    let recordId;
    if (passResult.rowCount === 0) {
      const defaultPassword = "admin123";
      currentPassHash = await bcrypt.hash(defaultPassword, 10);
      const insertRes = await pool.query(
        `INSERT INTO admin_passwords (password_hash) VALUES ($1) RETURNING id, password_hash`,
        [currentPassHash]
      );
      recordId = insertRes.rows[0].id;
    } else {
      recordId = passResult.rows[0].id;
      currentPassHash = passResult.rows[0].password_hash;
    }
    const isMatch = await bcrypt.compare(oldPassword, currentPassHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu hiện tại không chính xác. (Nếu chưa đổi lần nào, mật khẩu mặc định là admin123)",
      });
    }
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE admin_passwords SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newPasswordHash, recordId]
    );
    return res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công.",
    });
  } catch (error) {
    console.error("Lỗi đổi mật khẩu:", error);
    return res.status(500).json({
      success: false,
      message: "Không thể đổi mật khẩu do lỗi máy chủ.",
      error: error.message,
    });
  }
});

module.exports = router;
