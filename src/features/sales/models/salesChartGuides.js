// Đường tham chiếu của biểu đồ dùng THB, đồng nhất với chiều cao các cột.
// Trung bình/ngày chỉ lấy ngày đã qua hoặc hôm nay, kể cả ngày không có đơn;
// không coi khoản nhập trước cho ngày tương lai là doanh thu thực tế.
// "Mỗi ngày cần" tính trên tổng tháng đang xem (gồm kế hoạch tương lai nếu có).
export function calculateSalesChartGuides(rows, today, targetVnd, rate) {
  const elapsed = rows.filter((row) => row.date <= today);
  const remainingDays = rows.filter((row) => row.date > today).length;
  const hasRecordedElapsed = elapsed.some((row) => row.recorded);
  const actualRevenueThb = elapsed.reduce((total, row) => total + (row.revenueThb ?? 0), 0);
  const projectedRevenueThb = rows.reduce((total, row) => total + (row.revenueThb ?? 0), 0);
  const averageThb = hasRecordedElapsed && elapsed.length > 0 ? actualRevenueThb / elapsed.length : null;
  const hasTarget = Number.isSafeInteger(targetVnd) && targetVnd > 0;
  const hasRate = Number.isFinite(rate) && rate > 0;
  const neededThb = hasTarget && hasRate && remainingDays > 0
    ? Math.max(0, (targetVnd / rate) - projectedRevenueThb) / remainingDays
    : null;
  return { averageThb, neededThb, elapsedDays: elapsed.length, remainingDays };
}
