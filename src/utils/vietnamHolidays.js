import { Solar } from "lunar-javascript";

// Các ngày lễ, ngày kỷ niệm theo dương lịch
export const SOLAR_HOLIDAYS = [
  { day: 1, month: 1, title: "TẾT DƯƠNG LỊCH", icon: "🎆" },
  { day: 3, month: 2, title: "NGÀY THÀNH LẬP ĐẢNG CỘNG SẢN VIỆT NAM", icon: "/images//ĐCSVN.jpg", isImage: true },
  { day: 14, month: 2, title: "LỄ TÌNH NHÂN (VALENTINE)", icon: "❤️" },
  { day: 27, month: 2, title: "NGÀY THẦY THUỐC VIỆT NAM", icon: "🩺" },
  { day: 8, month: 3, title: "NGÀY QUỐC TẾ PHỤ NỮ", icon: "🌷" },
  { day: 14, month: 3, title: "LỄ TÌNH NHÂN TRẮNG", icon: "🤍" },
  { day: 20, month: 3, title: "NGÀY QUỐC TẾ HẠNH PHÚC", icon: "❤️" },
  { day: 26, month: 3, title: "NGÀY THÀNH LẬP ĐOÀN TNCS HỒ CHÍ MINH", icon: "/images//ĐTNCSHCM.png", isImage: true },
  { day: 21, month: 4, title: "NGÀY SÁCH VÀ VĂN HÓA ĐỌC VIỆT NAM", icon: "📚" },
  { day: 30, month: 4, title: "NGÀY GIẢI PHÓNG MIỀN NAM", icon: "/images//VN2.webp", isImage: true },
  { day: 1, month: 5, title: "NGÀY QUỐC TẾ LAO ĐỘNG", icon: "👷" },
  { day: 7, month: 5, title: "NGÀY CHIẾN THẮNG ĐIỆN BIÊN PHỦ", icon: "⭐" },
  { day: 15, month: 5, title: "NGÀY THÀNH LẬP ĐỘI THIẾU NIÊN TIỀN PHONG HỒ CHÍ MINH", icon: "/images//ĐTNTPHCM.png", isImage: true },
  { day: 19, month: 5, title: "NGÀY SINH CHỦ TỊCH HỒ CHÍ MINH", icon: "/images//HCM.png", isImage: true },
  { day: 1, month: 6, title: "NGÀY QUỐC TẾ THIẾU NHI", icon: "🎈" },
  { day: 5, month: 6, title: "NGÀY BÁC HỒ RA ĐI TÌM ĐƯỜNG CỨU NƯỚC", icon: "/images//HCM.png", isImage: true },
  { day: 21, month: 6, title: "NGÀY BÁO CHÍ CÁCH MẠNG VIỆT NAM", icon: "📰" },
  { day: 28, month: 6, title: "NGÀY GIA ĐÌNH VIỆT NAM", icon: "👨‍👩‍👧‍👦" },
  { day: 2, month: 7, title: "NGÀY THỐNG NHẤT ĐẤT NƯỚC", icon: "/images//VN1.webp", isImage: true },
  { day: 27, month: 7, title: "NGÀY THƯƠNG BINH - LIỆT SĨ", icon: "🕯️" },
  { day: 19, month: 8, title: "NGÀY CÁCH MẠNG THÁNG TÁM THÀNH CÔNG", icon: "⭐" },
  { day: 2, month: 9, title: "QUỐC KHÁNH NƯỚC CHXHCN VIỆT NAM", icon: "/images//VN1.webp", isImage: true },
  { day: 10, month: 9, title: "NGÀY THÀNH LẬP MẶT TRẬN TỔ QUỐC VIỆT NAM", icon: "🤝" },
  { day: 1, month: 10, title: "NGÀY QUỐC TẾ NGƯỜI CAO TUỔI", icon: "👴" },
  { day: 10, month: 10, title: "NGÀY GIẢI PHÓNG THỦ ĐÔ", icon: "⭐" },
  { day: 13, month: 10, title: "NGÀY DOANH NHÂN VIỆT NAM", icon: "💼" },
  { day: 20, month: 10, title: "NGÀY PHỤ NỮ VIỆT NAM", icon: "🌸" },
  { day: 9, month: 11, title: "NGÀY PHÁP LUẬT VIỆT NAM", icon: "⚖️" },
  { day: 19, month: 11, title: "NGÀY QUỐC TẾ NAM GIỚI", icon: "👨" },
  { day: 20, month: 11, title: "NGÀY NHÀ GIÁO VIỆT NAM", icon: "📚" },
  { day: 24, month: 11, title: "NGÀY VĂN HÓA VIỆT NAM", icon: "🏛️" },
  { day: 1, month: 12, title: "NGÀY THẾ GIỚI PHÒNG CHỐNG AIDS", icon: "💉" },
  { day: 19, month: 12, title: "NGÀY TOÀN QUỐC KHÁNG CHIẾN", icon: "🪖" },
  { day: 22, month: 12, title: "NGÀY THÀNH LẬP QUÂN ĐỘI NHÂN DÂN VIỆT NAM", icon: "/images//QĐNDVN.png", isImage: true },
  { day: 24, month: 12, title: "LỄ GIÁNG SINH", icon: "🎄" },
  { day: 31, month: 12, title: "TẤT NIÊN", icon: "🎇" },
];

