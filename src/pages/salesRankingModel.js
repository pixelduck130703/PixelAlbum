export const PERIODS = [
  ['today', 'Hôm nay'], ['yesterday', 'Hôm qua'], ['thisWeek', 'Tuần này'],
  ['lastWeek', 'Tuần trước'], ['thisMonth', 'Tháng này'], ['lastMonth', 'Tháng trước'], ['custom', 'Tùy chỉnh'],
];

const iso = (d) => d.toISOString().slice(0, 10);
const date = (s) => new Date(`${s}T00:00:00Z`);
function addDays(s, days) {
  const d = date(s); d.setUTCDate(d.getUTCDate() + days); return iso(d);
}

export function rankingRange(period, today, customStart, customEnd) {
  const monday = addDays(today, -((date(today).getUTCDay() + 6) % 7));
  const month = `${today.slice(0, 7)}-01`;
  const lastMonthEnd = addDays(month, -1);
  switch (period) {
    case 'yesterday': return [addDays(today, -1), addDays(today, -1)];
    case 'thisWeek': return [monday, today];
    case 'lastWeek': return [addDays(monday, -7), addDays(monday, -1)];
    case 'thisMonth': return [month, today];
    case 'lastMonth': return [`${lastMonthEnd.slice(0, 7)}-01`, lastMonthEnd];
    case 'custom': return [customStart, customEnd];
    default: return [today, today];
  }
}

export function rankingRangeError(start, end, today) {
  const valid = (s) => /^(20\d{2}|2100)-\d{2}-\d{2}$/.test(s) && Number.isFinite(date(s).getTime()) && iso(date(s)) === s;
  if (!valid(start) || !valid(end)) return 'Vui lòng chọn đủ ngày hợp lệ.';
  if (start > end) return 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.';
  if (end > today) return 'Không chọn ngày trong tương lai.';
  if ((date(end) - date(start)) / 86400000 >= 366) return 'Khoảng thời gian tối đa 366 ngày.';
  return '';
}

export function filterRanking(rows, employees, selectedIds) {
  const allowed = new Set(employees.map((p) => p.id));
  const selected = selectedIds === null ? null : new Set(selectedIds);
  return rows.filter((row) => allowed.has(row.employeeId) && (!selected || selected.has(row.employeeId)))
    .sort((a, b) => b.revenueThb - a.revenueThb || a.name.localeCompare(b.name, 'vi') || a.employeeId.localeCompare(b.employeeId));
}

export function rankingShowsCompletion(period) {
  return period === 'thisMonth' || period === 'lastMonth';
}
