const test = require('node:test');
const assert = require('node:assert/strict');
const { monthRange, normalizeEmployees, normalizeEmployeeRecords, normalizeDailySales, getEmployees, getWarehouses, getDailySales, selectWarehouseEmployees, getWarehouseEmployees } = require('../services/pancakeSales');

const employeeId = 'test-employee';
test('Bangkok date boundaries and leap year', () => {
  assert.deepEqual(monthRange('2028-02', new Date('2028-02-28T18:00:00Z')), { first: '2028-02-01', last: '2028-02-29', today: '2028-02-29', end: '2028-02-29' });
  assert.throws(() => monthRange('2026-13'), /Tháng không hợp lệ/);
});

test('employee names, duplicate labels and matching ID', () => {
  const users = normalizeEmployees([{ user_id: 'abc12345', user: { name: ' HÙNG  BLACK VL ' } }, { user: { id: 'def12345', name: 'HÙNG BLACK VL' } }]);
  assert.equal(users.length, 2);
  assert.notEqual(users[0].name, users[1].name);
});

test('units, order_count, duplicate dates and missing vs zero', () => {
  const result = normalizeDailySales([
    { 'User.id': employeeId, 'Time.day': '2026-11-19', success: { price: 1928600, order_count: 23 } },
    { 'User.id': { id: employeeId }, 'Time.day': '2026-11-19', success: { price: 100, order_count: 1 } },
    { 'User.id': { user_id: employeeId }, 'Time.day': '2026-11-21', success: { price: 0, order_count: 0 } },
    { 'User.id': 'other', 'Time.day': '2026-11-19', success: { price: 100000, order_count: 100 } },
  ], employeeId, '2026-11-01', '2026-11-22');
  assert.deepEqual(result, [{ date: '2026-11-19', orders: 24, revenueThb: 19287 }, { date: '2026-11-21', orders: 0, revenueThb: 0 }]);
  assert.throws(() => normalizeDailySales([{ 'User.id': 'wrong' }], employeeId, '2026-11-01', '2026-11-22'));
  assert.throws(() => normalizeDailySales([{ 'User.id': employeeId, 'Time.day': '2026-11-19', success: { price: '123', order_count: 1 } }], employeeId, '2026-11-01', '2026-11-22'));
});

