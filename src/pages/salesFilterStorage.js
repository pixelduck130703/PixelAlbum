import { PERIODS, rankingRangeError } from './salesRankingModel.js';

// Tách khỏi mục tiêu V5 và token quản trị. Chỉ lưu tùy chọn giao diện.
export const SALES_FILTER_KEYS = {
  personal: 'pixelalbum-sales-personal-filters-v1',
  ranking: 'pixelalbum-sales-ranking-filters-v1',
  targets: 'pixelalbum-sales-target-filters-v1',
};

const validId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const warehouseChoice = (value) => value === '' || validId(value) ? value : null;
const validMonth = (value) => typeof value === 'string' && /^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(value);
const validDate = (value, today) => typeof value === 'string' && !rankingRangeError(value, value, today);

function read(key, storage) {
  try {
    const value = JSON.parse((storage ?? globalThis.localStorage).getItem(key));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}

export function saveSalesFilters(key, filters, storage) {
  try { (storage ?? globalThis.localStorage).setItem(key, JSON.stringify(filters)); }
  catch { /* Trình duyệt từ chối storage: dashboard vẫn hoạt động. */ }
}

export function readPersonalFilters(today, storage) {
  const value = read(SALES_FILTER_KEYS.personal, storage);
  return {
    month: validMonth(value.month) ? value.month : today.slice(0, 7),
    warehouseChoice: warehouseChoice(value.warehouseChoice),
    chosenEmployee: validId(value.chosenEmployee) ? value.chosenEmployee : '',
  };
}

export function readRankingFilters(today, storage) {
  const value = read(SALES_FILTER_KEYS.ranking, storage);
  return {
    warehouseChoice: warehouseChoice(value.warehouseChoice),
    // null = chọn tất cả, [] = bỏ chọn tất cả; không được nhầm hai trạng thái.
    selected: Array.isArray(value.selected) ? [...new Set(value.selected.filter(validId))] : null,
    period: PERIODS.some(([period]) => period === value.period) ? value.period : 'today',
    customStart: validDate(value.customStart, today) ? value.customStart : today,
    customEnd: validDate(value.customEnd, today) ? value.customEnd : today,
  };
}

export function readTargetFilter(storage) {
  const value = read(SALES_FILTER_KEYS.targets, storage);
  return typeof value.query === 'string' ? value.query : '';
}

export function resolveWarehouseChoice(choice, warehouses) {
  if (choice === '') return '';
  if (choice !== null && warehouses.some((warehouse) => warehouse.id === choice)) return choice;
  return warehouses.find((warehouse) => warehouse.name.trim().toUpperCase() === 'VALLEY')?.id ?? null;
}
