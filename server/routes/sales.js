const { registerDayOrderDetailsRoute } = require('./dayOrderDetails');
const { createSaleTargetsRouter } = require('./saleTargets');
const { registerSaleReportRoute } = require('./saleReport');
const { registerWarehouseReportRoute } = require('./warehouseReport');
const router = require('express').Router();
const verifyAdminToken = require('../middleware/auth');
const { PancakeError, getEmployees, getWarehouses, getDailySales, getWarehouseEmployees, getWarehouseEmployeesForRange, validateWarehouseId } = require('../services/pancakeSales');
const { getExchangeRate } = require('../services/exchangeRate');
const { getExchangeRateReliable } = require('../services/exchangeRateReliable');
const { createSalesTargetsRouter } = require('./salesTargets');
const { getLeaderboard } = require('../services/salesRanking');

// Chỉ các endpoint GET báo cáo được phép xem công khai nếu chủ hệ thống chủ động bật.
// Mặc định vẫn yêu cầu JWT. Không thay đổi middleware của các route khác.
let windowStart = 0;
let publicCount = 0;
function salesReadAccess(req, res, next) {
  res.set('Cache-Control', 'no-store');
  res.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  if (process.env.SALES_PUBLIC_READ !== 'true') return verifyAdminToken(req, res, next);
  // Giới hạn tổng lượt xem công khai theo mỗi tiến trình, không dựa vào IP do proxy cung cấp.
  if (Date.now() - windowStart >= 60000) { windowStart = Date.now(); publicCount = 0; }
  if (++publicCount > 120) return res.status(429).json({ success: false, message: 'Quá nhiều lượt tải báo cáo. Vui lòng thử lại sau một phút.' });
  next();
}

function handleError(error, res) {
  if (error instanceof PancakeError) return res.status(error.status).json({ success: false, message: error.message });
  // Không trả stack, URL hoặc payload có thể chứa thông tin nhạy cảm.
  return res.status(500).json({ success: false, message: 'Lỗi xử lý dữ liệu doanh số.' });
}

router.get('/api/sales/employees', salesReadAccess, async (req, res) => {
  try {
    const { warehouseId = '', month, start, end } = req.query;
    validateWarehouseId(warehouseId);
    if (!warehouseId) return res.json({ success: true, warehouseId, filterBy: 'all', employees: await getEmployees() });
    if (start !== undefined || end !== undefined) return res.json({ success: true, warehouseId, filterBy: 'activity', start, end, employees: await getWarehouseEmployeesForRange(start, end, warehouseId) });
    res.json({ success: true, warehouseId, filterBy: 'activity', month, employees: await getWarehouseEmployees(month, warehouseId) });
  }
  catch (error) { handleError(error, res); }
});

router.get('/api/sales/warehouses', salesReadAccess, async (_req, res) => {
  try { res.json({ success: true, warehouses: await getWarehouses() }); }
  catch (error) { handleError(error, res); }
});

router.get('/api/sales/daily', salesReadAccess, async (req, res) => {
  try {
    const { month, employeeId } = req.query;
    const rows = await getDailySales(month, employeeId);
    res.json({ success: true, month, employeeId, rows, updatedAt: new Date().toISOString() });
  } catch (error) { handleError(error, res); }
});

router.get('/api/sales/ranking', salesReadAccess, async (req, res) => {
  try {
    const { start, end } = req.query;
    res.json({ success: true, start, end, ...(await getLeaderboard(start, end)) });
  } catch (error) { handleError(error, res); }
});

router.get('/api/sales/exchange-rate', salesReadAccess, async (_req, res) => {
  try { res.json({ success: true, ...(await getExchangeRateReliable(getExchangeRate)) }); }
  catch { res.status(503).json({ success: false, message: 'Không lấy được tỷ giá trực tuyến.' }); }
});

registerWarehouseReportRoute(router, salesReadAccess, handleError);
registerSaleReportRoute(router, salesReadAccess, handleError);
registerDayOrderDetailsRoute(router, verifyAdminToken);
router.use(createSalesTargetsRouter(salesReadAccess));
router.use(createSaleTargetsRouter(salesReadAccess));
module.exports = router;
