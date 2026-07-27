require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const ExcelJS = require("exceljs");

const {
  pool,
  initializeDatabase,
} = require("./database/db");

const verifyAdminToken = require("./middleware/auth");

const app = express();

/* ==========================
   Middleware
========================== */

const allowedOrigins = [
  "http://localhost:5173",
  "https://pixel-album.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Cho phép Postman hoặc request không có Origin
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("CORS chặn origin:", origin);

      return callback(
        new Error("Nguồn truy cập không được CORS cho phép.")
      );
    },
    credentials: true,
  })
);

app.use(express.json());

/* ==========================
   Hàm dùng chung
========================== */

function normalizeSecurityAnswer(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function normalizeOptionalText(value) {
  const normalized = String(value || "").trim();

  return normalized || null;
}

function normalizeOptionalDate(value) {
  return value ? String(value).slice(0, 10) : null;
}

/* ==========================
   Trang chủ
========================== */

app.get("/", (req, res) => {
  res.send("🎂 Birthday Search API is running with PostgreSQL!");
});

/* ==========================
   Kiểm tra PostgreSQL
========================== */

app.get("/api/test", async (req, res) => {
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
      database: "PostgreSQL Docker",
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

/* ==========================
   Lấy tất cả người
========================== */

app.get("/api/people", async (req, res) => {
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

/* ==========================
   Lấy người theo ID
========================== */
app.get("/api/people/public/:publicId", async (req, res) => {
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

app.post("/api/people/public/:publicId/album-view", async (req, res) => {
  try {
    const { publicId } = req.params;

    const result = await pool.query(
      `
      UPDATE people
      SET "albumViews" = COALESCE("albumViews", 0) + 1
      WHERE "publicId" = $1
      RETURNING "albumViews"
      `,
      [publicId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng.",
      });
    }

    return res.json({
      success: true,
      albumViews: Number(result.rows[0].albumViews),
    });
  } catch (error) {
    console.error("Lỗi tăng lượt xem album:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể tăng lượt xem album.",
    });
  }
});

app.get("/api/people/:id", async (req, res) => {
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

/* ==========================
   Tìm theo ngày sinh
   Định dạng: YYYY-MM-DD
========================== */

app.get("/api/birthday/:birthday", async (req, res) => {
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

/* ==========================
   Thêm người mới
========================== */

app.post(
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

/* ==========================
   Dashboard
========================== */

app.get("/api/dashboard", verifyAdminToken, async (req, res) => {
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

/* ==========================
   Cập nhật người
========================== */

app.put(
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

      // Xóa câu hỏi thì xóa luôn câu trả lời
      if (!question) {
        storedAnswer = null;
      } else if (newAnswer) {
        // Nhập câu trả lời mới thì mã hóa lại
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

/* ==========================
   Xóa người
========================== */

app.delete(
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

/* ==========================
   Đăng nhập Admin
========================== */

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

  if (
    username !== validUsername ||
    password !== validPassword
  ) {
    return res.status(401).json({
      success: false,
      message: "Tài khoản hoặc mật khẩu không đúng.",
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: "Server chưa cấu hình JWT_SECRET.",
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

/* ==========================
   Xác thực album
========================== */
app.post(
  "/api/people/public/:publicId/verify-album",
  async (req, res) => {
    try {
      const answer = normalizeSecurityAnswer(
        req.body.answer
      );

      const result = await pool.query(
        `
          SELECT
            album,
            "securityQuestion",
            "securityAnswer"
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

      const person = result.rows[0];

      if (!person.album) {
        return res.status(404).json({
          success: false,
          message: "Người này chưa có album.",
        });
      }

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

      if (!person.securityAnswer) {
        return res.status(500).json({
          success: false,
          message:
            "Câu hỏi xác thực chưa được cấu hình đầy đủ.",
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

      return res.json({
        success: true,
        album: person.album,
      });
    } catch (error) {
      console.error(
        "Lỗi xác thực album bằng publicId:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Không thể xác thực album.",
        error: error.message,
      });
    }
  }
);

app.post(
  "/api/people/:id/verify-album",
  async (req, res) => {
    try {
      const answer =
        normalizeSecurityAnswer(req.body.answer);

      const result = await pool.query(
        `
          SELECT
            album,
            "securityQuestion",
            "securityAnswer"
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

      const person = result.rows[0];

      if (!person.album) {
        return res.status(404).json({
          success: false,
          message: "Người này chưa có album.",
        });
      }

      // Không có câu hỏi thì mở album luôn
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

      if (!person.securityAnswer) {
        return res.status(500).json({
          success: false,
          message:
            "Câu hỏi xác thực chưa được cấu hình đầy đủ.",
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
    } catch (error) {
      console.error("Lỗi xác thực album:", error);

      res.status(500).json({
        success: false,
        message: "Không thể xác thực album.",
        error: error.message,
      });
    }
  }
);

/* ==========================
   API xuất Excel
========================== */

app.get(
  "/api/admin/export-excel",
  verifyAdminToken,
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          id,
          name,
          birthday,
          "deathDate",
          gender,
          class,
          phone,
          address,
          avatar,
          album
        FROM people
        ORDER BY id DESC
      `);

      const workbook = new ExcelJS.Workbook();

      workbook.creator = "Pixel Album";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Danh sách album");

      worksheet.columns = [
        { header: "STT", key: "stt", width: 8 },
        { header: "Họ và tên", key: "name", width: 28 },
        { header: "Ngày sinh", key: "birthday", width: 16 },
        { header: "Ngày mất", key: "deathDate", width: 16 },
        { header: "Giới tính", key: "gender", width: 12 },
        { header: "Lớp", key: "className", width: 16 },
        { header: "Số điện thoại", key: "phone", width: 18 },
        { header: "Địa chỉ", key: "address", width: 35 },
        { header: "Ảnh đại diện", key: "avatar", width: 45 },
        { header: "Liên kết album", key: "album", width: 45 },
      ];

      const headerRow = worksheet.getRow(1);

      headerRow.font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };

      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF16A34A" },
      };

      headerRow.alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      headerRow.height = 25;

      const formatDate = (value) => {
        if (!value) return "";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
          return value;
        }

        return date.toLocaleDateString("vi-VN");
      };

      result.rows.forEach((person, index) => {
        worksheet.addRow({
          stt: index + 1,
          name: person.name || "",
          birthday: formatDate(person.birthday),
          deathDate: formatDate(person.deathDate),
          gender: person.gender || "",
          className: person.class || "",
          phone: person.phone || "",
          address: person.address || "",
          avatar: person.avatar || "",
          album: person.album || "",
        });
      });

      worksheet.autoFilter = {
        from: "A1",
        to: "J1",
      };

      worksheet.views = [
        {
          state: "frozen",
          ySplit: 1,
        },
      ];

      worksheet.eachRow((row, rowNumber) => {
        row.alignment = {
          vertical: "middle",
          horizontal: rowNumber === 1 ? "center" : "left",
          wrapText: true,
        };

        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD1D5DB" } },
            left: { style: "thin", color: { argb: "FFD1D5DB" } },
            bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
            right: { style: "thin", color: { argb: "FFD1D5DB" } },
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();

      const fileName = `DanhSachAlbum-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

      res.status(200);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );

      res.setHeader("Content-Length", buffer.length);

      return res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Lỗi xuất Excel:", error);

      return res.status(500).json({
        message: "Không thể xuất file Excel",
        error: error.message,
      });
    }
  }
);

/* ==========================
   API tăng lượt truy cập website
========================== */

app.post("/api/visits", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Tăng tổng lượt truy cập
    const totalResult = await client.query(`
      INSERT INTO website_stats (id, visits)
      VALUES (1, 1)
      ON CONFLICT (id)
      DO UPDATE
      SET visits = website_stats.visits + 1
      RETURNING visits
    `);

    // Tăng lượt truy cập của ngày hiện tại
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

/* ==========================
   API lấy dữ liệu biểu đồ
========================== */

app.get(
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

/* ==========================
   API lấy số lượt truy cập web
========================== */

app.get("/api/visits", async (req, res) => {
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

/* ==========================
   Middleware xử lý lỗi CORS
========================== */

app.use((error, req, res, next) => {
  if (error.message.includes("CORS")) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
});

/* ==========================
   Kết quả bóng đá
========================== */

app.get("/api/football/live", async (req, res) => {
  try {
    if (!process.env.FOOTBALL_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Thiếu FOOTBALL_API_KEY.",
      });
    }

    const response = await fetch(
      "https://v3.football.api-sports.io/fixtures?live=all",
      {
        headers: {
          "x-apisports-key": process.env.FOOTBALL_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Football API trả về lỗi ${response.status}`
      );
    }

    const data = await response.json();

    res.json({
      success: true,
      matches: data.response || [],
    });
  } catch (error) {
    console.error("Lỗi lấy kết quả bóng đá:", error);

    res.status(500).json({
      success: false,
      message: "Không thể tải kết quả bóng đá.",
    });
  }
});

/* ==========================
   Khởi động server
========================== */

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `🚀 Server running at http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "❌ Không thể khởi động server:",
      error
    );

    process.exit(1);
  }
}

startServer();