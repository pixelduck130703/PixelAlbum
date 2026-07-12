require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./database/db");
const jwt = require("jsonwebtoken");
const app = express();
const verifyAdminToken = require("./middleware/auth");
const bcrypt = require("bcryptjs");

function normalizeSecurityAnswer(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

app.use(cors());
app.use(express.json());

function normalizeSecurityAnswer(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/* ==========================
   Trang chủ
========================== */

app.get("/", (req, res) => {
  res.send("🎂 Birthday Search API is running!");
});

/* ==========================
   Kiểm tra kết nối SQLite
========================== */

app.get("/api/test", (req, res) => {
  db.all("SELECT * FROM people", [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    res.json(rows);
  });
});

/* ==========================
   Lấy tất cả người
========================== */

app.get("/api/people", (req, res) => {

  const sql = `
    SELECT
      id,
      name,
      birthday,
      deathDate,
      gender,
      class,
      phone,
      address,
      avatar,
      album,
      securityQuestion
    FROM people
    ORDER BY id DESC
  `;

  db.all(sql, [], (err, rows) => {

    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }

    res.json(rows);

  });

});

/* ==========================
   Lấy theo ID
========================== */

app.get("/api/people/:id", (req, res) => {

  const sql = `
    SELECT
      id,
      name,
      birthday,
      deathDate,
      gender,
      class,
      phone,
      address,
      avatar,

      CASE
        WHEN securityQuestion IS NULL
          OR TRIM(securityQuestion)=''
        THEN album
        ELSE NULL
      END AS album,

      CASE
        WHEN album IS NULL
          OR TRIM(album)=''
        THEN 0
        ELSE 1
      END AS hasAlbum,

      securityQuestion

    FROM people
    WHERE id=?
  `;

  db.get(sql, [req.params.id], (err, row) => {

    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người."
      });
    }

    res.json(row);

  });

});

/* ==========================
   Tìm theo ngày sinh
========================== */

app.get("/api/birthday/:birthday", (req, res) => {

  db.all(
    "SELECT * FROM people WHERE birthday=?",
    [req.params.birthday],
    (err, rows) => {

      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message
        });
      }

      res.json(rows);

    }
  );

});

/* ==========================
   Thêm người mới
========================== */

