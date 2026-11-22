import React, { useEffect, useMemo } from "react";
import {
  FaEye,
  FaClock,
  FaTimes,
  FaDesktop,
  FaMobileAlt,
  FaTabletAlt,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import AlbumLocationBadge from "./AlbumLocationBadge";

const FALLBACK_AVATAR = "https://placehold.co/160x160?text=Avatar";

function TodayAlbumViewsModal({
  open,
  people = [],
  summary = { totalAlbums: 0, totalViews: 0 },
  selectedDate = "",
  loading = false,
  onDateChange,
  onClose,
}) {
  // Lấy ngày hôm nay theo giờ VN
  const today = useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }, []);

  // Khóa cuộn trang + Bắt sự kiện phím ESC
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

  if (!open) return null;

  const safePeople = Array.isArray(people) ? people : [];

  const formatDate = (value) => {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    return year && month && day ? `${day}/${month}/${year}` : value;
  };

  const formatTime = (value) => {
    if (!value) return "--:--:--";
    try {
      return new Date(value).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Ho_Chi_Minh",
      });
    } catch {
      return "--:--:--";
    }
  };

  const changeDate = (numberOfDays) => {
    if (!selectedDate) return;
    const [year, month, day] = selectedDate.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    date.setUTCDate(date.getUTCDate() + numberOfDays);

    const nextYear = date.getUTCFullYear();
    const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
    const nextDay = String(date.getUTCDate()).padStart(2, "0");

    onDateChange?.(`${nextYear}-${nextMonth}-${nextDay}`);
  };

  const getDeviceIcon = (device = "") => {
    const value = String(device).toLowerCase();
    if (value.includes("mobile") || value.includes("smartphone"))
      return <FaMobileAlt className="text-emerald-600 shrink-0" />;
    if (value.includes("tablet")) return <FaTabletAlt className="text-lime-600 shrink-0" />;
    return <FaDesktop className="text-green-600 shrink-0" />;
  };

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_AVATAR;
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <div
        className="flex max-h-[96dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[94dvh] sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div className="shrink-0 bg-gradient-to-r from-emerald-600 via-green-600 to-lime-600 px-4 py-3.5 text-white sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 text-base backdrop-blur sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl">
                <FaEye />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-black sm:text-2xl">
                  Lịch sử xem album theo ngày
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm text-white backdrop-blur transition hover:bg-white/25 active:scale-95 cursor-pointer sm:h-10 sm:w-10 sm:text-lg"
              aria-label="Đóng"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* BỘ CHỌN NGÀY */}
        <div className="shrink-0 border-b border-emerald-100 bg-emerald-50/50 px-3 py-2 sm:px-6 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="hidden min-w-0 items-center gap-2.5 sm:flex">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <FaCalendarAlt className="text-sm" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Ngày thống kê
                </p>
                <p className="mt-0.5 text-sm font-black text-slate-800">
                  {formatDate(selectedDate)}
                </p>
              </div>
            </div>

            <div className="flex w-full items-center justify-end gap-1.5 sm:w-auto sm:gap-2">
              <button
                type="button"
                onClick={() => changeDate(-1)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-white text-slate-500 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95 cursor-pointer sm:h-10 sm:w-10"
                title="Ngày trước"
              >
                <FaChevronLeft className="text-xs sm:text-sm" />
              </button>

              <div className="relative min-w-0 flex-1 sm:w-[160px] sm:flex-none">
                <FaCalendarAlt className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-emerald-500 sm:text-sm" />
                <input
                  type="date"
                  value={selectedDate}
                  max={today}
                  onChange={(event) => onDateChange?.(event.target.value)}
                  className="h-9 w-full min-w-0 rounded-xl border border-emerald-100 bg-white pl-7 pr-2 text-xs font-bold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:h-10 sm:pl-8 sm:pr-3 sm:text-sm"
                />
              </div>

              <button
                type="button"
                onClick={() => changeDate(1)}
                disabled={selectedDate >= today}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-white text-slate-500 shadow-xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer sm:h-10 sm:w-10"
                title="Ngày sau"
              >
                <FaChevronRight className="text-xs sm:text-sm" />
              </button>

              {selectedDate !== today && (
                <button
                  type="button"
                  onClick={() => onDateChange?.(today)}
                  className="h-9 shrink-0 whitespace-nowrap rounded-xl bg-emerald-600 px-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 cursor-pointer sm:h-10 sm:px-4"
                >
                  Hôm nay
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TỔNG QUAN */}
        <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-emerald-100 bg-white p-2.5 sm:gap-3 sm:px-6 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 py-2 sm:gap-2.5 sm:rounded-2xl sm:px-4 sm:py-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs text-emerald-600 sm:h-9 sm:w-9 sm:text-base">
              <FaEye />
            </div>
            <span className="truncate text-[9px] font-bold uppercase tracking-wide text-emerald-600 sm:text-xs">
              Album đã xem
            </span>
            <span className="ml-auto shrink-0 text-sm font-black leading-none text-emerald-700 sm:text-xl">
              {Number(summary.totalAlbums || 0).toLocaleString("vi-VN")}
            </span>
          </div>

          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-lime-100 bg-lime-50 px-2.5 py-2 sm:gap-2.5 sm:rounded-2xl sm:px-4 sm:py-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lime-100 text-xs text-lime-600 sm:h-9 sm:w-9 sm:text-base">
              <FaClock />
            </div>
            <span className="truncate text-[9px] font-bold uppercase tracking-wide text-lime-600 sm:text-xs">
              Tổng lượt mở
            </span>
            <span className="ml-auto shrink-0 text-sm font-black leading-none text-lime-700 sm:text-xl">
              {Number(summary.totalViews || 0).toLocaleString("vi-VN")}
            </span>
          </div>
        </div>

        {/* NỘI DUNG */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/40 p-2.5 sm:p-6">
          {loading ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center sm:min-h-[280px]">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-100 border-t-emerald-600 sm:h-10 sm:w-10 sm:border-4" />
              <p className="mt-3 text-xs font-semibold text-slate-500 sm:mt-4 sm:text-sm">
                Đang tải dữ liệu...
              </p>
            </div>
          ) : safePeople.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center text-center sm:min-h-[280px]">
              <div className="text-3xl sm:text-5xl">👀</div>
              <h3 className="mt-2 text-sm font-bold text-slate-800 sm:mt-4 sm:text-lg">
                Không có lượt xem
              </h3>
              <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">
                Không có album nào được mở ngày{" "}
                <strong className="text-emerald-600">{formatDate(selectedDate)}</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-4">
              {safePeople.map((person) => {
                const viewDetails = Array.isArray(person.viewDetails) ? person.viewDetails : [];
                const viewTimes = Array.isArray(person.viewTimes) ? person.viewTimes : [];

                return (
                  <article
                    key={person.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition hover:border-emerald-200 hover:shadow-md sm:rounded-2xl"
                  >
                    {/* Thông tin người */}
                    <div className="flex items-center gap-2.5 p-2.5 sm:gap-3 sm:p-4">
                      <img
                        src={person.avatar || FALLBACK_AVATAR}
                        alt={person.name || "Avatar"}
                        onError={handleImageError}
                        className="h-10 w-10 shrink-0 rounded-full border border-emerald-100 object-cover shadow-xs sm:h-12 sm:w-12"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate text-xs font-bold text-slate-800 sm:text-base">
                            {person.name || "Chưa cập nhật"}
                          </h3>

                          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:px-2.5 sm:py-1 sm:text-xs">
                              <FaEye className="text-[10px]" />
                              <span>{Number(person.todayViews || 0).toLocaleString("vi-VN")} lượt</span>
                            </span>

                            <span className="inline-flex items-center rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-semibold text-lime-700 sm:px-2.5 sm:py-1 sm:text-xs">
                              <span>
                                Tổng {Number(person.totalViews || person.albumViews || person.viewCount || 0).toLocaleString("vi-VN")}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chi tiết từng phiên mở */}
                    <div className="border-t border-emerald-100 bg-gradient-to-r from-emerald-50/40 via-white to-lime-50/30 p-2.5 sm:p-4">
                      <div className="mb-2 flex items-center gap-1.5 sm:mb-2.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-emerald-600 sm:h-6 sm:w-6">
                          <FaClock className="text-[10px] sm:text-xs" />
                        </div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 sm:text-[10px]">
                          Chi tiết các lần mở
                        </p>
                      </div>

                      {viewDetails.length > 0 ? (
                        <div className="space-y-1.5 sm:space-y-2">
                          {[...viewDetails].reverse().map((detail, index) => {
                            const viewedAt = detail?.viewedAt;
                            const deviceName =
                              detail?.deviceName ||
                              detail?.deviceModel ||
                              detail?.deviceTypeText ||
                              detail?.deviceType ||
                              "Không xác định";
                            const deviceType = detail?.deviceType || "";
                            const os = detail?.os || "";

                            return (
                              <div
                                key={`${person.id}-${viewedAt}-${index}`}
                                className="overflow-x-auto no-scrollbar rounded-lg border border-slate-100 bg-white/90 p-2 shadow-2xs sm:rounded-xl sm:p-2.5"
                              >
                                {/* CỐ ĐỊNH 1 HÀNG DUY NHẤT (flex-row, flex-nowrap) */}
                                <div className="flex min-w-max flex-row items-center justify-between gap-2.5 sm:gap-4">
                                  
                                  {/* Khối Thời gian */}
                                  <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-100 text-[11px] text-blue-600 sm:h-8 sm:w-8 sm:rounded-lg sm:text-xs">
                                      <FaClock />
                                    </div>
                                    <div className="shrink-0">
                                      <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 sm:text-[9px]">
                                        Thời gian
                                      </p>
                                      <p className="whitespace-nowrap text-[11px] font-black text-slate-800 sm:text-xs">
                                        {formatTime(viewedAt)}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Khối Badges: Vị trí (Location), Thiết bị, Hệ điều hành */}
                                  <div className="flex shrink-0 flex-row items-center gap-1.5 sm:gap-2">
                                    {/* Badge Vị trí (Thay cho trình duyệt) */}
                                    <AlbumLocationBadge detail={detail} daily={person} />

                                    {/* Badge Thiết bị */}
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-violet-100/90 px-2 py-0.5 text-[10px] font-semibold text-violet-800 whitespace-nowrap sm:rounded-full sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-xs">
                                      {getDeviceIcon(deviceType)}
                                      <span className="max-w-[120px] truncate sm:max-w-none">
                                        {deviceName}
                                      </span>
                                    </span>

                                    {/* Badge Hệ điều hành */}
                                    {os && (
                                      <span className="inline-flex shrink-0 items-center rounded-md bg-emerald-100/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 whitespace-nowrap sm:rounded-full sm:px-2.5 sm:py-1 sm:text-xs">
                                        <span className="max-w-[90px] truncate sm:max-w-none">
                                          {os}
                                        </span>
                                      </span>
                                    )}
                                  </div>

                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : viewTimes.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {[...viewTimes].reverse().map((viewedAt, index) => (
                            <span
                              key={`${person.id}-${viewedAt}-${index}`}
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:px-2.5 sm:py-1 sm:text-xs"
                            >
                              <FaClock className="text-[10px]" />
                              {formatTime(viewedAt)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 sm:text-sm">Chưa có dữ liệu chi tiết.</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="shrink-0 border-t border-slate-200 bg-white p-2.5 sm:p-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-full items-center justify-center rounded-xl bg-slate-100 px-4 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700 active:scale-[0.99] cursor-pointer sm:min-h-[46px] sm:px-5 sm:text-base"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default TodayAlbumViewsModal;
