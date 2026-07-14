import { useEffect, useState } from "react";
import { uploadImageToCloudinary } from "../../services/cloudinary";

const initialForm = {
  name: "",
  birthday: "",
  deathDate: "",
  gender: "Nam",
  class: "",
  phone: "",
  address: "",
  avatar: "",
  album: "",
  securityQuestion: "",
  securityAnswer: "",
};

function PersonForm({
  open,
  person,
  onClose,
  onSubmit,
  submitting = false,
}) {
  const [form, setForm] = useState(initialForm);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (person) {
      setForm({
        name: person.name || "",
        birthday: person.birthday || "",
        deathDate: person.deathDate || "",
        gender: person.gender || "Nam",
        class: person.class || "",
        phone: person.phone || "",
        address: person.address || "",
        avatar: person.avatar || "",
        album: person.album || "",
        securityQuestion: person.securityQuestion || "",
        securityAnswer: "",
      });
    } else {
      setForm(initialForm);
    }

    setUploadingImage(false);
  }, [person, open]);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
  const { name, value } = event.target;

  if (name === "birthday" || name === "deathDate") {
    let date = value.replace(/\D/g, "");

    if (date.length > 2) {
      date = date.slice(0, 2) + "/" + date.slice(2);
    }

    if (date.length > 5) {
      date = date.slice(0, 5) + "/" + date.slice(5);
    }

    date = date.slice(0, 10);

    setForm((current) => ({
      ...current,
      [name]: date,   // ✅ Quan trọng là phải dùng [name]
    }));

    return;
  }

  setForm((current) => ({
    ...current,
    [name]: value,
  }));
};

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn đúng file ảnh.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ảnh không được lớn hơn 5MB.");
      event.target.value = "";
      return;
    }

    try {
      setUploadingImage(true);

      const imageUrl = await uploadImageToCloudinary(file);

      setForm((currentForm) => ({
        ...currentForm,
        avatar: imageUrl,
      }));
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);

      alert(
        error.message ||
        "Không thể tải ảnh lên Cloudinary."
      );
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleRemoveAvatar = () => {
    setForm((currentForm) => ({
      ...currentForm,
      avatar: "",
    }));
  };

  const convertToDatabaseDate = (value) => {
    if (!value) return "";

    // Nếu dữ liệu đã là YYYY-MM-DD thì giữ nguyên
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    // Chuyển DD/MM/YYYY thành YYYY-MM-DD
    const parts = value.trim().split("/");

    if (parts.length !== 3) {
      return "";
    }

    const [day, month, year] = parts;

    if (!day || !month || !year) {
      return "";
    }

    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Vui lòng nhập họ tên.");
      return;
    }

    const birthdayForDatabase =
      convertToDatabaseDate(form.birthday);

    const deathDateForDatabase =
      convertToDatabaseDate(form.deathDate);

    if (form.birthday && !birthdayForDatabase) {
      alert("Ngày sinh phải đúng định dạng DD/MM/YYYY.");
      return;
    }

    if (form.deathDate && !deathDateForDatabase) {
      alert("Ngày mất phải đúng định dạng DD/MM/YYYY.");
      return;
    }

    if (
      birthdayForDatabase &&
      deathDateForDatabase &&
      deathDateForDatabase < birthdayForDatabase
    ) {
      alert("Ngày mất không thể trước ngày sinh.");
      return;
    }

    const hasSecurityQuestion =
      form.securityQuestion.trim() !== "";

    const isCreatingNewQuestion =
      !person?.securityQuestion && hasSecurityQuestion;

    if (
      isCreatingNewQuestion &&
      !form.securityAnswer.trim()
    ) {
      alert("Vui lòng nhập câu trả lời xác thực.");
      return;
    }

    if (uploadingImage) {
      alert("Vui lòng chờ ảnh tải lên xong.");
      return;
    }

    onSubmit({
      ...form,
      birthday: birthdayForDatabase || null,
      deathDate: deathDateForDatabase || null,
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      class: form.class.trim(),
      album: form.album.trim(),
      securityQuestion:
        form.securityQuestion.trim(),
      securityAnswer:
        form.securityAnswer.trim(),
    });
  };

  const convertToDisplayDate = (value) => {
    if (!value) return "";

    const normalized = String(value).slice(0, 10);
    const [year, month, day] = normalized.split("-");

    if (!year || !month || !day) {
      return value;
    }

    return `${day}/${month}/${year}`;
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !submitting && !uploadingImage) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {person ? "Sửa thông tin" : "Thêm người mới"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Nhập đầy đủ thông tin bên dưới
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting || uploadingImage}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Họ và tên <span className="text-red-500">*</span>
              </label>

              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ví dụ: Nguyễn Tuấn Hùng"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="birthday"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Ngày sinh
              </label>

              <input
                id="birthday"
                type="text"
                name="birthday"
                value={form.birthday}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                maxLength={10}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
  <label
    htmlFor="deathDate"
    className="mb-2 block text-sm font-semibold text-slate-700"
  >
    Ngày mất
  </label>

  <input
    id="deathDate"
    type="text"
    name="deathDate"
    value={form.deathDate}
    onChange={handleChange}
    placeholder="DD/MM/YYYY"
    maxLength={10}
    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
  />

  <p className="mt-2 text-xs text-slate-500">
    Để trống nếu người này còn sống. Định dạng: DD/MM/YYYY
  </p>
