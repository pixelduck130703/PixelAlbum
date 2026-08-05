function DashboardActions({
  loadingTodayAlbumViews,
  onShowTodayAlbumViews,
  onManageAnnouncement,
  onManageMusic,
  onExportExcel,
  onAdd,
}) {
  const buttonClass =
    "flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3 md:flex md:flex-wrap md:items-stretch md:justify-end">
        {/* Album xem hôm nay */}
        <button
          type="button"
          onClick={onShowTodayAlbumViews}
          disabled={loadingTodayAlbumViews}
          className={`${buttonClass} bg-violet-600 hover:bg-violet-700 md:w-auto md:flex-1`}
        >
          <span className="shrink-0 text-base">🔥</span>

          <span className="leading-5">
            {loadingTodayAlbumViews
              ? "Đang tải..."
              : "Album xem hôm nay"}
          </span>
        </button>

        {/* Thông báo */}
        <button
          type="button"
          onClick={onManageAnnouncement}
          className={`${buttonClass} bg-amber-500 hover:bg-amber-600 md:w-auto md:flex-1`}
        >
          <span className="shrink-0 text-base">📢</span>
          <span>Thông báo</span>
        </button>

        {/* Quản lý nhạc */}
        <button
          type="button"
          onClick={onManageMusic}
          className={`${buttonClass} bg-indigo-600 hover:bg-indigo-700 md:w-auto md:flex-1`}
        >
          <span className="shrink-0 text-base">🎵</span>
          <span>Quản lý nhạc</span>
        </button>

        {/* Xuất Excel */}
        <button
          type="button"
          onClick={onExportExcel}
          className={`${buttonClass} bg-emerald-600 hover:bg-emerald-700 md:w-auto md:flex-1`}
        >
          <span className="shrink-0 text-base">📊</span>
          <span>Xuất Excel</span>
        </button>

        {/* Thêm album */}
        <button
          type="button"
          onClick={onAdd}
          className={`${buttonClass} col-span-2 min-h-[56px] bg-blue-600 text-base hover:bg-blue-700 md:min-h-[50px] md:w-auto md:flex-1 md:text-sm`}
        >
          <span className="shrink-0 text-lg md:text-base">➕</span>
          <span>Thêm Album</span>
        </button>
      </div>
    </div>
  );
}

export default DashboardActions;