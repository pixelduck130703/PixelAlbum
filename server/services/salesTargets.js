const monthPattern = /^(20\d{2}|2100)-(0[1-9]|1[0-2])$/;
const employeePattern = /^[A-Za-z0-9_-]{1,128}$/;

class TargetError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

function validateMonth(month) {
  if (typeof month !== 'string' || !monthPattern.test(month)) throw new TargetError('Tháng không hợp lệ (YYYY-MM).');
  return `${month}-01`;
}

function validateChanges(changes) {
  if (!Array.isArray(changes) || !changes.length || changes.length > 1000) throw new TargetError('Cần từ 1 đến 1000 mục tiêu.');
  const seen = new Set();
  for (const row of changes) {
    if (typeof row?.employeeId !== 'string' || !employeePattern.test(row.employeeId) || seen.has(row.employeeId) || !Number.isSafeInteger(row.targetVnd) || row.targetVnd < 0) throw new TargetError('Mã nhân viên hoặc mục tiêu không hợp lệ, hoặc bị trùng.');
    seen.add(row.employeeId);
  }
  return changes;
}

async function initializeSalesTargets(pool) {
  await pool.query(`CREATE TABLE IF NOT EXISTS sales_employee_targets (
    shop_id TEXT NOT NULL,
    employee_id TEXT NOT NULL,
    target_month DATE NOT NULL CHECK (EXTRACT(DAY FROM target_month) = 1),
    target_vnd BIGINT NOT NULL CHECK (target_vnd >= 0 AND target_vnd <= 9007199254740991),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (shop_id, target_month, employee_id)
  )`);
}

function createSalesTargetStore(pool, getShopId = () => process.env.PANCAKE_SHOP_ID) {
  function scope() {
    const shop = String(getShopId() || '').trim();
    if (!/^\d+$/.test(shop)) throw new TargetError('Chưa cấu hình PANCAKE_SHOP_ID.', 503);
    return shop;
  }
  return {
    async list(month) {
      const { rows } = await pool.query('SELECT employee_id, target_vnd FROM sales_employee_targets WHERE shop_id = $1 AND target_month = $2::date ORDER BY employee_id', [scope(), validateMonth(month)]);
      return rows.map((row) => ({ employeeId: row.employee_id, targetVnd: Number(row.target_vnd) }));
    },
    async save(month, changes) {
      const date = validateMonth(month);
      validateChanges(changes);
      // Một câu lệnh nguyên tử, chỉ ghi các nhân viên được gửi lên, không xóa mục tiêu khác.
      await pool.query(`INSERT INTO sales_employee_targets (shop_id, target_month, employee_id, target_vnd)
        SELECT $1, $2::date, item.employee_id, item.target_vnd
        FROM unnest($3::text[], $4::bigint[]) AS item(employee_id, target_vnd)
        ON CONFLICT (shop_id, target_month, employee_id)
        DO UPDATE SET target_vnd = EXCLUDED.target_vnd, updated_at = NOW()`, [scope(), date, changes.map((row) => row.employeeId), changes.map((row) => row.targetVnd)]);
    },
  };
}

// Khởi tạo pool ở thời điểm sử dụng, để kiểm thử API không cần DB thật.
const store = {
  list: (...args) => createSalesTargetStore(require('../database/db').pool).list(...args),
  save: (...args) => createSalesTargetStore(require('../database/db').pool).save(...args),
};

module.exports = { TargetError, validateMonth, validateChanges, initializeSalesTargets, createSalesTargetStore, store };
