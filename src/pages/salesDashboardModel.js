// Tiện ích tính doanh số. Không gọi Pancake từ trình duyệt.
export const BUSINESS_TZ = 'Asia/Bangkok';
export const DEFAULT_EMPLOYEE_ID = 'fafeb8f7-7dd4-4cb2-b61c-6e8d8e4b64a6';

export function employeeTargetKey(employeeId, month) {
  return `${employeeId}:${month}`;
}

export function getEmployeeTarget(targets, employeeId, month) {
  const saved = targets?.[employeeTargetKey(employeeId, month)] ??
    (employeeId === DEFAULT_EMPLOYEE_ID ? targets?.[`hung:${month}`] : undefined);
  return Number.isSafeInteger(saved) && saved >= 0 ? saved : null;
}

export function parseTargetVnd(value) {
  const text = String(value).trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(text)) return null;
  const amount = Number(text.replace(/\./g, ''));
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

// Khi quản trị viên xóa ô và lưu, ghi 0 để bỏ mục tiêu đã đặt.
export function parseTargetDraft(value) {
  return String(value).trim() === '' ? 0 : parseTargetVnd(value);
}

export function normalizeEmployeeSearch(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim().replace(/\s+/g, ' ');
}

export const PROGRESS_COLORS = [
  '#F36B70', '#F68B68', '#F8A35A', '#F9B748', '#FBD044',
  '#FCE45B', '#E5E65E', '#B9DD5B', '#87D762', '#58CE68', '#28C66C',
];

export function todayInBangkok(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function daysInMonth(month) {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}

export function shiftMonth(month, by) {
  const [year, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(year, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function progressColor(ratio) {
  const level = Math.max(0, Math.min(10, Math.floor((Number.isFinite(ratio) ? ratio : 0) * 10)));
  return PROGRESS_COLORS[level];
}

export function buildRows(month, dailyData) {
  const byDate = new Map(dailyData.map((item) => [item.date, item]));
  return Array.from({ length: daysInMonth(month) }, (_, i) => {
    const date = `${month}-${String(i + 1).padStart(2, '0')}`;
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const item = byDate.get(date);
    return { date, day: i + 1, weekday, recorded: Boolean(item), orders: item?.orders ?? null, revenueThb: item?.revenueThb ?? null };
  });
}

export function calculateSummary(rows, targetVnd, rate, today) {
  const hasTarget = Number.isSafeInteger(targetVnd) && targetVnd > 0;
  const recordedDays = rows.filter((row) => row.recorded).length;
  const daysLeft = rows.filter((row) => row.date > today).length;
  if (!recordedDays) return {
    orders: null, revenueThb: null, revenueVnd: null, remainingVnd: null, remainingThb: null,
    targetThb: hasTarget ? targetVnd / rate : null, ratio: null, daysLeft, needPerDay: null, needThbPerDay: null,
    recordedDays, revenue750: null, revenue780: null,
  };
  const orders = rows.reduce((sum, row) => sum + (row.orders ?? 0), 0);
  const revenueThb = rows.reduce((sum, row) => sum + (row.revenueThb ?? 0), 0);
  const revenueVnd = revenueThb * rate;
  const remainingVnd = hasTarget ? Math.max(0, targetVnd - revenueVnd) : null;
  return {
    orders, revenueThb, revenueVnd, remainingVnd, remainingThb: hasTarget ? remainingVnd / rate : null,
    targetThb: hasTarget ? targetVnd / rate : null, ratio: hasTarget && targetVnd > 0 ? revenueVnd / targetVnd : null,
    daysLeft, needPerDay: hasTarget && daysLeft > 0 ? remainingVnd / daysLeft : null,
    needThbPerDay: hasTarget && daysLeft > 0 ? remainingVnd / rate / daysLeft : null,
    recordedDays,
    revenue750: revenueThb * 750, revenue780: revenueThb * 780,
  };
}

// Nhóm các ngày từ thứ Hai đến Chủ Nhật, cắt tại ranh giới tháng.
// Tổng chỉ chứa doanh số thuộc tháng đang xem, không tính trùng tuần giáp tháng.
export function groupWeeklyRows(rows, rate) {
  const groups = [];
  let days = [];
  let total = 0;
  let hasData = false;
  rows.forEach((row, index) => {
    days.push(row);
    total += (row.revenueThb ?? 0) * rate;
    hasData ||= row.recorded;
    if (row.weekday === 0 || index === rows.length - 1) {
      groups.push({ startDate: days[0].date, endDate: row.date, rows: days, totalVnd: hasData ? total : null });
      days = [];
      total = 0;
      hasData = false;
    }
  });
  return groups;
}

// CSV vẫn ghi tổng tại ngày cuối tuần để không cộng trùng doanh số.
export function weeklyTotals(rows, rate) {
  return new Map(groupWeeklyRows(rows, rate).map((week) => [week.endDate, week.totalVnd]));
}

const compactNumber = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1, useGrouping: false });
export function formatChartRevenue(value) {
  if (!Number.isFinite(value)) return '';
  const magnitude = Math.abs(value);
  if (magnitude >= 999_950) return `${compactNumber.format(value / 1_000_000)}M`;
  if (magnitude >= 1_000) return `${compactNumber.format(value / 1_000)}K`;
  return compactNumber.format(value);
}
