// V19.12: có thể nhập tạm cho mọi ngày trong tháng (kể cả ngày tương lai).
// Doanh số tương lai được đánh dấu dự kiến và không ghi sang Pancake POS.
// Doanh số điều chỉnh chỉ là lớp hiển thị tại trình duyệt.
// Không ghi Pancake POS, backend, database hay bảng xếp hạng nhân viên.
const KEY_PREFIX = 'pixelalbum-sales-dashboard-temporary-revenue-v1:';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// Giữ phép quy đổi VND (kể cả mức tỷ giá 1000) trong phạm vi số nguyên an toàn.
const MAX_THB = Math.floor(Number.MAX_SAFE_INTEGER / 1000);

export function temporaryRevenueStorageKey(employeeId, month) {
  return `${KEY_PREFIX}${month}:${employeeId}`;
}

// Nhập THB nguyên: "10240" hoặc "10.240". Để trống là bỏ điều chỉnh.
export function parseTemporaryThb(input) {
  const value = String(input ?? '').trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(value)) return null;
  const amount = Number(value.replace(/\./g, ''));
  return Number.isSafeInteger(amount) && amount >= 0 && amount <= MAX_THB ? amount : null;
}

export function readTemporaryRevenue(employeeId, month, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!employeeId || !/^\d{4}-\d{2}$/.test(month) || !storage) return {};
  try {
    const raw = JSON.parse(storage.getItem(temporaryRevenueStorageKey(employeeId, month)) || '{}');
    if (!raw || Array.isArray(raw) || typeof raw !== 'object') return {};
    return Object.fromEntries(Object.entries(raw).filter(([date, value]) =>
      DATE_PATTERN.test(date) && date.startsWith(`${month}-`) &&
      typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= MAX_THB
    ));
  } catch { return {}; }
}

export function writeTemporaryRevenue(employeeId, month, entries, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!employeeId || !storage || !/^\d{4}-\d{2}$/.test(month)) throw new Error('Không có bộ nhớ trình duyệt khả dụng.');
  const key = temporaryRevenueStorageKey(employeeId, month);
  if (Object.keys(entries).length) storage.setItem(key, JSON.stringify(entries));
  else storage.removeItem(key);
}

// Chuẩn hóa bản nhập thử; không lưu số bằng dữ liệu gốc để tránh nhãn điều chỉnh giả.
export function normalizeTemporaryRevenue(drafts, originalRows) {
  const byDate = new Map(originalRows.map((row) => [row.date, row]));
  const entries = {};
  const invalidDates = [];
  for (const [date, raw] of Object.entries(drafts || {})) {
    if (!DATE_PATTERN.test(date) || !byDate.has(date)) continue;
    if (String(raw).trim() === '') continue;
    const value = parseTemporaryThb(raw);
    if (value === null) { invalidDates.push(date); continue; }
    const original = byDate.get(date);
    if (original.recorded && original.revenueThb === value) continue;
    entries[date] = value;
  }
  return { entries, invalidDates };
}

export function applyTemporaryRevenue(originalRows, entries, today) {
  return originalRows.map((row) => {
    if (!Object.hasOwn(entries, row.date)) return { ...row, temporaryAdjusted: false, temporaryForecast: false };
    return { ...row, revenueThb: entries[row.date], recorded: true, temporaryAdjusted: true, temporaryForecast: row.date > today };
  });
}
