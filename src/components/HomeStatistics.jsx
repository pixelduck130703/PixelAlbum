export default function HomeStatistics({
  visits,
  totalAlbums = 0,
  totalAlbumViews = 0,
  birthdaysThisMonth = 0,
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
      value: Number(totalAlbums).toLocaleString("vi-VN"),
      bg: "bg-green-100",
      color: "text-green-600",
    },
    {
      icon: "👁️",
      title: "Lượt xem album",
      value: Number(totalAlbumViews).toLocaleString("vi-VN"),
      bg: "bg-purple-100",
      color: "text-purple-600",
    },
    {
      icon: "🎂",
      title: "Sinh nhật tháng",
      value: Number(birthdaysThisMonth).toLocaleString("vi-VN"),
      bg: "bg-pink-100",
      color: "text-pink-600",
    },
  ];

  return (
    <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3 lg:mt-6 lg:grid-cols-4 lg:gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="min-w-0 rounded-xl border border-slate-200 bg-white px-2.5 py-3 shadow-sm transition hover:shadow-md sm:px-3 lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-5 lg:py-5 lg:text-center"
        >
          {/* Mobile */}
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${card.bg} text-sm sm:h-9 sm:w-9 sm:text-base`}
            >
              {card.icon}
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-between gap-1.5">
              <span className="min-w-0 text-[10px] font-medium leading-tight text-slate-600 sm:text-xs">
                {card.title}
              </span>

              <span
                className={`shrink-0 text-base font-bold sm:text-lg ${card.color}`}
              >
                {card.value}
              </span>
            </div>
          </div>

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
        </div>
      ))}
    </div>
  );
}