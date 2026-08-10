require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const ExcelJS = require("exceljs");
const multer = require("multer");
const cloudinary = require("./config/cloudinary");
const DeviceDetector = require("device-detector-js");

const musicUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 25 * 1024 * 1024,
  },

  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/flac",
      "audio/x-flac",
      "audio/mp4",
      "audio/x-m4a",
    ];

    const fileName = String(file.originalname || "").toLowerCase();

    const hasAllowedExtension =
      fileName.endsWith(".mp3") ||
      fileName.endsWith(".wav") ||
      fileName.endsWith(".flac") ||
      fileName.endsWith(".m4a");

    if (
      allowedMimeTypes.includes(file.mimetype) ||
      hasAllowedExtension
    ) {
      callback(null, true);
      return;
    }

    callback(
      new Error(
        "Chỉ chấp nhận file MP3, WAV, FLAC hoặc M4A."
      )
    );
  },
});

const uploadMusicToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "birthday-search/music",
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(result);
        }
      );

    uploadStream.end(fileBuffer);
  });
};

const {
  pool,
  initializeDatabase,
} = require("./database/db");

const verifyAdminToken = require("./middleware/auth");

const app = express();
const deviceDetector = new DeviceDetector();

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
   API công khai cho Home
========================== */

app.get("/api/home-music", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        mt.id,
        mt.name,
        mt.music_url AS "musicUrl"
      FROM home_music hm
      LEFT JOIN music_tracks mt
        ON mt.id = hm.track_id
      WHERE hm.id = 1
      LIMIT 1
    `);

    const track = result.rows[0];

    if (!track?.id || !track?.musicUrl) {
      return res.json({
        enabled: false,
        track: null,
      });
    }

    return res.json({
      enabled: true,
      track,
    });
  } catch (error) {
    console.error("Lỗi lấy nhạc trang chủ:", error);

    return res.status(500).json({
      message: "Không thể lấy nhạc trang chủ.",
    });
  }
});

/* ==========================
   API chọn bài phát trên Home
========================== */

app.put(
  "/api/admin/home-music",
  verifyAdminToken,
  async (req, res) => {
    try {
      const rawTrackId = req.body.trackId;

      // Không chọn bài nào.
      if (
        rawTrackId === null ||
        rawTrackId === undefined ||
        rawTrackId === ""
      ) {
        await pool.query(`
          UPDATE home_music
          SET
            track_id = NULL,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `);

        return res.json({
          message: "Đã tắt nhạc nền trang chủ.",
          trackId: null,
        });
      }

      const trackId = Number(rawTrackId);

      if (!Number.isInteger(trackId) || trackId <= 0) {
        return res.status(400).json({
          message: "Bài hát không hợp lệ.",
        });
      }

      const trackResult = await pool.query(
        `SELECT id FROM music_tracks WHERE id = $1`,
        [trackId]
      );

      if (!trackResult.rows[0]) {
        return res.status(404).json({
          message: "Không tìm thấy bài hát.",
        });
      }

      await pool.query(
        `
        UPDATE home_music
        SET
          track_id = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
        `,
        [trackId]
      );

      return res.json({
        message: "Đã cập nhật nhạc nền trang chủ.",
        trackId,
      });
    } catch (error) {
      console.error("Lỗi chọn nhạc nền:", error);

      return res.status(500).json({
        message: "Không thể cập nhật nhạc nền.",
      });
    }
  }
);

/* ==========================
   API xóa bài hát
========================== */

app.delete(
  "/api/admin/music/:id",
  verifyAdminToken,
  async (req, res) => {
    const client = await pool.connect();

    try {
      const trackId = Number(req.params.id);

      if (!Number.isInteger(trackId) || trackId <= 0) {
        return res.status(400).json({
          message: "ID bài hát không hợp lệ.",
        });
      }

      const trackResult = await client.query(
        `
        SELECT
          id,
          name,
          public_id AS "publicId"
        FROM music_tracks
        WHERE id = $1
        LIMIT 1
        `,
        [trackId]
      );

      const track = trackResult.rows[0];

      if (!track) {
        return res.status(404).json({
          message: "Không tìm thấy bài hát.",
        });
      }

      await cloudinary.uploader.destroy(
        track.publicId,
        {
          resource_type: "video",
          invalidate: true,
        }
      );

      await client.query(
        `DELETE FROM music_tracks WHERE id = $1`,
        [trackId]
      );

      return res.json({
        message: "Xóa bài hát thành công.",
      });
    } catch (error) {
      console.error("Lỗi xóa bài hát:", error);

      return res.status(500).json({
        message: "Không thể xóa bài hát.",
      });
    } finally {
      client.release();
    }
  }
);

/* ==========================
   API sửa tên bài hát
========================== */

app.put(
  "/api/admin/music/:id",
  verifyAdminToken,
  async (req, res) => {
    try {
      const trackId = Number(req.params.id);
      const name = String(req.body.name || "").trim();

      if (!Number.isInteger(trackId) || trackId <= 0) {
        return res.status(400).json({
          message: "ID bài hát không hợp lệ.",
        });
      }

      if (!name) {
        return res.status(400).json({
          message: "Tên bài hát không được để trống.",
        });
      }

      const result = await pool.query(
        `
        UPDATE music_tracks
        SET
          name = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING
          id,
          name,
          music_url AS "musicUrl",
          public_id AS "publicId",
          updated_at AS "updatedAt"
        `,
        [name, trackId]
      );

      if (!result.rows[0]) {
        return res.status(404).json({
          message: "Không tìm thấy bài hát.",
        });
      }

      return res.json({
        message: "Đổi tên bài hát thành công.",
        track: result.rows[0],
      });
    } catch (error) {
      console.error("Lỗi sửa bài hát:", error);

      return res.status(500).json({
        message: "Không thể sửa bài hát.",
      });
    }
  }
);

/* ==========================
   API thêm bài hát
========================== */

app.post(
  "/api/admin/music",
  verifyAdminToken,
  musicUpload.single("music"),
  async (req, res) => {
    let uploadedPublicId = null;

    try {
      const name = String(req.body.name || "").trim();

      if (!name) {
        return res.status(400).json({
          message: "Vui lòng nhập tên bài hát.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Vui lòng chọn file nhạc.",
        });
      }

      const uploadResult =
        await uploadMusicToCloudinary(req.file.buffer);

      uploadedPublicId = uploadResult.public_id;

      const result = await pool.query(
        `
        INSERT INTO music_tracks (
          name,
          music_url,
          public_id
        )
        VALUES ($1, $2, $3)
        RETURNING
          id,
          name,
          music_url AS "musicUrl",
          public_id AS "publicId",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        `,
        [
          name,
          uploadResult.secure_url,
          uploadResult.public_id,
        ]
      );

      return res.status(201).json({
        message: "Thêm bài hát thành công.",
        track: result.rows[0],
      });
    } catch (error) {
      console.error("Lỗi thêm bài hát:", error);

      // Nếu upload thành công nhưng lưu DB lỗi thì xóa file vừa tải.
      if (uploadedPublicId) {
        try {
          await cloudinary.uploader.destroy(
            uploadedPublicId,
            {
              resource_type: "video",
              invalidate: true,
            }
          );
        } catch (cleanupError) {
          console.error(
            "Không thể dọn file Cloudinary:",
            cleanupError
          );
        }
      }

      if (error instanceof multer.MulterError) {
        return res.status(400).json({
          message:
            error.code === "LIMIT_FILE_SIZE"
              ? "File nhạc không được vượt quá 25 MB."
              : error.message,
        });
      }

      return res.status(500).json({
        message:
          error.message ||
          "Không thể thêm bài hát.",
      });
    }
  }
);

/* ==========================
   LAPI lấy danh sách nhạc
========================== */

app.get(
  "/api/admin/music",
  verifyAdminToken,
  async (req, res) => {
    try {
      const tracksResult = await pool.query(`
        SELECT
          id,
          name,
          music_url AS "musicUrl",
          public_id AS "publicId",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM music_tracks
        ORDER BY created_at DESC, id DESC
      `);

      const selectedResult = await pool.query(`
        SELECT track_id AS "trackId"
        FROM home_music
        WHERE id = 1
        LIMIT 1
      `);

      return res.json({
        tracks: tracksResult.rows,
        selectedTrackId:
          selectedResult.rows[0]?.trackId || null,
      });
    } catch (error) {
      console.error("Lỗi tải danh sách nhạc:", error);

      return res.status(500).json({
        message: "Không thể tải danh sách nhạc.",
      });
    }
  }
);

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

        COALESCE("albumViews", 0) AS "albumViews",

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
   API lấy dữ liệu biểu đồ số lần truy cập web
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
   API ghi nhận số lượt truy cập album
========================== */

app.post(
  "/api/people/public/:publicId/album-view",
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { publicId } = req.params;

      /*
       * ========================================
       * 1. USER AGENT + CLIENT HINTS
       * ========================================
       */

      const userAgent =
        req.headers["user-agent"] || "";

      const clientHints =
        req.body?.clientHints &&
        typeof req.body.clientHints === "object"
          ? req.body.clientHints
          : {};

      /*
       * ========================================
       * 2. DEVICE DETECTOR
       * ========================================
       */

      const detected =
        deviceDetector.parse(userAgent);

      const browserInfo =
        detected?.client || {};

      const deviceInfo =
        detected?.device || {};

      const osInfo =
        detected?.os || {};

      /*
       * ========================================
       * 3. TRÌNH DUYỆT
       * ========================================
       */

      const browser =
        browserInfo.name ||
        "Không xác định";

      const browserVersion =
        clientHints.uaFullVersion ||
        browserInfo.version ||
        "";

      /*
       * ========================================
       * 4. LOẠI THIẾT BỊ
       * ========================================
       */

      let deviceType =
        deviceInfo.type ||
        (
          clientHints.mobile === true
            ? "smartphone"
            : "desktop"
        );

      deviceType =
        String(deviceType || "")
          .trim()
          .toLowerCase();

      /*
       * device-detector-js dùng brand
       * thay vì vendor.
       */
      const deviceVendor =
        String(
          deviceInfo.brand || ""
        ).trim();

      /*
       * Ưu tiên model mà device-detector-js
       * nhận diện được.
       *
       * Nếu detector không nhận ra thì mới
       * dùng model từ Client Hints.
       */
      const deviceModel =
        String(
          deviceInfo.model ||
          clientHints.model ||
          ""
        ).trim();

      /*
       * ========================================
       * 5. HỆ ĐIỀU HÀNH
       * ========================================
       */

      const os =
        osInfo.name ||
        clientHints.platform ||
        "Không xác định";

      const osVersion =
        osInfo.version ||
        clientHints.platformVersion ||
        "";

      /*
       * ========================================
       * 6. CPU
       * ========================================
       */

      const cpu =
        clientHints.architecture ||
        "";

      const bitness =
        clientHints.bitness ||
        "";

      /*
       * ========================================
       * 7. LOẠI THIẾT BỊ TIẾNG VIỆT
       * ========================================
       */

      let deviceTypeText;

      switch (deviceType) {
        case "smartphone":
        case "mobile":
          deviceTypeText =
            "Điện thoại";
          break;

        case "tablet":
          deviceTypeText =
            "Máy tính bảng";
          break;

        case "smarttv":
        case "tv":
          deviceTypeText =
            "Smart TV";
          break;

        case "wearable":
          deviceTypeText =
            "Thiết bị đeo";
          break;

        case "console":
          deviceTypeText =
            "Máy chơi game";
          break;

        case "car browser":
          deviceTypeText =
            "Màn hình ô tô";
          break;

        case "camera":
          deviceTypeText =
            "Máy ảnh";
          break;

        case "portable media player":
          deviceTypeText =
            "Thiết bị đa phương tiện";
          break;

        case "feature phone":
          deviceTypeText =
            "Điện thoại phổ thông";
          break;

        default:
          deviceTypeText =
            "Máy tính";
      }

      /*
       * ========================================
       * 8. TẠO TÊN THIẾT BỊ
       * ========================================
       */

      let deviceName = "";

      if (
        deviceVendor &&
        deviceModel
      ) {
        /*
         * Nếu model đã chứa tên hãng thì không
         * ghép hãng lần nữa.
         *
         * Ví dụ:
         * Samsung Galaxy S24 Ultra
         */
        if (
          deviceModel
            .toLowerCase()
            .includes(
              deviceVendor.toLowerCase()
            )
        ) {
          deviceName =
            deviceModel;
        } else {
          deviceName =
            `${deviceVendor} ${deviceModel}`;
        }
      } else if (deviceModel) {
        /*
         * Pixel thường có model:
         * Pixel 7
         * Pixel 8 Pro
         */
        if (
          /^pixel/i.test(deviceModel)
        ) {
          deviceName =
            `Google ${deviceModel}`;
        } else {
          deviceName =
            deviceModel;
        }
      } else if (deviceVendor) {
        deviceName =
          deviceVendor;
      } else if (
        /iphone/i.test(userAgent)
      ) {
        deviceName =
          "Apple iPhone";
      } else if (
        /ipad/i.test(userAgent)
      ) {
        deviceName =
          "Apple iPad";
      } else if (
        deviceType === "desktop"
      ) {
        deviceName =
          `${os} PC`;
      } else {
        deviceName =
          deviceTypeText;
      }

      /*
       * ========================================
       * 9. DỮ LIỆU CHI TIẾT LƯỢT MỞ
       * ========================================
       */

      const viewDetail = {
        browser,
        browserVersion,

        deviceType,
        deviceTypeText,

        deviceVendor,
        deviceModel,
        deviceName,

        os,
        osVersion,

        cpu,
        bitness,

        clientHints,

        userAgent,
      };

      /*
       * Debug.
       * Sau khi test ổn có thể xóa.
       */
      console.log(
        "========== ALBUM DEVICE =========="
      );

      console.log(
        "DEVICE DETECTOR:",
        detected
      );

      console.log(
        "CLIENT HINTS:",
        clientHints
      );

      console.log(
        "FINAL DEVICE:",
        viewDetail
      );

      console.log(
        "=================================="
      );

      /*
       * ========================================
       * 10. BẮT ĐẦU TRANSACTION
       * ========================================
       */

      await client.query("BEGIN");

      /*
       * ========================================
       * 11. TÌM ALBUM
       * ========================================
       */

      const personResult =
        await client.query(
          `
            SELECT
              id,
              name,
              album,
              "albumViews"
            FROM people
            WHERE "publicId" = $1
            LIMIT 1
          `,
          [publicId]
        );

      if (
        personResult.rows.length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(404).json({
          message:
            "Không tìm thấy album.",
        });
      }

      const person =
        personResult.rows[0];

      if (
        !person.album ||
        !String(
          person.album
        ).trim()
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          message:
            "Người này chưa có liên kết album.",
        });
      }

      /*
       * ========================================
       * 12. TĂNG TỔNG LƯỢT XEM CỦA ALBUM
       * ========================================
       */

      const updatedPerson =
        await client.query(
          `
            UPDATE people

            SET "albumViews" =
              COALESCE(
                "albumViews",
                0
              ) + 1

            WHERE id = $1

            RETURNING
              "albumViews"
          `,
          [person.id]
        );

      /*
       * ========================================
       * 13. TĂNG TỔNG LƯỢT MỞ TRONG NGÀY
       * ========================================
       */

      await client.query(`
        INSERT INTO album_view_daily (
          view_date,
          views
        )

        VALUES (
          (
            NOW()
            AT TIME ZONE
              'Asia/Ho_Chi_Minh'
          )::date,

          1
        )

        ON CONFLICT (
          view_date
        )

        DO UPDATE SET

          views =
            album_view_daily.views + 1
      `);

      /*
       * ========================================
       * 14. LƯU CHI TIẾT THEO ALBUM
       * ========================================
       */

      await client.query(
        `
          INSERT INTO album_view_by_person_daily (
            person_id,
            view_date,
            views,
            last_viewed_at,
            view_times,
            view_details
          )

          VALUES (
            $1,

            (
              NOW()
              AT TIME ZONE
                'Asia/Ho_Chi_Minh'
            )::date,

            1,

            NOW(),

            ARRAY[
              NOW()
            ]::timestamptz[],

            jsonb_build_array(
              jsonb_build_object(

                'viewedAt',
                NOW(),

                'browser',
                $2::text,

                'browserVersion',
                $3::text,

                'deviceType',
                $4::text,

                'deviceTypeText',
                $5::text,

                'deviceVendor',
                $6::text,

                'deviceModel',
                $7::text,

                'deviceName',
                $8::text,

                'os',
                $9::text,

                'osVersion',
                $10::text,

                'cpu',
                $11::text,

                'bitness',
                $12::text,

                'clientHints',
                $13::jsonb,

                'userAgent',
                $14::text
              )
            )
          )

          ON CONFLICT (
            person_id,
            view_date
          )

          DO UPDATE SET

            views =
              album_view_by_person_daily.views
              + 1,

            last_viewed_at =
              NOW(),

            view_times =
              array_append(
                COALESCE(
                  album_view_by_person_daily.view_times,
                  '{}'::timestamptz[]
                ),
                NOW()
              ),

            view_details =
              COALESCE(
                album_view_by_person_daily.view_details,
                '[]'::jsonb
              )

              ||

              jsonb_build_array(
                jsonb_build_object(

                  'viewedAt',
                  NOW(),

                  'browser',
                  $2::text,

                  'browserVersion',
                  $3::text,

                  'deviceType',
                  $4::text,

                  'deviceTypeText',
                  $5::text,

                  'deviceVendor',
                  $6::text,

                  'deviceModel',
                  $7::text,

                  'deviceName',
                  $8::text,

                  'os',
                  $9::text,

                  'osVersion',
                  $10::text,

                  'cpu',
                  $11::text,

                  'bitness',
                  $12::text,

                  'clientHints',
                  $13::jsonb,

                  'userAgent',
                  $14::text
                )
              )
        `,
        [
          person.id,

          viewDetail.browser,

          viewDetail.browserVersion,

          viewDetail.deviceType,

          viewDetail.deviceTypeText,

          viewDetail.deviceVendor,

          viewDetail.deviceModel,

          viewDetail.deviceName,

          viewDetail.os,

          viewDetail.osVersion,

          viewDetail.cpu,

          viewDetail.bitness,

          JSON.stringify(
            viewDetail.clientHints
          ),

          viewDetail.userAgent,
        ]
      );

      /*
       * ========================================
       * 15. COMMIT
       * ========================================
       */

      await client.query(
        "COMMIT"
      );

      return res.json({
        message:
          "Đã ghi nhận lượt xem album.",

        albumViews: Number(
          updatedPerson.rows[0]
            ?.albumViews || 0
        ),
      });
    } catch (error) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch {
        // Bỏ qua lỗi rollback.
      }

      console.error(
        "Lỗi ghi nhận lượt xem album:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Không thể ghi nhận lượt xem album.",
        });
    } finally {
      client.release();
    }
  }
);
/* ==========================
   API lấy số lượt truy cập album
========================== */

app.get(
  "/api/admin/album-view-chart",
  verifyAdminToken,
  async (req, res) => {
    try {
      const requestedDays = Number(req.query.days);

      const days =
        Number.isInteger(requestedDays) &&
          requestedDays >= 7 &&
          requestedDays <= 365
          ? requestedDays
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
            )::date AS view_date
          )
          SELECT
            TO_CHAR(date_range.view_date, 'YYYY-MM-DD') AS date,
            COALESCE(album_view_daily.views, 0)::integer AS views
          FROM date_range
          LEFT JOIN album_view_daily
            ON album_view_daily.view_date = date_range.view_date
          ORDER BY date_range.view_date ASC
        `,
        [days]
      );

      return res.status(200).json({
        days,
        data: result.rows.map((item) => ({
          date: item.date,
          views: Number(item.views) || 0,
        })),
      });
    } catch (error) {
      console.error("Lỗi lấy biểu đồ lượt mở album:", error);

      return res.status(500).json({
        message: "Không thể tải biểu đồ lượt mở album",
      });
    }
  }
);

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
   API lấy album được xem hôm nay
