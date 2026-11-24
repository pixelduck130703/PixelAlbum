const { normalizeSaleReport } = require('./saleReport');
const { normalizeWarehouseReport } = require('./warehouseReport');
// Pancake POS sales. Chỉ sử dụng phía server; không trả API key ra frontend.
const BASE = 'https://pos.pages.fm/api/v1/shops';
const TZ = 'Asia/Bangkok';
const monthPattern = /^(20\d{2}|2100)-(0[1-9]|1[0-2])$/;

class PancakeError extends Error {
  constructor(message, status = 502) { super(message); this.status = status; }
}

function bangkokDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function monthRange(month, now = new Date()) {
  if (typeof month !== 'string' || !monthPattern.test(month)) throw new PancakeError('Tháng không hợp lệ (YYYY-MM).', 400);
  const [year, m] = month.split('-').map(Number);
  const first = `${month}-01`;
  const last = `${month}-${new Date(Date.UTC(year, m, 0)).getUTCDate()}`;
  const today = bangkokDate(now);
  return { first, last, today, end: last < today ? last : today };
}

async function requestPancake(path, params = [], allowMissingSuccess = false) {
  const shop = String(process.env.PANCAKE_SHOP_ID || '').trim();
  const key = String(process.env.PANCAKE_API_KEY || '').trim();
  if (!/^\d+$/.test(shop) || !key) throw new PancakeError('Backend chưa cấu hình PANCAKE_SHOP_ID hoặc PANCAKE_API_KEY.', 503);
  const url = new URL(`${BASE}/${shop}/${path}`);
  url.searchParams.append('api_key', key);
  for (const [name, value] of params) url.searchParams.append(name, value);
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: 'error', headers: { Accept: 'application/json' } });
  } catch {
    // Không log URL hoặc lỗi gốc vì URL chứa key.
    throw new PancakeError('Không thể kết nối Pancake. Hãy thử lại.');
  }
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new PancakeError('Pancake từ chối quyền truy cập. Kiểm tra API key và shop ID.');
    if (response.status === 429) throw new PancakeError('Pancake đang giới hạn lượt gọi. Thử lại sau.', 503);
    throw new PancakeError(`Pancake trả lỗi HTTP ${response.status}.`);
  }
  let result;
  try { result = await response.json(); } catch { throw new PancakeError('Pancake trả dữ liệu không phải JSON.'); }
  if (!Array.isArray(result?.data) || (result.success !== true && !(allowMissingSuccess && result.success === undefined))) throw new PancakeError('Pancake trả dữ liệu không hợp lệ.');
  return result.data;
}

