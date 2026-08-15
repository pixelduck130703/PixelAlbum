import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

const EMPTY_FORM = {
  day: "",
  month: "",
  title: "",
  icon: "📅",
};

function EventManager({ open = false, onClose }) {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadEvents = async () => {
    try {
      setLoading(true);

      const response = await api.get("/admin/events");

      setEvents(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error("Lỗi tải sự kiện:", error);

      toast.error(
        error.response?.data?.message ||
          "Không thể tải danh sách sự kiện."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    setEditingId(null);
    setForm(EMPTY_FORM);

    loadEvents();
  }, [open]);

  if (!open) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    const day = Number(form.day);
    const month = Number(form.month);
    const title = form.title.trim();
    const icon = form.icon.trim() || "📅";

    if (!day || day < 1 || day > 31) {
      toast.error("Ngày phải từ 1 đến 31.");
      return;
    }

    if (!month || month < 1 || month > 12) {
      toast.error("Tháng phải từ 1 đến 12.");
      return;
    }

    if (!title) {
      toast.error("Vui lòng nhập tiêu đề sự kiện.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        day,
        month,
        title,
        icon,
      };

      if (editingId) {
        await api.put(
          `/admin/events/${editingId}`,
          payload
        );

        toast.success(
          "Cập nhật sự kiện thành công!"
        );
      } else {
        await api.post(
          "/admin/events",
          payload
        );

        toast.success(
          "Thêm sự kiện thành công!"
        );
      }

      setEditingId(null);
      setForm(EMPTY_FORM);

      await loadEvents();
    } catch (error) {
      console.error(
        "Lỗi lưu sự kiện:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Không thể lưu sự kiện."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);

    setForm({
      day: String(item.day),
      month: String(item.month),
      title: item.title || "",
      icon: item.icon || "📅",
    });
  };

  const handleCancelEdit = () => {
    if (saving) {
      return;
    }

    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleDelete = async (item) => {
    if (saving) {
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa sự kiện "${item.title}" không?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      await api.delete(
        `/admin/events/${item.id}`
      );

      toast.success(
        "Xóa sự kiện thành công!"
      );

      if (editingId === item.id) {
        setEditingId(null);
        setForm(EMPTY_FORM);
      }

      await loadEvents();
    } catch (error) {
      console.error(
        "Lỗi xóa sự kiện:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Không thể xóa sự kiện."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) {
      return;
    }

    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              📅 Quản lý sự kiện
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Sự kiện sẽ hiển thị trên trang chủ
              đúng ngày và tháng đã chọn.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-red-100 hover:text-red-600"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="border-b border-slate-200 bg-slate-50 p-4 sm:p-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="event-day"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Ngày
                </label>

                <input
                  id="event-day"
                  name="day"
                  type="number"
                  min="1"
                  max="31"
                  value={form.day}
                  onChange={handleChange}
                  placeholder="23"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="event-month"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Tháng
                </label>

                <input
                  id="event-month"
                  name="month"
                  type="number"
                  min="1"
                  max="12"
                  value={form.month}
                  onChange={handleChange}
                  placeholder="12"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="event-title"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Tiêu đề
              </label>

              <input
                id="event-title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="Tết Ông Công Ông Táo"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="event-icon"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Icon
              </label>

              <input
                id="event-icon"
                name="icon"
                type="text"
                value={form.icon}
                onChange={handleChange}
                placeholder="🐟"
                maxLength={10}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Hủy sửa
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Đang lưu..."
                  : editingId
                    ? "Lưu thay đổi"
                    : "Thêm sự kiện"}
              </button>
            </div>
          </form>
        </div>

        {/* List */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">
              Danh sách sự kiện
            </h3>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {events.length} sự kiện
            </span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-500">
              Đang tải sự kiện...
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-slate-500">
              Chưa có sự kiện nào.
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                    {item.icon || "📅"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                        {String(item.day).padStart(2, "0")}/
                        {String(item.month).padStart(2, "0")}
                      </span>
                    </div>

                    <p className="mt-1 break-words font-bold text-slate-800">
                      {item.title}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(item)
                      }
                      disabled={saving}
                      className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
                    >
                      Sửa
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(item)
                      }
                      disabled={saving}
                      className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventManager;