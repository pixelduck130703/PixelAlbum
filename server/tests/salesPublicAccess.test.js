const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

test('sales access is private by default and public only when enabled', async () => {
  const originalFetch = global.fetch;
  process.env.PANCAKE_SHOP_ID = '123';
  process.env.PANCAKE_API_KEY = 'test-key-not-real';
  delete process.env.SALES_PUBLIC_READ;
  global.fetch = async (url, options) => {
    const parsed = new URL(url);
    if (parsed.hostname === 'open.er-api.com') return Response.json({ result: 'success', base_code: 'THB', rates: { VND: 801.25 }, time_last_update_unix: Math.floor(Date.now() / 1000), time_next_update_unix: Math.floor(Date.now() / 1000) + 86400 });
    if (parsed.hostname !== 'pos.pages.fm') return originalFetch(url, options);
    if (parsed.pathname.endsWith('/users')) return new Response(JSON.stringify({ success: true, data: [{ user_id: 'employee-1', user: { name: 'HÙNG BLACK VL' } }] }));
    if (parsed.pathname.endsWith('/warehouses')) return Response.json({ data: [{ id: 'ntc', name: 'NTC', phone: 'private' }] });
    const warehouse = parsed.searchParams.get('filter[Order.warehouse_id][]');
    return Response.json({ success: true, data: [{ 'User.id': 'employee-1', 'Time.day': '2026-01-01', ...(warehouse ? { 'Order.warehouse_id': warehouse } : {}), success: { price: 123400, order_count: 2 } }] });
  };
  const app = express();
  app.use(require('../routes/sales'));
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api/sales`;
  try {
    assert.equal((await fetch(`${base}/employees`)).status, 401);
    assert.equal((await fetch(`${base}/warehouses`)).status, 401);
    assert.equal((await fetch(`${base}/exchange-rate`)).status, 401);
    assert.equal((await fetch(`${base}/daily?month=2026-01&employeeId=employee-1`)).status, 401);
    process.env.SALES_PUBLIC_READ = 'true';
    const users = await fetch(`${base}/employees`);
    assert.equal(users.status, 200);
    assert.equal(users.headers.get('cache-control'), 'no-store');
    assert.deepEqual((await users.json()).employees, [{ id: 'employee-1', name: 'HÙNG BLACK VL' }]);
    assert.deepEqual((await (await fetch(`${base}/warehouses`)).json()).warehouses, [{ id: 'ntc', name: 'NTC' }]);
    const daily = await fetch(`${base}/daily?month=2026-01&employeeId=employee-1`);
    assert.equal(daily.status, 200);
    assert.deepEqual((await daily.json()).rows, [{ date: '2026-01-01', orders: 2, revenueThb: 1234 }]);
    assert.deepEqual((await (await fetch(`${base}/employees?month=2026-01&warehouseId=ntc`)).json()).employees, [{ id: 'employee-1', name: 'HÙNG BLACK VL' }]);
    assert.equal((await fetch(`${base}/employees?month=2026-01&warehouseId=unknown`)).status, 400);
    assert.deepEqual((await (await fetch(`${base}/daily?month=2026-01&employeeId=employee-1&warehouseId=ntc`)).json()).rows, [{ date: '2026-01-01', orders: 2, revenueThb: 1234 }]);
    const exchange = await fetch(`${base}/exchange-rate`);
    assert.equal(exchange.status, 200);
    assert.equal((await exchange.json()).rate, 801.25);
    assert.equal((await fetch(`${base}/daily`, { method: 'POST' })).status, 404);
    process.env.SALES_PUBLIC_READ = 'false';
    assert.equal((await fetch(`${base}/employees`)).status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    global.fetch = originalFetch;
    delete process.env.SALES_PUBLIC_READ;
  }
});