app.post("/api/people", verifyAdminToken, async (req, res) => {
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


    if (birthday && deathDate && deathDate < birthday) {
      return res.status(400).json({
        success: false,
        message: "Ngày mất không thể trước ngày sinh.",
      });
    }

    const question = String(securityQuestion || "").trim();
    const answer = normalizeSecurityAnswer(securityAnswer);

    if (question && !answer) {
      return res.status(400).json({
        success: false,
        message: "Đã nhập câu hỏi thì phải nhập câu trả lời.",
      });
    }

    let hashedAnswer = null;

    if (question) {
      hashedAnswer = await bcrypt.hash(answer, 10);
    }

    const sql = `
      INSERT INTO people (
        name,
        birthday,
        deathDate,
        gender,
        class,
        phone,
        address,
        avatar,
        album,
        securityQuestion,
        securityAnswer
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      sql,
      [
        name.trim(),
        birthday || null,
        deathDate || null,
        gender || "",
        className || "",
        phone || "",
        address || "",
        avatar || "",
        album || "",
        question || null,
        hashedAnswer,
      ],
      function (error) {
        if (error) {
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        res.status(201).json({
          success: true,
          message: "Thêm người thành công.",
          id: this.lastID,
        });
      }
    );
  } catch (error) {
    console.error("Lỗi thêm người:", error);

    res.status(500).json({
      success: false,
      message: "Không thể thêm người.",
    });
  }
});
/* ==========================
   Khởi động server
========================== */
/* ==========================
   Dashboard
========================== */

app.get("/api/dashboard", verifyAdminToken, (req, res) => {

  db.get(
    "SELECT COUNT(*) AS totalPeople FROM people",
    [],
    (err, totalResult) => {

      if (err) {
        return res.status(500).json(err);
      }

      const currentMonth = new Date().getMonth() + 1;

      db.get(
        `SELECT COUNT(*) AS thisMonth
         FROM people
         WHERE strftime('%m', birthday)=?`,
        [String(currentMonth).padStart(2, "0")],

        (err, monthResult) => {

          if (err) {
            return res.status(500).json(err);
          }

          const today = new Date();

          const month = String(today.getMonth() + 1).padStart(2, "0");
          const day = String(today.getDate()).padStart(2, "0");

          db.get(
            `SELECT COUNT(*) AS today
             FROM people
             WHERE strftime('%m-%d', birthday)=?`,
            [`${month}-${day}`],

            (err, todayResult) => {

              if (err) {
                return res.status(500).json(err);
              }

              db.get(
                `SELECT COUNT(*) AS album
                 FROM people
                 WHERE album IS NOT NULL
                 AND album <> ''`,

                [],

                (err, albumResult) => {

                  if (err) {
                    return res.status(500).json(err);
                  }

                  res.json({
                    totalPeople: totalResult.totalPeople,
                    thisMonth: monthResult.thisMonth,
                    today: todayResult.today,
                    album: albumResult.album
                  });

                }

              );

            }

          );

        }

      );

    }

  );

});

app.put("/api/people/:id", verifyAdminToken, (req, res) => {
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

  if (birthday && deathDate && deathDate < birthday) {
    return res.status(400).json({
      success: false,
      message: "Ngày mất không thể trước ngày sinh.",
    });
  }

  db.get(
    `
      SELECT securityQuestion, securityAnswer
      FROM people
      WHERE id = ?
    `,
    [req.params.id],
    async (findError, currentPerson) => {
      if (findError) {
        return res.status(500).json({
          success: false,
          error: findError.message,
        });
      }

      if (!currentPerson) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người cần sửa.",
        });
      }

      try {
        const question = String(securityQuestion || "").trim();
        const newAnswer = normalizeSecurityAnswer(securityAnswer);

        let storedAnswer = currentPerson.securityAnswer;

        // Xóa câu hỏi thì xóa luôn câu trả lời
        if (!question) {
          storedAnswer = null;
        } else if (newAnswer) {
          // Có nhập đáp án mới thì mã hóa lại
          storedAnswer = await bcrypt.hash(newAnswer, 10);
        } else if (!currentPerson.securityAnswer) {
          // Thêm câu hỏi mới nhưng không nhập đáp án
          return res.status(400).json({
            success: false,
            message: "Vui lòng nhập câu trả lời xác thực.",
          });
        }

        const sql = `
          UPDATE people
          SET
            name = ?,
            birthday = ?,
            deathDate = ?,
            gender = ?,
            class = ?,
            phone = ?,
            address = ?,
            avatar = ?,
            album = ?,
            securityQuestion = ?,
            securityAnswer = ?
          WHERE id = ?
        `;

        db.run(
          sql,
          [
            name.trim(),
            birthday || null,
            deathDate || null,
            gender || "",
            className || "",
            phone || "",
            address || "",
            avatar || "",
            album || "",
            question || null,
            storedAnswer,
            req.params.id,
          ],
          function (updateError) {
            if (updateError) {
              return res.status(500).json({
                success: false,
                error: updateError.message,
              });
            }

            res.json({
              success: true,
              message: "Cập nhật thành công.",
            });
          }
        );
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Không thể cập nhật dữ liệu.",
        });
      }
    }
  );
});

/* ==========================
   Đăng nhập Admin
========================== */

app.delete("/api/people/:id", verifyAdminToken, (req, res) => {
  db.run(
    "DELETE FROM people WHERE id = ?",
    [req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }

      res.json({
        success: true,
        deleted: this.changes,
      });
    }
  );
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng nhập tài khoản và mật khẩu.",
    });
  }

  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  if (username !== validUsername || password !== validPassword) {
    return res.status(401).json({
      success: false,
      message: "Tài khoản hoặc mật khẩu không đúng.",
    });
  }

  const token = jwt.sign(
    {
      role: "admin",
      username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );

  res.json({
    success: true,
    message: "Đăng nhập thành công.",
    token,
  });
});

app.post("/api/people/:id/verify-album", (req, res) => {
  const answer = normalizeSecurityAnswer(req.body.answer);

  db.get(
    `
      SELECT
        album,
        securityQuestion,
        securityAnswer
      FROM people
      WHERE id = ?
    `,
    [req.params.id],
    async (error, person) => {
      if (error) {
        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }

      if (!person) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người.",
        });
      }

      if (!person.album) {
        return res.status(404).json({
          success: false,
          message: "Người này chưa có album.",
        });
      }

      // Không có câu hỏi thì mở luôn
      if (!person.securityQuestion) {
        return res.json({
          success: true,
          album: person.album,
        });
      }

      if (!answer) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập câu trả lời.",
        });
      }

      const correct = await bcrypt.compare(
        answer,
        person.securityAnswer
      );

      if (!correct) {
        return res.status(401).json({
          success: false,
          message: "Câu trả lời không chính xác.",
        });
      }

      res.json({
        success: true,
        album: person.album,
      });
    }
  );
});

app.post("/api/people/:id/verify-album", async (req, res) => {

  const answer = normalizeSecurityAnswer(req.body.answer);

  db.get(
    `
        SELECT
            album,
            securityQuestion,
            securityAnswer
        FROM people
        WHERE id=?
        `,
    [req.params.id],

    async (err, person) => {

      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message
        });
      }

      if (!person) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy."
        });
      }

      if (!person.album) {
        return res.status(404).json({
          success: false,
          message: "Chưa có album."
        });
      }

      if (!person.securityQuestion) {

        return res.json({
          success: true,
          album: person.album
        });

      }

      if (!answer) {

        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập câu trả lời."
        });

      }

      const correct = await bcrypt.compare(
        answer,
        person.securityAnswer
      );

      if (!correct) {

        return res.status(401).json({
          success: false,
          message: "Sai câu trả lời."
        });

      }

      res.json({
        success: true,
        album: person.album
      });

    }

  );

});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

