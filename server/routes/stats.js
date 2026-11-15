const router = require("express").Router();
const { pool } = require("../database/db");
const verifyAdminToken = require("../middleware/auth");

router.get("/api/stats", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_stats (
        stat_date DATE PRIMARY KEY
          DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
        visits INT DEFAULT 0,
        exports INT DEFAULT 0
      );
    `);

    // Đảm bảo có bản ghi cho ngày hôm nay
    await pool.query(`
      INSERT INTO app_stats (stat_date, visits, exports)
      VALUES (
        (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
        0,
        0
      )
      ON CONFLICT (stat_date) DO NOTHING;
    `);

    const result = await pool.query(`
      SELECT
        COALESCE(SUM(visits), 0)::BIGINT AS total_visits,
        COALESCE(SUM(exports), 0)::BIGINT AS total_exports,
        COALESCE(
          SUM(exports) FILTER (
            WHERE stat_date =
              (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
          ),
          0
        )::BIGINT AS today_exports
      FROM app_stats;
    `);

    const stats = result.rows[0];

    return res.status(200).json({
      success: true,
      totalVisits: Number(stats?.total_visits || 0),
      todayExports: Number(stats?.today_exports || 0),
      totalExports: Number(stats?.total_exports || 0),
    });
  } catch (error) {
    console.error("Lỗi lấy thống kê app_stats:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể lấy dữ liệu thống kê.",
    });
  }
});

router.post("/api/stats/visit", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_stats (
        stat_date DATE PRIMARY KEY
          DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
        visits INT DEFAULT 0,
        exports INT DEFAULT 0
      );
    `);

    await pool.query(`
      INSERT INTO app_stats (stat_date, visits, exports)
      VALUES (
        (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
        1,
        0
      )
      ON CONFLICT (stat_date)
      DO UPDATE SET visits = COALESCE(app_stats.visits, 0) + 1;
    `);

    return res.status(200).json({
      success: true,
      message: "Đã tăng lượt truy cập.",
    });
  } catch (error) {
    console.error("Lỗi ghi nhận lượt truy cập:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi ghi nhận lượt truy cập.",
    });
  }
});

router.post("/api/stats/export", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_stats (
        stat_date DATE PRIMARY KEY
          DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
        visits INT DEFAULT 0,
        exports INT DEFAULT 0
      );
    `);

    const result = await pool.query(`
      INSERT INTO app_stats (stat_date, visits, exports)
      VALUES (
        (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
        0,
        1
      )
      ON CONFLICT (stat_date)
      DO UPDATE SET exports = COALESCE(app_stats.exports, 0) + 1
      RETURNING exports;
    `);

    const todayExports = Number(result.rows[0]?.exports || 0);

    const totalResult = await pool.query(`
      SELECT COALESCE(SUM(exports), 0)::BIGINT AS total_exports
      FROM app_stats;
    `);

    const totalExports = Number(
      totalResult.rows[0]?.total_exports || 0
    );

    console.log(
      `[VIDEO EXPORTED] Hôm nay: ${todayExports} | Tổng: ${totalExports}`
    );

    return res.status(200).json({
      success: true,
      todayExports,
      totalExports,
    });
  } catch (error) {
    console.error("Lỗi ghi nhận xuất video:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi ghi nhận xuất video.",
    });
  }
});

router.get("/api/dashboard", verifyAdminToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*)::INTEGER AS "totalPeople",
        COUNT(*) FILTER (
          WHERE birthday IS NOT NULL
          AND "deathDate" IS NULL
          AND EXTRACT(MONTH FROM birthday) =
              EXTRACT(MONTH FROM CURRENT_DATE)
        )::INTEGER AS "thisMonth",
        COUNT(*) FILTER (
          WHERE album IS NOT NULL
          AND TRIM(album) <> ''
        )::INTEGER AS album,
        COUNT(*) FILTER (
          WHERE birthday IS NOT NULL
          AND "deathDate" IS NULL
          AND EXTRACT(MONTH FROM birthday) =
              EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(DAY FROM birthday) =
              EXTRACT(DAY FROM CURRENT_DATE)
        )::INTEGER AS today,
        COALESCE(
          SUM("albumViews"),
          0
        )::BIGINT AS "totalAlbumViews"
      FROM people
    `);
    const stats = result.rows[0];
    res.json({
      ...stats,
      totalAlbumViews: Number(stats.totalAlbumViews || 0),
    });
  } catch (error) {
    console.error("Lỗi lấy thống kê dashboard:", error);
    res.status(500).json({
      message: "Không thể lấy thống kê dashboard.",
      error: error.message,
    });
  }
});

router.post("/api/visits", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const totalResult = await client.query(`
      INSERT INTO website_stats (id, visits)
      VALUES (1, 1)
      ON CONFLICT (id)
      DO UPDATE
      SET visits = website_stats.visits + 1
      RETURNING visits
    `);
    await client.query(`
      INSERT INTO website_visit_daily (visit_date, visits)
      VALUES (
        (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
        1
      )
      ON CONFLICT (visit_date)
      DO UPDATE
      SET visits = website_visit_daily.visits + 1
    `);
    await client.query("COMMIT");
    return res.json({
      visits: Number(totalResult.rows[0].visits),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Lỗi tăng lượt truy cập:", error);
    return res.status(500).json({
      message: "Không thể cập nhật lượt truy cập",
    });
  } finally {
    client.release();
  }
});

router.get(
  "/api/admin/visit-chart",
  verifyAdminToken,
  async (req, res) => {
    try {
      const daysValue = Number(req.query.days);
      const days =
        Number.isInteger(daysValue) &&
        daysValue >= 7 &&
        daysValue <= 365
          ? daysValue
          : 30;
      const result = await pool.query(
        `
        WITH date_range AS (
          SELECT generate_series(
            (
              (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
              - ($1::integer - 1)
            ),
            (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
            INTERVAL '1 day'
          )::date AS visit_date
        )
        SELECT
          TO_CHAR(date_range.visit_date, 'YYYY-MM-DD') AS date,
          COALESCE(website_visit_daily.visits, 0)::integer AS visits
        FROM date_range
        LEFT JOIN website_visit_daily
          ON website_visit_daily.visit_date = date_range.visit_date
        ORDER BY date_range.visit_date ASC
        `,
        [days]
      );
      return res.json({
        days,
        data: result.rows.map((item) => ({
          date: item.date,
          visits: Number(item.visits) || 0,
        })),
      });
    } catch (error) {
      console.error("Lỗi lấy biểu đồ lượt truy cập:", error);
      return res.status(500).json({
        message: "Không thể tải biểu đồ lượt truy cập",
      });
    }
  }
);

router.get("/api/visits", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT visits
      FROM website_stats
      WHERE id = 1
    `);
    res.json({
      visits: Number(result.rows[0].visits),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      visits: 0,
    });
  }
});

module.exports = router;
