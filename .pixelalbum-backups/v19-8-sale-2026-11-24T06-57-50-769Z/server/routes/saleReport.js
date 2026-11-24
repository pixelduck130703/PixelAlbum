'use strict';
const { getSaleReport } = require('../services/pancakeSales');
function registerSaleReportRoute(router, salesReadAccess, handleError) {
  router.get('/api/sales/sale-report', salesReadAccess, async (req,res) => {
    try {
      const {start,end,role='assign',warehouseId=''} = req.query;
      const result = await getSaleReport(start,end,role,warehouseId);
      res.json({success:true,start,end,role,warehouseId,...result,updatedAt:new Date().toISOString()});
    } catch(error) {
      if (error?.name === 'SaleReportError') return res.status(error.status || 502).json({success:false,message:error.message});
      handleError(error,res);
    }
  });
}
module.exports = {registerSaleReportRoute};
