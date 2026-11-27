import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSalesChartGuides } from '../models/salesChartGuides.js';

test('average includes elapsed zero-revenue calendar days but excludes future planned days', () => {
  const rows = [
    { date: '2026-11-01', recorded: true, revenueThb: 600 },
    { date: '2026-11-02', recorded: false, revenueThb: null },
    { date: '2026-11-03', recorded: true, revenueThb: 300, temporaryForecast: true },
    { date: '2026-11-04', recorded: false, revenueThb: null },
  ];
  const result = calculateSalesChartGuides(rows, '2026-11-02', 1_500_000, 750);
  assert.equal(result.averageThb, 300);
  assert.equal(result.neededThb, 550); // (2000 - (600 + 300)) / 2 remaining days
  assert.equal(result.elapsedDays, 2);
});

test('no target does not draw needed line, previous month has no remaining days', () => {
  const rows = [{ date: '2026-10-31', recorded: true, revenueThb: 120 }];
  assert.equal(calculateSalesChartGuides(rows, '2026-11-27', null, 750).neededThb, null);
  assert.equal(calculateSalesChartGuides(rows, '2026-11-27', 1_000_000, 750).neededThb, null);
  assert.equal(calculateSalesChartGuides(rows, '2026-11-27', 1_000_000, 750).averageThb, 120);
});

test('no elapsed data yields no average line', () => {
  const rows = [{ date: '2026-12-01', recorded: true, revenueThb: 1000, temporaryForecast: true }];
  const r = calculateSalesChartGuides(rows, '2026-11-27', 0, 750);
  assert.equal(r.averageThb, null);
  assert.equal(r.neededThb, null);
});
