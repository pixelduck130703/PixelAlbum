const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const databasePath = path.join(__dirname, "people.db");

const db = new sqlite3.Database(databasePath, (error) => {
  if (error) {
    console.error("Lỗi kết nối SQLite:", error.message);
    return;
  }

  console.log("✅ Connected to SQLite");
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      birthday TEXT NOT NULL,
      deathDate TEXT,
      gender TEXT,
      class TEXT,
      phone TEXT,
      address TEXT,
      avatar TEXT,
      album TEXT,
      securityQuestion TEXT,
      securityAnswer TEXT
    )
  `);

  db.all("PRAGMA table_info(people)", [], (error, columns) => {
    if (error) {
      console.error("Lỗi kiểm tra cấu trúc bảng:", error.message);
      return;
    }

    const migrations = [
      {
        name: "deathDate",
        sql: "ALTER TABLE people ADD COLUMN deathDate TEXT",
      },
      {
        name: "securityQuestion",
        sql: "ALTER TABLE people ADD COLUMN securityQuestion TEXT",
      },
      {
        name: "securityAnswer",
        sql: "ALTER TABLE people ADD COLUMN securityAnswer TEXT",
      },
    ];

    migrations.forEach((migration) => {
      const exists = columns.some(
        (column) => column.name === migration.name
      );

      if (!exists) {
        db.run(migration.sql, (migrationError) => {
          if (migrationError) {
            console.error(
              `Lỗi thêm cột ${migration.name}:`,
              migrationError.message
            );
          } else {
            console.log(`✅ Đã thêm cột ${migration.name}`);
          }
        });
      }
    });
  });
});

module.exports = db;