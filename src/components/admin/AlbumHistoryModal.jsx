import { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaEye,
  FaHistory,
  FaTimes,
  FaChrome,
  FaFirefoxBrowser,
  FaSafari,
  FaEdge,
  FaDesktop,
  FaMobileAlt,
  FaTabletAlt,
  FaGlobe,
} from "react-icons/fa";
import api from "../../services/api";

function AlbumHistoryModal({
  open,
  person,
  onClose,
}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    if (!open || !person?.id) {
      setHistory([]);
      setError("");
      return;
    }

    const loadHistory = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/admin/people/${person.id}/album-history`
        );

        setHistory(
          Array.isArray(response.data?.data)
            ? response.data.data
            : []
        );
      } catch (err) {
        console.error(
          "Lỗi tải lịch sử album:",
          err.response?.data || err
        );

        setHistory([]);
        setError(
          err.response?.data?.message ||
            "Không thể tải lịch sử xem album."
        );
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [open, person?.id]);

  const totalViews = useMemo(() => {
    return history.reduce(
      (total, item) => total + Number(item.views || 0),
      0
    );
  }, [history]);

  const formatDate = (value) => {
    if (!value) return "—";
    const [year, month, day] = String(value).split("-");
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  };

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
        <div className="shrink-0 bg-gradient-to-r from-emerald-600 via-green-600 to-lime-600 px-4 py-4 text-white sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg backdrop-blur sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl">
                <FaHistory />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-black sm:text-2xl">
                  Lịch sử xem album
                </h2>
                <p className="mt-0.5 truncate text-xs font-medium text-emerald-100 sm:text-sm">
                  {person?.name || "Chi tiết album"}
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

        {/* TỔNG QUAN / SUMMARY */}
        <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-emerald-100 bg-white px-3 py-2.5 sm:grid-cols-2 sm:gap-2 sm:px-6 sm:py-3.5">
          {/* Tổng lượt xem */}
          <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2.5 sm:rounded-2xl sm:px-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 sm:h-9 sm:w-9">
              <FaEye className="text-sm sm:text-base" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-emerald-600 sm:text-xs">
                Tổng lượt xem
              </span>
              <span className="text-base font-black leading-none text-emerald-700 sm:text-xl">
                {totalViews.toLocaleString("vi-VN")}
              </span>
            </div>
          </div>

          {/* Số ngày có lượt xem */}
          <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-lime-100 bg-lime-50/80 px-3 py-2.5 sm:rounded-2xl sm:px-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-lime-100 text-lime-600 sm:h-9 sm:w-9">
              <FaCalendarAlt className="text-sm sm:text-base" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-lime-600 sm:text-xs">
                Số ngày đã xem
              </span>
              <span className="text-base font-black leading-none text-lime-700 sm:text-xl">
                {history.length.toLocaleString("vi-VN")}
              </span>
            </div>
          </div>
        </div>

        {/* NỘI DUNG / CONTENT */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/40 p-3 sm:p-6">
          {loading ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center sm:min-h-[280px]">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600 sm:h-10 sm:w-10" />
              <p className="mt-3 text-xs font-semibold text-slate-500 sm:mt-4 sm:text-sm">
                Đang tải lịch sử xem...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm font-semibold text-red-600">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center sm:min-h-[280px]">
              <div className="text-4xl sm:text-5xl">👀</div>
              <h3 className="mt-3 text-base font-bold text-slate-800 sm:mt-4 sm:text-lg">
                Chưa có lịch sử xem
              </h3>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {history.map((item) => {
                const viewDetails = Array.isArray(item.viewDetails) ? item.viewDetails : [];

                return (
                  <article
                    key={item.date}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                  >
                    {/* Header ngày */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 bg-emerald-50/50 p-3 sm:px-4 sm:py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 text-xs sm:h-8 sm:w-8 sm:text-sm">
                          <FaCalendarAlt />
                        </div>
                        <span className="text-sm font-bold text-slate-800 sm:text-base">
                          {formatDate(item.date)}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 sm:text-xs">
                        <FaEye />
                        <span>{Number(item.views || 0).toLocaleString("vi-VN")} lượt</span>
                      </span>
                    </div>

                    {/* Chi tiết từng phiên xem trong ngày */}
                    <div className="p-3 sm:p-4">
                      {viewDetails.length > 0 ? (
                        <div className="space-y-2">
                          {viewDetails
                            .slice()
                            .reverse()
                            .map((detail, index) => {
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
                                  key={`${item.date}-${viewedAt}-${index}`}
                                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 shadow-2xs sm:p-3"
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
                                          {formatDateTime(viewedAt)}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Badges Thiết bị & Trình duyệt */}
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
                                        <span className="inline-flex max-w-[100px] items-center rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700 sm:max-w-none sm:px-3 sm:py-1.5 sm:text-xs">
                                          <span className="truncate">{os}</span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 sm:text-sm">
                          Chưa có dữ liệu chi tiết cho ngày này.
                        </p>
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

export default AlbumHistoryModal;