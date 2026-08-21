import { useEffect, useMemo } from "react";
import {
  FaCheckCircle,
  FaClock,
  FaCommentDots,
  FaEnvelopeOpenText,
  FaQuestionCircle,
  FaTimes,
  FaTimesCircle,
  FaTrash,
  FaUser,
} from "react-icons/fa";

function GraduationRsvpModal({
  open,
  onClose,
  list = [],
  loading = false,
  onDelete,
}) {
  // Khóa cuộn trang khi mở modal + Hỗ trợ phím ESC để đóng
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  // Thống kê số lượng
  const stats = useMemo(() => {
    const total = list.length;
    const countYes = list.filter((item) => item.attendance === "yes").length;
    const countMaybe = list.filter((item) => item.attendance === "maybe").length;
    const countNo = list.filter((item) => item.attendance === "no").length;

    return { total, countYes, countMaybe, countNo };
  }, [list]);

  const formatDateTime = (value) => {
    if (!value) return "--:--:--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(date);
  };

  const getAttendanceBadge = (status) => {
    switch (status) {
      case "yes":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 sm:text-xs">
            <FaCheckCircle className="text-emerald-600" /> Sẽ tham dự
          </span>
        );
      case "maybe":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 sm:text-xs">
            <FaQuestionCircle className="text-amber-600" /> Chưa chắc chắn
          </span>
        );
      case "no":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800 sm:text-xs">
            <FaTimesCircle className="text-rose-600" /> Vắng mặt
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 sm:text-xs">
            Khác
          </span>
        );
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <div
        className="flex max-h-[96dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[94dvh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="shrink-0 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 px-4 py-4 text-white sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg backdrop-blur sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl">
                <FaEnvelopeOpenText />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black sm:text-2xl">
                  Xác nhận tham dự lễ tốt nghiệp
                </h2>
                <p className="mt-0.5 truncate text-xs font-medium text-blue-100 sm:text-sm">
                  Danh sách phản hồi & lời chúc từ khách mời
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-base text-white backdrop-blur transition hover:bg-white/25 active:scale-95 cursor-pointer sm:h-10 sm:w-10 sm:text-lg"
              aria-label="Đóng (ESC)"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* TỔNG QUAN / 4 THẺ THẲNG HÀNG 1 DÒNG */}
        <div className="grid shrink-0 grid-cols-4 gap-2 border-b border-indigo-100 bg-white p-3 sm:px-6 sm:py-3.5">
          {/* Tổng phản hồi */}
          <div className="flex min-w-0 items-center justify-between gap-1.5 rounded-xl border border-blue-100 bg-blue-50/80 px-2.5 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <FaEnvelopeOpenText className="shrink-0 text-blue-600 text-xs sm:text-sm" />
              <span className="truncate text-[10px] font-bold uppercase tracking-wide text-blue-600 sm:text-xs">
                Tổng:
              </span>
            </div>
            <span className="shrink-0 font-mono text-xs font-black text-blue-700 sm:text-base">
              {stats.total.toLocaleString("vi-VN")}
            </span>
          </div>

          {/* Sẽ tham dự */}
          <div className="flex min-w-0 items-center justify-between gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50/80 px-2.5 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <FaCheckCircle className="shrink-0 text-emerald-600 text-xs sm:text-sm" />
              <span className="truncate text-[10px] font-bold uppercase tracking-wide text-emerald-600 sm:text-xs">
                Tham dự:
              </span>
            </div>
            <span className="shrink-0 font-mono text-xs font-black text-emerald-700 sm:text-base">
              {stats.countYes.toLocaleString("vi-VN")}
            </span>
          </div>

          {/* Chưa chắc chắn */}
          <div className="flex min-w-0 items-center justify-between gap-1.5 rounded-xl border border-amber-100 bg-amber-50/80 px-2.5 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <FaQuestionCircle className="shrink-0 text-amber-600 text-xs sm:text-sm" />
              <span className="truncate text-[10px] font-bold uppercase tracking-wide text-amber-600 sm:text-xs">
                Có thể:
              </span>
            </div>
            <span className="shrink-0 font-mono text-xs font-black text-amber-700 sm:text-base">
              {stats.countMaybe.toLocaleString("vi-VN")}
            </span>
          </div>

          {/* Vắng mặt */}
          <div className="flex min-w-0 items-center justify-between gap-1.5 rounded-xl border border-rose-100 bg-rose-50/80 px-2.5 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <FaTimesCircle className="shrink-0 text-rose-600 text-xs sm:text-sm" />
              <span className="truncate text-[10px] font-bold uppercase tracking-wide text-rose-600 sm:text-xs">
                Vắng:
              </span>
            </div>
            <span className="shrink-0 font-mono text-xs font-black text-rose-700 sm:text-base">
              {stats.countNo.toLocaleString("vi-VN")}
            </span>
          </div>
        </div>

        {/* NỘI DUNG / CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/40 p-3 sm:p-6">
          {loading ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center sm:min-h-[280px]">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600 sm:h-10 sm:w-10" />
              <p className="mt-3 text-xs font-semibold text-slate-500 sm:mt-4 sm:text-sm">
                Đang tải danh sách xác nhận...
              </p>
            </div>
          ) : list.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center sm:min-h-[280px]">
              <div className="text-4xl sm:text-5xl">💌</div>
              <h3 className="mt-3 text-base font-bold text-slate-800 sm:mt-4 sm:text-lg">
                Chưa có phản hồi nào
              </h3>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Các phản hồi xác nhận tham dự của khách mời sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {list.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                >
                  {/* Header thẻ người gửi */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-50 bg-indigo-50/40 p-3 sm:px-4 sm:py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-xs text-indigo-600 sm:h-8 sm:w-8 sm:text-sm">
                        <FaUser />
                      </div>
                      <span className="text-sm font-bold text-slate-900 sm:text-base">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getAttendanceBadge(item.attendance)}

                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 bg-white text-xs text-red-500 shadow-2xs transition hover:bg-red-50 hover:text-red-700 active:scale-95 cursor-pointer sm:h-8 sm:w-8"
                          title="Xóa phản hồi này"
                          aria-label={`Xóa phản hồi của ${item.name}`}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chi tiết nội dung phản hồi */}
                  <div className="space-y-2.5 p-3 sm:p-4">
                    {/* Lời chúc */}
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                        <FaCommentDots />
                        <span>Lời chúc:</span>
                      </div>
                      {item.wishes ? (
                        <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-slate-800 sm:text-sm">
                          "{item.wishes}"
                        </p>
                      ) : (
                        <p className="mt-1 text-xs italic text-slate-400">
                          (Khách mời không để lại lời chúc)
                        </p>
                      )}
                    </div>

                    {/* Block Thời gian gửi */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs text-slate-500 sm:px-3.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        <FaClock className="text-indigo-500" />
                        <span>
                          Thời gian:{" "}
                          <strong className="text-slate-700">
                            {formatDateTime(item.submittedAt || item.created_at)}
                          </strong>
                        </span>
                      </div>

                      <span className="font-mono text-[11px] text-slate-400">
                        Mã RSVP: #{item.id}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="shrink-0 border-t border-slate-200 bg-white p-2.5 sm:p-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-full items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.99] cursor-pointer sm:min-h-[48px] sm:px-5 sm:text-base"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default GraduationRsvpModal;