function SearchBox({
  name,
  setName,
  birthday,
  setBirthday,
  onSearch,
  onClear,
}) {
  const handleBirthdayChange = (event) => {
  if (name.trim()) return;

  // Chỉ giữ lại các chữ số
  let value = event.target.value.replace(/\D/g, "");

  // Giới hạn tối đa 8 số (ddmmyyyy)
  value = value.substring(0, 8);

  // Tự thêm dấu /
  if (value.length > 4) {
    value = `${value.substring(0, 2)}/${value.substring(2, 4)}/${value.substring(4)}`;
  } else if (value.length > 2) {
    value = `${value.substring(0, 2)}/${value.substring(2)}`;
  }

  setBirthday(value);
};

  const handleNameChange = (event) => {
  if (birthday) return;

  setName(event.target.value);
};

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch();
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl sm:p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl">
          🎞️ NHỮNG BỨC ẢNH TÔI LƯU VỀ BẠN
        </h1>

        <p className="mt-3 text-slate-500">
          Tìm kiếm theo ngày sinh hoặc họ tên (chỉ tìm kiếm theo một trong hai)
        </p>

         <p className="mt-3 text-xl font-bold text-red-500">
          Ưu tiên tìm bằng ngày sinh, nếu không có kết quả hãy tìm theo họ và tên
        </p>

      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {/* Tìm theo ngày sinh */}
        <div>
  <label
    htmlFor="birthday-search"
    className="mb-2 block text-sm font-semibold text-slate-700"
  >
    Tìm theo ngày sinh theo định dạng Ngày/Tháng/Năm (khuyến khích)
  </label>

  <input
  id="birthday-search"
  type="text"
  value={birthday}
  onChange={handleBirthdayChange}
  disabled={Boolean(name.trim())}
  placeholder="Ví dụ: 04/02/2004"
  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
/>

  {birthday && (
    <p className="mt-2 text-xs text-blue-600">
      Đã chọn ngày sinh. Tìm kiếm theo tên đang được khóa.
    </p>
  )}
</div>

<div className="flex items-center gap-4">
  <div className="h-px flex-1 bg-slate-200" />

  <span className="text-sm font-medium text-slate-400">
    HOẶC
  </span>

  <div className="h-px flex-1 bg-slate-200" />
</div>

<div>
  <label
    htmlFor="name-search"
    className="mb-2 block text-sm font-semibold text-slate-700"
  >
    Tìm theo họ và tên
  </label>

  <input
    id="name-search"
    type="text"
    value={name}
    onChange={handleNameChange}
    disabled={Boolean(birthday)}
    placeholder={
      birthday
        ? "Xóa ngày sinh để tìm theo tên"
        : "Ví dụ: Nguyễn Tuấn Hùng"
    }
    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
  />

  {name.trim() && (
    <p className="mt-2 text-xs text-blue-600">
      Đã nhập họ tên. Tìm kiếm theo ngày sinh đang được khóa.
    </p>
  )}
</div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            🔍 Tìm kiếm
          </button>

          <button
            type="button"
            onClick={onClear}
            className="rounded-xl bg-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-300 sm:w-auto"
          >
            Xóa tìm kiếm
          </button>
        </div>
      </form>
    </div>
  );
}

export default SearchBox;