========================== */

app.get(
  "/api/admin/album-views",
  verifyAdminToken,
  async (req, res) => {
    try {
      /*
       * Nếu frontend không gửi date
       * thì mặc định lấy ngày hôm nay.
       */
      const requestedDate =
        String(req.query.date || "").trim();

      let selectedDate =
        requestedDate;

      /*
       * Kiểm tra YYYY-MM-DD
       */
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
          selectedDate
        )
      ) {
        const todayResult =
          await pool.query(`
            SELECT
              TO_CHAR(
                NOW()
                AT TIME ZONE 'Asia/Ho_Chi_Minh',
                'YYYY-MM-DD'
              ) AS date
          `);

        selectedDate =
          todayResult.rows[0].date;
      }

      /*
       * Lấy danh sách album được xem
       * trong ngày được chọn.
       */
      const result =
        await pool.query(
          `
            SELECT
              p.id,
              p."publicId",
              p.name,
              p.avatar,
              p.birthday,
              p.album,
              p."albumViews",

              daily.views
                AS "todayViews",

              daily.last_viewed_at
                AS "lastViewedAt",

              daily.view_times
                AS "viewTimes",

              daily.view_details
                AS "viewDetails"

            FROM album_view_by_person_daily daily

            INNER JOIN people p
              ON p.id = daily.person_id

            WHERE
              daily.view_date = $1::date

            ORDER BY
              daily.last_viewed_at DESC,
              daily.views DESC,
              p.name ASC
          `,
          [selectedDate]
        );

      const data =
        result.rows.map(
          (person) => ({
            ...person,

            todayViews:
              Number(
                person.todayViews
              ) || 0,

            viewTimes:
              Array.isArray(
                person.viewTimes
              )
                ? person.viewTimes
                : [],

            viewDetails:
              Array.isArray(
                person.viewDetails
              )
                ? person.viewDetails
                : [],
          })
        );

      const totalViews =
        data.reduce(
          (total, person) =>
            total +
            Number(
              person.todayViews || 0
            ),
          0
        );

      return res.json({
        date: selectedDate,

        totalAlbums:
          data.length,

        totalViews,

        data,
      });
    } catch (error) {
      console.error(
        "Lỗi lấy lịch sử xem album:",
        error
      );

      return res.status(500).json({
        message:
          "Không thể tải lịch sử xem album.",
      });
    }
  }
);

