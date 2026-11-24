export const PERIODS = [
  ['today','Hôm nay'], ['yesterday','Hôm qua'], ['thisWeek','Tuần này'],
  ['lastWeek','Tuần trước'], ['thisMonth','Tháng này'], ['lastMonth','Tháng trước'],
  ['custom','Tùy chọn ngày'],
];
const toDate = (iso) => new Date(`${iso}T00:00:00Z`);
const iso = (d) => d.toISOString().slice(0,10);
const shift = (day,n) => { const d=toDate(day);d.setUTCDate(d.getUTCDate()+n);return iso(d); };
export function rangeForPeriod(period,today,start,end) {
  const monday = shift(today,-((toDate(today).getUTCDay()+6)%7));
  const monthStart = `${today.slice(0,7)}-01`;
  const lastMonthEnd = shift(monthStart,-1);
  switch(period){
    case 'today': return [today,today];
    case 'yesterday': return [shift(today,-1),shift(today,-1)];
    case 'thisWeek': return [monday,today];
    case 'lastWeek': return [shift(monday,-7),shift(monday,-1)];
    case 'thisMonth': return [monthStart,today];
    case 'lastMonth': return [`${lastMonthEnd.slice(0,7)}-01`,lastMonthEnd];
    case 'custom': return [start,end];
    default: return [today,today];
  }
}
export function dateRangeError(start,end,today) {
  const valid=(v)=>typeof v==='string' && /^20\d{2}-\d{2}-\d{2}$/.test(v) && Number.isFinite(toDate(v).getTime()) && iso(toDate(v))===v;
  if(!valid(start)||!valid(end)) return 'Vui lòng chọn đủ ngày hợp lệ.';
  if(start>end) return 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.';
  if(end>today) return 'Không thể thống kê ngày trong tương lai.';
  if((toDate(end)-toDate(start))/86400000>=366) return 'Khoảng thời gian tối đa 366 ngày.';
  return '';
}
export const SORT_FIELDS = ['orders','returnedOrders','priceThb','discountThb','shippingFeeThb','returnedShippingFeeThb','salesThb','revenueThb'];
export function sortedWarehouses(rows, sort, descending=true) {
  const key = SORT_FIELDS.includes(sort) ? sort : 'revenueThb';
  return [...rows].sort((a,b)=>{
    const av=a[key],bv=b[key];
    if(av===null&&bv!==null)return 1;
    if(bv===null&&av!==null)return -1;
    const compare=(av??0)-(bv??0);
    return (descending?-compare:compare)||a.name.localeCompare(b.name,'vi');
  });
}
export function totalWarehouses(rows) {
  const keys=['orders','returnedOrders','priceThb','discountThb','shippingFeeThb','returnedShippingFeeThb','salesThb','revenueThb'];
  const summary=Object.fromEntries(keys.map(k=>[k,rows.every(r=>r[k]!==null)?rows.reduce((v,r)=>v+r[k],0):null]));
  summary.activeCount=rows.filter(r=>r.orders>0).length;
  summary.revenueEstimated=rows.some(r=>r.revenueEstimated);
  return summary;
}
