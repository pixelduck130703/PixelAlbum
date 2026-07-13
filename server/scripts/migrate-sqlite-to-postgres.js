require("dotenv").config();

const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const {
  pool,
  initializeDatabase,
} = require("../database/db");

const sqlitePath = path.join(
  __dirname,
  "../database/people.db"
);

const sqliteDb = new sqlite3.Database(
  sqlitePath,
  sqlite3.OPEN_READONLY,
  (error) => {
    if (error) {
      console.error(
        "Không mở được SQLite:",
        error.message
      );
    }
  }
);

function readSQLitePeople() {
  return new Promise((resolve, reject) => {
    sqliteDb.all(
      "SELECT * FROM people ORDER BY id ASC",
      [],
      (error, rows) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(rows);
      }
    );
  });
}

async function migrate() {
  try {
    await initializeDatabase();

    const people = await readSQLitePeople();

    console.log(
      `Tìm thấy ${people.length} bản ghi trong SQLite`
    );

    for (const person of people) {
      await pool.query(
        `
          INSERT INTO people (
            id,
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
            $7, $8, $9, $10, $11, $12
          )
          ON CONFLICT (id)
          DO UPDATE SET
            name = EXCLUDED.name,
            birthday = EXCLUDED.birthday,
            "deathDate" = EXCLUDED."deathDate",
            gender = EXCLUDED.gender,
            class = EXCLUDED.class,
            phone = EXCLUDED.phone,
            address = EXCLUDED.address,
            avatar = EXCLUDED.avatar,
            album = EXCLUDED.album,
            "securityQuestion" =
              EXCLUDED."securityQuestion",
            "securityAnswer" =
              EXCLUDED."securityAnswer",
            "updatedAt" = CURRENT_TIMESTAMP
        `,
        [
          person.id,
          person.name,
          person.birthday || null,
          person.deathDate || null,
          person.gender || null,
          person.class || null,
          person.phone || null,
          person.address || null,
          person.avatar || null,
          person.album || null,
          person.securityQuestion || null,
          person.securityAnswer || null,
        ]
      );
    }

    await pool.query(`
      SELECT setval(
        pg_get_serial_sequence('people', 'id'),
        COALESCE((SELECT MAX(id) FROM people), 1),
        true
      )
    `);

    console.log(
      `✅ Đã chuyển ${people.length} người sang PostgreSQL Docker`
    );
  } catch (error) {
    console.error(
      "❌ Chuyển dữ liệu thất bại:",
      error
    );

    process.exitCode = 1;
  } finally {
    sqliteDb.close();
    await pool.end();
  }
}

migrate();