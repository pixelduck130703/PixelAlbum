'use strict';
// V19.9: mục tiêu Sale độc lập với bảng sales_employee_targets của Marketing.
// Không được dùng cùng khóa (shop, month, employee) vì một người có thể kiêm cả hai vai trò.
const { validateMonth, validateChanges, TargetError } = require('./salesTargets');
let initialized;
const SCHEMA = `CREATE TABLE IF NOT EXISTS sales_sale_targets (
  shop_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  target_month DATE NOT NULL CHECK (EXTRACT(DAY FROM target_month) = 1),
  target_vnd BIGINT NOT NULL CHECK (target_vnd >= 0 AND target_vnd <= 9007199254740991),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (shop_id, target_month, employee_id)
)`;
function getPool() { return require('../database/db').pool; }
async function ensureSchema() {
  if (!initialized) initialized = getPool().query(SCHEMA).catch(error => { initialized = null; throw error; });
  await initialized;
}
function shopId() {
  const id = String(process.env.PANCAKE_SHOP_ID || '').trim();
  if (!/^\d+$/.test(id)) throw new TargetError('Chưa cấu hình PANCAKE_SHOP_ID.', 503);
  return id;
}
const store = {
  async list(month) {
    const date = validateMonth(month);
    await ensureSchema();
    const { rows } = await getPool().query(
      'SELECT employee_id, target_vnd FROM sales_sale_targets WHERE shop_id = $1 AND target_month = $2::date ORDER BY employee_id',
      [shopId(), date]);
    return rows.map(row => ({ employeeId: row.employee_id, targetVnd: Number(row.target_vnd) }));
  },
  async save(month, changes) {
    const date = validateMonth(month);
    validateChanges(changes);
    await ensureSchema();
    await getPool().query(`INSERT INTO sales_sale_targets (shop_id,target_month,employee_id,target_vnd)
      SELECT $1, $2::date, item.employee_id, item.target_vnd
      FROM unnest($3::text[], $4::bigint[]) AS item(employee_id,target_vnd)
      ON CONFLICT (shop_id,target_month,employee_id)
      DO UPDATE SET target_vnd = EXCLUDED.target_vnd, updated_at = NOW()`,
      [shopId(), date, changes.map(row => row.employeeId), changes.map(row => row.targetVnd)]);
  },
};
module.exports = { store, ensureSchema, SCHEMA };
