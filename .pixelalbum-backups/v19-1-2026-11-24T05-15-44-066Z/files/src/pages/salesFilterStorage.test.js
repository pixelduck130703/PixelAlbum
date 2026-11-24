import test from 'node:test';
import assert from 'node:assert/strict';
import { SALES_FILTER_KEYS, readPersonalFilters, readRankingFilters, readTargetFilter, saveSalesFilters, resolveWarehouseChoice } from './salesFilterStorage.js';
import { rankingRange } from './salesRankingModel.js';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
const today = '2026-11-22';

test('first visit uses current month, Valley default, no personal employee and all ranking employees', () => {
  const storage = memoryStorage();
  assert.deepEqual(readPersonalFilters(today, storage), { month: '2026-11', warehouseChoice: null, chosenEmployee: '' });
  assert.deepEqual(readRankingFilters(today, storage), { warehouseChoice: null, selected: null, period: 'today', customStart: today, customEnd: today });
});

test('personal, ranking and target preferences persist independently across reload', () => {
  const storage = memoryStorage();
  const personal = { month: '2026-10', warehouseChoice: '', chosenEmployee: 'employee-1' };
  const ranking = { warehouseChoice: 'valley-1', selected: ['employee-2', 'employee-3'], period: 'custom', customStart: '2026-10-05', customEnd: '2026-11-02' };
  saveSalesFilters(SALES_FILTER_KEYS.personal, personal, storage);
  saveSalesFilters(SALES_FILTER_KEYS.ranking, ranking, storage);
  saveSalesFilters(SALES_FILTER_KEYS.targets, { query: 'Hùng' }, storage);
  assert.deepEqual(readPersonalFilters('2026-12-01', storage), personal);
  assert.deepEqual(readRankingFilters('2026-12-01', storage), ranking);
  assert.equal(readTargetFilter(storage), 'Hùng');
});

test('explicit empty selection is restored and relative presets follow the new date', () => {
  const storage = memoryStorage();
  saveSalesFilters(SALES_FILTER_KEYS.ranking, { selected: [], period: 'thisMonth', customStart: today, customEnd: today }, storage);
  const restored = readRankingFilters('2026-12-02', storage);
  assert.deepEqual(restored.selected, []);
  assert.deepEqual(rankingRange(restored.period, '2026-12-02', restored.customStart, restored.customEnd), ['2026-12-01', '2026-12-02']);
  saveSalesFilters(SALES_FILTER_KEYS.ranking, { selected: null }, storage);
  assert.equal(readRankingFilters(today, storage).selected, null);
});

test('bad JSON, invalid fields and blocked localStorage do not break dashboard', () => {
  const storage = memoryStorage();
  storage.setItem(SALES_FILTER_KEYS.personal, 'not JSON');
  assert.equal(readPersonalFilters(today, storage).month, '2026-11');
  saveSalesFilters(SALES_FILTER_KEYS.ranking, { selected: ['x', 'x', 1, '<script>'], period: 'bad', customStart: '2026-02-30', customEnd: '2027-01-01', warehouseChoice: [] }, storage);
  assert.deepEqual(readRankingFilters(today, storage), { warehouseChoice: null, selected: ['x'], period: 'today', customStart: today, customEnd: today });
  const blocked = { getItem() { throw Error('denied'); }, setItem() { throw Error('denied'); } };
  assert.doesNotThrow(() => saveSalesFilters(SALES_FILTER_KEYS.ranking, {}, blocked));
  assert.equal(readRankingFilters(today, blocked).period, 'today');
});

test('warehouse choices preserve all and wait for available warehouse IDs; removed IDs fall back to Valley', () => {
  const warehouses = [{ id: '', name: 'Tất cả các kho' }, { id: 'v', name: 'VALLEY' }, { id: 'n', name: 'NTC' }];
  assert.equal(resolveWarehouseChoice('n', warehouses), 'n');
  assert.equal(resolveWarehouseChoice('', warehouses), '');
  assert.equal(resolveWarehouseChoice(null, warehouses), 'v');
  assert.equal(resolveWarehouseChoice('missing', warehouses), 'v');
  assert.equal(resolveWarehouseChoice('n', []), null);
});
