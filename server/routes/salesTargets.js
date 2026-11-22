const express = require('express');
const jwt = require('jsonwebtoken');
const verifyAdminToken = require('../middleware/auth');
const { TargetError, validateMonth, validateChanges, store } = require('../services/salesTargets');
const { getEmployees, PancakeError } = require('../services/pancakeSales');

function canEdit(req) {
  if (req.admin?.role === 'admin') return true;
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return false;
  try { return jwt.verify(auth.slice(7), process.env.JWT_SECRET).role === 'admin'; }
  catch { return false; }
}

function createSalesTargetsRouter(readAccess, targets = store, employees = getEmployees) {
  const router = express.Router();
  function fail(error, res) {
    if (error instanceof TargetError || error instanceof PancakeError) return res.status(error.status).json({ success: false, message: error.message });
    return res.status(503).json({ success: false, message: 'Không truy cập được cơ sở dữ liệu mục tiêu.' });
  }
  router.get('/api/sales/targets', readAccess, async (req, res) => {
    try {
      const month = req.query.month;
      validateMonth(month);
      res.json({ success: true, month, canEdit: canEdit(req), targets: await targets.list(month) });
    } catch (error) { fail(error, res); }
  });
  // Không sử dụng salesReadAccess cho ghi, kể cả khi bật SALES_PUBLIC_READ.
  router.put('/api/sales/targets', verifyAdminToken, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const { month, changes } = req.body || {};
      validateMonth(month);
      validateChanges(changes);
      const known = new Set((await employees()).map((person) => person.id));
      if (changes.some((row) => !known.has(row.employeeId))) throw new TargetError('Nhân viên không tồn tại trong shop Pancake.');
      await targets.save(month, changes);
      res.json({ success: true, month, canEdit: true, targets: changes });
    } catch (error) { fail(error, res); }
  });
  return router;
}
module.exports = { createSalesTargetsRouter };
