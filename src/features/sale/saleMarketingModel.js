// Giữ chính xác loại chỉ số Pancake đang hiển thị; không trộn Tiền hàng và Doanh số.
export function convertSaleReport(report) {
  if (!report || !Array.isArray(report.rows) || !Array.isArray(report.employeeDaily)) {
    throw new Error('Backend Sale chưa trả dữ liệu nhân viên theo ngày. Hãy cập nhật backend từ V19.9.');
  }
  // Chỉ gọi là Doanh số khi mọi nhân viên có dữ liệu phí vận chuyển hợp lệ.
  const hasSales = report.rows.every((row) => typeof row.salesThb === 'number' && Number.isFinite(row.salesThb));
  const metric = hasSales ? 'salesThb' : 'revenueThb';
  const measureLabel = hasSales ? 'Doanh số' : 'Tiền hàng';
  const rows = report.rows.map((row) => ({
    employeeId: row.employeeId, name: row.name, orders: row.orders,
    revenueThb: row[metric],
  }));
  const employeeDaily = report.employeeDaily.map((row) => ({
    date: row.date, employeeId: row.employeeId, orders: row.orders,
    revenueThb: row[metric] == null ? (metric === 'salesThb' ? null : row.revenueThb) : row[metric],
  }));
  // Tránh cộng lẫn chỉ số không có: API không trả đủ doanh số thì báo rõ lỗi.
  if (employeeDaily.some((row) => typeof row.revenueThb !== 'number' || !Number.isFinite(row.revenueThb))) {
    throw new Error('Dữ liệu doanh số nhân viên/ngày chưa đủ; vui lòng kiểm tra API Pancake.');
  }
  return { rows, employeeDaily, measureLabel, updatedAt: report.updatedAt };
}

export function saleEmployeesFromReport(converted) {
  return converted.rows.filter((row) => row.revenueThb > 0).map(({ employeeId, name }) => ({ id: employeeId, name }));
}

export function saleRankingWithTargets(converted, targets = {}, month = '') {
  return converted.rows.map((row) => {
    const saved = month ? targets[`${row.employeeId}:${month}`] : null;
    const targetVnd = Number.isSafeInteger(saved) && saved > 0 ? saved : null;
    return { ...row, targetVnd, completion: null };
  });
}
