function TodayAlbumViewsModal({
  open,
  people = [],
  summary = {
    totalAlbums: 0,
    totalViews: 0,
  },
  onClose,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-w-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-5 py-5 text-white sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold sm:text-2xl">
                Album được xem hôm nay
              </h2>

              <p className="mt-1 text-sm text-white/80">
                Theo dõi những album vừa có lượt xem mới
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-xl text-white transition hover:bg-white/25"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>

          {/* Thống kê nhanh */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wide text-white/75">
                Số album
              </p>

              <p className="mt-1 text-2xl font-bold">
                {Number(
                  summary.totalAlbums || 0
                ).toLocaleString("vi-VN")}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wide text-white/75">
                Tổng lượt mở
              </p>

              <p className="mt-1 text-2xl font-bold">
                {Number(
                  summary.totalViews || 0
                ).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        </div>

        {/* Nội dung */}
        <div className="p-4 sm:p-6">
          {people.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-3xl">
                👀
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-800">
                Chưa có album nào được xem
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Danh sách sẽ xuất hiện khi người dùng mở album trong hôm nay.
              </p>
            </div>
          ) : (
            <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
              {people.map((person, index) => (
                <a
                  key={person.id}
                  href={`/person/${person.publicId}`}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 hover:shadow-md sm:gap-4 sm:p-4"
                >
                  {/* Thứ hạng */}
                  <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 sm:flex">
                    {index + 1}
                  </div>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={
                        person.avatar ||
                        "https://placehold.co/100x100?text=Avatar"
                      }
                      alt={person.name || "Avatar"}
                      className="h-16 w-16 rounded-full border-2 border-white object-cover shadow-sm sm:h-14 sm:w-14"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src =
                          "https://placehold.co/100x100?text=Avatar";
                      }}
                    />
                  </div>

                  {/* Thông tin */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-800 group-hover:text-violet-700">
                      {person.name}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                        {Number(
                          person.todayViews || 0
                        ).toLocaleString("vi-VN")}{" "}
                        lượt hôm nay
                      </span>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        Tổng{" "}
                        {Number(
                          person.albumViews || 0
                        ).toLocaleString("vi-VN")}
                      </span>
                    </div>

                    {person.lastViewedAt && (
                      <p className="mt-2 text-xs text-slate-400">
                        Xem gần nhất lúc{" "}
                        {new Date(
                          person.lastViewedAt
                        ).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 text-xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-500">
                    →
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TodayAlbumViewsModal;