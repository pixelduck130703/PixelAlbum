import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_EMPLOYEE_ID, employeeTargetKey, getEmployeeTarget, parseTargetVnd, parseTargetDraft, buildRows, calculateSummary, groupWeeklyRows, weeklyTotals, formatChartRevenue } from '../models/salesDashboardModel.js';

test('targets are independent by employee and month, preserving legacy Hung targets', () => {
  const targets = { 'hung:2026-11': 400_000_000, [employeeTargetKey('employee-b', '2026-11')]: 300_000_000, [employeeTargetKey('employee-b', '2026-12')]: 0 };
  assert.equal(getEmployeeTarget(targets, DEFAULT_EMPLOYEE_ID, '2026-11'), 400_000_000);
  assert.equal(getEmployeeTarget(targets, 'employee-b', '2026-11'), 300_000_000);
  assert.equal(getEmployeeTarget(targets, 'employee-b', '2026-12'), 0);
  assert.equal(getEmployeeTarget(targets, 'employee-c', '2026-11'), null);
  assert.equal(getEmployeeTarget({}, DEFAULT_EMPLOYEE_ID, '2026-12'), null);
  assert.equal(getEmployeeTarget({ ...targets, [employeeTargetKey(DEFAULT_EMPLOYEE_ID, '2026-11')]: 600_000_000 }, DEFAULT_EMPLOYEE_ID, '2026-11'), 600_000_000);
});

test('target input accepts whole nonnegative VND with Vietnamese thousands separators', () => {
  assert.equal(parseTargetVnd('500.000.000'), 500_000_000);
  assert.equal(parseTargetVnd(' 750000000 '), 750_000_000);
  assert.equal(parseTargetVnd('0'), 0);
  for (const input of ['', '-1', '12.5', 'abc', '1e6', '9007199254740992', '1.00.000']) assert.equal(parseTargetVnd(input), null);
  assert.equal(parseTargetDraft(''), 0);
  assert.equal(parseTargetDraft('0'), 0);
  assert.equal(parseTargetDraft('300.000.000'), 300_000_000);
  assert.equal(parseTargetDraft('-1'), null);
});

test('changing a goal updates progress at fixed 780 without altering revenue', () => {
  const rows = buildRows('2026-11', [{ date: '2026-11-01', orders: 1, revenueThb: 100_000 }]);
  const first = calculateSummary(rows, 500_000_000, 780, '2026-11-22');
  const second = calculateSummary(rows, 300_000_000, 780, '2026-11-22');
  assert.equal(first.revenueVnd, 78_000_000);
  assert.equal(second.revenueVnd, first.revenueVnd);
  assert.equal(first.ratio, 0.156);
  assert.equal(second.ratio, 0.26);
  assert.equal(calculateSummary(rows, 0, 780, '2026-11-22').ratio, null);
  assert.equal(calculateSummary(rows, 0, 780, '2026-11-22').remainingVnd, null);
  const unknown = calculateSummary(rows, null, 780, '2026-11-22');
  assert.equal(unknown.revenueVnd, 78_000_000);
  assert.equal(unknown.targetThb, null);
  assert.equal(unknown.remainingVnd, null);
  assert.equal(unknown.ratio, null);
});

test('weeks are grouped Monday–Sunday with partial months and no duplicate revenue', () => {
  const rows = buildRows('2026-11', [
    { date: '2026-11-01', orders: 1, revenueThb: 100 },
    { date: '2026-11-02', orders: 2, revenueThb: 200 },
    { date: '2026-11-08', orders: 3, revenueThb: 300 },
    { date: '2026-11-16', orders: 0, revenueThb: 0 },
    { date: '2026-11-30', orders: 1, revenueThb: 400 },
  ]);
  const weeks = groupWeeklyRows(rows, 780);
  assert.deepEqual(weeks.map((week) => week.rows.length), [1, 7, 7, 7, 7, 1]);
  assert.deepEqual(weeks.map((week) => [week.startDate, week.endDate, week.totalVnd]), [
    ['2026-11-01', '2026-11-01', 78000],
    ['2026-11-02', '2026-11-08', 390000],
    ['2026-11-09', '2026-11-15', null],
    ['2026-11-16', '2026-11-22', 0],
    ['2026-11-23', '2026-11-29', null],
    ['2026-11-30', '2026-11-30', 312000],
  ]);
  assert.equal(weeks.flatMap((week) => week.rows).length, 30);
  assert.equal(weeks.reduce((sum, week) => sum + (week.totalVnd ?? 0), 0), calculateSummary(rows, null, 780, '2026-11-30').revenueVnd);
  assert.equal(weeklyTotals(rows, 780).get('2026-11-08'), 390000);
  assert.deepEqual(groupWeeklyRows(buildRows('2027-02', []), 780).map((week) => week.rows.length), [7, 7, 7, 7]);
});

test('chart labels use compact Vietnamese formatting, including zero and missing data', () => {
  assert.equal(formatChartRevenue(13600), '13,6K');
  assert.equal(formatChartRevenue(1000), '1K');
  assert.equal(formatChartRevenue(1250000), '1,3M');
  assert.equal(formatChartRevenue(825), '825');
  assert.equal(formatChartRevenue(0), '0');
  assert.equal(formatChartRevenue(-13600), '-13,6K');
  assert.equal(formatChartRevenue(null), '');
});
