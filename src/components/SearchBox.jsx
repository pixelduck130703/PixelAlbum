function SearchBox({
  name,
  setName,
  birthday,
  setBirthday,
  onSearch,
  onClear,
}) {
  const isBirthdayMode = Boolean(birthday);
  const isNameMode = Boolean(name.trim());
  const hasValue = isBirthdayMode || isNameMode;

  const handleBirthdayChange = (event) => {
    if (isNameMode) return;

    let value = event.target.value.replace(/\D/g, "").slice(0, 8);

    if (value.length > 4) {
      value = `${value.slice(0, 2)}/${value.slice(
        2,
        4
      )}/${value.slice(4)}`;
    } else if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }

    setBirthday(value);
  };

  const handleNameChange = (event) => {
    if (isBirthdayMode) return;
    setName(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch();
  };

  return (
    <section className="rounded-3xl bg-white p-5 shadow-xl sm:p-6">
      <div className="text-center">
        <h1 className="mx-auto max-w-5xl text-center text-2xl font-black leading-tight tracking-tight text-slate-800 sm:text-3xl lg:text-4xl lg:whitespace-nowrap">
          🎞️ TÌM KIẾM ALBUM VỀ BẠN

          <br className="sm:hidden" />

        </h1>

        <p className="mx-auto mt-4 text-lg leading-6 text-slate-500">
          Chọn 1 trong 2 cách.
        </p>
      </div>

      {/* Ghi chú */} <div className="mt-6 grid gap-3 sm:grid-cols-2"> <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4"> <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"> 🎂 </span> <div> <p className="text-sm font-bold text-slate-800"> Ưu tiên tìm theo ngày sinh </p> <p className="mt-1 text-xs leading-5 text-slate-500"> Không có kết quả hãy tìm theo họ và tên </p> </div> </div> <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4"> <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white"> ⏳ </span> <div> <p className="text-sm font-bold text-slate-800"> Máy chủ miễn phí </p> <p className="mt-1 text-xs leading-5 text-slate-500"> Lần mở đầu tiên có thể mất khoảng một phút. </p> </div> </div> </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="birthday-search"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Tìm theo ngày sinh (Ngày/Tháng/Năm)
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              📅
            </span>

            <input
              id="birthday-search"
              type="text"
              inputMode="numeric"
              value={birthday}
              onChange={handleBirthdayChange}
              disabled={isNameMode}
              placeholder={
                isNameMode
                  ? "Xóa họ và tên để nhập"
                  : "DD/MM/YYYY"
              }
              className={`h-12 w-full rounded-xl border bg-white pl-11 ${birthday ? "pr-11" : "pr-24"
                } font-medium text-slate-800 outline-none transition ${isBirthdayMode
                  ? "border-blue-500 ring-4 ring-blue-100"
                  : "border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
            />

            {/* Badge ưu tiên */}
            {!birthday && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-700">
                Ưu tiên
              </span>
            )}

            {/* Nút xóa */}
            {birthday && (
              <button
                type="button"
                onClick={() => setBirthday("")}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500 transition hover:bg-red-100 hover:text-red-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />

          <span className="text-xs font-bold uppercase text-slate-400">
            Hoặc
          </span>

          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div>
          <label
            htmlFor="name-search"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Tìm theo họ tên, lớp, sự kiện hoặc địa điểm du lịch (IT2, A3, Hà Giang, Graduation,...)
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
              🔎
            </span>

            <input
              id="name-search"
              type="text"
              value={name}
              onChange={handleNameChange}
              disabled={isBirthdayMode}
              placeholder={
                isBirthdayMode
                  ? "Xóa ngày sinh để nhập"
                  : "Nguyễn Tuấn Hùng, IT2, Hà Giang..."
              }
              className={`h-12 w-full rounded-xl border bg-white pl-11 pr-11 font-medium text-slate-800 outline-none transition ${isNameMode
                ? "border-blue-500 ring-4 ring-blue-100"
                : "border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                } disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
            />

            {isNameMode && (
              <button
                type="button"
                onClick={() => setName("")}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500 hover:bg-red-100 hover:text-red-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row">
          <button type="submit" disabled={!hasValue} className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0" > <span>🔍</span> <span>Tìm kiếm album</span> </button> <button type="button" onClick={onClear} disabled={!hasValue} className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[160px]" > <span>↺</span> <span>Xóa tìm kiếm</span> </button>
        </div>
      </form>
    </section>
  );
}

export default SearchBox;