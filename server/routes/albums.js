const router = require("express").Router();
const { pool } = require("../database/db");
const verifyAdminToken = require("../middleware/auth");
const bcrypt = require("bcryptjs");
const { normalizeSecurityAnswer } = require("../utils/normalizers");
const { getClientIp, getIpLocation, deviceDetector } = require("../services/visitorInfo");

router.post(
  "/api/people/public/:publicId/verify-album",
  async (req, res) => {
    try {
      const answer = normalizeSecurityAnswer(req.body.answer);
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
      console.error("Lỗi xác thực album bằng publicId:", error);
      return res.status(500).json({
        success: false,
        message: "Không thể xác thực album.",
        error: error.message,
      });
    }
  }
);

router.post(
  "/api/people/:id/verify-album",
  async (req, res) => {
    try {
      const answer = normalizeSecurityAnswer(req.body.answer);
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

router.post(
  "/api/people/public/:publicId/album-view",
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { publicId } = req.params;
      const clientIp = getClientIp(req);
      const clientLocation = await getIpLocation(clientIp);
      const userAgent = req.headers["user-agent"] || "";
      const clientHints =
        req.body?.clientHints && typeof req.body.clientHints === "object"
          ? req.body.clientHints
          : {};
      const detected = deviceDetector.parse(userAgent);
      const browserInfo = detected?.client || {};
      const deviceInfo = detected?.device || {};
      const osInfo = detected?.os || {};
      const browser = browserInfo.name || "Không xác định";
      const browserVersion =
        clientHints.uaFullVersion || browserInfo.version || "";
      let deviceType =
        deviceInfo.type ||
        (clientHints.mobile === true ? "smartphone" : "desktop");
      deviceType = String(deviceType || "").trim().toLowerCase();
      const deviceVendor = String(deviceInfo.brand || "").trim();
      const deviceModel = String(
        deviceInfo.model || clientHints.model || ""
      ).trim();
      const os = osInfo.name || clientHints.platform || "Không xác định";
      const osVersion = osInfo.version || clientHints.platformVersion || "";
      const cpu = clientHints.architecture || "";
      const bitness = clientHints.bitness || "";
      let deviceTypeText;
      switch (deviceType) {
        case "smartphone":
        case "mobile":
          deviceTypeText = "Điện thoại";
          break;
        case "tablet":
          deviceTypeText = "Máy tính bảng";
          break;
        case "smarttv":
        case "tv":
          deviceTypeText = "Smart TV";
          break;
        case "wearable":
          deviceTypeText = "Thiết bị đeo";
          break;
        case "console":
          deviceTypeText = "Máy chơi game";
          break;
        case "car browser":
          deviceTypeText = "Màn hình ô tô";
          break;
        case "camera":
          deviceTypeText = "Máy ảnh";
          break;
        case "portable media player":
          deviceTypeText = "Thiết bị đa phương tiện";
          break;
        case "feature phone":
          deviceTypeText = "Điện thoại phổ thông";
          break;
        default:
          deviceTypeText = "Máy tính";
      }
      let deviceName = "";
      if (deviceVendor && deviceModel) {
        if (deviceModel.toLowerCase().includes(deviceVendor.toLowerCase())) {
          deviceName = deviceModel;
        } else {
          deviceName = `${deviceVendor} ${deviceModel}`;
        }
      } else if (deviceModel) {
        if (/^pixel/i.test(deviceModel)) {
          deviceName = `Google ${deviceModel}`;
        } else {
          deviceName = deviceModel;
        }
      } else if (deviceVendor) {
        deviceName = deviceVendor;
      } else if (/iphone/i.test(userAgent)) {
        deviceName = "Apple iPhone";
      } else if (/ipad/i.test(userAgent)) {
        deviceName = "Apple iPad";
      } else if (deviceType === "desktop") {
        deviceName = `${os} PC`;
      } else {
        deviceName = deviceTypeText;
      }
      const viewDetail = {
        ipAddress: clientIp,
        location: clientLocation,
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
      await client.query("BEGIN");
      const personResult = await client.query(
        `
        SELECT id, name, album, "albumViews"
        FROM people
        WHERE "publicId" = $1
        LIMIT 1
        `,
        [publicId]
      );
      if (personResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          message: "Không tìm thấy album.",
        });
      }
      const person = personResult.rows[0];
      if (!person.album || !String(person.album).trim()) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Người này chưa có liên kết album.",
        });
      }
      const updatedPerson = await client.query(
        `
        UPDATE people
        SET "albumViews" = COALESCE("albumViews", 0) + 1
        WHERE id = $1
        RETURNING "albumViews"
        `,
        [person.id]
      );
      await client.query(`
        INSERT INTO album_view_daily (view_date, views)
        VALUES ((NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date, 1)
        ON CONFLICT (view_date)
        DO UPDATE SET views = album_view_daily.views + 1
      `);
      await client.query(
        `
        INSERT INTO album_view_by_person_daily (
          person_id,
          view_date,
          views,
          last_viewed_at,
          view_times,
          ip_address,
          view_details
        )
        VALUES (
          $1,
          (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
          1,
          NOW(),
          ARRAY[NOW()]::timestamptz[],
          $15::text,
          jsonb_build_array(
            jsonb_build_object(
              'viewedAt', NOW(),
              'ipAddress', $15::text,
              'location', $16::text,
              'browser', $2::text,
              'browserVersion', $3::text,
              'deviceType', $4::text,
              'deviceTypeText', $5::text,
              'deviceVendor', $6::text,
              'deviceModel', $7::text,
              'deviceName', $8::text,
              'os', $9::text,
              'osVersion', $10::text,
              'cpu', $11::text,
              'bitness', $12::text,
              'clientHints', $13::jsonb,
              'userAgent', $14::text
            )
          )
        )
        ON CONFLICT (person_id, view_date)
        DO UPDATE SET
          views = album_view_by_person_daily.views + 1,
          last_viewed_at = NOW(),
          ip_address = COALESCE(NULLIF($15::text, ''), album_view_by_person_daily.ip_address),
          view_times = array_append(
            COALESCE(album_view_by_person_daily.view_times, '{}'::timestamptz[]),
            NOW()
          ),
          view_details = COALESCE(album_view_by_person_daily.view_details, '[]'::jsonb)
          ||
          jsonb_build_array(
            jsonb_build_object(
              'viewedAt', NOW(),
              'ipAddress', $15::text,
              'location', $16::text,
              'browser', $2::text,
              'browserVersion', $3::text,
              'deviceType', $4::text,
              'deviceTypeText', $5::text,
              'deviceVendor', $6::text,
              'deviceModel', $7::text,
              'deviceName', $8::text,
              'os', $9::text,
              'osVersion', $10::text,
              'cpu', $11::text,
              'bitness', $12::text,
              'clientHints', $13::jsonb,
              'userAgent', $14::text
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
          JSON.stringify(viewDetail.clientHints),
          viewDetail.userAgent,
          clientIp,
          clientLocation,
        ]
      );
      await client.query("COMMIT");
      return res.json({
        message: "Đã ghi nhận lượt xem album.",
        albumViews: Number(updatedPerson.rows[0]?.albumViews || 0),
      });
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {}
      console.error("Lỗi ghi nhận lượt xem album:", error);
      return res.status(500).json({
        message: "Không thể ghi nhận lượt xem album.",
      });
    } finally {
      client.release();
    }
  }
);

router.get(
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

router.get(
  "/api/admin/people/:id/album-history",
  verifyAdminToken,
  async (req, res) => {
    try {
      const personId = Number(req.params.id);
      if (!Number.isInteger(personId) || personId <= 0) {
        return res.status(400).json({
          message: "ID album không hợp lệ.",
        });
      }
      const result = await pool.query(
        `
        SELECT
          view_date AS date,
          views,
          last_viewed_at AS "lastViewedAt",
          ip_address AS "ipAddress",
          view_times AS "viewTimes",
          view_details AS "viewDetails"
        FROM album_view_by_person_daily
        WHERE person_id = $1
        ORDER BY view_date DESC
        `,
        [personId]
      );
      const data = result.rows.map((item) => ({
        date: item.date,
        views: Number(item.views) || 0,
        lastViewedAt: item.lastViewedAt || null,
        ipAddress: item.ipAddress || null,
        viewTimes: Array.isArray(item.viewTimes) ? item.viewTimes : [],
        viewDetails: Array.isArray(item.viewDetails) ? item.viewDetails : [],
      }));
      const totalViews = data.reduce(
        (total, item) => total + item.views,
        0
      );
      return res.json({
        totalViews,
        totalDays: data.length,
        data,
      });
    } catch (error) {
      console.error("Lỗi lấy lịch sử xem album:", error);
      return res.status(500).json({
        message: "Không thể tải lịch sử xem album.",
      });
    }
  }
);

router.get(
  "/api/admin/album-views",
  verifyAdminToken,
  async (req, res) => {
    try {
      const requestedDate = String(req.query.date || "").trim();
      let selectedDate = requestedDate;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
        const todayResult = await pool.query(`
          SELECT
            TO_CHAR(
              NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh',
              'YYYY-MM-DD'
            ) AS date
        `);
        selectedDate = todayResult.rows[0].date;
      }
      const result = await pool.query(
        `
        SELECT
          p.id,
          p."publicId",
          p.name,
          p.avatar,
          p.birthday,
          p.album,
          p."albumViews",
          daily.views AS "todayViews",
          daily.last_viewed_at AS "lastViewedAt",
          daily.ip_address AS "ipAddress",
          daily.view_times AS "viewTimes",
          daily.view_details AS "viewDetails"
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
      const data = result.rows.map((person) => ({
        ...person,
        todayViews: Number(person.todayViews) || 0,
        ipAddress: person.ipAddress || null,
        viewTimes: Array.isArray(person.viewTimes) ? person.viewTimes : [],
        viewDetails: Array.isArray(person.viewDetails) ? person.viewDetails : [],
      }));
      const totalViews = data.reduce(
        (total, person) => total + Number(person.todayViews || 0),
        0
      );
      return res.json({
        date: selectedDate,
        totalAlbums: data.length,
        totalViews,
        data,
      });
    } catch (error) {
      console.error("Lỗi lấy lịch sử xem album:", error);
      return res.status(500).json({
        message: "Không thể tải lịch sử xem album.",
      });
    }
  }
);

module.exports = router;
