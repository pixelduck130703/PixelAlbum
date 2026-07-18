import PersonCard from "./PersonCard";

function SearchResult({
  loading = false,
  error = "",
  hasSearched = false,
  searchDescription = "",
  results = [],
}) {
  const safeResults = Array.isArray(results) ? results : [];

  return (
    <div className="mt-8">
      {loading && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500" />

          <p className="mt-4 text-lg font-semibold text-slate-700">
            Đang tải dữ liệu...
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Máy chủ đang khởi động. Website sẽ tự thử lại sau mỗi 5 giây.
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && !hasSearched && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">🔎</div>

          <p className="mt-2 text-slate-500">
            Chọn ngày sinh hoặc nhập họ tên của người cần tìm.
          </p>
        </div>
      )}

      {!loading && !error && hasSearched && (
        <>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Kết quả tìm kiếm
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {searchDescription}
              </p>
            </div>

            <span className="text-sm font-semibold text-blue-600">
              Tìm thấy {safeResults.length} người
            </span>
          </div>

          {safeResults.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <div className="text-5xl">😕</div>

              <h3 className="mt-4 text-xl font-bold text-slate-800">
                Không tìm thấy kết quả
              </h3>

              <p className="mt-2 text-slate-500">
                Hãy xóa tìm kiếm và tìm kiếm theo cách còn lại.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {safeResults.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SearchResult;