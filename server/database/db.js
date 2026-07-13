const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error(
    "Thiếu DATABASE_URL trong file server/.env"
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (error) => {
  console.error(
    "Lỗi PostgreSQL ngoài dự kiến:",
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

  console.log(
    "✅ PostgreSQL Docker đã kết nối và bảng people đã sẵn sàng"
  );
}

module.exports = {
  pool,
  initializeDatabase,
};