const cloudinary = require("../config/cloudinary");

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

module.exports = { uploadMusicToCloudinary };
