import React, { useState, useEffect, useCallback } from "react";
import { Solar } from "lunar-javascript";

// Danh sách ngày lễ Dương Lịch cố định (tháng-ngày: MM-DD)
const SOLAR_HOLIDAYS = {
  "01-01": "Tết Dương Lịch",
  "02-14": "Ngày Lễ Tình Nhân (Valentine)",
  "02-27": "Ngày Thầy thuốc Việt Nam",
  "03-08": "Ngày Quốc tế Phụ nữ",
  "03-26": "Ngày Thành lập Đoàn TNCS Hồ Chí Minh",
  "04-30": "Ngày Giải phóng Miền Nam, Thống nhất Đất nước",
  "05-01": "Ngày Quốc tế Lao động",
  "05-19": "Ngày Sinh Chủ tịch Hồ Chí Minh",
  "06-01": "Ngày Quốc tế Thiếu nhi",
  "07-27": "Ngày Thương binh - Liệt sĩ",
  "08-19": "Ngày Truyền thống Công an Nhân dân",
  "09-02": "Ngày Quốc khánh Nước CHXHCN Việt Nam",
  "10-10": "Ngày Giải phóng Thủ đô",
  "10-20": "Ngày Phụ nữ Việt Nam",
  "11-20": "Ngày Nhà giáo Việt Nam",
  "12-22": "Ngày Thành lập Quân đội Nhân dân Việt Nam",
  "12-25": "Lễ Giáng Sinh (Noel)",
};

// Danh sách ngày lễ Âm Lịch cố định (tháng-ngày: MM-DD)
const LUNAR_HOLIDAYS = {
  "01-01": "Tết Nguyên Đán (Mùng 1 Tết)",
  "01-02": "Tết Nguyên Đán (Mùng 2 Tết)",
  "01-03": "Tết Nguyên Đán (Mùng 3 Tết)",
  "01-15": "Tết Nguyên Tiêu",
  "03-10": "Ngày Giỗ Tổ Hùng Vương",
  "04-15": "Đại lễ Phật Đản",
  "05-05": "Tết Đoan Ngọ",
  "07-15": "Đại lễ Vu Lan Báo Hiếu",
  "08-15": "Tết Trung Thu",
  "12-23": "Lễ Ông Công Ông Táo",
  "12-30": "Lễ Tất Niên Cuối Năm",
};

const heavenlyStems = {
  "甲": "Giáp", "乙": "Ất", "丙": "Bính", "丁": "Đinh", "戊": "Mậu",
  "己": "Kỷ", "庚": "Canh", "辛": "Tân", "壬": "Nhâm", "癸": "Quý",
};

const earthlyBranches = {
  "子": "Tý", "丑": "Sửu", "寅": "Dần", "卯": "Mão", "辰": "Thìn", "巳": "Tỵ",
  "午": "Ngọ", "未": "Mùi", "申": "Thân", "酉": "Dậu", "戌": "Tuất", "亥": "Hợi",
};

const defaultWeekdays = [
  "Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"
];

// Hàm helper tính toán thông tin chi tiết của 1 ngày
function calculateDayDetail(year, month, day, weekdays = defaultWeekdays) {
  const dateObj = new Date(year, month - 1, day);
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  const isFirstLunarDay = lunar.getDay() === 1;

  const solarKey = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const lunarKey = `${String(Math.abs(lunar.getMonth())).padStart(2, "0")}-${String(lunar.getDay()).padStart(2, "0")}`;

  const holidayName = SOLAR_HOLIDAYS[solarKey] || LUNAR_HOLIDAYS[lunarKey] || null;

  const dayOfWeek = dateObj.getDay();
  const dayOfWeekIndex = (dayOfWeek + 6) % 7;

  const lMonth = Math.abs(lunar.getMonth());
  const lMonthText = lMonth === 1 ? "Giêng" : lMonth === 12 ? "Chạp" : String(lMonth).padStart(2, "0");
  const lYearGan = heavenlyStems[lunar.getYearGan()] || lunar.getYearGan();
  const lYearZhi = earthlyBranches[lunar.getYearZhi()] || lunar.getYearZhi();
  const lDayGan = heavenlyStems[lunar.getDayGan()] || lunar.getDayGan();
  const lDayZhi = earthlyBranches[lunar.getDayZhi()] || lunar.getDayZhi();

  return {
    solarDay: day,
    solarMonth: month,
    solarYear: year,
    weekdayName: weekdays[dayOfWeek],
    lunarDay: lunar.getDay(),
    lunarMonthText: lMonthText,
    lunarYearGanZhi: `${lYearGan} ${lYearZhi}`,
    lunarDayGanZhi: `${lDayGan} ${lDayZhi}`,
    lunarText: isFirstLunarDay
      ? `${lunar.getDay()}/${Math.abs(lunar.getMonth())}`
      : `${lunar.getDay()}`,
    isFirstLunarDay,
    holidayName,
    dayOfWeekIndex,
  };
}

