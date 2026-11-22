import api from './api';

export async function fetchSalesEmployees(warehouseId, month, signal) {
  const { data } = await api.get('/sales/employees', { params: { warehouseId, month }, signal, timeout: 60000 });
  if (data?.success !== true || data.warehouseId !== warehouseId || (warehouseId && data.month !== month) || !Array.isArray(data.employees) || data.employees.some((u) => typeof u?.id !== 'string' || typeof u?.name !== 'string')) {
    throw new Error('Danh sách nhân viên Pancake không hợp lệ.');
  }
  return data.employees;
}

export async function fetchSalesWarehouses(signal) {
  const { data } = await api.get('/sales/warehouses', { signal, timeout: 30000 });
  if (data?.success !== true || !Array.isArray(data.warehouses) || data.warehouses.some((row) => typeof row?.id !== 'string' || typeof row.name !== 'string')) throw new Error('Danh sách kho Pancake không hợp lệ.');
  return data.warehouses;
}

export async function fetchDailySales(month, employeeId, signal) {
  const { data } = await api.get('/sales/daily', { params: { month, employeeId }, signal, timeout: 45000 });
  if (data?.success !== true || data.month !== month || data.employeeId !== employeeId || !Array.isArray(data.rows) || data.rows.some((r) => typeof r?.date !== 'string' || !r.date.startsWith(`${month}-`) || !Number.isFinite(r.revenueThb) || !Number.isSafeInteger(r.orders) || r.orders < 0)) {
    throw new Error('Dữ liệu doanh số không khớp với nhân viên hoặc tháng đã chọn.');
  }
  return { rows: data.rows, updatedAt: data.updatedAt };
}

export async function fetchExchangeRate(signal) {
  const { data } = await api.get('/sales/exchange-rate', { signal, timeout: 15000 });
  if (data?.success !== true || !Number.isFinite(data.rate) || data.rate <= 0 || !Number.isFinite(Date.parse(data.updatedAt))) {
    throw new Error('Tỷ giá trực tuyến không hợp lệ.');
  }
  return { rate: data.rate, updatedAt: data.updatedAt, stale: data.stale === true };
}

function parseTargets(data, month) {
  if (data?.success !== true || data.month !== month || typeof data.canEdit !== 'boolean' || !Array.isArray(data.targets) || data.targets.some((row) => typeof row?.employeeId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(row.employeeId) || !Number.isSafeInteger(row.targetVnd) || row.targetVnd < 0)) {
    throw new Error('Dữ liệu mục tiêu không hợp lệ.');
  }
  return { canEdit: data.canEdit, targets: Object.fromEntries(data.targets.map((row) => [`${row.employeeId}:${month}`, row.targetVnd])) };
}

export async function fetchEmployeeTargets(month, signal) {
  const { data } = await api.get('/sales/targets', { params: { month }, signal, timeout: 15000 });
  return parseTargets(data, month);
}

export async function saveEmployeeTargets(month, changes) {
  const items = Object.entries(changes).map(([key, targetVnd]) => ({ employeeId: key.slice(0, -(`:${month}`.length)), targetVnd }));
  const { data } = await api.put('/sales/targets', { month, changes: items }, { timeout: 30000 });
  return parseTargets(data, month);
}

export function salesErrorMessage(error) {
  if (error?.response?.status === 401 || error?.response?.status === 403) return 'Báo cáo chưa bật chế độ xem không cần đăng nhập hoặc phiên đăng nhập đã hết hạn. Kiểm tra SALES_PUBLIC_READ ở backend.';
  if (error?.response?.status === 404) return 'Backend chưa có route doanh số. Kiểm tra server/app.js và khởi động lại backend.';
  return error?.response?.data?.message || (error?.code === 'ERR_NETWORK' ? 'Không kết nối được backend. Kiểm tra địa chỉ VITE_API_URL và server.' : error?.message || 'Không tải được doanh số.');
}
