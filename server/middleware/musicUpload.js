const multer = require("multer");

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

module.exports = musicUpload;
