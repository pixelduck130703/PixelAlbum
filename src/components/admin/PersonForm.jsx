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

const provinces = [
  "An Giang",
  "Bắc Ninh",
  "Cà Mau",
  "Cao Bằng",
  "Cần Thơ",
  "Đà Nẵng",
  "Đắk Lắk",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Nội",
  "Hà Tĩnh",
  "Hải Phòng",
  "Hưng Yên",
  "Huế",
  "Khánh Hòa",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Nghệ An",
  "Ninh Bình",
  "Phú Thọ",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sơn La",
  "Tây Ninh",
  "Thái Nguyên",
  "Thanh Hóa",
  "Thành phố Hồ Chí Minh",
  "Tuyên Quang",
  "Vĩnh Long",
];

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

function convertToDisplayDate(value) {
  if (!value) return "";

  const normalized = String(value).slice(0, 10);

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalized)) {
    return normalized;
  }

  const [year, month, day] = normalized.split("-");

  if (!year || !month || !day) {
    return String(value);
  }

  return `${day}/${month}/${year}`;
}

function convertToDatabaseDate(value) {
  if (!value) return "";

  const normalized = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const parts = normalized.split("/");

  if (parts.length !== 3) {
    return "";
  }

  const [day, month, year] = parts;

  if (
    !/^\d{2}$/.test(day) ||
    !/^\d{2}$/.test(month) ||
    !/^\d{4}$/.test(year)
  ) {
    return "";
  }

  const dayNumber = Number(day);
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  const date = new Date(yearNumber, monthNumber - 1, dayNumber);

  if (
    date.getFullYear() !== yearNumber ||
    date.getMonth() !== monthNumber - 1 ||
    date.getDate() !== dayNumber
  ) {
    return "";
  }

  return `${year}-${month}-${day}`;
}

