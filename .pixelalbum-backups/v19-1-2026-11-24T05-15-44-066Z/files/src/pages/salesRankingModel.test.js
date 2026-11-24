import test from 'node:test';
import assert from 'node:assert/strict';
import { rankingRange, rankingRangeError, filterRanking, rankingShowsCompletion, PERIODS } from './salesRankingModel.js';

test('periods honor Monday through Sunday, month and year boundaries', () => {
  const today = '2026-11-22';
  assert.deepEqual(rankingRange('today', today), [today, today]);
  assert.deepEqual(rankingRange('yesterday', today), ['2026-11-21', '2026-11-21']);
  assert.deepEqual(rankingRange('thisWeek', today), ['2026-11-16', today]);
  assert.deepEqual(rankingRange('lastWeek', today), ['2026-11-09', '2026-11-15']);
  assert.deepEqual(rankingRange('thisMonth', today), ['2026-11-01', today]);
  assert.deepEqual(rankingRange('lastMonth', '2027-01-01'), ['2026-12-01', '2026-12-31']);
  assert.deepEqual(rankingRange('lastMonth', '2024-03-01'), ['2024-02-01', '2024-02-29']);
  assert.deepEqual(rankingRange('custom', today, '2026-09-01', '2026-11-01'), ['2026-09-01', '2026-11-01']);
});
test('custom dates cannot be reversed, future, invalid or >366 days', () => {
  const today = '2026-11-22';
  for (const [a,b] of [['2026-02-30',today], ['2026-11-22','2026-11-21'], ['2026-11-22','2026-11-23'], ['2024-01-01',today], ['',today]]) assert.ok(rankingRangeError(a,b,today));
  assert.equal(rankingRangeError('2026-11-01',today,today),'');
});
test('only selected IDs in selected warehouse appear; sort descending', () => {
  const rows = [{employeeId:'a',name:'A',revenueThb:10},{employeeId:'b',name:'B',revenueThb:20},{employeeId:'c',name:'C',revenueThb:100}];
  const people = [{id:'a'},{id:'b'}];
  assert.deepEqual(filterRanking(rows,people,null).map(r=>r.employeeId),['b','a']);
  assert.deepEqual(filterRanking(rows,people,['a','c']).map(r=>r.employeeId),['a']);
  assert.deepEqual(filterRanking(rows,people,[]),[]);
});
test('completion column only shown for the two monthly presets', () => {
  assert.deepEqual(PERIODS.filter(([p]) => rankingShowsCompletion(p)).map(([p])=>p), ['thisMonth','lastMonth']);
});
