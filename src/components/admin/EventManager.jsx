import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { 
    FaCalendarAlt, 
    FaTimes, 
    FaPlus, 
    FaEdit, 
    FaTrashAlt, 
    FaSave, 
    FaTimesCircle, 
    FaSmile, 
    FaListUl 
} from "react-icons/fa";

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

    // Khóa cuộn trang & hỗ trợ phím Esc
    useEffect(() => {
        if (!open) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (e) => {
            if (e.key === "Escape" && !saving) {
                onClose?.();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, saving, onClose]);

    // Tải danh sách sự kiện
    const loadEvents = async () => {
        try {
            setLoading(true);
            const response = await api.get("/admin/events");
            setEvents(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Lỗi tải sự kiện:", error);
            toast.error(error.response?.data?.message || "Không thể tải danh sách sự kiện.");
        } finally {
            setLoading(false);
        }
    };

    // Khi mở Modal
    useEffect(() => {
        if (!open) return;
        setEditingId(null);
        setForm(EMPTY_FORM);
        loadEvents();
    }, [open]);

    if (!open) return null;

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (saving) return;

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
            const payload = { day, month, title, icon };

            if (editingId) {
                await api.put(`/admin/events/${editingId}`, payload);
                toast.success("Cập nhật sự kiện thành công!");
            } else {
                await api.post("/admin/events", payload);
                toast.success("Thêm sự kiện mới thành công!");
            }

            setEditingId(null);
            setForm(EMPTY_FORM);
            await loadEvents();
        } catch (error) {
            console.error("Lỗi lưu sự kiện:", error);
            toast.error(error.response?.data?.message || "Không thể lưu sự kiện.");
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
        if (saving) return;
        setEditingId(null);
        setForm(EMPTY_FORM);
    };

    const handleDelete = async (item) => {
        if (saving) return;
        const confirmed = window.confirm(`Bạn có chắc muốn xóa sự kiện "${item.title}" không?`);
        if (!confirmed) return;

        try {
            setSaving(true);
            await api.delete(`/admin/events/${item.id}`);
            toast.success("Xóa sự kiện thành công!");

            if (editingId === item.id) {
                setEditingId(null);
                setForm(EMPTY_FORM);
            }

            await loadEvents();
        } catch (error) {
            console.error("Lỗi xóa sự kiện:", error);
            toast.error(error.response?.data?.message || "Không thể xóa sự kiện.");
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        if (saving) return;
        onClose?.();
    };

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-5" 
            onClick={handleClose}
        >
            <div 
                className="flex max-h-[96dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[94dvh] sm:rounded-3xl" 
                onClick={(event) => event.stopPropagation()}
            >
                {/* HEADER */}
                <div className="shrink-0 bg-gradient-to-r from-rose-500 via-rose-600 to-red-500 px-4 py-4 text-white sm:px-6 sm:py-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg backdrop-blur sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl">
                                <FaCalendarAlt />
                            </div>
                            <div className="min-w-0">
                                <h2 className="truncate text-lg font-black sm:text-2xl">Quản lý sự kiện</h2>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={saving}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-base text-white backdrop-blur transition hover:bg-white/25 active:scale-95 disabled:opacity-40 sm:h-10 sm:w-10 sm:text-lg"
                            aria-label="Đóng"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* FORM TẠO / SỬA SỰ KIỆN */}
                <div className="shrink-0 border-b border-rose-100 bg-rose-50/40 p-3.5 sm:p-5">
                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">

                        {/* HÀNG 1: NGÀY - THÁNG - ICON */}
                        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                            {/* Ngày */}
                            <div>
                                <label className="mb-1 block text-[11px] font-bold text-slate-600 sm:text-xs">Ngày</label>
                                <input
                                    type="number"
                                    name="day"
                                    min="1"
                                    max="31"
                                    placeholder="01"
                                    value={form.day}
                                    onChange={handleChange}
                                    className="h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-center text-xs font-bold text-slate-800 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100 sm:text-sm"
                                />
                            </div>

                            {/* Tháng */}
                            <div>
                                <label className="mb-1 block text-[11px] font-bold text-slate-600 sm:text-xs">Tháng</label>
                                <input
                                    type="number"
                                    name="month"
                                    min="1"
                                    max="12"
                                    placeholder="01"
                                    value={form.month}
                                    onChange={handleChange}
                                    className="h-10 w-full rounded-xl border border-rose-100 bg-white px-3 text-center text-xs font-bold text-slate-800 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100 sm:text-sm"
                                />
                            </div>

                            {/* Icon / Emoji */}
                            <div>
                                <label className="mb-1 block text-[11px] font-bold text-slate-600 sm:text-xs">Icon / Emoji</label>
                                <div className="relative">
                                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-rose-400">
                                        <FaSmile />
                                    </span>
                                    <input
                                        type="text"
                                        name="icon"
                                        maxLength={10}
                                        placeholder="📅"
                                        value={form.icon}
                                        onChange={handleChange}
                                        className="h-10 w-full rounded-xl border border-rose-100 bg-white pl-7 pr-2 text-center text-xs font-bold text-slate-800 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100 sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* HÀNG 2: TÊN SỰ KIỆN (RIÊNG 1 HÀNG FULL CHIỀU RỘNG) */}
                        <div>
                            <label className="mb-1 block text-[11px] font-bold text-slate-600 sm:text-xs">Tiêu đề sự kiện</label>
                            <input
                                type="text"
                                name="title"
                                placeholder="Nhập tên sự kiện"
                                value={form.title}
                                onChange={handleChange}
                                className="h-10 w-full rounded-xl border border-rose-100 bg-white px-3.5 text-xs font-bold text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 sm:text-sm"
                            />
                        </div>

                        {/* HÀNG 3: NÚT THAO TÁC */}
                        <div className="flex items-center justify-end gap-2 pt-0.5">
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    disabled={saving}
                                    className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                                >
                                    <FaTimesCircle className="text-sm" />
                                    <span>Hủy sửa</span>
                                </button>
                            )}

                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-rose-500 px-4 text-xs font-bold text-white shadow-sm shadow-rose-200 transition hover:bg-rose-600 active:scale-95 disabled:opacity-50"
                            >
                                <FaSave className="text-xs" />
                                <span>{saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm sự kiện"}</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* DANH SÁCH SỰ KIỆN */}
                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/40 p-3 sm:p-5">
                    {/* Sub Header Danh Sách */}
                    <div className="mb-3 flex items-center justify-between gap-2 px-1">
                        <div className="flex items-center gap-2">
                            <FaListUl className="text-xs text-rose-500" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 sm:text-sm">
                                Danh sách hiện tại
                            </h4>
                        </div>
                        <span className="rounded-full border border-rose-100 bg-rose-50 px-2.5 py-0.5 text-[11px] font-black text-rose-600">
                            {events.length} sự kiện
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex min-h-[200px] flex-col items-center justify-center sm:min-h-[240px]">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-100 border-t-rose-500 sm:h-10 sm:w-10" />
                            <p className="mt-3 text-xs font-semibold text-slate-500 sm:text-sm">Đang tải dữ liệu sự kiện...</p>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-rose-200 bg-rose-50/30 p-6 text-center sm:min-h-[240px]">
                            <div className="text-4xl">🗓️</div>
                            <h3 className="mt-2.5 text-sm font-bold text-slate-800 sm:text-base">Chưa có sự kiện nào</h3>
                            <p className="mt-1 text-xs text-slate-400">Điền thông tin ở form phía trên để thêm sự kiện đầu tiên.</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {events.map((item) => (
                                <div
                                    key={item.id}
                                    className={`group flex items-center justify-between gap-3 rounded-2xl border bg-white p-3 shadow-sm transition hover:border-rose-200 hover:shadow-md ${
                                        editingId === item.id ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200"
                                    }`}
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        {/* Badge icon sự kiện */}
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-xl shadow-xs transition group-hover:scale-105 sm:h-12 sm:w-12 sm:text-2xl">
                                            {item.icon || "📅"}
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-black text-rose-700">
                                                    {String(item.day).padStart(2, "0")}/{String(item.month).padStart(2, "0")}
                                                </span>
                                            </div>
                                            <p className="mt-1 truncate text-xs font-bold text-slate-800 sm:text-sm">
                                                {item.title}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleEdit(item)}
                                            disabled={saving}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-xs transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-40 sm:h-9 sm:w-9"
                                            title="Sửa sự kiện"
                                        >
                                            <FaEdit className="text-xs sm:text-sm" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(item)}
                                            disabled={saving}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-xs transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:opacity-40 sm:h-9 sm:w-9"
                                            title="Xóa sự kiện"
                                        >
                                            <FaTrashAlt className="text-xs sm:text-sm" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="shrink-0 border-t border-slate-200 bg-white p-2.5 sm:p-4 sm:px-6">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={saving}
                        className="flex h-10 w-full items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-rose-50 hover:text-rose-700 active:scale-[0.99] disabled:opacity-50 sm:min-h-[44px] sm:px-5 sm:text-base"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EventManager;