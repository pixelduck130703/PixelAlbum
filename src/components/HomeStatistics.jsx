export default function HomeStatistics({
  visits,
  totalAlbums,
  totalAlbumViews,
  birthdaysThisMonth,
}) {
  const cards = [
    {
      icon: "👥",
      title: "Lượt truy cập",
      value: Number(visits ?? 0).toLocaleString("vi-VN"),
      bg: "bg-blue-100",
      color: "text-blue-600",
    },
    {
      icon: "🖼️",
      title: "Số album",
      value: totalAlbums.toLocaleString("vi-VN"),
      bg: "bg-green-100",
      color: "text-green-600",
    },
    {
      icon: "👁️",
      title: "Lượt xem album",
      value: totalAlbumViews.toLocaleString("vi-VN"),
      bg: "bg-purple-100",
      color: "text-purple-600",
    },
    {
      icon: "🎂",
      title: "Sinh nhật tháng",
      value: birthdaysThisMonth.toLocaleString("vi-VN"),
      bg: "bg-pink-100",
      color: "text-pink-600",
    },
  ];

  return (
  <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
    {cards.map((card) => (
      <div
        key={card.title}
        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm transition hover:shadow-md lg:flex-col lg:justify-center lg:px-5 lg:py-5 lg:text-center"
      >
        {/* Desktop */}
        <div className="hidden lg:block">
          <div
            className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${card.bg} text-2xl`}
          >
            {card.icon}
          </div>

          <p className="text-sm font-medium text-slate-500">
            {card.title}
          </p>

          <p className={`mt-2 text-3xl font-bold ${card.color}`}>
            {card.value}
          </p>
        </div>

        {/* Mobile */}
        <div className="flex w-full items-center justify-between lg:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${card.bg}`}
            >
              {card.icon}
            </div>

            <span className="truncate text-xs font-medium text-slate-600">
              {card.title}
            </span>
          </div>

          <span className={`ml-2 text-lg font-bold ${card.color}`}>
            {card.value}
          </span>
        </div>
      </div>
    ))}
  </div>
);
}