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

const FALLBACK_AVATAR =
  "https://placehold.co/160x160?text=Avatar";

function TodayAlbumViewsModal({
  open,

  people = [],

  summary = {
    totalAlbums: 0,
    totalViews: 0,
  },

  selectedDate = "",

  loading = false,

  onDateChange,

  onClose,
}) {
  if (!open) {
    return null;
  }

  const safePeople =
    Array.isArray(people)
      ? people
      : [];

  /*
   * ==========================
   * FORMAT NGÀY
   * ==========================
   */

  const formatDate = (value) => {
    if (!value) {
      return "";
    }

    const [
      year,
      month,
      day,
    ] = value.split("-");

    if (
      !year ||
      !month ||
      !day
    ) {
      return value;
    }

    return `${day}/${month}/${year}`;
  };

  /*
   * ==========================
   * FORMAT GIỜ
   * ==========================
   */

  const formatTime = (value) => {
    if (!value) {
      return "--:--:--";
    }

    try {
      return new Date(
        value
      ).toLocaleTimeString(
        "vi-VN",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone:
            "Asia/Ho_Chi_Minh",
        }
      );
    } catch {
      return "--:--:--";
    }
  };

  /*
   * ==========================
   * NGÀY HÔM NAY
   * ==========================
   */

  const getTodayString = () => {
    const formatter =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone:
            "Asia/Ho_Chi_Minh",

          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }
      );

    return formatter.format(
      new Date()
    );
  };

  const today =
    getTodayString();

  /*
   * ==========================
   * ĐỔI NGÀY
   * ==========================
   */

  const changeDate = (
    numberOfDays
  ) => {
    if (!selectedDate) {
      return;
    }

    const [
      year,
      month,
      day,
    ] = selectedDate
      .split("-")
      .map(Number);

    const date =
      new Date(
        year,
        month - 1,
        day
      );

    date.setDate(
      date.getDate() +
        numberOfDays
    );

    const nextYear =
      date.getFullYear();

    const nextMonth =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");

    const nextDay =
      String(
        date.getDate()
      ).padStart(2, "0");

    onDateChange?.(
      `${nextYear}-${nextMonth}-${nextDay}`
    );
  };

  /*
   * ==========================
   * ICON TRÌNH DUYỆT
   * ==========================
   */

  const getBrowserIcon = (
    browser = ""
  ) => {
    const value =
      String(
        browser
      ).toLowerCase();

    if (
      value.includes(
        "chrome"
      )
    ) {
      return (
        <FaChrome className="text-blue-600" />
      );
    }

    if (
      value.includes(
        "firefox"
      )
    ) {
      return (
        <FaFirefoxBrowser className="text-orange-500" />
      );
    }

    if (
      value.includes(
        "safari"
      )
    ) {
      return (
        <FaSafari className="text-sky-500" />
      );
    }

    if (
      value.includes(
        "edge"
      )
    ) {
      return (
        <FaEdge className="text-cyan-600" />
      );
    }

    return (
      <FaGlobe className="text-slate-500" />
    );
  };

  /*
   * ==========================
   * ICON THIẾT BỊ
   * ==========================
   */

  const getDeviceIcon = (
    device = ""
  ) => {
    const value =
      String(
        device
      ).toLowerCase();

    if (
      value.includes(
        "mobile"
      ) ||
      value.includes(
        "smartphone"
      )
    ) {
      return (
        <FaMobileAlt className="text-violet-600" />
      );
    }

    if (
      value.includes(
        "tablet"
      )
    ) {
      return (
        <FaTabletAlt className="text-violet-600" />
      );
    }

    return (
      <FaDesktop className="text-violet-600" />
    );
  };

  const handleImageError = (
    event
  ) => {
    event.currentTarget.onerror =
      null;

    event.currentTarget.src =
      FALLBACK_AVATAR;
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* ==========================
            HEADER
        ========================== */}

        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-800 sm:text-xl">
              👁️ Lịch sử xem album
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Xem lượt mở album theo từng ngày
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-red-100 hover:text-red-600"
            aria-label="Đóng"
          >
            <FaTimes />
          </button>
        </div>

        {/* ==========================
            CHỌN NGÀY
        ========================== */}

        <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Ngày thống kê
              </p>

              <p className="mt-1 text-lg font-black text-slate-800">
                {formatDate(
                  selectedDate
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Ngày trước */}
              <button
                type="button"
                onClick={() =>
                  changeDate(-1)
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                title="Ngày trước"
              >
                <FaChevronLeft />
              </button>

              {/* Chọn ngày */}
              <div className="relative min-w-0 flex-1 sm:w-[185px]">
                <FaCalendarAlt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />

                <input
                  type="date"
                  value={
                    selectedDate
                  }
                  max={today}
                  onChange={(
                    event
                  ) =>
                    onDateChange?.(
                      event.target
                        .value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {/* Ngày sau */}
              <button
                type="button"
                onClick={() =>
                  changeDate(1)
                }
                disabled={
                  selectedDate >=
                  today
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                title="Ngày sau"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>

          {/* Hôm nay */}
          {selectedDate !==
            today && (
            <button
              type="button"
              onClick={() =>
                onDateChange?.(
                  today
                )
              }
              className="mt-3 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-200"
            >
              Quay về hôm nay
            </button>
          )}
        </div>

        {/* ==========================
            TỔNG QUAN
        ========================== */}

        <div className="grid shrink-0 grid-cols-2 gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-500 sm:text-[11px]">
              Album đã xem
            </p>

            <p className="mt-1 text-2xl font-black text-blue-700">
              {Number(
                summary.totalAlbums ||
                  0
              ).toLocaleString(
                "vi-VN"
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-violet-500 sm:text-[11px]">
              Tổng lượt mở
            </p>

            <p className="mt-1 text-2xl font-black text-violet-700">
              {Number(
                summary.totalViews ||
                  0
              ).toLocaleString(
                "vi-VN"
              )}
            </p>
          </div>
        </div>

        {/* ==========================
            NỘI DUNG
        ========================== */}

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Loading */}

          {loading ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm font-semibold text-slate-500">
                Đang tải dữ liệu...
              </p>
            </div>
          ) : safePeople.length ===
            0 ? (
            /*
             * Không có dữ liệu
             */
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <div className="text-5xl">
                👀
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-800">
                Không có lượt xem
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Không có album nào được mở ngày{" "}
                <strong>
                  {formatDate(
                    selectedDate
                  )}
                </strong>
                .
              </p>
            </div>
          ) : (
            /*
             * Có dữ liệu
             */
            <div className="space-y-4">
              {safePeople.map(
                (person) => {
                  const viewDetails =
                    Array.isArray(
                      person.viewDetails
                    )
                      ? person.viewDetails
                      : [];

                  const viewTimes =
                    Array.isArray(
                      person.viewTimes
                    )
                      ? person.viewTimes
                      : [];

                  return (
                    <article
                      key={
                        person.id
                      }
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      {/* Người */}

                      <div className="flex items-center gap-3 p-4">
                        <img
                          src={
                            person.avatar ||
                            FALLBACK_AVATAR
                          }
                          alt={
                            person.name ||
                            "Avatar"
                          }
                          onError={
                            handleImageError
                          }
                          className="h-14 w-14 shrink-0 rounded-full border border-slate-200 object-cover shadow-sm"
                        />

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-bold text-slate-800">
                            {person.name ||
                              "Chưa cập nhật"}
                          </h3>

                          <div className="mt-1 flex items-center gap-2 text-sm text-indigo-600">
                            <FaEye />

                            <span className="font-semibold">
                              {Number(
                                person.todayViews ||
                                  0
                              ).toLocaleString(
                                "vi-VN"
                              )}{" "}
                              lượt mở
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Chi tiết */}

                      <div className="border-t border-slate-100 bg-slate-50/60 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <FaClock className="text-blue-500" />

                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Chi tiết lượt mở
                          </p>
                        </div>

                        {viewDetails.length >
                        0 ? (
                          <div className="space-y-2">
                            {[
                              ...viewDetails,
                            ]
                              .reverse()
                              .map(
                                (
                                  detail,
                                  index
                                ) => {
                                  const viewedAt =
                                    detail?.viewedAt;

                                  const browser =
                                    detail?.browser ||
                                    "Không xác định";

                                  const deviceName =
                                    detail?.deviceName ||
                                    detail?.deviceModel ||
                                    detail?.deviceTypeText ||
                                    detail?.deviceType ||
                                    "Không xác định";

                                  const deviceType =
                                    detail?.deviceType ||
                                    "";

                                  const os =
                                    detail?.os ||
                                    "";

                                  return (
                                    <div
                                      key={`${person.id}-${viewedAt}-${index}`}
                                      className="rounded-xl border border-slate-200 bg-white p-3"
                                    >
                                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        {/* Giờ */}

                                        <div className="flex items-center gap-2">
                                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                            <FaClock />
                                          </div>

                                          <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                              Thời gian
                                            </p>

                                            <p className="text-sm font-black text-slate-800">
                                              {formatTime(
                                                viewedAt
                                              )}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Thiết bị */}

                                        <div className="flex flex-wrap gap-2">
                                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700">
                                            {getBrowserIcon(
                                              browser
                                            )}

                                            {
                                              browser
                                            }
                                          </span>

                                          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700">
                                            {getDeviceIcon(
                                              deviceType
                                            )}

                                            {
                                              deviceName
                                            }
                                          </span>

                                          {os && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                              {
                                                os
                                              }
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                          </div>
                        ) : viewTimes.length >
                          0 ? (
                          <div className="flex flex-wrap gap-2">
                            {[
                              ...viewTimes,
                            ]
                              .reverse()
                              .map(
                                (
                                  viewedAt,
                                  index
                                ) => (
                                  <span
                                    key={`${person.id}-${viewedAt}-${index}`}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                                  >
                                    <FaClock />

                                    {formatTime(
                                      viewedAt
                                    )}
                                  </span>
                                )
                              )}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">
                            Chưa có dữ liệu chi tiết.
                          </p>
                        )}
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* ==========================
            FOOTER
        ========================== */}

        <div className="shrink-0 border-t border-slate-200 bg-white p-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-slate-100 px-5 font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default TodayAlbumViewsModal;