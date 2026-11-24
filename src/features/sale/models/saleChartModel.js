// Tạo trục ngày đầy đủ; ngày không có đơn chốt hiển thị 0, không bị biến mất khỏi biểu đồ.
export function completeSaleDays(start,end,reported=[]) {
  const known = new Map(reported.map(row=>[row.date,row]));
  const days=[];
  const first=new Date(`${start}T00:00:00Z`);
  const last=new Date(`${end}T00:00:00Z`);
  if(!Number.isFinite(first.getTime())||!Number.isFinite(last.getTime())||first>last)return [];
  for(let day=new Date(first);day<=last&&days.length<366;day.setUTCDate(day.getUTCDate()+1)) {
    const iso=day.toISOString().slice(0,10);
    days.push(known.get(iso)??{date:iso,orders:0,revenueThb:0,salesThb:0});
  }
  return days;
}
