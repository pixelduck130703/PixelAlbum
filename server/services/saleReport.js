'use strict';
// Pancake analytics/sale trả tiền ở đơn vị 1/100 THB. Các số liệu bổ sung
// chỉ được hiển thị khi API thực sự trả về; thiếu trường -> null, không giả lập 0.
const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
function reportError(message) {
  const error = new Error(message);
  error.name = 'SaleReportError'; error.status = 502;
  throw error;
}
function groupId(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'object') return String(value.id ?? value.user_id ?? '');
  return String(value);
}
const EXTRA = [
  ['productCount', 'product_count', 1],
  ['discountThb', 'discount', 100],
  ['shippingFeeThb', 'shipping_fee', 100],
  // Các field sau KHÔNG yêu cầu trong V19.7: để null nếu API chưa trả.
  ['returnShippingFeeThb', 'return_shipping_fee', 100],
  ['costThb', 'cost', 100],
];
function isValidMetric(value, divisor) {
  if (value === null || typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 1e14) return false;
  return divisor !== 1 || (Number.isSafeInteger(value) && value >= 0);
}
function makeEmployee(id, name) {
  return { employeeId: id, name, orders: 0, priceCents: 0,
    productCount: 0, discountThb: 0, shippingFeeThb: 0,
    returnShippingFeeThb: 0, costThb: 0, avgTotal: 0,
    metricMissing: { productCount: false, discountThb: false, shippingFeeThb: false,
      returnShippingFeeThb: false, costThb: false }, avgMissing: false };
}
function accumulate(person, success) {
  person.orders += success.order_count;
  person.priceCents += success.price;
  for (const [key, rawKey, divisor] of EXTRA) {
    const value = success[rawKey];
    if (!isValidMetric(value, divisor)) person.metricMissing[key] = true;
    else person[key] += value / divisor;
  }
  if (isValidMetric(success.avg_price, 100)) person.avgTotal += success.avg_price * success.order_count;
  else person.avgMissing = true;
}
function prepare(person) {
  const { employeeId, name, orders, priceCents, metricMissing, avgMissing, avgTotal } = person;
  const shippingFeeThb = metricMissing.shippingFeeThb ? null : person.shippingFeeThb;
  return {
    employeeId, name, orders, revenueThb: priceCents / 100,
    // revenueThb là trường PRICE (= Tiền hàng), giữ tên cũ để tương thích V19.7.
    // Doanh số = tiền hàng + phí vận chuyển thu khách (khi đủ dữ liệu).
    salesThb: shippingFeeThb === null ? null : priceCents / 100 + shippingFeeThb,
    productCount: metricMissing.productCount ? null : person.productCount,
    discountThb: metricMissing.discountThb ? null : person.discountThb,
    shippingFeeThb,
    returnShippingFeeThb: metricMissing.returnShippingFeeThb ? null : person.returnShippingFeeThb,
    costThb: metricMissing.costThb ? null : person.costThb,
    avgPriceThb: avgMissing || !orders ? null : avgTotal / orders / 100,
  };
}
function normalizeSaleReport(raw, employees, { start, end, warehouseId = '' }) {
  if (!Array.isArray(raw) || !Array.isArray(employees)) reportError('Báo cáo Sale không hợp lệ.');
  const people = new Map(employees.map(({ id, name }) => [String(id), makeEmployee(String(id), name)]));
  const days = new Map();
  let unassigned = false;
  for (const item of raw) {
    if (!item || !has(item, 'User.id') || !has(item, 'Time.day')) reportError('Pancake không trả nhóm nhân viên và ngày.');
    if (warehouseId) {
      if (!has(item, 'Order.warehouse_id')) reportError('Pancake không trả nhóm kho theo yêu cầu.');
      const warehouse = item['Order.warehouse_id'];
      const actual = warehouse && typeof warehouse === 'object' ? String(warehouse.id ?? warehouse.warehouse_id ?? '') : String(warehouse ?? '');
      if (actual !== warehouseId) reportError('Pancake trả dữ liệu ngoài kho đang chọn.');
    }
    const day = item['Time.day'];
    if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day) || day < start || day > end ||
      !Number.isFinite(Date.parse(`${day}T00:00:00Z`)) || new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day) {
      reportError('Pancake trả ngày báo cáo không hợp lệ.');
    }
    const success = item.success;
    if (success == null) continue;
    if (typeof success !== 'object' || !Number.isSafeInteger(success.order_count) || success.order_count < 0 ||
      typeof success.price !== 'number' || !Number.isFinite(success.price) || Math.abs(success.price) > 1e14) {
      reportError('Pancake trả số đơn hoặc doanh số không hợp lệ.');
    }
    const id = groupId(item['User.id']) || '__unassigned__';
    if (id === '__unassigned__') unassigned = true;
    if (!people.has(id)) people.set(id, makeEmployee(id, id === '__unassigned__' ? 'Chưa phân công' : `Nhân viên ngoài danh sách (${id.slice(-8)})`));
    const person = people.get(id);
    accumulate(person, success);
    const daily = days.get(day) ?? { date: day, orders: 0, priceCents: 0, shippingCents: 0, shippingComplete: true };
    daily.orders += success.order_count; daily.priceCents += success.price;
    if (isValidMetric(success.shipping_fee, 100)) daily.shippingCents += success.shipping_fee;
    else daily.shippingComplete = false;
    days.set(day, daily);
    if (!Number.isSafeInteger(person.orders) || !Number.isSafeInteger(daily.orders) ||
      !Number.isFinite(person.priceCents) || Math.abs(person.priceCents) > 1e14 ||
      !Number.isFinite(daily.priceCents) || Math.abs(daily.priceCents) > 1e14) reportError('Doanh số Sale vượt phạm vi xử lý an toàn.');
  }
  const rows = [...people.values()].filter(person => person.orders !== 0 || person.priceCents !== 0)
    .map(prepare).sort((a, b) => b.revenueThb - a.revenueThb || a.name.localeCompare(b.name, 'vi'));
  const daily = [...days.values()].map(({ priceCents, shippingCents, shippingComplete, ...rest }) => ({
    ...rest, revenueThb: priceCents / 100,
    salesThb: shippingComplete ? (priceCents + shippingCents) / 100 : null,
  }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const totals = {
    employees: rows.filter(person => person.employeeId !== '__unassigned__').length,
    orders: rows.reduce((sum, person) => sum + person.orders, 0),
    revenueThb: rows.reduce((sum, person) => sum + person.revenueThb, 0),
    unassigned,
    salesThb: rows.every(row => row.salesThb !== null) ? rows.reduce((sum, row) => sum + row.salesThb, 0) : null,
  };
  return { rows, daily, totals };
}
module.exports = { normalizeSaleReport, groupId };
