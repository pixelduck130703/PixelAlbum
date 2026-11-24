'use strict';
const express = require('express');
const jwt = require('jsonwebtoken');
const verifyAdminToken = require('../middleware/auth');
const { store } = require('../services/saleTargets');
const { validateMonth, validateChanges, TargetError } = require('../services/salesTargets');
const { getEmployees, PancakeError } = require('../services/pancakeSales');
function canEdit(req) {
  if (req.admin?.role === 'admin') return true;
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return false;
  try { return jwt.verify(auth.slice(7), process.env.JWT_SECRET).role === 'admin'; }
  catch { return false; }
}
function createSaleTargetsRouter(readAccess, targets = store, employees = getEmployees) {
  const router = express.Router();
  function fail(err, res) {
    if (err instanceof TargetError || err instanceof PancakeError) return res.status(err.status).json({ success:false, message:err.message });
    return res.status(503).json({ success:false, message:'Không truy cập được mục tiêu Sale. Kiểm tra quyền tạo bảng PostgreSQL sales_sale_targets.' });
  }
  router.get('/api/sales/sale-targets', readAccess, async (req, res) => {
    try {
      const month = req.query.month;
      validateMonth(month);
      res.set('Cache-Control', 'no-store');
      res.json({ success:true, month, canEdit:canEdit(req), targets:await targets.list(month) });
    } catch (err) { fail(err,res); }
  });
  // GET có thể công khai khi SALES_PUBLIC_READ, nhưng PUT luôn yêu cầu quyền admin.
  router.put('/api/sales/sale-targets', verifyAdminToken, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const {month, changes} = req.body || {};
      validateMonth(month); validateChanges(changes);
      const ids = new Set((await employees()).map(person => person.id));
      if (changes.some(item => !ids.has(item.employeeId))) throw new TargetError('Nhân viên không tồn tại trong Pancake.');
      await targets.save(month,changes);
      res.json({success:true,month,canEdit:true,targets:changes});
    } catch(err) { fail(err,res); }
  });
  return router;
}
module.exports = {createSaleTargetsRouter};
