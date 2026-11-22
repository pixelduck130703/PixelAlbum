const { Pool, types } = require("pg");

/*
 * Giữ cột PostgreSQL DATE ở dạng chuỗi YYYY-MM-DD.
 * Tránh bị chuyển thành:
 * 2004-07-08T17:00:00.000Z
 */
types.setTypeParser(1082, (value) => value);

if (!process.env.DATABASE_URL) {
  throw new Error(
    "Thiếu DATABASE_URL trong file server/.env hoặc Environment Variables"
  );
}

const isLocalDatabase =
  process.env.DATABASE_URL.includes("localhost") ||
  process.env.DATABASE_URL.includes("127.0.0.1");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  /*
   * PostgreSQL Docker trên máy không cần SSL.
   * Neon khi deploy online cần SSL.
   */
  ssl: isLocalDatabase
    ? false
    : {
      rejectUnauthorized: false,
    },

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("connect", () => {
  console.log("✅ Đã kết nối PostgreSQL");
});

pool.on("error", (error) => {
  console.error(
    "❌ Lỗi PostgreSQL ngoài dự kiến:",
    error
  );
});

async function initializeDatabase() {
  await require('../services/salesTargets').initializeSalesTargets(pool);
  /*
   * ==========================
   * BẢNG PEOPLE
   * ==========================
   */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS people (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      birthday DATE,
      "deathDate" DATE,
      gender TEXT,
      class TEXT,
      phone TEXT,
      address TEXT,
      avatar TEXT,
      album TEXT,
      "securityQuestion" TEXT,
      "securityAnswer" TEXT,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("✅ Bảng people đã sẵn sàng");

  /*
   * ==========================
   * BẢNG THÔNG BÁO
   * ==========================
   */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY,
      content TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    INSERT INTO announcements (
      id,
      content,
      updated_at
    )
    VALUES (
      1,
      NULL,
      NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `);

  console.log("✅ Bảng announcements đã sẵn sàng");

  /*
   * ==========================
   * BẢNG NHẠC
   * ==========================
   */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS music_tracks (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      music_url TEXT NOT NULL,
      public_id TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  console.log("✅ Bảng music_tracks đã sẵn sàng");

  /*
   * ==========================
   * BẢNG NHẠC TRANG HOME
   * ==========================
   */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS home_music (
      id INTEGER PRIMARY KEY,
      track_id INTEGER,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      CONSTRAINT home_music_single_row
        CHECK (id = 1),

      CONSTRAINT home_music_track_id_fkey
        FOREIGN KEY (track_id)
        REFERENCES music_tracks(id)
        ON DELETE SET NULL
    )
  `);

  await pool.query(`
    INSERT INTO home_music (
      id,
      track_id,
      updated_at
    )
    VALUES (
      1,
      NULL,
      NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `);

  console.log("✅ Bảng home_music đã sẵn sàng");

  /*
   * ==========================
   * BẢNG THỐNG KÊ LƯỢT XEM ALBUM THEO NGÀY
   * ==========================
   *
   * Mỗi người chỉ có 1 dòng / ngày.
   *
   * views:
   *   Tổng số lượt mở album trong ngày.
   *
   * last_viewed_at:
   *   Thời điểm mở gần nhất.
   *
   * view_times:
   *   Danh sách toàn bộ thời điểm mở album.
   *
   * view_details:
   *   Chi tiết từng lượt mở:
   *   - viewedAt
   *   - browser
   *   - device
   *   - userAgent
   */
  await pool.query(`
    CREATE TABLE IF NOT EXISTS graduation_rsvps (
        id BIGSERIAL PRIMARY KEY,

        name VARCHAR(150) NOT NULL,

        attendance VARCHAR(20) NOT NULL
            CHECK (attendance IN ('yes', 'maybe', 'no')),

        guests VARCHAR(20) NOT NULL DEFAULT 'alone'
            CHECK (guests IN ('alone', 'plus_one', 'group')),

        wishes TEXT,

        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        ip_address INET,

        user_agent TEXT,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
`);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_graduation_rsvps_submitted_at
    ON graduation_rsvps (submitted_at DESC);
`);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_graduation_rsvps_attendance
    ON graduation_rsvps (attendance);
`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS album_view_by_person_daily (
      person_id INTEGER NOT NULL,
      view_date DATE NOT NULL,

      views INTEGER NOT NULL DEFAULT 0,

      last_viewed_at TIMESTAMPTZ,

      view_times TIMESTAMPTZ[]
        NOT NULL
        DEFAULT '{}',

      view_details JSONB
        NOT NULL
        DEFAULT '[]'::jsonb,

      PRIMARY KEY (
        person_id,
        view_date
      ),

      CONSTRAINT album_view_by_person_daily_person_fkey
        FOREIGN KEY (person_id)
        REFERENCES people(id)
        ON DELETE CASCADE
    )
  `);

  /*
   * Bảng có thể đã tồn tại từ trước,
   * nên cần ALTER TABLE để bổ sung các cột mới.
   */
  await pool.query(`
    ALTER TABLE album_view_by_person_daily
    ADD COLUMN IF NOT EXISTS
      view_times TIMESTAMPTZ[]
      NOT NULL
      DEFAULT '{}'
  `);

  await pool.query(`
    ALTER TABLE album_view_by_person_daily
    ADD COLUMN IF NOT EXISTS
      view_details JSONB
      NOT NULL
      DEFAULT '[]'::jsonb
  `);

  console.log(
    "✅ Bảng album_view_by_person_daily đã sẵn sàng"
  );

  /*
   * ==========================
   * INDEX
   * ==========================
   */
  await pool.query(`
    CREATE INDEX IF NOT EXISTS
      idx_album_view_by_person_daily_date
    ON album_view_by_person_daily (
      view_date DESC
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
      idx_album_view_by_person_daily_last_viewed
    ON album_view_by_person_daily (
      last_viewed_at DESC
    )
  `);

  console.log(
    "✅ Index album_view_by_person_daily đã sẵn sàng"
  );
}

/*
 * ==========================
 * TEST DATABASE
 * ==========================
 */
async function testDatabaseConnection() {
  const result = await pool.query(`
    SELECT
      NOW() AS current_time,
      current_database() AS database_name,
      current_user AS database_user
  `);

  return result.rows[0];
}

module.exports = {
  pool,
  initializeDatabase,
  testDatabaseConnection,
};
