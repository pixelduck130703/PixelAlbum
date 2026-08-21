function DashboardActions({
  loadingTodayAlbumViews,
  onShowTodayAlbumViews,
  onManageAnnouncement,
  onManageMusic,
  onManageEvents,
  onExportExcel,
  onAdd,
}) {
  const buttonClass =
    "flex min-h-[48px] sm:min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-bold shadow-md backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer";

  return (
    <div className="w-full">
      {/* Mobile: lưới 2 cột đều nhau | Desktop: Flex wrap ngang */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:flex md:flex-wrap md:items-stretch md:justify-end">
        {/* 1. Album xem hôm nay: Xanh lá nhạt */}
        <button
          type="button"
          onClick={onShowTodayAlbumViews}
          disabled={loadingTodayAlbumViews}
          className={`${buttonClass} border-emerald-300 bg-emerald-100/70 text-emerald-950 md:w-auto md:flex-1`}
        >
          <span className="shrink-0 text-base">🔥</span>
          <span className="truncate leading-5">
            {loadingTodayAlbumViews ? "Đang tải..." : "Lịch sử xem"}
          </span>
        </button>

        {/* 2. Thông báo: Vàng cam nhạt */}
        <button
          type="button"
          onClick={onManageAnnouncement}
          className={`${buttonClass} border-amber-300 bg-amber-100/70 text-amber-950 md:w-auto md:flex-1`}
        >
          <span className="shrink-0 text-base">📢</span>
          <span className="truncate">Thông báo</span>
        </button>

        {/* 3. Quản lý nhạc: Tím nhạt */}
        <button
          type="button"
          onClick={onManageMusic}
          className={`${buttonClass} border-violet-300 bg-violet-100/70 text-violet-950 md:w-auto md:flex-1`}
        >
          <span className="shrink-0 text-base">🎵</span>
          <span className="truncate">Nhạc nền</span>
        </button>

        {/* 4. Xuất Excel: Xanh ngọc nhạt */}
        <button
          type="button"
          onClick={onExportExcel}
          className={`${buttonClass} border-teal-300 bg-teal-100/70 text-teal-950 md:w-auto md:flex-1`}
        >
          <span className="shrink-0 text-base">📊</span>
          <span className="truncate">Xuất Excel</span>
        </button>

        {/* 5. Quản lý sự kiện: Hồng đỏ nhạt */}
        <button
          type="button"
          onClick={onManageEvents}
          className={`${buttonClass} border-rose-300 bg-rose-100/70 text-rose-950 md:w-auto md:flex-1`}
        >
          <span className="shrink-0 text-base">📅</span>
          <span className="truncate">Thêm sự kiện</span>
        </button>

        {/* 6. Thêm album: Xanh dương nhạt */}
        <button
          type="button"
          onClick={onAdd}
          className={`${buttonClass} border-blue-300 bg-blue-100/70 text-blue-950 md:w-auto md:flex-1`}
        >
          <span className="shrink-0 text-base">➕</span>
          <span className="truncate">Thêm Album</span>
        </button>
      </div>
    </div>
  );
}

export default DashboardActions;