function normalizeEmployeeRecords(users) {
  const byId = new Map();
  for (const row of users) {
    const id = String(row?.user_id || row?.user?.id || '');
    const name = String(row?.user?.name || row?.name || '').trim().replace(/\s+/g, ' ');
    if (id && name) byId.set(id, { id, name, departmentName: typeof row?.department?.name === 'string' ? row.department.name : '' });
  }
  const counts = new Map();
  for (const { name } of byId.values()) counts.set(name, (counts.get(name) || 0) + 1);
  return [...byId.values()].map((u) => ({ ...u, name: counts.get(u.name) > 1 ? `${u.name} (${u.id.slice(-8)})` : u.name })).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

function publicEmployees(records) { return records.map(({ id, name }) => ({ id, name })); }

function normalizeEmployees(users) { return publicEmployees(normalizeEmployeeRecords(users)); }

let employeeCache = null;
let employeePending = null;
async function getEmployeeRecords() {
  if (employeeCache && Date.now() < employeeCache.expires) return employeeCache.data;
  if (employeePending) return employeePending;
  employeePending = (async () => {
    const data = normalizeEmployeeRecords(await requestPancake('users'));
    if (!data.length) throw new PancakeError('Pancake không trả danh sách nhân viên.');
    employeeCache = { data, expires: Date.now() + 60000 };
    return data;
  })();
  try { return await employeePending; } finally { employeePending = null; }
}

async function getEmployees() { return publicEmployees(await getEmployeeRecords()); }

// API /warehouses trả data[] (không bắt buộc có success). Chỉ trả tên và ID, không trả địa chỉ/số điện thoại.
function normalizeWarehouses(rows) {
  const byId = new Map();
  for (const row of rows) {
    const id = typeof row?.id === 'string' ? row.id : '';
    const name = typeof row?.name === 'string' ? row.name.trim() : '';
    if (/^[A-Za-z0-9_-]{1,128}$/.test(id) && name) byId.set(id, { id, name });
  }
  const counts = new Map();
  for (const { name } of byId.values()) counts.set(name, (counts.get(name) || 0) + 1);
  return [...byId.values()].map((row) => ({ ...row, name: counts.get(row.name) > 1 ? `${row.name} (${row.id.slice(-8)})` : row.name })).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

let warehouseCache = null;
let warehousePending = null;
async function getWarehouses() {
  if (warehouseCache && Date.now() < warehouseCache.expires) return warehouseCache.data;
  if (warehousePending) return warehousePending;
  warehousePending = (async () => {
    const raw = await requestPancake('warehouses', [], true);
    const data = normalizeWarehouses(raw);
    if (raw.length && !data.length) throw new PancakeError('Pancake trả danh sách kho không hợp lệ.');
    warehouseCache = { data, expires: Date.now() + 60000 };
    return data;
  })();
  try { return await warehousePending; } finally { warehousePending = null; }
}

function validateWarehouseId(warehouseId = '') {
  if (typeof warehouseId !== 'string' || (warehouseId !== '' && !/^[A-Za-z0-9_-]{1,128}$/.test(warehouseId))) throw new PancakeError('Mã kho không hợp lệ.', 400);
  return warehouseId;
}

async function assertWarehouse(warehouseId = '', warehouses = getWarehouses) {
  validateWarehouseId(warehouseId);
  if (warehouseId && !(await warehouses()).some((warehouse) => warehouse.id === warehouseId)) throw new PancakeError('Kho không tồn tại trong shop Pancake.', 400);
  return warehouseId;
}

// V10: nhân viên có phát sinh trong báo cáo kho, không suy đoán theo tên hoặc bộ phận.
function selectWarehouseEmployees(raw, employees, warehouseId) {
  const ids = new Set();
  for (const row of raw) {
    const warehouse = row?.['Order.warehouse_id'];
    const actual = typeof warehouse === 'object' && warehouse !== null ? String(warehouse.id || warehouse.warehouse_id || '') : String(warehouse || '');
    if (actual !== warehouseId) throw new PancakeError('Pancake không trả đúng kho đã chọn.');
    const user = row?.['User.id'];
    const id = typeof user === 'object' && user !== null ? String(user.id || user.user_id || '') : String(user || '');
    if (id) ids.add(id);
  }
  return employees.filter((employee) => ids.has(employee.id));
}

const warehouseEmployeeCache = new Map();
const warehouseEmployeePending = new Map();
async function getWarehouseEmployeesForRange(start, end, warehouseId, now = new Date()) {
  validateRankingRange(start, end, now);
  await assertWarehouse(warehouseId);
  const employees = await getEmployees();
  if (!warehouseId) return employees;
  const key = `${start}:${end}:${warehouseId}`;
  const cached = warehouseEmployeeCache.get(key);
  if (cached && Date.now() < cached.expires) return cached.data;
  if (warehouseEmployeePending.has(key)) return warehouseEmployeePending.get(key);
  const pending = (async () => {
    const raw = await requestPancake('analytics/sale', [
      ['since', new Date(`${start}T00:00:00+07:00`).toISOString()],
      ['until', new Date(Math.min(now.getTime(), new Date(`${end}T23:59:59+07:00`).getTime())).toISOString()],
      ['split_by[]', 'User.id'], ['split_by[]', 'Order.warehouse_id'], ['filter[Order.warehouse_id][]', warehouseId],
      ['select_fields[]', 'price'], ['select_fields[]', 'order_count'], ['user_type', 'marketer'], ['success_status', '1'], ['success_record', 'inserted_at'],
    ]);
    const data = selectWarehouseEmployees(raw, employees, warehouseId);
    if (warehouseEmployeeCache.size >= 128) warehouseEmployeeCache.delete(warehouseEmployeeCache.keys().next().value);
    warehouseEmployeeCache.set(key, { data, expires: Date.now() + 60000 });
    return data;
  })();
  warehouseEmployeePending.set(key, pending);
  try { return await pending; } finally { warehouseEmployeePending.delete(key); }
}

async function getWarehouseEmployees(month, warehouseId, now = new Date()) {
  const { first, end, today } = monthRange(month, now);
  if (first > today) { await assertWarehouse(warehouseId); return warehouseId ? [] : getEmployees(); }
  return getWarehouseEmployeesForRange(first, end, warehouseId, now);
}

function normalizeDailySales(data, employeeId, first, end, warehouseId = '') {
  const result = new Map();
  for (const row of data) {
    const user = row?.['User.id'];
    const id = typeof user === 'object' && user !== null ? String(user.id || user.user_id || '') : String(user || '');
    if (id !== employeeId) continue;
    if (warehouseId) {
      const raw = row['Order.warehouse_id'];
      const actual = typeof raw === 'object' && raw !== null ? String(raw.id || raw.warehouse_id || '') : String(raw || '');
      if (actual !== warehouseId) throw new PancakeError('Pancake không trả dữ liệu đúng kho đã chọn.');
    }
    const date = row['Time.day'];
    const price = row.success?.price;
    const orders = row.success?.order_count;
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < first || date > end || !Number.isFinite(price) || !Number.isSafeInteger(orders) || orders < 0) {
      throw new PancakeError('Pancake trả dòng thống kê không hợp lệ.');
    }
    const prev = result.get(date) || { date, orders: 0, price: 0 };
    prev.orders += orders;
    prev.price += price;
    result.set(date, prev);
  }
  if (data.length && !result.size) throw new PancakeError('Pancake không trả dữ liệu của đúng nhân viên được chọn.');
  // Giống Apps Script đã đối chiếu với Sheet: price là đơn vị 1/100 THB.
  return [...result.values()].sort((a, b) => a.date.localeCompare(b.date)).map(({ date, orders, price }) => ({ date, orders, revenueThb: price / 100 }));
}

async function getDailySales(month, employeeId, now = new Date(), warehouseId = '') {
  const { first, end, today } = monthRange(month, now);
  if (typeof employeeId !== 'string' || employeeId.length < 1 || employeeId.length > 128 || !/^[A-Za-z0-9_-]+$/.test(employeeId)) throw new PancakeError('ID nhân viên không hợp lệ.', 400);
  const employees = await getEmployees();
  if (!employees.some((user) => user.id === employeeId)) throw new PancakeError('Nhân viên không tồn tại trong shop Pancake.', 400);
  await assertWarehouse(warehouseId);
  if (first > today) return [];
  const raw = await requestPancake('analytics/sale', [
    ['since', new Date(`${first}T00:00:00+07:00`).toISOString()],
    ['until', new Date(Math.min(now.getTime(), new Date(`${end}T23:59:59+07:00`).getTime())).toISOString()],
    ['split_by[]', 'Time.day'], ['split_by[]', 'User.id'], ['filter[User.id][]', employeeId],
    ...(warehouseId ? [['split_by[]', 'Order.warehouse_id'], ['filter[Order.warehouse_id][]', warehouseId]] : []),
    ['select_fields[]', 'price'], ['select_fields[]', 'order_count'], ['user_type', 'marketer'],
    ['success_status', '1'], ['success_record', 'inserted_at'],
  ]);
  return normalizeDailySales(raw, employeeId, first, end, warehouseId);
}

function validateRankingRange(start, end, now = new Date()) {
  const valid = (d) => typeof d === 'string' && /^(20\d{2}|2100)-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d;
  if (!valid(start) || !valid(end) || start > end || end > bangkokDate(now) || (Date.parse(end) - Date.parse(start)) / 86400000 >= 366) {
    throw new PancakeError('Chọn khoảng ngày hợp lệ, không quá 366 ngày và không ở tương lai.', 400);
  }
}

function normalizeRanking(raw, employees) {
  const totals = new Map(employees.map(({ id, name }) => [id, { employeeId: id, name, orders: 0, price: 0 }]));
  for (const row of raw) {
    if (!row || !Object.hasOwn(row, 'User.id')) throw new PancakeError('Pancake không trả nhóm nhân viên hợp lệ.');
    const user = row?.['User.id'];
    // Nhóm đơn hàng không có nhân viên phụ trách không được tính cho ai.
    if (user == null || user === '') continue;
    const id = typeof user === 'object' && user !== null ? String(user.id || user.user_id || '') : String(user || '');
    if (!id) throw new PancakeError('Pancake không trả nhóm nhân viên hợp lệ.');
    const total = totals.get(id);
    if (!total) continue;
    const { price, order_count: orders } = row.success || {};
    if (!Number.isFinite(price) || !Number.isSafeInteger(orders) || orders < 0) throw new PancakeError('Pancake trả dòng thống kê không hợp lệ.');
    total.price += price;
    total.orders += orders;
    if (!Number.isFinite(total.price) || !Number.isSafeInteger(total.orders)) throw new PancakeError('Tổng doanh số không hợp lệ.');
  }
  return [...totals.values()].map(({ price, ...row }) => ({ ...row, revenueThb: price / 100 }));
}

async function getRanking(start, end, now = new Date()) {
  validateRankingRange(start, end, now);
  const [employees, raw] = await Promise.all([getEmployees(), requestPancake('analytics/sale', [
    ['since', new Date(`${start}T00:00:00+07:00`).toISOString()],
    ['until', new Date(Math.min(now.getTime(), new Date(`${end}T23:59:59+07:00`).getTime())).toISOString()],
    ['split_by[]', 'User.id'], ['select_fields[]', 'price'], ['select_fields[]', 'order_count'],
    ['user_type', 'marketer'], ['success_status', '1'], ['success_record', 'inserted_at'],
  ])]);
  return normalizeRanking(raw, employees);
}


// V19: thống kê theo kho thực trên đơn hàng, không dùng nhân viên để suy ra kho.
async function getWarehouseReport(start, end, now = new Date()) {
  validateRankingRange(start,end,now);
  const [warehouses, raw] = await Promise.all([getWarehouses(), requestPancake('analytics/sale', [
    ['since', new Date(`${start}T00:00:00+07:00`).toISOString()],
    ['until', new Date(Math.min(now.getTime(), new Date(`${end}T23:59:59+07:00`).getTime())).toISOString()],
    ['split_by[]','Order.warehouse_id'], ['select_fields[]','price'], ['select_fields[]','discount'],
    ['select_fields[]','shipping_fee'], ['select_fields[]','order_count'],
    ['success_status','1'], ['success_record','inserted_at'], ['returned_record','inserted_at'],
  ])]);
  return normalizeWarehouseReport(raw,warehouses);
}


// V19.6: doanh số Sale theo vai trò trên đơn, tách riêng Marketing.
async function getSaleReport(start, end, role = 'assign', warehouseId = '', now = new Date()) {
  validateRankingRange(start, end, now);
  if (!['assign','update','create'].includes(role)) throw new PancakeError('Cách tính Sale không hợp lệ.', 400);
  validateWarehouseId(warehouseId);
  if (warehouseId) await assertWarehouse(warehouseId);
  const params = [
    ['since', new Date(`${start}T00:00:00+07:00`).toISOString()],
    ['until', new Date(Math.min(now.getTime(), new Date(`${end}T23:59:59+07:00`).getTime())).toISOString()],
    ['split_by[]','Time.day'], ['split_by[]','User.id'],
    ...(warehouseId ? [['split_by[]','Order.warehouse_id'], ['filter[Order.warehouse_id][]',warehouseId]] : []),
    ['select_fields[]','price'], ['select_fields[]','order_count'],
    ['user_type',role], ['success_status','1'], ['success_record','inserted_at']
  ];
  const [employees,raw] = await Promise.all([getEmployees(),requestPancake('analytics/sale',params)]);
  return normalizeSaleReport(raw,employees,{start,end,warehouseId});
}

module.exports = { PancakeError, monthRange, normalizeEmployees, normalizeEmployeeRecords, normalizeDailySales, normalizeWarehouses, getEmployees, getWarehouses, validateWarehouseId, assertWarehouse, getDailySales, getWarehouseEmployees, getWarehouseEmployeesForRange, selectWarehouseEmployees, validateRankingRange, normalizeRanking, getRanking, getWarehouseReport, getSaleReport };
