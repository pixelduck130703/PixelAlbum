import { fetchSaleReport, fetchSaleTargets, saveSaleTargets } from './saleService';
import { todayInBangkok, daysInMonth } from '../sales/models/salesDashboardModel';
import { fetchSalesEmployees } from '../../services/salesService';
import { convertSaleReport, saleEmployeesFromReport, saleRankingWithTargets } from './saleMarketingModel';

function endOfMonth(month) {
  return `${month}-${String(daysInMonth(month)).padStart(2, '0')}`;
}
function periodOf(month) {
  const today = todayInBangkok();
  const start = `${month}-01`;
  const end = endOfMonth(month) < today ? endOfMonth(month) : today;
  return { start, end, future: start > end };
}
async function getSale(start, end, warehouseId, signal) {
  return convertSaleReport(await fetchSaleReport(start, end, 'assign', warehouseId, signal, '1', 'inserted_at'));
}
// Lọc kho đúng như Marketing: kho lọc danh sách người; doanh số cá nhân toàn shop.
export async function fetchSaleMarketingEmployees(warehouseId, month, signal, customStart, customEnd) {
  const period = customStart && customEnd
    ? { start: customStart, end: customEnd, future: false }
    : periodOf(month || todayInBangkok().slice(0, 7));
  if (period.future) return [];
  const active = saleEmployeesFromReport(await getSale(period.start, period.end, warehouseId, signal));
  if (warehouseId) return active;
  // Cùng quyền đặt mục tiêu như Marketing: khi chọn Tất cả kho,
  // người chưa phát sinh tháng này vẫn có thể được nhập mục tiêu.
  // Không dùng danh sách Marketing để tính doanh số Sale.
  try {
    const roster = await fetchSalesEmployees('', month || period.start.slice(0, 7), signal);
    const people = new Map(roster.map((person) => [person.id, person]));
    for (const person of active) people.set(person.id, person);
    return [...people.values()].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  } catch (error) {
    if (signal?.aborted) throw error;
    return active;
  }
}

export async function fetchSaleMarketingRanking(start, end, signal) {
  const converted = await getSale(start, end, '', signal);
  const month = start.slice(0, 7) === end.slice(0, 7) ? start.slice(0, 7) : '';
  let targets = {};
  let targetError = false;
  if (month) {
    try { targets = (await fetchSaleTargets(month, signal)).targets; }
    catch (error) {
      if (signal?.aborted) throw error;
      targetError = true;
    }
  }
  return {
    rows: saleRankingWithTargets(converted, targets, month),
    updatedAt: converted.updatedAt, targetError,
    measureLabel: converted.measureLabel,
  };
}

export async function fetchSaleMarketingDaily(month, employeeId, signal) {
  const period = periodOf(month);
  if (period.future) return { rows: [], updatedAt: null, measureLabel: 'Doanh số' };
  const converted = await getSale(period.start, period.end, '', signal);
  return {
    rows: converted.employeeDaily.filter((row) => row.employeeId === employeeId),
    updatedAt: converted.updatedAt,
    measureLabel: converted.measureLabel,
  };
}

export { fetchSaleTargets as fetchSaleMarketingTargets, saveSaleTargets as saveSaleMarketingTargets } from './saleService';