/* ==========================
   API lấy thông báo cho Home
========================== */

app.get("/api/announcement", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        content,
        updated_at AS "updatedAt"
      FROM announcements
      WHERE id = 1
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.json({
        content: "",
        updatedAt: null,
      });
    }

    return res.json({
      content: result.rows[0].content || "",
      updatedAt: result.rows[0].updatedAt || null,
    });
  } catch (error) {
    console.error("Lỗi lấy thông báo:", error);

    return res.status(500).json({
      message: "Không thể tải thông báo.",
    });
  }
});

/* ==========================
   API admin cập nhật thông báo
========================== */

app.put(
  "/api/admin/announcement",
  verifyAdminToken,
  async (req, res) => {
    try {
      const content = String(req.body?.content || "").trim();

      const result = await pool.query(
        `
          INSERT INTO announcements (
            id,
            content,
            updated_at
          )
          VALUES (
            1,
            $1,
            NOW()
          )
          ON CONFLICT (id)
          DO UPDATE SET
            content = EXCLUDED.content,
            updated_at = NOW()
          RETURNING
            content,
            updated_at AS "updatedAt"
        `,
        [content || null]
      );

      return res.json({
        message: content
          ? "Đã cập nhật thông báo."
          : "Đã xóa thông báo.",
        content: result.rows[0].content || "",
        updatedAt: result.rows[0].updatedAt,
      });
    } catch (error) {
      console.error("Lỗi cập nhật thông báo:", error);

      return res.status(500).json({
        message: "Không thể cập nhật thông báo.",
      });
    }
  }
);

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