</div>

            <div>
              <label
                htmlFor="gender"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Giới tính
              </label>

              <select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="class"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Lớp
              </label>

              <input
                id="class"
                type="text"
                name="class"
                value={form.class}
                onChange={handleChange}
                placeholder="Ví dụ: CNTT K63"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Số điện thoại
              </label>

              <input
                id="phone"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Ví dụ: 0123456789"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Tỉnh/Thành phố
              </label>

              <input
                id="address"
                type="text"
                name="address"
                list="provinces-list"
                value={form.address}
                onChange={handleChange}
                placeholder="Nhập hoặc chọn tỉnh/thành phố"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <datalist id="provinces-list">
                <option value="An Giang" />
                <option value="Bắc Ninh" />
                <option value="Cà Mau" />
                <option value="Cao Bằng" />
                <option value="Cần Thơ" />
                <option value="Đà Nẵng" />
                <option value="Đắk Lắk" />
                <option value="Điện Biên" />
                <option value="Đồng Nai" />
                <option value="Đồng Tháp" />
                <option value="Gia Lai" />
                <option value="Hà Nội" />
                <option value="Hà Tĩnh" />
                <option value="Hải Phòng" />
                <option value="Hưng Yên" />
                <option value="Huế" />
                <option value="Khánh Hòa" />
                <option value="Lai Châu" />
                <option value="Lâm Đồng" />
                <option value="Lạng Sơn" />
                <option value="Lào Cai" />
                <option value="Nghệ An" />
                <option value="Ninh Bình" />
                <option value="Phú Thọ" />
                <option value="Quảng Ngãi" />
                <option value="Quảng Ninh" />
                <option value="Quảng Trị" />
                <option value="Sơn La" />
                <option value="Tây Ninh" />
                <option value="Thái Nguyên" />
                <option value="Thanh Hóa" />
                <option value="Thành phố Hồ Chí Minh" />
                <option value="Tuyên Quang" />
                <option value="Vĩnh Long" />
              </datalist>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Ảnh đại diện
              </label>

              <div className="rounded-2xl border border-dashed border-slate-300 p-5">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleAvatarUpload}
                  disabled={uploadingImage || submitting}
                  className="block w-full text-sm text-slate-600
                    file:mr-4
                    file:rounded-lg
                    file:border-0
                    file:bg-blue-50
                    file:px-4
                    file:py-2
                    file:font-semibold
                    file:text-blue-600
                    hover:file:bg-blue-100
                    disabled:cursor-not-allowed
                    disabled:opacity-60"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Hỗ trợ JPG, PNG và WEBP. Dung lượng tối đa 5MB.
                </p>

                {uploadingImage && (
                  <div className="mt-4 rounded-xl bg-blue-50 p-3 text-sm font-medium text-blue-600">
                    Đang tải ảnh lên Cloudinary...
                  </div>
                )}

                {!uploadingImage && form.avatar && (
                  <div className="mt-5 flex flex-col gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center">
                    <img
                      src={form.avatar}
                      alt="Ảnh đại diện xem trước"
                      className="h-24 w-24 rounded-full border border-slate-200 object-cover"
                      onError={(event) => {
                        event.currentTarget.src =
                          "https://placehold.co/150x150?text=No+Image";
                      }}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-green-600">
                        Upload ảnh thành công
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {form.avatar}
                      </p>

                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={submitting}
                        className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="album"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Link album
              </label>

              <input
                id="album"
                type="url"
                name="album"
                value={form.album}
                onChange={handleChange}
                placeholder="Ví dụ: https://photos.app.goo.gl/..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Có thể dùng link Google Photos, Google Drive hoặc website khác.
              </p>
            </div>

            <div className="md:col-span-2">
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
                <h3 className="text-lg font-bold text-slate-800">
                  Xác thực khi xem album
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  Nếu để trống câu hỏi thì người dùng có thể mở album ngay.
                </p>

                <div className="mt-5">
                  <label
                    htmlFor="securityQuestion"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Câu hỏi xác thực
                  </label>

                  <input
                    id="securityQuestion"
                    type="text"
                    name="securityQuestion"
                    value={form.securityQuestion}
                    onChange={handleChange}
                    placeholder="Ví dụ: Tên gọi ở nhà của người này là gì?"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {form.securityQuestion.trim() && (
                  <div className="mt-5">
                    <label
                      htmlFor="securityAnswer"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Câu trả lời xác thực
                    </label>

                    <input
                      id="securityAnswer"
                      type="text"
                      name="securityAnswer"
                      value={form.securityAnswer}
                      onChange={handleChange}
                      placeholder={
                        person?.securityQuestion
                          ? "Để trống nếu không muốn đổi câu trả lời"
                          : "Nhập câu trả lời"
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      Chỉ người trả lời đúng mới có thể mở album.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || uploadingImage}
              className="rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Đang lưu..."
                : uploadingImage
                  ? "Đang upload ảnh..."
                  : person
                    ? "Lưu thay đổi"
                    : "Thêm người"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PersonForm;