// Component hiển thị phần thân tờ lịch xé
function TearOffSheetContent({ item }) {
  if (!item) return null;
  const isSunday = item.dayOfWeekIndex === 6;

  return (
    <div className="bg-[#fffef9] px-6 py-4 text-center select-none">
      {/* Ngày Dương Lịch to bản */}
      <div className="my-0.5">
        <span
          className={`text-8xl sm:text-9xl font-black tracking-tight leading-none drop-shadow-sm font-serif ${
            isSunday || item.holidayName ? "text-rose-600" : "text-slate-800"
          }`}
        >
          {item.solarDay}
        </span>
      </div>

      {/* Tên ngày lễ 1 dòng */}
      {item.holidayName && (
        <div className="mt-4 sm:mt-5 mb-2 px-1">
          <p
            title={item.holidayName}
            className="w-full truncate whitespace-nowrap text-xs sm:text-sm font-extrabold text-rose-600 leading-tight"
          >
            {item.holidayName}
          </p>
        </div>
      )}

      <div className="mx-auto my-3.5 h-[1px] w-24 bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>

      {/* Khối Âm Lịch */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 p-3.5 shadow-inner">
        <div className="flex items-center justify-center gap-3">
          <span className="rounded-md bg-amber-700 px-2 py-0.5 text-[11px] font-bold text-white uppercase">
            Âm Lịch
          </span>
          <span className="text-xl font-bold text-amber-900">
            Ngày {item.lunarDay} Tháng {item.lunarMonthText}
          </span>
        </div>

        {/* Bát tự Can Chi */}
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-amber-200/70 pt-2.5 text-xs text-amber-900">
          <div className="rounded-lg bg-white/70 py-1.5 px-2">
            <span className="text-slate-500 block text-[10px]">Ngày</span>
            <span className="font-bold">{item.lunarDayGanZhi}</span>
          </div>
          <div className="rounded-lg bg-white/70 py-1.5 px-2">
            <span className="text-slate-500 block text-[10px]">Năm</span>
            <span className="font-bold">{item.lunarYearGanZhi}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Popup kiểu Block Lịch xé giấy - Kèm hiệu ứng xé giấy khi chuyển ngày
function TearOffCalendarModal({ detail, onChangeDay, onClose, weekdays }) {
  const [animating, setAnimating] = useState(false);
  const [animDirection, setAnimDirection] = useState("next");
  const [oldDetail, setOldDetail] = useState(null);

  const triggerChangeDay = useCallback((direction) => {
    if (animating || !detail) return;
    setOldDetail(detail);
    setAnimDirection(direction);
    setAnimating(true);

    const delta = direction === "next" ? 1 : -1;
    const targetDate = new Date(detail.solarYear, detail.solarMonth - 1, detail.solarDay + delta);
    const newDetail = calculateDayDetail(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      targetDate.getDate(),
      weekdays
    );

    onChangeDay(newDetail);

    setTimeout(() => {
      setAnimating(false);
      setOldDetail(null);
    }, 450);
  }, [animating, detail, onChangeDay, weekdays]);

  const handlePrevDay = useCallback(() => triggerChangeDay("prev"), [triggerChangeDay]);
  const handleNextDay = useCallback(() => triggerChangeDay("next"), [triggerChangeDay]);

  useEffect(() => {
    if (!detail) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") handlePrevDay();
      if (e.key === "ArrowRight") handleNextDay();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detail, handlePrevDay, handleNextDay, onClose]);

  if (!detail) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <style>{`
        @keyframes ripOffNext {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; transform-origin: top left; }
          30% { transform: translateY(12px) rotate(7deg) scale(0.98); opacity: 0.95; }
          100% { transform: translateY(140px) rotate(24deg) scale(0.85); opacity: 0; filter: blur(1.5px); }
        }
        @keyframes ripOffPrev {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; transform-origin: top right; }
          30% { transform: translateY(12px) rotate(-7deg) scale(0.98); opacity: 0.95; }
          100% { transform: translateY(140px) rotate(-24deg) scale(0.85); opacity: 0; filter: blur(1.5px); }
        }
        .animate-tear-next { animation: ripOffNext 0.45s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
        .animate-tear-prev { animation: ripOffPrev 0.45s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
      `}</style>

      <div
        className="relative flex items-center justify-center gap-3 sm:gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút Lùi 1 ngày */}
        <button
          type="button"
          onClick={handlePrevDay}
          disabled={animating}
          className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-xl backdrop-blur-md border border-slate-200/80 transition hover:bg-white hover:scale-105 active:scale-95 cursor-pointer font-bold text-xl disabled:opacity-40"
          title="Lùi 1 ngày (←)"
        >
          ‹
        </button>

        {/* Tờ lịch xé giấy */}
        <div className="relative w-full max-w-[340px] sm:max-w-sm overflow-hidden rounded-3xl bg-amber-50/90 shadow-[0_25px_70px_rgba(0,0,0,0.35)] transition-all animate-in zoom-in-95 duration-200 border-4 border-amber-900/30 ring-1 ring-black/10">
          {/* Khuy gáy bloc lịch xé giấy */}
          <div className="relative z-20 bg-gradient-to-r from-red-700 via-rose-600 to-red-800 px-6 pt-6 pb-4 text-center text-white shadow-md">
            <div className="absolute top-2.5 left-1/2 flex -translate-x-1/2 gap-12">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-yellow-300 bg-amber-950 shadow-inner"></span>
              <span className="h-3.5 w-3.5 rounded-full border-2 border-yellow-300 bg-amber-950 shadow-inner"></span>
            </div>

            <p className="mt-3 text-xs font-bold tracking-widest text-yellow-300/90 uppercase">
              Tháng {String(detail.solarMonth).padStart(2, "0")} Năm {detail.solarYear}
            </p>
            <h2 className="mt-0.5 text-xl font-extrabold tracking-wide uppercase">
              {detail.weekdayName}
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white font-bold hover:bg-white/40 cursor-pointer text-sm transition"
              title="Đóng (ESC)"
            >
              ✕
            </button>
          </div>

          {/* Vùng thân tờ lịch */}
          <div className="relative overflow-hidden bg-[#fffdfa]">
            <TearOffSheetContent item={detail} />

            {animating && oldDetail && (
              <div
                className={`absolute inset-0 z-10 bg-[#fffdfa] pointer-events-none shadow-xl ${
                  animDirection === "next" ? "animate-tear-next" : "animate-tear-prev"
                }`}
              >
                <TearOffSheetContent item={oldDetail} />
              </div>
            )}
          </div>

          {/* Đuôi tờ lịch răng cưa */}
          <div className="relative h-4 bg-[#fffdfa]">
            <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-r from-amber-100/50 via-amber-200/50 to-amber-100/50"></div>
          </div>
        </div>

        {/* Nút Tiến 1 ngày */}
        <button
          type="button"
          onClick={handleNextDay}
          disabled={animating}
          className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-xl backdrop-blur-md border border-slate-200/80 transition hover:bg-white hover:scale-105 active:scale-95 cursor-pointer font-bold text-xl disabled:opacity-40"
          title="Tiến 1 ngày (→)"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function DateHeader({
  today = new Date(),
  weekdays = defaultWeekdays,
  lunarToday,
  monthText = "Giêng",
  yearGan = "Giáp",
  yearZhi = "Thìn",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(today);
  const [isSelectingMonthYear, setIsSelectingMonthYear] = useState(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const isCurrentMonthView =
    month === today.getMonth() && year === today.getFullYear();

  // Chuyển tháng
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date());
    setIsSelectingMonthYear(false);
  };

  // Danh sách năm từ 1900 đến 2100
  const startYear = 1900;
  const endYear = 2100;
  const yearsList = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  // Tính ngày bắt đầu với Thứ 2 là ngày đầu tuần
  const rawFirstDay = new Date(year, month, 1).getDay();
  const firstDayIndex = (rawFirstDay + 6) % 7; 
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayDetail = calculateDayDetail(year, month + 1, d, weekdays);
    calendarCells.push(dayDetail);
  }

  const weekdaysHeader = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const now = new Date();

  return (
    <div className="mx-auto mt-6 w-full max-w-7xl px-4 sm:px-6">
      {/* 2 Khối chọn Dương / Âm lịch */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
        {/* Nút Ngày Dương Lịch */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`group flex flex-1 items-center justify-center rounded-2xl border bg-gradient-to-r from-blue-50 to-white p-3.5 shadow-sm transition-all sm:p-4 text-left cursor-pointer active:scale-[0.99] ${
            isOpen ? "border-blue-500 ring-2 ring-blue-200" : "border-blue-200 hover:border-blue-400 hover:shadow-md"
          }`}
        >
          <p className="whitespace-nowrap text-center text-sm font-bold text-slate-800 transition group-hover:text-blue-600 sm:text-lg lg:text-xl">
            {weekdays[today.getDay()]},{" "}
            {`Ngày ${String(today.getDate()).padStart(2, "0")} Tháng ${String(
              today.getMonth() + 1
            ).padStart(2, "0")} Năm ${today.getFullYear()}`}
          </p>
        </button>

        {/* Nút Ngày Âm Lịch */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`group flex flex-1 items-center justify-center rounded-2xl border bg-gradient-to-r from-amber-50 to-white p-3.5 shadow-sm transition-all sm:p-4 text-left cursor-pointer active:scale-[0.99] ${
            isOpen ? "border-amber-500 ring-2 ring-amber-200" : "border-amber-200 hover:border-amber-400 hover:shadow-md"
          }`}
        >
          <p className="whitespace-nowrap text-center text-sm font-bold text-slate-800 transition group-hover:text-amber-700 sm:text-lg lg:text-xl">
            {weekdays[today.getDay()]},{" "}
            Ngày {String(lunarToday?.getDay?.() ?? today.getDate()).padStart(2, "0")} Tháng {monthText} Năm{" "}
            {yearGan} {yearZhi}
          </p>
        </button>
      </div>

      {/* Bảng lịch tháng hiển thị trực tiếp ngay dưới DateHeader */}
      {isOpen && (
        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xl transition-all animate-in fade-in slide-in-from-top-3 duration-300">
          {/* Thanh điều hướng tháng & Chọn nhanh Tháng Năm */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700 transition hover:bg-slate-200 active:scale-95 cursor-pointer"
              title="Tháng trước"
            >
              ‹
            </button>

            {/* Vùng chọn Tháng / Năm gọn gàng trên 1 hàng */}
            <div className="flex items-center gap-1.5">
              {!isSelectingMonthYear ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsSelectingMonthYear(true)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-bold text-slate-800 transition hover:bg-slate-100 hover:text-blue-600 sm:text-base cursor-pointer"
                    title="Bấm để chọn tháng/năm"
                  >
                    <span>
                      Tháng {String(month + 1).padStart(2, "0")} Năm {year}
                    </span>
                    <span className="text-[10px] text-slate-400">▼</span>
                  </button>

                  {!isCurrentMonthView && (
                    <button
                      type="button"
                      onClick={handleGoToday}
                      className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 transition hover:bg-blue-100 cursor-pointer"
                      title="Về tháng hiện tại"
                    >
                      Hôm nay
                    </button>
                  )}
                </div>
              ) : (
                /* 2 ô chọn Tháng và Năm inline */
                <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <select
                    value={month}
                    onChange={(e) => setCurrentDate(new Date(year, Number(e.target.value), 1))}
                    className="rounded-lg border border-blue-400 bg-blue-50/50 px-2 py-1 text-xs font-bold text-blue-700 focus:outline-none cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>
                        Tháng {i + 1}
                      </option>
                    ))}
                  </select>

                  <select
                    value={year}
                    onChange={(e) => setCurrentDate(new Date(Number(e.target.value), month, 1))}
                    className="rounded-lg border border-blue-400 bg-blue-50/50 px-2 py-1 text-xs font-bold text-blue-700 focus:outline-none cursor-pointer"
                  >
                    {yearsList.map((y) => (
                      <option key={y} value={y}>
                        Năm {y}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setIsSelectingMonthYear(false)}
                    className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95 cursor-pointer"
                  >
                    ✓
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700 transition hover:bg-slate-200 active:scale-95 cursor-pointer"
              title="Tháng sau"
            >
              ›
            </button>
          </div>

          {/* Tiêu đề Thứ (T2 -> CN) */}
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500">
            {weekdaysHeader.map((w, idx) => (
              <div
                key={idx}
                className={idx === 6 ? "text-rose-500 font-extrabold" : idx === 5 ? "text-blue-500" : ""}
              >
                {w}
              </div>
            ))}
          </div>

          {/* Lưới các ô ngày */}
          <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="h-14 sm:h-16" />;
              }

              const isToday =
                cell.solarDay === now.getDate() &&
                month === now.getMonth() &&
                year === now.getFullYear();

              const isSunday = cell.dayOfWeekIndex === 6;
              const hasHoliday = Boolean(cell.holidayName);

              return (
                <button
                  type="button"
                  key={cell.solarDay}
                  onClick={() => setSelectedDayDetail(cell)}
                  title={cell.holidayName ? `${cell.holidayName}` : undefined}
                  className={`group relative flex h-14 sm:h-16 flex-col items-center justify-between rounded-2xl border p-1 sm:p-1.5 transition text-left cursor-pointer active:scale-95 ${
                    isToday
                      ? "border-blue-500 bg-blue-500 font-bold text-white shadow-md shadow-blue-500/20"
                      : hasHoliday
                      ? "border-rose-200 bg-rose-50/70 text-rose-700 hover:border-rose-400"
                      : isSunday
                      ? "border-slate-100 bg-red-50/30 text-rose-600 hover:border-blue-300"
                      : "border-slate-100 bg-slate-50/60 text-slate-800 hover:border-blue-300"
                  }`}
                >
                  {/* Số ngày Dương to và đậm rõ nét */}
                  <span className="text-base sm:text-lg font-extrabold leading-tight tracking-tight">
                    {cell.solarDay}
                  </span>

                  {/* Tên ngày Lễ hoặc Ngày Âm */}
                  {cell.holidayName ? (
                    <span
                      className={`w-full truncate text-center text-[9px] sm:text-[10px] font-bold leading-tight ${
                        isToday ? "text-yellow-200" : "text-rose-600"
                      }`}
                    >
                      {cell.holidayName}
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] sm:text-[11px] font-medium leading-tight ${
                        isToday
                          ? "text-blue-100"
                          : cell.isFirstLunarDay
                          ? "font-bold text-rose-600"
                          : "text-amber-600"
                      }`}
                    >
                      {cell.lunarText}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Chú thích & Nút thu gọn */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span> Dương lịch
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500"></span> Âm lịch
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-rose-500"></span> Ngày lễ
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsSelectingMonthYear(false);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
            >
              Thu gọn ▲
            </button>
          </div>
        </div>
      )}

      {/* Modal Popup Kiểu Lịch Xé Giấy (Hỗ trợ hiệu ứng xé rơi khi Tiến/Lùi ngày) */}
      <TearOffCalendarModal
        detail={selectedDayDetail}
        onChangeDay={setSelectedDayDetail}
        onClose={() => setSelectedDayDetail(null)}
        weekdays={weekdays}
      />
    </div>
  );
}

export default DateHeader;