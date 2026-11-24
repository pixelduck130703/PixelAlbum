// Đăng ký cùng router sales để tái sử dụng phân quyền / rate limit có sẵn.
const { getWarehouseReport } = require('../services/pancakeSales');
function registerWarehouseReportRoute(router, salesReadAccess, handleError) {
  router.get('/api/sales/warehouse-report', salesReadAccess, async (req, res) => {
    try {
      const { start, end } = req.query;
      const report = await getWarehouseReport(start, end);
      res.json({ success: true, start, end, ...report, updatedAt: new Date().toISOString() });
    } catch (error) {
      if (error?.name === 'WarehouseReportError' && error.status === 502) return res.status(502).json({ success: false, message: error.message });
      handleError(error, res);
    }
  });
}
module.exports = { registerWarehouseReportRoute };
