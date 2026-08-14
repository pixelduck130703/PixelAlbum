import { useState } from "react";
import { FaEnvelope, FaPaperPlane } from "react-icons/fa";

function FeedbackForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Vui lòng nhập họ tên.");
      return;
    }

    if (!form.message.trim()) {
      alert("Vui lòng nhập nội dung kiến nghị.");
      return;
    }

    const receiverEmail = "nguyentuanhung04022004@gmail.com";

    const emailSubject =
      form.subject.trim() || "Kiến nghị từ Memories Web";

    const emailBody = [
      `Họ tên: ${form.name.trim()}`,
      `Email người gửi: ${form.email.trim() || "Không cung cấp"}`,
      "",
      "Nội dung kiến nghị:",
      form.message.trim(),
    ].join("\n");

    const mailtoLink =
      `mailto:${receiverEmail}` +
      `?subject=${encodeURIComponent(emailSubject)}` +
      `&body=${encodeURIComponent(emailBody)}`;

    window.location.href = mailtoLink;
  };

  return (
    <section className="relative transform-gpu overflow-hidden rounded-3xl border border-white/80 border-t-white/95 bg-white/45 p-6 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),_0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-2xl backdrop-saturate-150 sm:p-8">
      {/* Vệt phản quang ánh sáng bề mặt kính trên cùng */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

      {/* Đốm màu khúc xạ tạo chiều sâu kính */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-blue-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-cyan-300/25 blur-3xl" />

      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-300/60 bg-blue-500/15 text-xl text-blue-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)] backdrop-blur-md">
          <FaEnvelope />
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-800 drop-shadow-sm">
            Gửi kiến nghị
          </h2>

          <p className="mt-1 font-medium text-slate-600">
            Gửi góp ý, yêu cầu chỉnh sửa thông tin hoặc báo cáo sự cố trong quá trình sử dụng.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative mt-7">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="feedback-name"
              className="mb-2 block text-sm font-bold text-slate-800"
            >
              Họ và tên <span className="text-red-500">*</span>
            </label>

            <input
              id="feedback-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nhập họ tên của bạn"
              className="w-full rounded-xl border border-slate-300/90 bg-white/90 px-4 py-3 font-semibold text-slate-900 placeholder-slate-500 shadow-sm backdrop-blur-md outline-none transition duration-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="feedback-email"
              className="mb-2 block text-sm font-bold text-slate-800"
            >
              Email của bạn
            </label>

            <input
              id="feedback-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
              className="w-full rounded-xl border border-slate-300/90 bg-white/90 px-4 py-3 font-semibold text-slate-900 placeholder-slate-500 shadow-sm backdrop-blur-md outline-none transition duration-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/20"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="feedback-subject"
              className="mb-2 block text-sm font-bold text-slate-800"
            >
              Tiêu đề
            </label>

            <input
              id="feedback-subject"
              type="text"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              placeholder="Tiêu đề"
              className="w-full rounded-xl border border-slate-300/90 bg-white/90 px-4 py-3 font-semibold text-slate-900 placeholder-slate-500 shadow-sm backdrop-blur-md outline-none transition duration-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/20"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="feedback-message"
              className="mb-2 block text-sm font-bold text-slate-800"
            >
              Nội dung kiến nghị <span className="text-red-500">*</span>
            </label>

            <textarea
              id="feedback-message"
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={8}
              placeholder={`Nhập nội dung bạn muốn gửi
- Bạn muốn cập nhật thông tin
- Bạn muốn gợi ý tính năng mới
- Bạn muốn thay đổi ảnh đại diện
- Bạn muốn thêm câu hỏi bảo mật để chỉ mình bạn mới có thể truy cập`}
              className="w-full resize-none rounded-xl border border-slate-300/90 bg-white/90 px-4 py-3 font-semibold text-slate-900 placeholder-slate-500 shadow-sm backdrop-blur-md outline-none transition duration-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-600/95 px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/25 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-blue-500/35 active:scale-95"
          >
            <FaPaperPlane />
            Gửi email kiến nghị
          </button>
        </div>
      </form>
    </section>
  );
}

export default FeedbackForm;