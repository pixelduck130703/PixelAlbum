// Các ngày lễ, ngày kỷ niệm theo dương lịch
export const SOLAR_HOLIDAYS = [
  { day: 1, month: 1, title: "Tết Dương Lịch", icon: "🎆" },
  { day: 3, month: 2, title: "Ngày Thành Lập Đảng Cộng sản Việt Nam", icon: "🚩" },
  { day: 14, month: 2, title: "Lễ Tình Nhân (Valentine)", icon: "❤️" },
  { day: 27, month: 2, title: "Ngày Thầy Thuốc Việt Nam", icon: "🩺" },
  { day: 8, month: 3, title: "Ngày Quốc Tế Phụ Nữ", icon: "🌷" },
  { day: 20, month: 3, title: "Ngày Quốc Tế Hạnh Phúc", icon: "😊" },
  { day: 26, month: 3, title: "Ngày Thành Lập Đoàn TNCS Hồ Chí Minh", icon: "💙" },
  { day: 21, month: 4, title: "Ngày Sách Và Văn Hóa Đọc Việt Nam", icon: "📚" },
  { day: 30, month: 4, title: "Ngày Giải Phóng Miền Nam", icon: "🇻🇳" },
  { day: 1, month: 5, title: "Ngày Quốc Tế Lao Động", icon: "👷" },
  { day: 7, month: 5, title: "Ngày Chiến Thắng Điện Biên Phủ", icon: "⭐" },
  { day: 15, month: 5, title: "Ngày Thành Lập Đội Thiếu Niên Tiền Phong Hồ Chí Minh", icon: "🧣" },
  { day: 19, month: 5, title: "Ngày Sinh Chủ Tịch Hồ Chí Minh", icon: "🌺" },
  { day: 1, month: 6, title: "Ngày Quốc Tế Thiếu nhi", icon: "🎈" },
  { day: 5, month: 6, title: "Ngày Bác Hồ Ra Đi Tìm Đường Cứu Nước", icon: "🚢" },
  { day: 21, month: 6, title: "Ngày Báo Chí Cách Mạng Việt Nam", icon: "📰" },
  { day: 28, month: 6, title: "Ngày Gia Đình Việt Nam", icon: "👨‍👩‍👧‍👦" },
  { day: 2, month: 7, title: "Ngày Thống Nhất Đất Nước", icon: "🇻🇳" },
  { day: 27, month: 7, title: "Ngày Thương Binh - Liệt Sĩ", icon: "🕯️" },
  { day: 19, month: 8, title: "Ngày Cách Mạng Tháng Tám Thành Công", icon: "🚩" },
  { day: 2, month: 9, title: "Quốc khánh Nước CHXHCN Việt Nam", icon: "🇻🇳" },
  { day: 10, month: 9, title: "Ngày Thành Lập Mặt Trận Tổ Quốc Việt Nam", icon: "🤝" },
  { day: 1, month: 10, title: "Ngày Quốc Tế Người Cao Tuổi", icon: "👴" },
  { day: 10, month: 10, title: "Ngày Giải Phóng Thủ Đô", icon: "🏙️" },
  { day: 13, month: 10, title: "Ngày Doanh Nhân Việt Nam", icon: "💼" },
  { day: 20, month: 10, title: "Ngày Phụ Nữ Việt Nam", icon: "🌸" },
  { day: 9, month: 11, title: "Ngày Pháp Luật Việt Nam", icon: "⚖️" },
  { day: 19, month: 11, title: "Ngày Quốc tế Nam giới", icon: "👨" },
  { day: 20, month: 11, title: "Ngày Nhà Giáo Việt Nam", icon: "🍎" },
  { day: 23, month: 11, title: "Ngày Di Sản Văn Hóa Việt Nam", icon: "🏛️" },
  { day: 1, month: 12, title: "Ngày Thế Giới Phòng Chống AIDS", icon: "🎗️" },
  { day: 19, month: 12, title: "Ngày Toàn Quốc Kháng Chiến", icon: "🪖" },
  { day: 22, month: 12, title: "Ngày Thành Lập Quân Đội Nhân Dân Việt Nam", icon: "🎖️" },
  { day: 24, month: 12, title: "Lễ Giáng Sinh", icon: "🎄" },
  { day: 31, month: 12, title: "Đêm Giao Thừa Dương lịch", icon: "🎇" },
];

// Các ngày lễ theo âm lịch
export const LUNAR_HOLIDAYS = [
  { day: 23, month: 12, title: "Tết Ông Công Ông Táo", icon: "🐟" },

  { day: 30, month: 12, title: "Tất Niên", icon: "🎆" },

  { day: 1, month: 1, title: "Mùng 1 Tết Nguyên Đán", icon: "🧧" },
  { day: 2, month: 1, title: "Mùng 2 Tết Nguyên Đán", icon: "🌸" },
  { day: 3, month: 1, title: "Mùng 3 Tết Nguyên Đán", icon: "🎊" },

  { day: 15, month: 1, title: "Tết Nguyên Tiêu (Rằm Tháng Giêng)", icon: "🏮" },

  { day: 3, month: 3, title: "Tết Hàn Thực", icon: "🍡" },

  { day: 10, month: 3, title: "Giỗ Tổ Hùng Vương", icon: "🏯" },

  { day: 15, month: 4, title: "Lễ Phật Đản", icon: "🪷" },

  { day: 5, month: 5, title: "Tết Đoan Ngọ", icon: "🍃" },

  { day: 15, month: 7, title: "Lễ Vu Lan", icon: "🙏" },

  { day: 15, month: 8, title: "Tết Trung Thu", icon: "🥮" },
];

// Hàm lấy ngày lễ hôm nay
export function getTodayVietnamHolidays(today, lunarToday) {
  if (!today || !lunarToday) {
    return [];
  }

  const solarDay = today.getDate();
  const solarMonth = today.getMonth() + 1;

  const lunarDay = lunarToday.getDay();
  const rawLunarMonth = lunarToday.getMonth();

  // Một số thư viện biểu diễn tháng nhuận bằng số âm
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

  // Không lấy ngày lễ truyền thống trong tháng nhuận
  const lunarResults = isLeapMonth
    ? []
    : LUNAR_HOLIDAYS.filter(
        (holiday) =>
          holiday.day === lunarDay &&
          holiday.month === lunarMonth,
      ).map((holiday) => ({
        ...holiday,
        type: "lunar",
        dateText: `${String(holiday.day).padStart(2, "0")}/${String(
          holiday.month,
        ).padStart(2, "0")} Âm lịch`,
      }));

  return [...solarResults, ...lunarResults];
}