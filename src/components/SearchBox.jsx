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
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
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
    <section className="relative overflow-hidden rounded-3xl border border-white/80 border-t-white/95 bg-white/40 p-5 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),_0_20px_50px_rgba(0,0,0,0.08)] backdrop-blur-2xl backdrop-saturate-150 sm:p-6">
      {/* Vệt phản quang ánh sáng bề mặt kính trên cùng */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

      {/* Đốm màu khúc xạ tạo chiều sâu kính */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full bg-blue-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-cyan-300/25 blur-3xl" />

      <div className="relative text-center">
        <h1 className="mx-auto max-w-5xl text-center text-2xl font-black leading-tight tracking-tight text-slate-800 drop-shadow-sm sm:text-3xl lg:text-4xl lg:whitespace-nowrap">
          🎞️ NHỮNG BỨC ẢNH
          <span className="hidden sm:inline"> TÔI LƯU VỀ BẠN</span>
          <br className="sm:hidden" />
          <span className="sm:hidden">TÔI LƯU VỀ BẠN</span>
        </h1>

        <p className="mx-auto mt-4 text-lg font-medium leading-6 text-slate-600">
          Tìm theo ngày sinh hoặc họ tên, chọn 1 trong 2 cách.
        </p>
      </div>

      {/* Ghi chú */}
      <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200/60 bg-blue-50/50 p-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)] backdrop-blur-md">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-400/40 bg-blue-600/90 text-white shadow-md shadow-blue-500/20 backdrop-blur-md">
            🎂
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Ưu tiên tìm theo ngày sinh
            </p>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
              Không có kết quả hãy tìm theo họ và tên
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/50 p-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)] backdrop-blur-md">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-500/90 text-white shadow-md shadow-amber-500/20 backdrop-blur-md">
            ⏳
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Máy chủ miễn phí
            </p>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
              Lần mở đầu tiên có thể mất khoảng một phút.
            </p>
          </div>
        </div>
      </div>

      {/* Form nhập liệu */}
      <form onSubmit={handleSubmit} className="relative mt-5 space-y-4">
        {/* Tìm theo ngày sinh */}
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
                isNameMode ? "Xóa họ và tên để nhập" : "DD/MM/YYYY"
              }
              className={`h-12 w-full rounded-xl border pl-11 ${
                birthday ? "pr-11" : "pr-24"
              } font-medium text-slate-800 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)] backdrop-blur-md outline-none transition ${
                isBirthdayMode
                  ? "border-blue-500/80 bg-white/80 ring-4 ring-blue-400/20"
                  : "border-white/80 bg-white/60 focus:border-blue-500/80 focus:bg-white/80 focus:ring-4 focus:ring-blue-400/20"
              } disabled:cursor-not-allowed disabled:bg-slate-100/50 disabled:text-slate-400`}
            />

            {/* Badge ưu tiên */}
            {!birthday && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-blue-200/80 bg-blue-100/80 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-700 backdrop-blur-md">
                Ưu tiên
              </span>
            )}

            {/* Nút xóa */}
            {birthday && (
              <button
                type="button"
                onClick={() => setBirthday("")}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/80 text-xs font-bold text-slate-500 shadow-sm backdrop-blur-md transition hover:border-red-200 hover:bg-red-500/15 hover:text-red-600 active:scale-95"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Ngăn cách */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/60 shadow-sm" />
          <span className="text-xs font-bold uppercase text-slate-400">
            Hoặc
          </span>
          <div className="h-px flex-1 bg-white/60 shadow-sm" />
        </div>

        {/* Tìm theo tên */}
        <div>
          <label
            htmlFor="name-search"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Tìm theo họ tên, lớp hoặc địa điểm du lịch (IT2, A3, Hà Giang, ...)
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
              className={`h-12 w-full rounded-xl border pl-11 pr-11 font-medium text-slate-800 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)] backdrop-blur-md outline-none transition ${
                isNameMode
                  ? "border-blue-500/80 bg-white/80 ring-4 ring-blue-400/20"
                  : "border-white/80 bg-white/60 focus:border-blue-500/80 focus:bg-white/80 focus:ring-4 focus:ring-blue-400/20"
              } disabled:cursor-not-allowed disabled:bg-slate-100/50 disabled:text-slate-400`}
            />

            {isNameMode && (
              <button
                type="button"
                onClick={() => setName("")}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/80 text-xs font-bold text-slate-500 shadow-sm backdrop-blur-md transition hover:border-red-200 hover:bg-red-500/15 hover:text-red-600 active:scale-95"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex flex-col gap-3 pt-1 sm:flex-row">
          <button
            type="submit"
            disabled={!hasValue}
            className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl border border-blue-400/30 bg-blue-600/90 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-600 hover:shadow-blue-500/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <span>🔍</span>
            <span>Tìm kiếm album</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={!hasValue}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/60 px-5 py-3 font-semibold text-slate-700 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),_0_4px_12px_rgba(0,0,0,0.04)] backdrop-blur-md transition hover:border-white hover:bg-white/80 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[160px]"
          >
            <span>↺</span>
            <span>Xóa tìm kiếm</span>
          </button>
        </div>
      </form>
    </section>
  );
}

export default SearchBox;