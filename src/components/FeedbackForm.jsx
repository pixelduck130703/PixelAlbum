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
    <section className="h-full rounded-3xl bg-white p-6 shadow-xl sm:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl text-blue-600">
          <FaEnvelope />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Gửi kiến nghị
          </h2>

          <p className="mt-1 text-slate-500">
            Gửi góp ý, yêu cầu chỉnh sửa thông tin hoặc báo cáo sự cố trong quá trình sử dụng.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-7">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="feedback-name"
              className="mb-2 block text-sm font-semibold text-slate-700"
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
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="feedback-email"
              className="mb-2 block text-sm font-semibold text-slate-700"
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
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="feedback-subject"
              className="mb-2 block text-sm font-semibold text-slate-700"
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
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="feedback-message"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Nội dung kiến nghị <span className="text-red-500">*</span>
            </label>

            <textarea
              id="feedback-message"
              name="message"
              value={form.message}
              onChange={handleChange}
              rows={6}
              placeholder="Nhập nội dung bạn muốn gửi"
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
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