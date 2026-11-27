import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTemporaryRevenue, applyTemporaryRevenue, readTemporaryRevenue, writeTemporaryRevenue } from '../utils/salesTemporaryRevenue.js';
const rows = [
  { date: '2026-11-26', revenueThb: 120, recorded: true, orders: 1 },
  { date: '2026-11-27', revenueThb: null, recorded: false, orders: null },
  { date: '2026-11-28', revenueThb: null, recorded: false, orders: null },
];
test('temporary mode accepts past, today and future days with 0 and valid thousand separators', () => {
  const drafts = {'2026-11-26':'0','2026-11-27':'1.200','2026-11-28':'2500'};
  const { entries, invalidDates } = normalizeTemporaryRevenue(drafts, rows);
  assert.deepEqual(entries, {'2026-11-26':0, '2026-11-27':1200, '2026-11-28':2500});
  assert.deepEqual(invalidDates, []);
  const adjusted = applyTemporaryRevenue(rows, entries, '2026-11-27');
  assert.equal(adjusted[2].recorded, true);
  assert.equal(adjusted[2].temporaryForecast, true);
  assert.equal(adjusted[1].temporaryForecast, false);
  assert.equal(adjusted.reduce((sum, r) => sum + r.revenueThb, 0), 3700);
  assert.equal(adjusted[2].orders, null);
});
test('blank future day removes override, invalid input blocks saving', () => {
  assert.deepEqual(normalizeTemporaryRevenue({'2026-11-28':''}, rows).entries, {});
  const result = normalizeTemporaryRevenue({'2026-11-28':'-500','2026-12-01':'500'}, rows);
  assert.deepEqual(result.invalidDates, ['2026-11-28']);
  assert.deepEqual(result.entries, {});
});
test('future temporary revenue persists per month and employee without touching backend', () => {
  const memory = new Map();
  const storage = { setItem: (k,v) => memory.set(k,v), getItem: (k) => memory.get(k), removeItem: (k) => memory.delete(k) };
  writeTemporaryRevenue('employee', '2026-11', {'2026-11-28':100}, storage);
  assert.deepEqual(readTemporaryRevenue('employee', '2026-11', storage), {'2026-11-28':100});
  writeTemporaryRevenue('employee', '2026-11', {}, storage);
  assert.deepEqual(readTemporaryRevenue('employee', '2026-11', storage), {});
});

test('future plan updates monthly total and weekly amount, without changing order count', async () => {
  const { calculateSummary, groupWeeklyRows } = await import('../models/salesDashboardModel.js');
  const completeRows = [
    { date:'2026-11-26', weekday:4, recorded:true, revenueThb:120, orders:1 },
    { date:'2026-11-27', weekday:5, recorded:false, revenueThb:null, orders:null },
    { date:'2026-11-28', weekday:6, recorded:false, revenueThb:null, orders:null },
  ];
  const adjusted = applyTemporaryRevenue(completeRows, {'2026-11-28':200}, '2026-11-27');
  const summary = calculateSummary(adjusted, 750_000, 750, '2026-11-27');
  assert.equal(summary.revenueThb, 320);
  assert.equal(summary.orders, 1);
  assert.equal(groupWeeklyRows(adjusted, 750)[0].totalVnd, 240_000);
});