test('mock upstream: exact API contract, no real calls', async () => {
  process.env.PANCAKE_SHOP_ID = '123';
  process.env.PANCAKE_API_KEY = 'TEST_KEY_ONLY';
  const originalFetch = global.fetch;
  let calledAnalytics = false;
  global.fetch = async (url) => {
    const u = new URL(url);
    assert.equal(u.hostname, 'pos.pages.fm');
    assert.equal(u.searchParams.get('api_key'), 'TEST_KEY_ONLY');
    if (u.pathname.endsWith('/users')) return new Response(JSON.stringify({ success: true, data: [{ user_id: employeeId, user: { name: 'Test' }, department: { id: 1, name: 'NTC' } }] }));
    if (u.pathname.endsWith('/warehouses')) return Response.json({ data: [{ id: 'ntc', name: 'NTC', phone: 'private' }] });
    assert.ok(u.pathname.endsWith('/analytics/sale'));
    calledAnalytics = true;
    assert.deepEqual(u.searchParams.getAll('select_fields[]'), ['price', 'order_count']);
    assert.equal(u.searchParams.get('since'), '2026-10-31T17:00:00.000Z');
    assert.equal(u.searchParams.get('until'), '2026-11-22T08:00:00.000Z');
    const warehouse = u.searchParams.get('filter[Order.warehouse_id][]');
    const groups = u.searchParams.getAll('split_by[]');
    const rankingScope = !u.searchParams.has('filter[User.id][]');
    if (!rankingScope) assert.equal(u.searchParams.get('filter[User.id][]'), employeeId);
    assert.deepEqual(groups, rankingScope ? ['User.id', 'Order.warehouse_id'] : ['Time.day', 'User.id', ...(warehouse ? ['Order.warehouse_id'] : [])]);
    assert.ok(!warehouse || warehouse === 'ntc');
    return Response.json({ success: true, data: [{ 'User.id': employeeId, 'Time.day': '2026-11-19', ...(warehouse ? { 'Order.warehouse_id': { id: warehouse } } : {}), success: { price: warehouse ? 100000 : 1928600, order_count: warehouse ? 3 : 23 } }] });
  };
  try {
    assert.deepEqual(await getEmployees(), [{ id: employeeId, name: 'Test' }]);
    assert.deepEqual(await getWarehouses(), [{ id: 'ntc', name: 'NTC' }]);
    assert.deepEqual(await getWarehouseEmployees('2026-11', 'ntc', new Date('2026-11-22T08:00:00Z')), [{ id: employeeId, name: 'Test' }]);
    assert.equal(calledAnalytics, true, 'Nhân viên theo kho được tìm từ báo cáo doanh số');
    assert.deepEqual(await getDailySales('2026-11', employeeId, new Date('2026-11-22T08:00:00Z')), [{ date: '2026-11-19', revenueThb: 19286, orders: 23 }]);
    assert.ok(calledAnalytics);
    await assert.rejects(getWarehouseEmployees('2026-11', 'unknown', new Date('2026-11-22T08:00:00Z')), /Kho không tồn tại/);
    assert.deepEqual(await getDailySales('2026-11', employeeId, new Date('2026-11-22T08:00:00Z'), 'ntc'), [{ date: '2026-11-19', revenueThb: 1000, orders: 3 }]);
    await assert.rejects(getDailySales('2026-11', employeeId, new Date('2026-11-22T08:00:00Z'), 'unknown'), /Kho không tồn tại/);
    assert.deepEqual(await getDailySales('2026-12', employeeId, new Date('2026-11-22T08:00:00Z')), []);
    await assert.rejects(getDailySales('2026-11', 'unknown'), /không tồn tại/);
  } finally { global.fetch = originalFetch; }
});

test('V10 warehouse filter matches activity IDs only, not department or names', () => {
  const employees = normalizeEmployeeRecords([
    { user_id: 'a', user: { name: 'A', email: 'private' }, department: { name: '  VaLLeY ' } },
    { user_id: 'b', user: { name: 'B VALLEY' }, department: { name: 'NTC' } },
    { user_id: 'c', user: { name: 'C' }, sale_group: { name: 'VALLEY' } },
    { user_id: 'd', user: { name: 'D' }, department: { name: 'VALLEY 2' } },
    { user_id: 'e', user: { name: 'E' }, department: { name: 'VALLEY' } },
  ]);
  const raw = [{ 'User.id': 'b', 'Order.warehouse_id': 'valley' }, { 'User.id': { id: 'c' }, 'Order.warehouse_id': { id: 'valley' } }, { 'User.id': 'unknown', 'Order.warehouse_id': 'valley' }];
  assert.deepEqual(selectWarehouseEmployees(raw, employees, 'valley').map(e => e.id), ['b','c']);
  assert.deepEqual(selectWarehouseEmployees([], employees, 'vinny'), []);
  assert.throws(() => selectWarehouseEmployees(raw, employees, 'ntc'), /đúng kho/);
});

test('warehouse-specific analytics rejects wrong or absent warehouse dimension', () => {
  const row = { 'User.id': employeeId, 'Time.day': '2026-11-19', success: { price: 100, order_count: 1 } };
  for (const actual of [undefined, 'vinny', { id: 'vinny' }]) assert.throws(() => normalizeDailySales([{ ...row, 'Order.warehouse_id': actual }], employeeId, '2026-11-01', '2026-11-22', 'ntc'), /đúng kho/);
  assert.deepEqual(normalizeDailySales([{ ...row, 'Order.warehouse_id': 'ntc' }], employeeId, '2026-11-01', '2026-11-22', 'ntc'), [{ date: '2026-11-19', revenueThb: 1, orders: 1 }]);
});
