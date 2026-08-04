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