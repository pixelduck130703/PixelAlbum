import api from '../../services/api';
export async function fetchDayOrders({date,employeeId,team,signal}) {
  const {data}=await api.get('/sales/day-orders',{
    params:{date,employeeId,team},signal,timeout:60000,
  });
  if(data?.success!==true || data.date!==date || data.employeeId!==employeeId || data.team!==team || !Array.isArray(data.orders)) {
    throw new Error('Dữ liệu chi tiết đơn hàng chưa hợp lệ.');
  }
  return data;
}
