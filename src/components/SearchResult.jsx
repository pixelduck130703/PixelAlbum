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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-md sm:p-5"
      onClick={() => onClose?.()}
    >
      {/* VÙNG SÁNG CỰC QUANG NỀN (AURORA BLOBS ĐA SẮC) */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-400/45 to-blue-600/40 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-96 w-96 rounded-full bg-gradient-to-tl from-emerald-400/40 via-teal-400/45 to-cyan-500/40 blur-[110px]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-indigo-500/30 blur-[120px]" />

      {/* CONTAINER KÍNH LIQUID GLASS ĐA SẮC */}
      <div
        className="relative flex max-h-[92dvh] w-full max-w-3xl transform-gpu flex-col overflow-hidden rounded-[2.25rem] border border-white/80 border-t-white bg-gradient-to-br from-white/70 via-white/50 to-cyan-50/40 shadow-[inset_0_2px_4px_rgba(255,255,255,1),_0_24px_60px_rgba(14,165,233,0.18)] backdrop-blur-3xl backdrop-saturate-[1.8]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Vệt phản quang ánh sáng cầu vồng nhẹ ở viền trên */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r from-cyan-400 via-white to-teal-300 opacity-95" />

        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-cyan-100/70 bg-gradient-to-r from-cyan-500/15 via-white/40 to-blue-500/15 px-5 py-4 backdrop-blur-xl sm:px-7">
          <div className="min-w-0">
            <h2 className="bg-gradient-to-r from-slate-900 via-blue-950 to-teal-900 bg-clip-text text-lg font-black text-transparent sm:text-xl drop-shadow-sm">
              Kết quả tìm kiếm
            </h2>

            {searchDescription && (
              <p className="mt-1 truncate text-xs font-semibold text-cyan-800 sm:text-sm">
                {searchDescription}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onClose?.()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/90 bg-white/70 text-base font-bold text-slate-600 shadow-[inset_0_1px_2px_rgba(255,255,255,1),_0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-md transition hover:border-rose-300 hover:bg-rose-500/20 hover:text-rose-600 active:scale-95 sm:h-10 sm:w-10"
            aria-label="Đóng kết quả tìm kiếm"
          >
            ✕
          </button>
        </div>

        {/* NỘI DUNG */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Máy chủ chưa sẵn sàng */}
          {loading && (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <div className="relative">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-cyan-200/70 border-t-cyan-600 shadow-md shadow-cyan-500/20" />
              </div>

              <h3 className="mt-5 text-xl font-extrabold text-slate-800">
                Máy chủ chưa sẵn sàng
              </h3>

              <p className="mt-2 max-w-md text-sm font-medium leading-6 text-slate-600">
                Máy chủ đang khởi động. Vui lòng chờ một chút, website sẽ tự thử kết nối lại sau mỗi 5 giây.
              </p>

              <div className="mt-5 rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-100/80 to-yellow-100/80 px-4 py-3 text-sm font-bold text-amber-900 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)] backdrop-blur-md">
                ⏳ Lần truy cập đầu tiên có thể mất khoảng 30–60 giây.
              </div>
            </div>
          )}

          {/* Lỗi */}
          {!loading && error && (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-rose-300/80 bg-gradient-to-br from-rose-100/80 to-red-100/80 text-3xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)] backdrop-blur-md">
                ⚠️
              </div>

              <h3 className="mt-4 text-xl font-extrabold text-slate-800">
                Không thể kết nối máy chủ
              </h3>

              <p className="mt-2 max-w-md text-sm font-bold leading-6 text-rose-600">
                {error}
              </p>

              <p className="mt-3 max-w-md text-xs font-medium leading-5 text-slate-500">
                Hãy chờ một lúc rồi thử tìm kiếm lại.
              </p>
            </div>
          )}

          {/* Không có kết quả */}
          {!loading && !error && safeResults.length === 0 && (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <div className="text-5xl drop-shadow-sm">😕</div>

              <h3 className="mt-4 text-xl font-extrabold text-slate-800">
                Không tìm thấy kết quả
              </h3>

              <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-slate-600">
                Hãy đóng cửa sổ này, xóa nội dung tìm kiếm và thử theo cách còn lại.
              </p>
            </div>
          )}

          {/* Có kết quả */}
          {!loading && !error && safeResults.length > 0 && (
            <>
              <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-white/90 bg-gradient-to-r from-blue-500/15 via-cyan-500/15 to-emerald-500/15 px-4 py-3 shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),_0_4px_16px_rgba(14,165,233,0.08)] backdrop-blur-md">
                <p className="text-sm font-bold text-slate-800">
                  Kết quả phù hợp
                </p>

                <span className="rounded-full border border-cyan-300/60 bg-gradient-to-r from-cyan-600 to-blue-600 px-3.5 py-1 text-xs font-black text-white shadow-md shadow-cyan-500/25 backdrop-blur-md">
                  {safeResults.length} Album
                </span>
              </div>

              <div className="space-y-3.5">
                {safeResults.map((person) => (
                  <PersonCard key={person.id} person={person} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="shrink-0 border-t border-cyan-100/60 bg-gradient-to-r from-cyan-50/40 via-white/40 to-blue-50/40 p-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => onClose?.()}
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-white/90 bg-gradient-to-r from-white/80 via-white/90 to-cyan-50/80 px-5 font-bold text-slate-700 shadow-[inset_0_1px_2px_rgba(255,255,255,1),_0_4px_12px_rgba(0,0,0,0.05)] backdrop-blur-md transition hover:border-cyan-200 hover:bg-white hover:text-cyan-700 active:scale-[0.99]"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default SearchResult;