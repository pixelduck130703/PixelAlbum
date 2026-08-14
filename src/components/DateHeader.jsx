function DateHeader({
  today,
  weekdays,
  lunarToday,
  monthText,
  yearGan,
  yearZhi,
}) {
  return (
    <div className="mx-auto mt-6 flex w-full max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-stretch sm:px-6">
      {/* Ngày dương lịch */}
      <div className="relative transform-gpu overflow-hidden flex flex-1 items-center justify-center rounded-2xl border border-blue-200/80 border-t-white/95 bg-gradient-to-r from-blue-50/70 to-white/80 p-3 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),_0_12px_32px_rgba(0,0,0,0.05)] backdrop-blur-2xl backdrop-saturate-150 transition hover:bg-white/90 sm:p-4">
        {/* Vệt phản quang bề mặt kính trên cùng */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

        <p className="relative whitespace-nowrap text-center text-sm font-bold text-slate-800 drop-shadow-sm sm:text-lg lg:text-xl">
          {weekdays[today.getDay()]},{" "}
          {`Ngày ${String(today.getDate()).padStart(2, "0")} Tháng ${String(
            today.getMonth() + 1
          ).padStart(2, "0")} Năm ${today.getFullYear()}`}
        </p>
      </div>

      {/* Ngày âm lịch */}
      <div className="relative transform-gpu overflow-hidden flex flex-1 items-center justify-center rounded-2xl border border-amber-200/80 border-t-white/95 bg-gradient-to-r from-amber-50/70 to-white/80 p-3 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),_0_12px_32px_rgba(0,0,0,0.05)] backdrop-blur-2xl backdrop-saturate-150 transition hover:bg-white/90 sm:p-4">
        {/* Vệt phản quang bề mặt kính trên cùng */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

        <p className="relative whitespace-nowrap text-center text-sm font-bold text-slate-800 drop-shadow-sm sm:text-lg lg:text-xl">
          {weekdays[today.getDay()]},{" "}
          Ngày {String(lunarToday.getDay()).padStart(2, "0")} Tháng {monthText} Năm{" "}
          {yearGan} {yearZhi}
        </p>
      </div>
    </div>
  );
}

export default DateHeader;