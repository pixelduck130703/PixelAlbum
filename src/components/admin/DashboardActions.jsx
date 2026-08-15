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
    "flex min-h-[48px] sm:min-h-[50px] w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

  return (
    <div className="w-full">
      {/* Mobile: lưới 2 cột đều nhau | Desktop: Flex wrap ngang */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:flex md:flex-wrap md:items-stretch md:justify-end">
        {/* 1. Album xem hôm nay */}
        <button
          type="button"
          onClick={onShowTodayAlbumViews}
          disabled={loadingTodayAlbumViews}
          className={`${buttonClass} bg-green-600 hover:bg-green-700 md:w-auto md:flex-1`}
        >
          <span className="shrink-0 text-base">🔥</span>
          <span className="truncate leading-5">
            {loadingTodayAlbumViews ? "Đang tải..." : "Lịch sử xem"}
          </span>
        </button>

        {/* 2. Thông báo */}
        <button
          type="button"
          onClick={onManageAnnouncement}
          className={`${buttonClass} bg-amber-500 hover:bg-amber-600 md:w-auto md:flex-1`}
        >
          <span className="shrink-0 text-base">📢</span>
          <span className="truncate">Thông báo</span>
        </button>

        {/* 3. Quản lý nhạc */}
        <button
          type="button"
          onClick={onManageMusic}
          className={`${buttonClass} bg-violet-600 hover:bg-violet-700 md:w-auto md:flex-1`}
        >
          <span className="shrink-0 text-base">🎵</span>
          <span className="truncate">Quản lý nhạc</span>
        </button>

        {/* 4. Xuất Excel */}
        <button
          type="button"
          onClick={onExportExcel}
          className={`${buttonClass} bg-emerald-600 hover:bg-emerald-700 md:w-auto md:flex-1`}
        >
          <span className="shrink-0 text-base">📊</span>
          <span className="truncate">Xuất Excel</span>
        </button>

        {/* 5. Quản lý sự kiện */}
        <button
          type="button"
          onClick={onManageEvents}
          className={`${buttonClass} bg-rose-500 hover:bg-rose-600 shadow-rose-200 md:w-auto md:flex-1`}
        >
          <span className="shrink-0 text-base">📅</span>
          <span className="truncate">Thêm sự kiện</span>
        </button>

        {/* 6. Thêm album */}
        <button
          type="button"
          onClick={onAdd}
          className={`${buttonClass} bg-blue-600 hover:bg-blue-700 md:w-auto md:flex-1`}
        >
          <span className="shrink-0 text-base">➕</span>
          <span className="truncate">Thêm Album</span>
        </button>
      </div>
    </div>
  );
}

export default DashboardActions;