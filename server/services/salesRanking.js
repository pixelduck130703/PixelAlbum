const { getRanking, validateRankingRange } = require('./pancakeSales');
const { store } = require('./salesTargets');

const RATE = 780;

function monthsInRange(start, end) {
  const months = [];
  const cursor = new Date(`${start.slice(0, 7)}-01T00:00:00Z`);
  while (cursor.toISOString().slice(0, 7) <= end.slice(0, 7)) {
    months.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

async function getLeaderboard(start, end, now = new Date(), sales = getRanking, targets = store) {
  validateRankingRange(start, end, now);
  const months = monthsInRange(start, end);
  const [rows, goalLists] = await Promise.all([
    sales(start, end, now),
    Promise.all(months.map((month) => targets.list(month))).catch(() => null),
  ]);
  const maps = goalLists?.map((list) => new Map(list.map((row) => [row.employeeId, row.targetVnd])));
  const result = rows.map((row) => {
    const goals = maps?.map((map) => map.get(row.employeeId));
    const targetVnd = goals?.every((goal) => Number.isSafeInteger(goal) && goal > 0) ? goals.reduce((a, b) => a + b, 0) : null;
    return { ...row, targetVnd, completion: targetVnd ? row.revenueThb * RATE / targetVnd : null };
  }).sort((a, b) => b.revenueThb - a.revenueThb || a.name.localeCompare(b.name, 'vi') || a.employeeId.localeCompare(b.employeeId));
  return { rows: result, months, targetError: !maps, updatedAt: now.toISOString() };
}

module.exports = { monthsInRange, getLeaderboard };
