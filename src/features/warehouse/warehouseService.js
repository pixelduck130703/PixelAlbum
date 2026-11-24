import api from '../../services/api';
export async function fetchWarehouseReport(start,end,signal) {
  const { data } = await api.get('/sales/warehouse-report',{params:{start,end},signal,timeout:60000});
  if(data?.success!==true || data.start!==start || data.end!==end || !Array.isArray(data.rows) ||
     data.rows.some(r=>!r || typeof r.warehouseId!=='string' || typeof r.name!=='string' || !Number.isSafeInteger(r.orders) || r.orders<0 ||
       !['returnedOrders','priceThb','discountThb','shippingFeeThb','returnedShippingFeeThb','salesThb','revenueThb'].every(k=>r[k]===null || (typeof r[k]==='number' && Number.isFinite(r[k]))))) {
    throw new Error('Báo cáo kho không hợp lệ. Vui lòng kiểm tra backend.');
  }
  return data;
}

// Hiển thị nguyên nhân dễ hiểu khi tab Kho hàng không có dữ liệu.
// Chỉ hiển thị mã trạng thái và thông báo an toàn do backend trả, không lộ token.
export function warehouseReportErrorMessage(error) {
  const status = error?.response?.status;
  if (status === 404) return 'Backend chưa nhận endpoint /api/sales/warehouse-report (HTTP 404). Cần cài backend V19 và deploy lại server; V19.2 chỉ đổi giao diện.';
  if (status === 401 || status === 403) return 'Không có quyền đọc báo cáo (HTTP ' + status + '). Kiểm tra phiên quản trị hoặc SALES_PUBLIC_READ của backend.';
  if (status === 429) return 'Đang vượt giới hạn truy vấn (HTTP 429). Đợi một chút rồi thử lại.';
  if (status === 502) return 'Backend không xử lý được phản hồi Pancake (HTTP 502): ' + (error?.response?.data?.message || 'cần đối chiếu cấu trúc dữ liệu kho với API thực tế.');
  if (status >= 500) return 'Backend đang lỗi (HTTP ' + status + '). Kiểm tra log server và cấu hình Pancake POS.';
  if (error?.code === 'ERR_NETWORK' || !error?.response && error?.message === 'Network Error') return 'Không kết nối được backend. Kiểm tra VITE_API_URL, CORS và trạng thái server.';
  if (status) return 'API báo lỗi HTTP ' + status + ': ' + (error?.response?.data?.message || 'Vui lòng kiểm tra tab Network (F12).');
  return error?.message || 'Chưa xác định được lỗi. Mở F12 → Console / Network để kiểm tra.';
}
