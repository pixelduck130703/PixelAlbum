const cloudinary = require("cloudinary").v2;

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  throw new Error(
    "Thiếu CLOUDINARY_CLOUD_NAME trong file .env"
  );
}

if (!process.env.CLOUDINARY_API_KEY) {
  throw new Error(
    "Thiếu CLOUDINARY_API_KEY trong file .env"
  );
}

if (!process.env.CLOUDINARY_API_SECRET) {
  throw new Error(
    "Thiếu CLOUDINARY_API_SECRET trong file .env"
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

module.exports = cloudinary;