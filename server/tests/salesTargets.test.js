const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const verifyAdminToken = require('../middleware/auth');
const { createSalesTargetsRouter } = require('../routes/salesTargets');
const { createSalesTargetStore, validateChanges, validateMonth, initializeSalesTargets } = require('../services/salesTargets');

test('database schema and queries scope targets by shop, month and employee', async () => {
  const calls = [];
  const pool = { query: async (sql, values) => { calls.push({ sql, values }); return { rows: [{ employee_id: 'person-a', target_vnd: '500000000' }] }; } };
  await initializeSalesTargets(pool);
  assert.match(calls[0].sql, /PRIMARY KEY \(shop_id, target_month, employee_id\)/);
  const store = createSalesTargetStore(pool, () => '123');
  assert.deepEqual(await store.list('2026-11'), [{ employeeId: 'person-a', targetVnd: 500000000 }]);
  assert.deepEqual(calls[1].values, ['123', '2026-11-01']);
  await store.save('2026-12', [{ employeeId: 'person-a', targetVnd: 750000000 }, { employeeId: 'person-b', targetVnd: 0 }]);
  assert.deepEqual(calls[2].values, ['123', '2026-12-01', ['person-a', 'person-b'], [750000000, 0]]);
  assert.match(calls[2].sql, /ON CONFLICT \(shop_id, target_month, employee_id\)/);
  assert.throws(() => validateMonth('2026-13'));
  for (const amount of [-1, 1.5, '500', Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => validateChanges([{ employeeId: 'person-a', targetVnd: amount }]));
  assert.throws(() => validateChanges([{ employeeId: 'person-a', targetVnd: 1 }, { employeeId: 'person-a', targetVnd: 2 }]));
});

test('two clients see saved monthly targets; anonymous or non-admin writes are rejected', async () => {
  process.env.JWT_SECRET = 'test-only-secret-not-production';
  let publicRead = true;
  const months = new Map();
  const store = {
    list: async (month) => [...(months.get(month) || new Map())].map(([employeeId, targetVnd]) => ({ employeeId, targetVnd })),
    save: async (month, rows) => { const values = months.get(month) || new Map(); rows.forEach((row) => values.set(row.employeeId, row.targetVnd)); months.set(month, values); },
  };
  const app = express();
  app.use(express.json());
  app.use(createSalesTargetsRouter((req, res, next) => publicRead ? next() : verifyAdminToken(req, res, next), store, async () => [{ id: 'person-a' }, { id: 'person-b' }]));
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api/sales/targets`;
  const admin = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET);
  const viewer = jwt.sign({ role: 'viewer' }, process.env.JWT_SECRET);
  const read = (month, token) => fetch(`${base}?month=${month}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const save = (month, changes, token) => fetch(base, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ month, changes }) });
  const a = { employeeId: 'person-a', targetVnd: 500000000 };
  try {
    assert.equal((await save('2026-11', [a])).status, 401);
    assert.equal((await save('2026-11', [a], viewer)).status, 403);
    assert.equal((await save('2026-11', [{ employeeId: 'unknown', targetVnd: 500 }], admin)).status, 400);
    assert.equal((await save('2026-11', [a], admin)).status, 200);
    assert.deepEqual(await (await read('2026-11')).json(), { success: true, month: '2026-11', canEdit: false, targets: [a] });
    assert.equal((await (await read('2026-11', admin)).json()).canEdit, true);
    assert.deepEqual((await (await read('2026-12')).json()).targets, []);
    assert.equal((await save('2026-12', [{ ...a, targetVnd: 0 }], admin)).status, 200);
    assert.equal((await save('2026-11', [{ employeeId: 'person-b', targetVnd: 200 }], admin)).status, 200);
    assert.equal((await (await read('2026-11')).json()).targets.length, 2);
    assert.deepEqual((await (await read('2026-12')).json()).targets, [{ ...a, targetVnd: 0 }]);
    publicRead = false;
    assert.equal((await read('2026-11')).status, 401);
    assert.equal((await read('2026-11', admin)).status, 200);
  } finally { await new Promise((resolve) => server.close(resolve)); delete process.env.JWT_SECRET; }
});
