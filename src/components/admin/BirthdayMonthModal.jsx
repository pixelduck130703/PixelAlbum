import { useEffect } from "react";

function BirthdayMonthModal({
  open,
  selectedMonth,
  people = [],
  onChangeMonth,
  onClose,
  formatDate,
}) {
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
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-5 py-5 text-white sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold sm:text-2xl">
                📅 Sinh nhật tháng {selectedMonth}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-xl text-white transition hover:bg-white/25 cursor-pointer"
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>

          {/* 2 Thẻ thống kê căn thẳng hàng 1 dòng */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="truncate text-xs font-medium uppercase tracking-wide text-white/75">
                Tháng chọn:
              </p>
              <p className="font-mono text-xl font-bold sm:text-2xl">
                {selectedMonth}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <p className="truncate text-xs font-medium uppercase tracking-wide text-white/75">
                Số người:
              </p>
              <p className="font-mono text-xl font-bold sm:text-2xl">
                {Number(people.length).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        </div>

        {/* Nội dung */}
        <div className="p-4 sm:p-6">
          <div className="mb-5">

            <select
              id="birthday-month"
              value={selectedMonth}
              onChange={(event) =>
                onChangeMonth(event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100"
            >
              {Array.from({ length: 12 }, (_, index) => {
                const month = index + 1;

                return (
                  <option key={month} value={month}>
                    Tháng {month}
                  </option>
                );
              })}
            </select>
          </div>

          {people.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl">
                📅
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-800">
                Không có sinh nhật trong tháng này
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Hãy chọn tháng khác để xem danh sách sinh nhật.
              </p>
            </div>
          ) : (
            <div className="max-h-[48vh] space-y-3 overflow-y-auto pr-1">
              {people.map((person, index) => (
                <a
                  key={person.id}
                  href={`/person/${person.publicId}`}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:shadow-md sm:gap-4 sm:p-4"
                >
                  <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600 sm:flex">
                    {index + 1}
                  </div>

                  <img
                    src={
                      person.avatar ||
                      "https://placehold.co/100x100?text=Avatar"
                    }
                    alt={person.name || "Avatar"}
                    className="h-16 w-16 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src =
                        "https://placehold.co/100x100?text=Avatar";
                    }}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-800 group-hover:text-orange-600">
                      {person.name}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                        🎂 {formatDate(person.birthday)}
                      </span>

                      {person.class && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          🎓 {person.class}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="shrink-0 text-xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-500">
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

export default BirthdayMonthModal;