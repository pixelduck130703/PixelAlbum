import {
  FaEye,
  FaClock,
  FaTimes,
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
  onClose,
}) {
  if (!open) {
    return null;
  }

  const safePeople = Array.isArray(people)
    ? people
    : [];

  const formatTime = (value) => {
    if (!value) {
      return "--:--:--";
    }

    try {
      return new Date(value).toLocaleTimeString(
        "vi-VN",
        {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Ho_Chi_Minh",
        }
      );
    } catch {
      return "--:--:--";
    }
  };

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_AVATAR;
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
              🔥 Album xem hôm nay
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Theo dõi các album đã được mở trong ngày
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-red-100 hover:text-red-600"
            aria-label="Đóng"
          >
            <FaTimes />
          </button>
        </div>

        {/* Tổng quan */}
        <div className="grid shrink-0 grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50 px-4 py-4 sm:px-6">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Album đã xem
            </p>

            <p className="mt-1 text-2xl font-black text-blue-600">
              {Number(
                summary.totalAlbums || 0
              ).toLocaleString("vi-VN")}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Tổng lượt mở
            </p>

            <p className="mt-1 text-2xl font-black text-indigo-600">
              {Number(
                summary.totalViews || 0
              ).toLocaleString("vi-VN")}
            </p>
          </div>
        </div>

        {/* Nội dung */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {safePeople.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <div className="text-5xl">
                👀
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-800">
                Chưa có lượt xem hôm nay
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Khi có người mở album, dữ liệu sẽ xuất hiện ở đây.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {safePeople.map((person) => {
                const viewTimes =
                  Array.isArray(
                    person.viewTimes
                  )
                    ? person.viewTimes
                    : [];

                return (
                  <article
                    key={person.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    {/* Thông tin người */}
                    <div className="flex items-center gap-3">
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
                            lượt xem hôm nay
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Các thời gian mở */}
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="mb-3 flex items-center gap-2">
                        <FaClock className="text-blue-500" />

                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Thời gian mở
                        </p>
                      </div>

                      {viewTimes.length ===
                      0 ? (
                        <p className="text-sm text-slate-400">
                          Chưa có dữ liệu thời gian.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {[...viewTimes]
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
                                  <FaClock className="text-[10px]" />

                                  {formatTime(
                                    viewedAt
                                  )}
                                </span>
                              )
                            )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
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