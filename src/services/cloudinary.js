export async function uploadImageToCloudinary(file) {
  if (!file) {
    throw new Error("Bạn chưa chọn ảnh.");
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName) {
    throw new Error(
      "Thiếu VITE_CLOUDINARY_CLOUD_NAME trong file .env."
    );
  }

  if (!uploadPreset) {
    throw new Error(
      "Thiếu VITE_CLOUDINARY_UPLOAD_PRESET trong file .env."
    );
  }

  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message ||
      "Không thể upload ảnh lên Cloudinary."
    );
  }

  return data.secure_url;
}