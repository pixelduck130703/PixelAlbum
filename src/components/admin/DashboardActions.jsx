function DashboardActions({
  loadingTodayAlbumViews = false,
  onShowTodayAlbumViews,
  onManageAnnouncement,
  onExportExcel,
  onAdd,
}) {
  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2 lg:grid-cols-4">
      {/* Album xem hôm nay */}
      <button
        type="button"
        onClick={onShowTodayAlbumViews}
        disabled={loadingTodayAlbumViews}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>🔥</span>

        <span>
          {loadingTodayAlbumViews
            ? "Đang tải..."
            : "Album xem hôm nay"}
        </span>
      </button>

      {/* Quản lý thông báo */}
      <button
        type="button"
        onClick={onManageAnnouncement}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 hover:shadow-md"
      >
        <span>📢</span>
        <span>Thông báo</span>
      </button>

      {/* Xuất Excel */}
      <button
        type="button"
        onClick={onExportExcel}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 hover:shadow-md"
      >
        <span>📊</span>
        <span>Xuất Excel</span>
      </button>

      {/* Thêm album */}
      <button
        type="button"
        onClick={onAdd}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
      >
        <span>➕</span>
        <span>Thêm Album</span>
      </button>
    </div>
  );
}

export default DashboardActions;