function PersonForm({
  open,
  person,
  onClose,
  onSubmit,
  submitting = false,
}) {
  const [form, setForm] = useState(initialForm);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [clearSecurityAnswer, setClearSecurityAnswer] = useState(false);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (person) {
      setForm({
        name: person.name || "",
        birthday: convertToDisplayDate(person.birthday),
        deathDate: convertToDisplayDate(person.deathDate),
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

    setClearSecurityAnswer(false);
    setUploadingImage(false);
  }, [person, open]);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "birthday" || name === "deathDate") {
      let date = value.replace(/\D/g, "").slice(0, 8);

      if (date.length > 2) {
        date = `${date.slice(0, 2)}/${date.slice(2)}`;
      }

      if (date.length > 5) {
        date = `${date.slice(0, 5)}/${date.slice(5)}`;
      }

      setForm((current) => ({
        ...current,
        [name]: date,
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSecurityQuestionChange = (event) => {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      securityQuestion: value,
      ...(value.trim()
        ? {}
        : {
            securityAnswer: "",
          }),
    }));

    if (!value.trim()) {
      setClearSecurityAnswer(false);
    }
  };

  const handleSecurityAnswerChange = (event) => {
    const value = event.target.value;
    setClearSecurityAnswer(false);

    setForm((current) => ({
      ...current,
      securityAnswer: value,
    }));
  };

  const handleClearSecurityAnswer = () => {
    setClearSecurityAnswer(true);

    setForm((current) => ({
      ...current,
      securityAnswer: "",
    }));
  };

  const handleRestoreSecurityAnswer = () => {
    setClearSecurityAnswer(false);

    setForm((current) => ({
      ...current,
      securityAnswer: "",
    }));
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

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

      setForm((current) => ({
        ...current,
        avatar: imageUrl,
      }));
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      alert(error.message || "Không thể tải ảnh lên Cloudinary.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleRemoveAvatar = () => {
    setForm((current) => ({
      ...current,
      avatar: "",
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Vui lòng nhập họ tên.");
      return;
    }

    const birthdayForDatabase = convertToDatabaseDate(form.birthday);
    const deathDateForDatabase = convertToDatabaseDate(form.deathDate);

    if (form.birthday && !birthdayForDatabase) {
      alert("Ngày sinh phải đúng định dạng DD/MM/YYYY và là ngày hợp lệ.");
      return;
    }

    if (form.deathDate && !deathDateForDatabase) {
      alert("Ngày mất phải đúng định dạng DD/MM/YYYY và là ngày hợp lệ.");
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

    const hasSecurityQuestion = form.securityQuestion.trim() !== "";
    const hasSecurityAnswer = form.securityAnswer.trim() !== "";
    const hasExistingQuestion = Boolean(person?.securityQuestion);

    // Khi tạo mới hoặc trước đó chưa có câu hỏi: Bắt buộc nhập câu trả lời
    if (hasSecurityQuestion && !hasExistingQuestion && !hasSecurityAnswer) {
      alert("Vui lòng nhập câu trả lời xác thực.");
      return;
    }

    // Nếu sửa câu hỏi nhưng đã xóa đáp án cũ và không nhập mới
    if (hasSecurityQuestion && hasExistingQuestion && clearSecurityAnswer && !hasSecurityAnswer) {
      alert("Vui lòng nhập câu trả lời xác thực mới hoặc khôi phục câu trả lời cũ.");
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
      avatar: form.avatar.trim(),
      album: form.album.trim(),
      securityQuestion: form.securityQuestion.trim(),
      securityAnswer: form.securityAnswer.trim(),
      clearSecurityAnswer,
    });
  };

  const handleBackdropClick = (event) => {
    if (
      event.target === event.currentTarget &&
      !submitting &&
      !uploadingImage
    ) {
      onClose();
    }
  };

  const isBusy = submitting || uploadingImage;
  const hasExistingAnswer = Boolean(person?.securityQuestion) && !clearSecurityAnswer;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
    >
      <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="shrink-0 bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 px-5 py-5 text-white sm:px-7 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/25 text-2xl backdrop-blur">
                {person ? "✏️" : "➕"}
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold sm:text-2xl">
                  {person ? "Chỉnh sửa album" : "Thêm album mới"}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
            <div className="space-y-6">
              {/* THÔNG TIN CƠ BẢN */}
              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <SectionHeader
                  icon="👤"
                  title="Thông tin cơ bản"
                  description="Thông tin nhận diện và liên hệ"
                />

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FormField
                    label="Họ và tên"
                    htmlFor="name"
                    required
                    fullWidth
                  >
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Ví dụ: Nguyễn Tuấn Hùng"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField
                    label="Ngày sinh"
                    htmlFor="birthday"
                  >
                    <input
                      id="birthday"
                      type="text"
                      name="birthday"
                      inputMode="numeric"
                      value={form.birthday}
                      onChange={handleChange}
                      placeholder="DD/MM/YYYY"
                      maxLength={10}
                      className={inputClass}
                    />
                    <HelperText>
                      Nhập theo định dạng ngày/tháng/năm.
                    </HelperText>
                  </FormField>

                  <FormField
                    label="Ngày mất"
                    htmlFor="deathDate"
                  >
                    <input
                      id="deathDate"
                      type="text"
                      name="deathDate"
                      inputMode="numeric"
                      value={form.deathDate}
                      onChange={handleChange}
                      placeholder="DD/MM/YYYY"
                      maxLength={10}
                      className={inputClass}
                    />
                    <HelperText>
                      Để trống nếu người này còn sống.
                    </HelperText>
                  </FormField>

                  <FormField
                    label="Giới tính"
                    htmlFor="gender"
                  >
                    <select
                      id="gender"
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </FormField>

                  <FormField
                    label="Lớp"
                    htmlFor="class"
                  >
                    <input
                      id="class"
                      type="text"
                      name="class"
                      value={form.class}
                      onChange={handleChange}
                      placeholder="Ví dụ: CNTT K63"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField
                    label="Số điện thoại"
                    htmlFor="phone"
                  >
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Ví dụ: 0123456789"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField
                    label="Quê quán/Địa điểm"
                    htmlFor="address"
                  >
                    <input
                      id="address"
                      type="text"
                      name="address"
                      list="provinces-list"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Nhập hoặc chọn tỉnh/thành phố"
                      className={inputClass}
                    />

                    <datalist id="provinces-list">
                      {provinces.map((province) => (
                        <option
                          key={province}
                          value={province}
                        />
                      ))}
                    </datalist>
                  </FormField>
                </div>
              </section>

              {/* ẢNH ĐẠI DIỆN */}
              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <SectionHeader
                  icon="📷"
                  title="Ảnh đại diện"
                  description="Tải ảnh lên Cloudinary, tối đa 5MB"
                />

                <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-sky-300 hover:bg-sky-50/40 sm:p-5">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleAvatarUpload}
                    disabled={isBusy}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-sky-500 file:px-4 file:py-2.5 file:font-semibold file:text-white hover:file:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <p className="mt-3 text-xs text-slate-500">
                    Hỗ trợ JPG, PNG, WEBP. Dung lượng tối đa 5MB.
                  </p>

                  {uploadingImage && (
                    <div className="mt-4 flex items-center gap-3 rounded-xl bg-sky-50 p-3 text-sm font-medium text-sky-700">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-sky-200 border-t-sky-500" />
                      Đang tải ảnh lên Cloudinary...
                    </div>
                  )}

                  {!uploadingImage && form.avatar && (
                    <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center">
                      <img
                        src={form.avatar}
                        alt="Ảnh đại diện xem trước"
                        className="h-24 w-24 shrink-0 rounded-full border-2 border-white object-cover shadow-md"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            "https://placehold.co/150x150?text=No+Image";
                        }}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-emerald-700">
                          ✓ Tải ảnh thành công
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {form.avatar}
                        </p>

                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={submitting}
                          className="mt-3 rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                        >
                          Xóa ảnh
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* LIÊN KẾT ALBUM */}
              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <SectionHeader
                  icon="🖼️"
                  title="Liên kết album"
                  description="Google Photos, Google Drive hoặc liên kết khác"
                />

                <div className="mt-5">
                  <input
                    id="album"
                    type="url"
                    name="album"
                    value={form.album}
                    onChange={handleChange}
                    placeholder="https://photos.app.goo.gl/..."
                    className={inputClass}
                  />
                </div>
              </section>

              {/* BẢO MẬT */}
              <section className="overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-sm">
                <div className="p-4 sm:p-6">
                  <SectionHeader
                    icon="🔐"
                    title="Xác thực khi xem album"
                    description="Để trống câu hỏi nếu không cần bảo vệ album"
                  />

                  <div className="mt-5 space-y-5">
                    <FormField
                      label="Câu hỏi xác thực"
                      htmlFor="securityQuestion"
                    >
                      <input
                        id="securityQuestion"
                        type="text"
                        name="securityQuestion"
                        value={form.securityQuestion}
                        onChange={handleSecurityQuestionChange}
                        placeholder="Ví dụ: Tên gọi ở nhà là gì?"
                        className={inputClass}
                      />
                    </FormField>

                    {form.securityQuestion.trim() && (
                      <FormField
                        label="Câu trả lời xác thực"
                        htmlFor="securityAnswer"
                        required={!hasExistingAnswer}
                      >
                        <div className="space-y-3">
                          {hasExistingAnswer && (
                            <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50/80 px-4 py-2.5 text-sm">
                              <span className="font-medium text-amber-900">
                                🔒 Đang lưu câu trả lời bảo mật (đã mã hóa)
                              </span>
                              <button
                                type="button"
                                onClick={handleClearSecurityAnswer}
                                disabled={isBusy}
                                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                              >
                                Xóa để tạo mới
                              </button>
                            </div>
                          )}

                          <input
                            id="securityAnswer"
                            type="text"
                            name="securityAnswer"
                            value={form.securityAnswer}
                            onChange={handleSecurityAnswerChange}
                            placeholder={
                              hasExistingAnswer
                                ? "Nhập vào đây nếu muốn thay thế câu trả lời mới..."
                                : "Nhập câu trả lời..."
                            }
                            className={inputClass}
                          />

                          {clearSecurityAnswer && (
                            <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                              <span className="text-sm font-medium text-red-600">
                                ⚠️ Đã xóa câu trả lời cũ. Hãy nhập câu trả lời mới vào ô trên.
                              </span>
                              <button
                                type="button"
                                onClick={handleRestoreSecurityAnswer}
                                disabled={isBusy}
                                className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 cursor-pointer"
                              >
                                Khôi phục câu trả lời cũ
                              </button>
                            </div>
                          )}

                          <HelperText>
                            {hasExistingAnswer
                              ? "Nếu không muốn đổi, bạn chỉ cần để trống ô này (câu trả lời cũ vẫn sẽ được giữ nguyên)."
                              : "Chỉ người trả lời đúng câu hỏi này mới có thể mở album."}
                          </HelperText>
                        </div>
                      </FormField>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* FOOTER */}
          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isBusy}
                className="min-h-[48px] rounded-xl bg-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={isBusy}
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {submitting && (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}

                {submitting
                  ? "Đang lưu..."
                  : uploadingImage
                    ? "Đang tải ảnh..."
                    : person
                      ? "Lưu thay đổi"
                      : "Thêm album"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-xl">
        {icon}
      </div>

      <div>
        <h3 className="font-bold text-slate-800 sm:text-lg">{title}</h3>
        {description && (
          <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  required = false,
  fullWidth = false,
  children,
}) {
  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function HelperText({ children }) {
  return (
    <p className="mt-2 text-xs leading-5 text-slate-500">{children}</p>
  );
}

export default PersonForm;