import api from '../../services/api';
const finite = value => typeof value === 'number' && Number.isFinite(value);
const optionalNumber = value => value === undefined || value === null || finite(value);
function validLine(row, needsEmployee = false) {
  return row && typeof row === 'object' && (!needsEmployee || (typeof row.employeeId === 'string' && typeof row.name === 'string')) &&
    Number.isSafeInteger(row.orders) && row.orders >= 0 && finite(row.revenueThb) &&
    ['productCount', 'discountThb', 'shippingFeeThb', 'returnShippingFeeThb', 'costThb', 'avgPriceThb', 'salesThb'].every(key => optionalNumber(row[key]));
}
export async function fetchSaleReport(start, end, role, warehouseId, signal, successStatus = '1', successRecord = 'inserted_at') {
  const { data } = await api.get('/sales/sale-report', { params: { start, end, role, warehouseId, successStatus, successRecord }, signal, timeout: 65000 });
  if (data?.success !== true || data.start !== start || data.end !== end || data.role !== role || data.warehouseId !== warehouseId ||
      data.successStatus !== successStatus || data.successRecord !== successRecord ||
      !Array.isArray(data.rows) || !Array.isArray(data.daily) || (data.employeeDaily !== undefined && !Array.isArray(data.employeeDaily)) || data.rows.some(row => !validLine(row, true)) || (Array.isArray(data.employeeDaily) && data.employeeDaily.some(row => !validLine(row) || typeof row.employeeId !== 'string' || typeof row.date !== 'string' || row.date < start || row.date > end)) ||
      data.daily.some(row => !validLine(row) || typeof row.date !== 'string' || row.date < start || row.date > end) ||
      !data.totals || !finite(data.totals.revenueThb) || !Number.isSafeInteger(data.totals.orders) ||
      !Number.isFinite(Date.parse(data.updatedAt))) {
    throw new Error('Dữ liệu doanh số Sale không hợp lệ hoặc không khớp bộ lọc.');
  }
  return data;
}

// Mục tiêu Sale có bảng riêng trong PostgreSQL; không ảnh hưởng Marketing.
const parseSaleTargets = (data, month) => {
  if (data?.success !== true || data.month !== month || typeof data.canEdit !== 'boolean' || !Array.isArray(data.targets) ||
    data.targets.some(x => typeof x?.employeeId !== 'string' || !Number.isSafeInteger(x.targetVnd) || x.targetVnd < 0))
    throw new Error('Dữ liệu mục tiêu Sale không hợp lệ.');
  return { canEdit:data.canEdit, targets:Object.fromEntries(data.targets.map(x => [`${x.employeeId}:${month}`,x.targetVnd])) };
};
export async function fetchSaleTargets(month,signal) {
  const {data}=await api.get('/sales/sale-targets',{params:{month},signal,timeout:15000});
  return parseSaleTargets(data,month);
}
export async function saveSaleTargets(month,changes) {
  const items=Object.entries(changes).map(([key,targetVnd])=>({employeeId:key.slice(0,-(`:${month}`.length)),targetVnd}));
  const {data}=await api.put('/sales/sale-targets',{month,changes:items},{timeout:30000});
  return parseSaleTargets(data,month);
}
