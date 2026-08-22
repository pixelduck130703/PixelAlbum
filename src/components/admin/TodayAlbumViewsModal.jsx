import React, { useEffect, useMemo, useCallback } from "react";
import {
  FaEye,
  FaClock,
  FaTimes,
  FaChrome,
  FaFirefoxBrowser,
  FaSafari,
  FaEdge,
  FaDesktop,
  FaMobileAlt,
  FaTabletAlt,
  FaGlobe,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

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

  const getBrowserIcon = (browser = "") => {
    const value = String(browser).toLowerCase();
    if (value.includes("chrome")) return <FaChrome className="text-emerald-600" />;
    if (value.includes("firefox")) return <FaFirefoxBrowser className="text-lime-600" />;
    if (value.includes("safari")) return <FaSafari className="text-teal-600" />;
    if (value.includes("edge")) return <FaEdge className="text-green-600" />;
    return <FaGlobe className="text-slate-500" />;
  };

  const getDeviceIcon = (device = "") => {
    const value = String(device).toLowerCase();
    if (value.includes("mobile") || value.includes("smartphone"))
      return <FaMobileAlt className="text-emerald-600" />;
    if (value.includes("tablet")) return <FaTabletAlt className="text-lime-600" />;
    return <FaDesktop className="text-green-600" />;
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
        <div className="shrink-0 bg-gradient-to-r from-emerald-600 via-green-600 to-lime-600 px-4 py-4 text-white sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg backdrop-blur sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl">
                <FaEye />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black sm:text-2xl">
                  Lịch sử xem album
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-base text-white backdrop-blur transition hover:bg-white/25 active:scale-95 cursor-pointer sm:h-10 sm:w-10 sm:text-lg"
              aria-label="Đóng"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* BỘ CHỌN NGÀY */}
        <div className="shrink-0 border-b border-emerald-100 bg-emerald-50/50 px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="hidden min-w-0 items-center gap-3 sm:flex">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <FaCalendarAlt className="text-base" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Ngày thống kê
                </p>
                <p className="mt-0.5 text-base font-black text-slate-800">
                  {formatDate(selectedDate)}
                </p>
              </div>
            </div>

            <div className="flex w-full items-center justify-end gap-1.5 sm:w-auto sm:gap-2">
              <button
                type="button"
                onClick={() => changeDate(-1)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-white text-slate-500 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95 cursor-pointer"
                title="Ngày trước"
              >
                <FaChevronLeft className="text-sm" />
              </button>

              <div className="relative min-w-0 flex-1 sm:w-[170px] sm:flex-none">
                <FaCalendarAlt className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-emerald-500 sm:left-3 sm:text-sm" />
                <input
                  type="date"
                  value={selectedDate}
                  max={today}
                  onChange={(event) => onDateChange?.(event.target.value)}
                  className="h-10 w-full min-w-0 rounded-xl border border-emerald-100 bg-white pl-8 pr-2 text-xs font-bold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:pl-9 sm:pr-3 sm:text-sm"
                />
              </div>

              <button
                type="button"
                onClick={() => changeDate(1)}
                disabled={selectedDate >= today}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-white text-slate-500 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
                title="Ngày sau"
              >
                <FaChevronRight className="text-sm" />
              </button>

              {selectedDate !== today && (
                <button
                  type="button"
                  onClick={() => onDateChange?.(today)}
                  className="h-10 shrink-0 whitespace-nowrap rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 cursor-pointer sm:px-4"
                >
                  Hôm nay
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TỔNG QUAN */}
        <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-emerald-100 bg-white px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 sm:gap-2.5 sm:rounded-2xl sm:px-4 sm:py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 sm:h-9 sm:w-9">
              <FaEye className="text-sm sm:text-base" />
            </div>
            <span className="truncate text-[10px] font-bold uppercase tracking-wide text-emerald-600 sm:text-xs">
              Album đã xem
            </span>
            <span className="ml-auto shrink-0 text-base font-black leading-none text-emerald-700 sm:text-xl">
              {Number(summary.totalAlbums || 0).toLocaleString("vi-VN")}
            </span>
          </div>

          <div className="flex min-w-0 items-center gap-2 rounded-xl border border-lime-100 bg-lime-50 px-3 py-2 sm:gap-2.5 sm:rounded-2xl sm:px-4 sm:py-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime-100 text-lime-600 sm:h-9 sm:w-9">
              <FaClock className="text-sm sm:text-base" />
            </div>
            <span className="truncate text-[10px] font-bold uppercase tracking-wide text-lime-600 sm:text-xs">
              Tổng lượt mở
            </span>
            <span className="ml-auto shrink-0 text-base font-black leading-none text-lime-700 sm:text-xl">
              {Number(summary.totalViews || 0).toLocaleString("vi-VN")}
            </span>
          </div>
        </div>

        {/* NỘI DUNG */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/40 p-3 sm:p-6">
          {loading ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center sm:min-h-[280px]">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600 sm:h-10 sm:w-10" />
              <p className="mt-3 text-xs font-semibold text-slate-500 sm:mt-4 sm:text-sm">
                Đang tải dữ liệu...
              </p>
            </div>
          ) : safePeople.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center sm:min-h-[280px]">
              <div className="text-4xl sm:text-5xl">👀</div>
              <h3 className="mt-3 text-base font-bold text-slate-800 sm:mt-4 sm:text-lg">
                Không có lượt xem
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 sm:mt-2 sm:text-sm">
                Không có album nào được mở ngày{" "}
                <strong className="text-emerald-600">{formatDate(selectedDate)}</strong>.
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {safePeople.map((person) => {
                const viewDetails = Array.isArray(person.viewDetails) ? person.viewDetails : [];
                const viewTimes = Array.isArray(person.viewTimes) ? person.viewTimes : [];

                return (
                  <article
                    key={person.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                  >
                    {/* Người */}
                    <div className="flex items-center gap-3 p-3 sm:p-4">
                      <img
                        src={person.avatar || FALLBACK_AVATAR}
                        alt={person.name || "Avatar"}
                        onError={handleImageError}
                        className="h-11 w-11 shrink-0 rounded-full border border-emerald-100 object-cover shadow-sm sm:h-14 sm:w-14"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          {/* Đã thêm min-w-0 và truncate để tên dài tự động cắt gọn, không đẩy cụm bên phải */}
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-bold text-slate-800 sm:text-base">
                              {person.name || "Chưa cập nhật"}
                            </h3>
                          </div>

                          {/* Cố định cụm badge bằng shrink-0 để không bao giờ bị rơi xuống dòng dưới */}
                          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700 sm:px-2.5 sm:py-1 sm:text-xs">
                              <FaEye />
                              <span>{Number(person.todayViews || 0).toLocaleString("vi-VN")} lượt trong ngày</span>
                            </span>

                            <span className="inline-flex items-center rounded-full bg-lime-100 px-2 py-1 text-[10px] font-semibold text-lime-700 sm:px-2.5 sm:py-1 sm:text-xs">
                              <span>
                                Tổng {Number(person.totalViews || person.albumViews || person.viewCount || 0).toLocaleString("vi-VN")} lượt
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chi tiết */}
                    <div className="border-t border-emerald-100 bg-gradient-to-r from-emerald-50/60 via-white to-lime-50/50 p-3 sm:p-4">
                      <div className="mb-2 flex items-center gap-2 sm:mb-3">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                          <FaClock className="text-xs" />
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 sm:text-xs">
                          Chi tiết lượt mở
                        </p>
                      </div>

                      {viewDetails.length > 0 ? (
                        <div className="space-y-2">
                          {[...viewDetails].reverse().map((detail, index) => {
                            const viewedAt = detail?.viewedAt;
                            const browser = detail?.browser || "Không xác định";
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
                                className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:p-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                                  {/* Thời gian */}
                                  <div className="flex shrink-0 items-center gap-2">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm text-blue-600 sm:h-9 sm:w-9 sm:text-base">
                                      <FaClock />
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 sm:text-[10px]">
                                        Thời gian
                                      </p>
                                      <p className="text-xs font-black text-slate-800 sm:text-sm">
                                        {formatTime(viewedAt)}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Thiết bị & Browser */}
                                  <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold text-blue-700 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs">
                                      {getBrowserIcon(browser)}
                                      <span className="truncate">{browser}</span>
                                    </span>

                                    <span className="inline-flex max-w-[140px] items-center gap-1 rounded-full bg-violet-100 px-2 py-1 text-[10px] font-semibold text-violet-700 sm:max-w-none sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs">
                                      {getDeviceIcon(deviceType)}
                                      <span className="truncate">{deviceName}</span>
                                    </span>

                                    {os && (
                                      <span className="inline-flex max-w-[90px] items-center rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700 sm:max-w-none sm:px-3 sm:py-1.5 sm:text-xs">
                                        <span className="truncate">{os}</span>
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
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs"
                            >
                              <FaClock />
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
            className="flex h-10 w-full items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700 active:scale-[0.99] cursor-pointer sm:min-h-[48px] sm:px-5 sm:text-base"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default TodayAlbumViewsModal;