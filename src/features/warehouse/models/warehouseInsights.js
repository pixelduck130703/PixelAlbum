// Visualizations read the exact warehouse rows already shown by the report.
// Missing/negative values must never be converted to 0 or silently excluded
// from a 100% revenue-share chart.
export const WAREHOUSE_CHART_COLORS = [
  '#3269d6','#0d9c86','#e6a04a','#9a7bd5','#cf647f','#468fb7',
  '#91a542','#a36f56','#6b8bc7','#2d9ea8','#ba82a8','#818b9c',
];

const isAmount = (value) => typeof value === 'number' && Number.isFinite(value);
const active = (row) => Number(row?.orders) > 0 || (isAmount(row?.revenueThb) && row.revenueThb !== 0);
const nameSort = (a, b) => a.name.localeCompare(b.name, 'vi');
const validLimit = (value, fallback) => Number.isSafeInteger(value) && value >= 2 ? value : fallback;

export function buildWarehouseInsights(rows, options = {}) {
  const input = Array.isArray(rows) ? rows : [];
  const activeRows = input.filter(active);
  const invalidRows = activeRows.filter(row => !isAmount(row.revenueThb) || row.revenueThb < 0);
  const hasEstimated = activeRows.some(row => row.revenueEstimated === true);
  const sortableRows = activeRows.filter(row => isAmount(row.revenueThb) && row.revenueThb >= 0)
    .sort((a, b) => b.revenueThb - a.revenueThb || nameSort(a, b));
  const total = sortableRows.reduce((sum, row) => sum + row.revenueThb, 0);
  const canShowShare = activeRows.length > 0 && invalidRows.length === 0 && total > 0;
  const barLimit = validLimit(options.barLimit, 12);
  const pieLimit = validLimit(options.pieLimit, 8);
  const max = Math.max(0, ...sortableRows.map(row => row.revenueThb));
  const bars = sortableRows.slice(0, barLimit).map((row, index) => ({
    warehouseId: row.warehouseId, name: row.name, revenueThb: row.revenueThb,
    relativePercent: max > 0 ? row.revenueThb / max * 100 : 0,
    sharePercent: canShowShare ? row.revenueThb / total * 100 : null,
    color: WAREHOUSE_CHART_COLORS[index % WAREHOUSE_CHART_COLORS.length],
  }));
  const pie = [];
  let gradient = null;
  if (canShowShare) {
    const first = sortableRows.length <= pieLimit ? sortableRows : sortableRows.slice(0, pieLimit - 1);
    const remaining = sortableRows.slice(first.length);
    const segments = first.map(row => ({ name: row.name, revenueThb: row.revenueThb }));
    if (remaining.length) segments.push({ name: `Kho khác (${remaining.length})`, revenueThb: remaining.reduce((sum, row) => sum + row.revenueThb, 0) });
    let cumulative = 0;
    const stops = [];
    segments.forEach((row, index) => {
      const begin = cumulative;
      const finish = index === segments.length - 1 ? 100 : Math.min(100, cumulative + row.revenueThb / total * 100);
      cumulative = finish;
      const color = WAREHOUSE_CHART_COLORS[index % WAREHOUSE_CHART_COLORS.length];
      pie.push({ ...row, sharePercent: row.revenueThb / total * 100, color });
      stops.push(`${color} ${begin.toFixed(5)}% ${finish.toFixed(5)}%`);
    });
    gradient = `conic-gradient(${stops.join(', ')})`;
  }
  return {
    activeCount: activeRows.length,
    invalidCount: invalidRows.length,
    hasEstimated,
    canShowShare,
    bars,
    pie,
    gradient,
    totalThb: canShowShare ? total : null,
    hiddenBars: Math.max(0, sortableRows.length - bars.length),
  };
}
