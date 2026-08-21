function DashboardStats({
  stats = {
    totalPeople: 0,
    album: 0,
    totalAlbumViews: 0,
    thisMonth: 0,
    today: 0,
  },
  visits = 0,
  onShowMonthBirthday,
  onShowTodayBirthday,
  onShowVisits, // Nhận hàm mở modal RSVP
}) {
  const staticCards = [
    {
      title: "Tổng số album",
      value: Number(stats.totalPeople || 0).toLocaleString("vi-VN"),
      icon: "👥",
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Có liên kết",
      value: Number(stats.album || 0).toLocaleString("vi-VN"),
      icon: "🖼️",
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "Tổng lượt xem album",
      value: Number(stats.totalAlbumViews || 0).toLocaleString("vi-VN"),
      icon: "👁️",
      color: "text-indigo-600",
      bg: "bg-indigo-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      {/* 3 thẻ tĩnh thông thường */}
      {staticCards.map((card) => (
        <div
          key={card.title}
          className="rounded-2xl bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium leading-5 text-slate-500 md:text-sm">
              {card.title}
            </p>

            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.bg} text-xl md:h-11 md:w-11 md:text-2xl`}
            >
              {card.icon}
            </div>
          </div>

          <h2 className={`mt-3 text-2xl font-bold md:text-3xl ${card.color}`}>
            {card.value}
          </h2>
        </div>
      ))}

      {/* Lượt truy cập website - Click để mở Modal RSVP */}
      <button
        type="button"
        onClick={onShowVisits}
        className="cursor-pointer rounded-2xl bg-white p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95 md:p-4"
        title="Bấm để xem danh sách xác nhận tham dự"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium leading-5 text-slate-500 md:text-sm">
            Lượt truy cập website
          </p>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-xl md:h-11 md:w-11 md:text-2xl">
            🌐
          </div>
        </div>

        <h2 className="mt-3 text-2xl font-bold text-green-600 md:text-3xl">
          {visits === null
            ? "..."
            : Number(visits || 0).toLocaleString("vi-VN")}
        </h2>
      </button>

      {/* Sinh nhật tháng này */}
      <button
        type="button"
        onClick={onShowMonthBirthday}
        className="cursor-pointer rounded-2xl bg-white p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95 md:p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium leading-5 text-slate-500 md:text-sm">
            Sinh nhật tháng này
          </p>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-xl md:h-11 md:w-11 md:text-2xl">
            📅
          </div>
        </div>

        <h2 className="mt-3 text-2xl font-bold text-red-500 md:text-3xl">
          {Number(stats.thisMonth || 0).toLocaleString("vi-VN")}
        </h2>
      </button>

      {/* Sinh nhật hôm nay */}
      <button
        type="button"
        onClick={onShowTodayBirthday}
        className="cursor-pointer rounded-2xl bg-white p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95 md:p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium leading-5 text-slate-500 md:text-sm">
            Sinh nhật hôm nay
          </p>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-xl md:h-11 md:w-11 md:text-2xl">
            🎂
          </div>
        </div>

        <h2 className="mt-3 text-2xl font-bold text-pink-500 md:text-3xl">
          {Number(stats.today || 0).toLocaleString("vi-VN")}
        </h2>
      </button>
    </div>
  );
}

export default DashboardStats;