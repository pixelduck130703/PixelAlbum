import { useEffect } from "react";
import PersonCard from "./PersonCard";

function SearchResult({
  loading = false,
  error = "",
  hasSearched = false,
  searchDescription = "",
  results = [],
  onClose,
}) {
  const safeResults = Array.isArray(results) ? results : [];

  // Chỉ mở popup sau khi người dùng đã bấm tìm kiếm
  const shouldOpen = hasSearched;

  useEffect(() => {
    if (!shouldOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shouldOpen, onClose]);

  if (!shouldOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
      onClick={() => onClose?.()}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-800 sm:text-xl">
              Kết quả tìm kiếm
            </h2>

            {searchDescription && (
              <p className="mt-1 truncate text-xs text-slate-500 sm:text-sm">
                {searchDescription}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onClose?.()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500 transition hover:bg-red-100 hover:text-red-600"
            aria-label="Đóng kết quả tìm kiếm"
          >
            ✕
          </button>
        </div>

        {/* Nội dung */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Máy chủ chưa sẵn sàng */}
          {loading && (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <div className="relative">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-800">
                Máy chủ chưa sẵn sàng
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Máy chủ đang khởi động. Vui lòng chờ một chút, website sẽ tự thử
                kết nối lại sau mỗi 5 giây.
              </p>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                ⏳ Lần truy cập đầu tiên có thể mất khoảng 30–60 giây.
              </div>
            </div>
          )}

          {/* Lỗi */}
          {!loading && error && (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
                ⚠️
              </div>

              <h3 className="mt-4 text-xl font-bold text-slate-800">
                Không thể kết nối máy chủ
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-red-600">
                {error}
              </p>

              <p className="mt-3 max-w-md text-xs leading-5 text-slate-500">
                Hãy chờ một lúc rồi thử tìm kiếm lại.
              </p>
            </div>
          )}

          {/* Không có kết quả */}
          {!loading &&
            !error &&
            safeResults.length === 0 && (
              <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                <div className="text-5xl">
                  😕
                </div>

                <h3 className="mt-4 text-xl font-bold text-slate-800">
                  Không tìm thấy kết quả
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Hãy đóng cửa sổ này, xóa nội dung tìm kiếm và thử theo cách
                  còn lại.
                </p>
              </div>
            )}

          {/* Có kết quả */}
          {!loading &&
            !error &&
            safeResults.length > 0 && (
              <>
                <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-blue-50 px-4 py-3">
                  <p className="text-sm font-medium text-slate-600">
                    Kết quả phù hợp
                  </p>

                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                    {safeResults.length} Album
                  </span>
                </div>

                <div className="space-y-4">
                  {safeResults.map((person) => (
                    <PersonCard
                      key={person.id}
                      person={person}
                    />
                  ))}
                </div>
              </>
            )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-200 bg-white p-4 sm:px-6">
          <button
            type="button"
            onClick={() => onClose?.()}
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-slate-100 px-5 font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default SearchResult;