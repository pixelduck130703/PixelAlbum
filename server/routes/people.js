const router = require("express").Router();
const { pool } = require("../database/db");
const verifyAdminToken = require("../middleware/auth");
const bcrypt = require("bcryptjs");
const { normalizeSecurityAnswer, normalizeOptionalText, normalizeOptionalDate } = require("../utils/normalizers");

router.get("/api/people", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        "publicId",
        name,
        TO_CHAR(birthday, 'YYYY-MM-DD') AS birthday,
        TO_CHAR("deathDate", 'YYYY-MM-DD') AS "deathDate",
        gender,
        class,
        phone,
        address,
        avatar,
        album,
        "securityQuestion",
        COALESCE("albumViews", 0) AS "albumViews"
      FROM people
      ORDER BY
        COALESCE("albumViews", 0) DESC,
        id DESC;
    `);
    return res.json(result.rows);
  } catch (error) {
    console.error("Lỗi lấy danh sách người:", error);
    return res.status(500).json({
      message: "Lỗi máy chủ",
    });
  }
});

router.get("/api/people/public/:publicId", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        "publicId",
        name,
        TO_CHAR(birthday, 'YYYY-MM-DD') AS birthday,
        TO_CHAR("deathDate", 'YYYY-MM-DD') AS "deathDate",
        gender,
        class,
        phone,
        address,
        avatar,
        COALESCE("albumViews", 0) AS "albumViews",
        CASE
          WHEN "securityQuestion" IS NULL
            OR TRIM("securityQuestion") = ''
          THEN album
          ELSE NULL
        END AS album,
        CASE
          WHEN album IS NULL
            OR TRIM(album) = ''
          THEN FALSE
          ELSE TRUE
        END AS "hasAlbum",
        "securityQuestion"
      FROM people
      WHERE "publicId" = $1
      `,
      [req.params.publicId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người.",
      });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin người.",
    });
  }
});

router.get("/api/people/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        TO_CHAR(birthday, 'YYYY-MM-DD') AS birthday,
        TO_CHAR("deathDate", 'YYYY-MM-DD') AS "deathDate",
        gender,
        class,
        phone,
        address,
        avatar,
        CASE
          WHEN "securityQuestion" IS NULL
            OR TRIM("securityQuestion") = ''
          THEN album
          ELSE NULL
        END AS album,
        CASE
          WHEN album IS NULL
            OR TRIM(album) = ''
          THEN FALSE
          ELSE TRUE
        END AS "hasAlbum",
        "securityQuestion"
      FROM people
      WHERE id = $1
      `,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người.",
      });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Lỗi lấy thông tin người:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin người.",
      error: error.message,
    });
  }
});

router.get("/api/birthday/:birthday", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        TO_CHAR(birthday, 'YYYY-MM-DD') AS birthday,
        TO_CHAR("deathDate", 'YYYY-MM-DD') AS "deathDate",
        gender,
        class,
        phone,
        address,
        avatar,
        album,
        "securityQuestion"
      FROM people
      WHERE birthday = $1::date
      ORDER BY id DESC
      `,
      [req.params.birthday]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Lỗi tìm theo ngày sinh:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tìm theo ngày sinh.",
      error: error.message,
    });
  }
});

