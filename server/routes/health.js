const router = require("express").Router();
const { pool } = require("../database/db");

router.get("/", (req, res) => {
  res.send("🎂 Birthday Search API is running with PostgreSQL!");
});

router.get("/api/test", async (req, res) => {
  try {
    const result = await pool.query(`
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
      ORDER BY id DESC
    `);
    res.json({
      success: true,
      database: "PostgreSQL",
      total: result.rowCount,
      people: result.rows,
    });
  } catch (error) {
    console.error("Lỗi kiểm tra PostgreSQL:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
