import { useEffect } from "react";
import {
  FaSearch,
  FaTimes,
  FaExclamationTriangle,
  FaFolderOpen,
  FaClock,
} from "react-icons/fa";
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

  // Khóa cuộn trang + Phím tắt ESC để đóng
  useEffect(() => {
    if (!shouldOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [shouldOpen, onClose]);

  if (!shouldOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-5"
      onClick={() => onClose?.()}
    >
      <div
        className="flex max-h-[96dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[92dvh] sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div className="shrink-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 px-4 py-4 text-white sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg backdrop-blur sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl">
                <FaSearch />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-black sm:text-2xl">
                  Kết quả tìm kiếm
                </h2>

                {searchDescription && (
                  <p className="mt-0.5 truncate text-xs font-medium text-blue-100 sm:text-sm">
                    {searchDescription}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onClose?.()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-base text-white backdrop-blur transition hover:bg-white/25 active:scale-95 cursor-pointer sm:h-10 sm:w-10 sm:text-lg"
              aria-label="Đóng kết quả tìm kiếm (ESC)"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* NỘI DUNG */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/40 p-3 sm:p-6">
          {/* TRẠNG THÁI: ĐANG KẾT NỐI / LOADING */}
          {loading && (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center sm:min-h-[340px]">
              <div className="relative">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600 sm:h-14 sm:w-14" />
              </div>

              <h3 className="mt-5 text-base font-black text-slate-800 sm:text-xl">
                Máy chủ đang khởi động...
              </h3>

              <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-500 sm:text-sm">
                Vui lòng chờ giây lát, website sẽ tự động thử kết nối lại sau mỗi 5 giây.
              </p>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm">
                <FaClock className="text-amber-500 shrink-0" />
                <span>Lần truy cập đầu tiên có thể mất khoảng 30–60 giây.</span>
              </div>
            </div>
          )}

          {/* TRẠNG THÁI: LỖI */}
          {!loading && error && (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-4 text-center sm:min-h-[300px]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-2xl text-rose-600 sm:h-16 sm:w-16 sm:text-3xl">
                <FaExclamationTriangle />
              </div>

              <h3 className="mt-4 text-base font-black text-slate-800 sm:text-lg">
                Không thể kết nối máy chủ
              </h3>

              <p className="mt-2 max-w-md text-xs font-medium text-rose-600 sm:text-sm">
                {error}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Hãy chờ một lát rồi thử tìm kiếm lại nhé.
              </p>
            </div>
          )}

          {/* TRẠNG THÁI: KHÔNG TÌM THẤY KẾT QUẢ */}
          {!loading && !error && safeResults.length === 0 && (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-4 text-center sm:min-h-[300px]">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-3xl text-slate-400 sm:h-20 sm:w-20 sm:text-4xl">
                <FaFolderOpen />
              </div>

              <h3 className="mt-4 text-base font-black text-slate-800 sm:text-lg">
                Không tìm thấy album phù hợp
              </h3>

              <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500 sm:text-sm">
                Hãy kiểm tra lại từ khóa tìm kiếm hoặc thử tra cứu theo thông tin khác.
              </p>
            </div>
          )}

          {/* TRẠNG THÁI: CÓ KẾT QUẢ */}
          {!loading && !error && safeResults.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              {/* Thống kê số lượng kết quả */}
              <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/80 px-3.5 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 sm:text-sm">
                  Kết quả tìm thấy
                </span>

                <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-black text-white sm:px-3 sm:py-1">
                  {safeResults.length} Album
                </span>
              </div>

              {/* Danh sách thẻ PersonCard trực tiếp không qua vòng bọc ngoài */}
              <div className="space-y-3 sm:space-y-3.5">
                {safeResults.map((person, index) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    themeIndex={index}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="shrink-0 border-t border-slate-200 bg-white p-2.5 sm:p-4 sm:px-6">
          <button
            type="button"
            onClick={() => onClose?.()}
            className="flex h-10 w-full items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-[0.99] cursor-pointer sm:min-h-[48px] sm:px-5 sm:text-base"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default SearchResult;