router.post(
  "/api/people",
  verifyAdminToken,
  async (req, res) => {
    try {
      const {
        name,
        birthday,
        deathDate,
        gender,
        class: className,
        phone,
        address,
        avatar,
        album,
        securityQuestion,
        securityAnswer,
      } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Họ tên không được để trống.",
        });
      }
      const normalizedBirthday =
        normalizeOptionalDate(birthday);
      const normalizedDeathDate =
        normalizeOptionalDate(deathDate);
      if (
        normalizedBirthday &&
        normalizedDeathDate &&
        normalizedDeathDate < normalizedBirthday
      ) {
        return res.status(400).json({
          success: false,
          message: "Ngày mất không thể trước ngày sinh.",
        });
      }
      const question =
        normalizeOptionalText(securityQuestion);
      const answer =
        normalizeSecurityAnswer(securityAnswer);
      if (question && !answer) {
        return res.status(400).json({
          success: false,
          message:
            "Đã nhập câu hỏi thì phải nhập câu trả lời.",
        });
      }
      let hashedAnswer = null;
      if (question) {
        hashedAnswer = await bcrypt.hash(answer, 10);
      }
      const result = await pool.query(
        `
        INSERT INTO people (
          name,
          birthday,
          "deathDate",
          gender,
          class,
          phone,
          address,
          avatar,
          album,
          "securityQuestion",
          "securityAnswer"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11
        )
        RETURNING id
        `,
        [
          name.trim(),
          normalizedBirthday,
          normalizedDeathDate,
          normalizeOptionalText(gender),
          normalizeOptionalText(className),
          normalizeOptionalText(phone),
          normalizeOptionalText(address),
          normalizeOptionalText(avatar),
          normalizeOptionalText(album),
          question,
          hashedAnswer,
        ]
      );
      res.status(201).json({
        success: true,
        message: "Thêm người thành công.",
        id: result.rows[0].id,
      });
    } catch (error) {
      console.error("Lỗi thêm người:", error);
      res.status(500).json({
        success: false,
        message: "Không thể thêm người.",
        error: error.message,
      });
    }
  }
);

router.put(
  "/api/people/:id",
  verifyAdminToken,
  async (req, res) => {
    try {
      const {
        name,
        birthday,
        deathDate,
        gender,
        class: className,
        phone,
        address,
        avatar,
        album,
        securityQuestion,
        securityAnswer,
      } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Họ tên không được để trống.",
        });
      }
      const normalizedBirthday =
        normalizeOptionalDate(birthday);
      const normalizedDeathDate =
        normalizeOptionalDate(deathDate);
      if (
        normalizedBirthday &&
        normalizedDeathDate &&
        normalizedDeathDate < normalizedBirthday
      ) {
        return res.status(400).json({
          success: false,
          message: "Ngày mất không thể trước ngày sinh.",
        });
      }
      const currentResult = await pool.query(
        `
        SELECT
          "securityQuestion",
          "securityAnswer"
        FROM people
        WHERE id = $1
        `,
        [req.params.id]
      );
      if (currentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người cần sửa.",
        });
      }
      const currentPerson = currentResult.rows[0];
      const question =
        normalizeOptionalText(securityQuestion);
      const newAnswer =
        normalizeSecurityAnswer(securityAnswer);
      let storedAnswer = currentPerson.securityAnswer;
      if (!question) {
        storedAnswer = null;
      } else if (newAnswer) {
        storedAnswer = await bcrypt.hash(newAnswer, 10);
      } else if (!currentPerson.securityAnswer) {
        return res.status(400).json({
          success: false,
          message:
            "Vui lòng nhập câu trả lời xác thực.",
        });
      }
      const updateResult = await pool.query(
        `
        UPDATE people
        SET
          name = $1,
          birthday = $2,
          "deathDate" = $3,
          gender = $4,
          class = $5,
          phone = $6,
          address = $7,
          avatar = $8,
          album = $9,
          "securityQuestion" = $10,
          "securityAnswer" = $11,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $12
        RETURNING id
        `,
        [
          name.trim(),
          normalizedBirthday,
          normalizedDeathDate,
          normalizeOptionalText(gender),
          normalizeOptionalText(className),
          normalizeOptionalText(phone),
          normalizeOptionalText(address),
          normalizeOptionalText(avatar),
          normalizeOptionalText(album),
          question,
          storedAnswer,
          req.params.id,
        ]
      );
      if (updateResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người cần sửa.",
        });
      }
      res.json({
        success: true,
        message: "Cập nhật thành công.",
      });
    } catch (error) {
      console.error("Lỗi cập nhật người:", error);
      res.status(500).json({
        success: false,
        message: "Không thể cập nhật dữ liệu.",
        error: error.message,
      });
    }
  }
);

router.delete(
  "/api/people/:id",
  verifyAdminToken,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        DELETE FROM people
        WHERE id = $1
        RETURNING id
        `,
        [req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người cần xóa.",
        });
      }
      res.json({
        success: true,
        message: "Xóa thành công.",
        deleted: result.rowCount,
      });
    } catch (error) {
      console.error("Lỗi xóa người:", error);
      res.status(500).json({
        success: false,
        message: "Không thể xóa dữ liệu.",
        error: error.message,
      });
    }
  }
);

module.exports = router;
