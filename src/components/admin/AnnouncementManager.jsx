import { useEffect, useState } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

function AnnouncementManager({
    open = false,
    onClose,
}) {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;

        const loadAnnouncement = async () => {
            try {
                setLoading(true);

                const response = await api.get("/announcement");

                if (cancelled) {
                    return;
                }

                setContent(response.data?.content || "");
            } catch (error) {
                if (cancelled) {
                    return;
                }

                console.error("Lỗi tải thông báo:", error);

                toast.error(
                    error.response?.data?.message ||
                    "Không thể tải thông báo."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadAnnouncement();

        return () => {
            cancelled = true;
        };
    }, [open]);

    if (!open) {
        return null;
    }

    const handleClose = () => {
        if (saving) {
            return;
        }

        onClose?.();
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            const normalizedContent = content.trim();

            const response = await api.put(
                "/admin/announcement",
                {
                    content: normalizedContent,
                }
            );

            setContent(response.data?.content || "");

            toast.success(
                normalizedContent
                    ? "Đã lưu thông báo!"
                    : "Đã xóa thông báo!"
            );

            onClose?.();
        } catch (error) {
            console.error("Lỗi lưu thông báo:", error);

            toast.error(
                error.response?.data?.message ||
                "Không thể lưu thông báo."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleClear = async () => {
        if (!content.trim() || saving) {
            return;
        }

        const confirmed = window.confirm(
            "Bạn có chắc muốn xóa thông báo hiện tại không?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setSaving(true);

            await api.put("/admin/announcement", {
                content: "",
            });

            setContent("");

            toast.success("Đã xóa thông báo.");

            onClose?.();
        } catch (error) {
            console.error("Lỗi xóa thông báo:", error);

            toast.error(
                error.response?.data?.message ||
                "Không thể xóa thông báo."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-5 py-5 text-white sm:px-6 sm:py-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur">
                                📢
                            </div>

                            <h2 className="text-xl font-bold sm:text-2xl">
                                Thông báo trang chủ
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={saving}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-xl text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Đóng"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Nội dung */}
                <div className="max-h-[65vh] overflow-y-auto p-4 sm:p-6">
                    {loading ? (
                        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-sm text-slate-500">
                            <span className="h-8 w-8 animate-spin rounded-full border-4 border-amber-100 border-t-amber-500" />
                            Đang tải thông báo...
                        </div>
                    ) : (
                        <>
                            <label
                                htmlFor="announcement-content"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Nội dung thông báo
                            </label>

                            <textarea
                                id="announcement-content"
                                value={content}
                                onChange={(event) =>
                                    setContent(event.target.value)
                                }
                                rows={7}
                                maxLength={1000}
                                disabled={saving}
                                placeholder="Ví dụ: Website sẽ bảo trì từ 22:00 đến 23:00 tối nay..."
                                className="min-h-[180px] w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3 leading-7 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
                            />

                            <div className="mt-2 flex flex-col gap-1 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                                <span>
                                    Để trống thì trang chủ sẽ không hiển thị thông báo.
                                </span>

                                <span className="shrink-0 font-medium">
                                    {content.length}/1000
                                </span>
                            </div>

                            {/* Xem trước */}
                            {content.trim() && (
                                <div className="mt-5 hidden overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 sm:block">
                                    <div className="border-b border-amber-200 px-4 py-3">
                                        <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
                                            Xem trước
                                        </p>
                                    </div>

                                    <div className="flex items-start gap-3 p-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-lg text-white shadow-sm">
                                            📢
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-amber-800">
                                                Thông báo
                                            </p>

                                            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                                                {content.trim()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!loading && (
                    <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
                        <div className="grid grid-cols-1 gap-3 sm:flex sm:justify-end">
                            <button
                                type="button"
                                onClick={handleClear}
                                disabled={saving || !content.trim()}
                                className="min-h-[48px] rounded-xl bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Xóa thông báo
                            </button>

                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={saving}
                                className="min-h-[48px] rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Hủy
                            </button>

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving && (
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                )}

                                {saving
                                    ? "Đang lưu..."
                                    : "Lưu thông báo"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AnnouncementManager;