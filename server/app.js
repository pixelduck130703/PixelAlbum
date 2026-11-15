require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { pool, initializeDatabase } = require("./database/db");
const corsOptions = require("./config/cors");
const corsError = require("./middleware/corsError");

const app = express();
app.set("trust proxy", true);
app.use(cors(corsOptions));
app.use(express.json());

// Preserve the existing optional TTS integration.
try {
  app.use("/api/tts", require("./routes/tts"));
} catch (error) {
  // TTS remains optional, as in the original application.
}

// Routers retain complete original paths to avoid changing frontend calls.
app.use(require("./routes/health"));
app.use(require("./routes/stats"));
app.use(require("./routes/music"));
app.use(require("./routes/people"));
app.use(require("./routes/auth"));
app.use(require("./routes/albums"));
app.use(require("./routes/exports"));
app.use(require("./routes/events"));
app.use(require("./routes/rsvp"));
app.use(require("./routes/announcements"));

app.use(corsError);

const PORT = process.env.PORT || 5000;
async function startServer() {
  try {
    await initializeDatabase();
    
    // Tự động kiểm tra và khởi tạo bảng app_stats trước khi mở cổng
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_stats (
        stat_date DATE PRIMARY KEY DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date,
        visits INT DEFAULT 0,
        exports INT DEFAULT 0
      );
    `);

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
