const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5174",
  "https://pixel-album.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

module.exports = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.error("CORS chặn origin:", origin);
    return callback(new Error("Nguồn truy cập không được CORS cho phép."));
  },
  credentials: true,
};
