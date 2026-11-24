// V19 - Thống kê theo kho từ Pancake analytics/sale.
// Tách phép tính khỏi network để có thể kiểm thử với dữ liệu mẫu.
function validNumber(value) { return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1e14; }
function money(value) { return validNumber(value) ? value : null; }
function warehouseKey(value) {
  if (value == null || value === '') return '__unassigned__';
  if (typeof value === 'object') value = value.id ?? value.warehouse_id;
  return typeof value === 'string' && value ? value : '__unassigned__';
}
function fail(message) { const error = new Error(message); error.name = 'WarehouseReportError'; error.status = 502; throw error; }

function normalizeWarehouseReport(raw, warehouses) {
  if (!Array.isArray(raw) || !Array.isArray(warehouses)) fail('Dữ liệu báo cáo kho không hợp lệ.');
  const totals = new Map();
  for (const wh of warehouses) {
    if (!wh?.id || !wh?.name) continue;
    totals.set(wh.id, { warehouseId: wh.id, name: wh.name, orders: 0, returnedOrders: 0, returnedKnown: true,
      priceCents: 0, discountCents: 0, shippingCents: 0, returnShippingCents: 0, returnShippingKnown: true, financialKnown: true });
  }
  for (const item of raw) {
    if (!item || !Object.prototype.hasOwnProperty.call(item, 'Order.warehouse_id')) fail('Pancake không nhóm dữ liệu theo kho như yêu cầu.');
    const id = warehouseKey(item['Order.warehouse_id']);
    if (!totals.has(id)) totals.set(id, { warehouseId: id, name: id === '__unassigned__' ? 'Kho chưa xác định' : `Kho không còn trong danh sách (${id.slice(-8)})`,
      orders: 0, returnedOrders: 0, returnedKnown: true, priceCents: 0, discountCents: 0, shippingCents: 0, returnShippingCents: 0, returnShippingKnown: true, financialKnown: true });
    const sum = totals.get(id);
    const success = item.success;
    if (success !== null && success !== undefined) {
      if (typeof success !== 'object' || !Number.isSafeInteger(success.order_count) || success.order_count < 0 || !validNumber(success.price)) fail('Pancake trả thiếu đơn chốt hoặc tiền hàng của kho.');
      sum.orders += success.order_count;
      sum.priceCents += success.price;
      if (!validNumber(success.shipping_fee) || !validNumber(success.discount)) sum.financialKnown = false;
      else { sum.shippingCents += success.shipping_fee; sum.discountCents += success.discount; }
    }
    if (!Object.prototype.hasOwnProperty.call(item, 'returned')) sum.returnedKnown = false;
    else if (item.returned !== null) {
      if (typeof item.returned !== 'object' || !Number.isSafeInteger(item.returned.order_count) || item.returned.order_count < 0) sum.returnedKnown = false;
      else sum.returnedOrders += item.returned.order_count;
    }
    // Không suy đoán phí trả hàng. API có shop không trả trường này.
    const rawReturnFee = success?.return_shipping_fee ?? item.returned?.return_shipping_fee;
    if (rawReturnFee !== undefined && rawReturnFee !== null) {
      if (!validNumber(rawReturnFee)) sum.returnShippingKnown = false;
      else sum.returnShippingCents += rawReturnFee;
    } else if (!Object.prototype.hasOwnProperty.call(item, 'returned') || item.returned?.order_count > 0) sum.returnShippingKnown = false;
    if (!Number.isSafeInteger(sum.orders) || !validNumber(sum.priceCents)) fail('Tổng đơn hoặc doanh số vượt phạm vi hợp lệ.');
  }
  const rows = [...totals.values()].map((r) => {
    const priceThb = r.priceCents / 100;
    const shippingFeeThb = r.financialKnown ? r.shippingCents / 100 : null;
    const discountThb = r.financialKnown ? r.discountCents / 100 : null;
    const returnedShippingFeeThb = r.returnShippingKnown ? r.returnShippingCents / 100 : null;
    // Công thức đối chiếu ảnh Pancake: Doanh số = Tiền hàng + phí VC thu khách;
    // Doanh thu = Doanh số - Chiết khấu - phí trả hàng (nếu có dữ liệu).
    // Nếu phí trả hàng không được API trả, tính doanh thu TRƯỚC phí trả hàng và đánh dấu chưa đối soát.
    const salesThb = r.financialKnown ? priceThb + shippingFeeThb : null;
    const revenueThb = r.financialKnown ? salesThb - discountThb - (returnedShippingFeeThb ?? 0) : null;
    return { warehouseId: r.warehouseId, name: r.name, orders: r.orders,
      returnedOrders: r.returnedKnown ? r.returnedOrders : null,
      priceThb, shippingFeeThb, discountThb, returnedShippingFeeThb, salesThb, revenueThb,
      revenueEstimated: r.financialKnown && !r.returnShippingKnown && r.orders > 0 };
  });
  const fields = ['orders', 'returnedOrders', 'priceThb', 'shippingFeeThb', 'discountThb', 'returnedShippingFeeThb', 'salesThb', 'revenueThb'];
  const summary = Object.fromEntries(fields.map((field) => [field, rows.every((r) => r[field] !== null) ? rows.reduce((a, r) => a + r[field], 0) : null]));
  summary.revenueEstimated = rows.some((r) => r.revenueEstimated);
  return { rows, totals: summary, incomplete: rows.some((r) => r.orders > 0 && (r.revenueEstimated || r.salesThb === null)) };
}
module.exports = { normalizeWarehouseReport, warehouseKey, money };
