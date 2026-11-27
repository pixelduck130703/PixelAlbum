'use strict';
const { DayOrdersError, createDayOrdersService } = require('../services/dayOrderDetails');
const { load } = createDayOrdersService();
function registerDayOrderDetailsRoute(router, verifyAdminToken) {
  // CHI ADMIN: cac don hang khong duoc mo qua SALES_PUBLIC_READ.
  router.get('/api/sales/day-orders', verifyAdminToken, async (req,res) => {
    res.set('Cache-Control','private, no-store');
    res.set('X-Robots-Tag','noindex, nofollow, noarchive');
    try {
      const result=await load({date:req.query.date,employeeId:req.query.employeeId,team:req.query.team || 'marketing'});
      res.json({success:true,...result});
    } catch(err) {
      if (err instanceof DayOrdersError) return res.status(err.status).json({success:false,message:err.message});
      return res.status(500).json({success:false,message:'Không tải được chi tiết đơn hàng.'});
    }
  });
}
module.exports={registerDayOrderDetailsRoute};
