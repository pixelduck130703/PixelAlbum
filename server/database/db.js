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
  /*
   * Bảng người dùng / album.
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
   * Bảng thông báo trang chủ.
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
   * Danh sách bài hát được tải lên Cloudinary.
   * File nhạc không lưu trực tiếp trong PostgreSQL.
   * PostgreSQL chỉ lưu tên bài hát, URL và public_id.
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
   * Bảng lưu bài hát đang được chọn phát trên trang Home.
   *
   * Chỉ sử dụng một dòng có id = 1.
   * track_id = NULL nghĩa là không phát nhạc.
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

  /*
   * Tạo cấu hình nhạc mặc định.
   * NULL nghĩa là trang Home chưa phát bài hát nào.
   */
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
}

async function testDatabaseConnection() {
  const result = await pool.query(
    "SELECT NOW() AS current_time"
  );

  return result.rows[0];
}

module.exports = {
  pool,
  initializeDatabase,
  testDatabaseConnection,
};