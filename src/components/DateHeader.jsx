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
      <div className="flex flex-1 items-center justify-center rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-3 shadow-sm sm:p-4">
        <p className="whitespace-nowrap text-center text-sm font-bold text-slate-800 sm:text-lg lg:text-xl">
          {weekdays[today.getDay()]},{" "}
          {`Ngày ${String(today.getDate()).padStart(2, "0")} Tháng ${String(
            today.getMonth() + 1
          ).padStart(2, "0")} Năm ${today.getFullYear()}`}
        </p>
      </div>

      {/* Ngày âm lịch */}
      <div className="flex flex-1 items-center justify-center rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-white p-3 shadow-sm sm:p-4">
        <p className="whitespace-nowrap text-center text-sm font-bold text-slate-800 sm:text-lg lg:text-xl">
          {weekdays[today.getDay()]},{" "}
          Ngày {String(lunarToday.getDay()).padStart(2, "0")} Tháng {monthText} Năm{" "}
          {yearGan} {yearZhi}
        </p>
      </div>
    </div>
  );
}

export default DateHeader;