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
      bg: "border-blue-300/60 bg-blue-500/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
      color: "text-blue-600",
    },
    {
      icon: "🖼️",
      title: "Số album",
      value: Number(totalAlbums).toLocaleString("vi-VN"),
      bg: "border-emerald-300/60 bg-emerald-500/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
      color: "text-emerald-600",
    },
    {
      icon: "👁️",
      title: "Lượt xem album",
      value: Number(totalAlbumViews).toLocaleString("vi-VN"),
      bg: "border-purple-300/60 bg-purple-500/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
      color: "text-purple-600",
    },
    {
      icon: "🎂",
      title: "Sinh nhật tháng này",
      value: Number(birthdaysThisMonth).toLocaleString("vi-VN"),
      bg: "border-pink-300/60 bg-pink-500/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]",
      color: "text-pink-600",
    },
  ];

  return (
    <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3 lg:mt-6 lg:grid-cols-4 lg:gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="group relative min-w-0 transform-gpu overflow-hidden rounded-2xl border border-white/80 border-t-white/95 bg-white/40 px-2.5 py-3 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),_0_12px_32px_rgba(0,0,0,0.06)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 hover:border-white hover:bg-white/60 hover:shadow-[inset_0_1.5px_3px_rgba(255,255,255,1),_0_16px_40px_rgba(0,0,0,0.09)] sm:px-3 lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-5 lg:py-5 lg:text-center"
        >
          {/* Vệt phản quang ánh sáng bề mặt kính trên cùng */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

          {/* Vệt sáng lướt khi hover */}
          <div className="pointer-events-none absolute -left-full top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 transition-all duration-700 group-hover:left-[150%]" />

          {/* Mobile */}
          <div className="relative flex min-w-0 items-center gap-2 lg:hidden">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${card.bg} text-sm backdrop-blur-md sm:h-9 sm:w-9 sm:text-base`}
            >
              {card.icon}
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-between gap-1.5">
              <span className="min-w-0 text-[10px] font-bold leading-tight text-slate-700 sm:text-xs">
                {card.title}
              </span>

              <span
                className={`shrink-0 text-base font-extrabold sm:text-lg ${card.color}`}
              >
                {card.value}
              </span>
            </div>
          </div>

          {/* Desktop */}
          <div className="relative hidden lg:block">
            <div
              className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border ${card.bg} text-2xl backdrop-blur-md transition-transform duration-300 group-hover:scale-110`}
            >
              {card.icon}
            </div>

            <p className="text-sm font-bold text-slate-600">
              {card.title}
            </p>

            <p className={`mt-2 text-3xl font-black drop-shadow-sm ${card.color}`}>
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}