// Các ngày lễ theo âm lịch
export const LUNAR_HOLIDAYS = [
  { day: 23, month: 12, title: "TẾT ÔNG CÔNG ÔNG TÁO", icon: "🐟" },

  { day: 1, month: 1, title: "MÙNG 1 TẾT NGUYÊN ĐÁN", icon: "🧧" },
  { day: 2, month: 1, title: "MÙNG 2 TẾT NGUYÊN ĐÁN", icon: "🌸" },
  { day: 3, month: 1, title: "MÙNG 3 TẾT NGUYÊN ĐÁN", icon: "🎊" },

  { day: 15, month: 1, title: "TẾT NGUYÊN TIÊU (RẰM THÁNG GIÊNG)", icon: "🏮" },

  { day: 3, month: 3, title: "TẾT HÀN THỰC", icon: "🍡" },

  { day: 10, month: 3, title: "GIỖ TỔ HÙNG VƯƠNG", icon: "🏯" },

  { day: 15, month: 4, title: "LỄ PHẬT ĐẢN", icon: "🪷" },

  { day: 5, month: 5, title: "TẾT ĐOAN NGỌ", icon: "🍃" },

  { day: 15, month: 7, title: "LỄ VU LAN", icon: "🙏" },

  { day: 15, month: 8, title: "TẾT TRUNG THU", icon: "🥮" },
];

// Hàm lấy ngày lễ hôm nay
export function getTodayVietnamHolidays(today, lunarToday) {
  if (!today || !lunarToday) return [];

  const solarDay = today.getDate();
  const solarMonth = today.getMonth() + 1;

  const lunarDay = lunarToday.getDay();
  const rawLunarMonth = lunarToday.getMonth();
  const lunarMonth = Math.abs(rawLunarMonth);
  const isLeapMonth = rawLunarMonth < 0;

  const solarResults = SOLAR_HOLIDAYS.filter(
    (holiday) =>
      holiday.day === solarDay &&
      holiday.month === solarMonth,
  ).map((holiday) => ({
    ...holiday,
    type: "solar",
    dateText: `${String(holiday.day).padStart(2, "0")}/${String(
      holiday.month,
    ).padStart(2, "0")} Dương lịch`,
  }));

  const lunarResults = isLeapMonth
    ? []
    : LUNAR_HOLIDAYS.filter(
        (holiday) =>
          holiday.title !== "TẤT NIÊN" &&
          holiday.day === lunarDay &&
          holiday.month === lunarMonth,
      ).map((holiday) => ({
        ...holiday,
        type: "lunar",
        dateText: `${String(holiday.day).padStart(2, "0")}/${String(
          holiday.month,
        ).padStart(2, "0")} Âm lịch`,
      }));

  // Kiểm tra ngày hôm sau có phải mùng 1 Tết hay không
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tomorrowLunar = Solar.fromYmd(
    tomorrow.getFullYear(),
    tomorrow.getMonth() + 1,
    tomorrow.getDate(),
  ).getLunar();

  const isTatNien =
    !isLeapMonth &&
    lunarMonth === 12 &&
    tomorrowLunar.getDay() === 1 &&
    Math.abs(tomorrowLunar.getMonth()) === 1;

  if (isTatNien) {
    lunarResults.push({
      day: lunarDay,
      month: lunarMonth,
      title: "TẤT NIÊN",
      icon: "🎆",
      type: "lunar",
      dateText: `${String(lunarDay).padStart(2, "0")}/12 Âm lịch`,
    });
  }

  return [...solarResults, ...lunarResults];
}