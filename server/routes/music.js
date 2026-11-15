const router = require("express").Router();
const { pool } = require("../database/db");
const verifyAdminToken = require("../middleware/auth");
const cloudinary = require("../config/cloudinary");
const musicUpload = require("../middleware/musicUpload");
const { uploadMusicToCloudinary } = require("../services/musicStorage");

router.get("/api/home-music", async (req, res) => {
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

router.put(
  "/api/admin/home-music",
  verifyAdminToken,
  async (req, res) => {
    try {
      const rawTrackId = req.body.trackId;
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

router.delete(
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

router.put(
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

router.post(
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

router.get(
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

module.exports = router;
