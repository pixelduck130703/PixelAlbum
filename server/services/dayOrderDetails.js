'use strict';
// V19.13.2: order-list-backed daily detail. The public analytics/sale API
// does NOT document split_by=Order.id: never use an invented group to build
// an exact order-ID allowlist. This endpoint shows orders CREATED on the chosen
// Bangkok day and associated with the employee's current order role.
// The official report count is displayed separately, not forcibly reconciled.
// Never return private customer fields or the Pancake API key to the client.
const API_BASE = 'https://pos.pages.fm/api/v1/shops';
const MAX_PAGES = 30;
const PAGE_SIZE = 100;
const ZONE = 'Asia/Bangkok';
const STATUS_NAMES = {
  0:'Mới',17:'Chờ xác nhận',11:'Chờ hàng',12:'Chờ in',13:'Đã in',
  20:'Đã đặt hàng',1:'Đã xác nhận',8:'Đóng hàng',9:'Chờ lấy hàng',
  2:'Đã gửi',3:'Đã nhận',16:'Đã thu tiền',4:'Đang hoàn',
  15:'Hoàn một phần',5:'Đã hoàn',6:'Đã hủy',7:'Đã xóa',
};
class DayOrdersError extends Error {
  constructor(message,status=502){super(message);this.name='DayOrdersError';this.status=status;}
}
const validDate = date => typeof date==='string'
  && /^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date)
  && !Number.isNaN(Date.parse(`${date}T00:00:00Z`))
  && new Date(`${date}T00:00:00Z`).toISOString().slice(0,10)===date;
const bangkokFormatter=new Intl.DateTimeFormat('en-CA',{
  timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit',
});
function bangkokDateFromMs(ms){
  if(!Number.isFinite(ms))return null;
  const parts=bangkokFormatter.formatToParts(ms);
  const val=type=>parts.find(p=>p.type===type)?.value;
  return `${val('year')}-${val('month')}-${val('day')}`;
}
function bangkokToday(now=new Date()){return bangkokDateFromMs(now.getTime());}
function validateInput({date,employeeId,team},now=new Date()){
  if(!validDate(date))throw new DayOrdersError('Ngày không hợp lệ.',400);
  if(!['marketing','sale'].includes(team))throw new DayOrdersError('Loại báo cáo không hợp lệ.',400);
  if(typeof employeeId!=='string'||!/^[a-zA-Z0-9_-]{1,128}$/.test(employeeId))throw new DayOrdersError('Mã nhân viên không hợp lệ.',400);
  return {date,employeeId,team,future:date>bangkokToday(now)};
}
function extractId(value){
  if(value===undefined||value===null)return '';
  if(typeof value==='string'||typeof value==='number')return String(value);
  if(Array.isArray(value))return value.map(extractId).find(Boolean)||'';
  if(typeof value==='object')return extractId(value.id??value.user_id);
  return '';
}
function getAssignedIds(order,team){
  if(team==='marketing')return [
    extractId(order.pke_mkter),extractId(order.marketer_id),extractId(order.marketer),
  ].filter(Boolean);
  const values=[extractId(order.assigning_seller_id),extractId(order.assigning_seller)];
  if(Array.isArray(order.items))for(const item of order.items)values.push(extractId(item?.assigning_seller_id));
  return values.filter(Boolean);
}
function parseCreatedAtMs(value,naiveZone=process.env.PANCAKE_ORDER_NAIVE_TZ||'UTC'){
  if(typeof value==='number'&&Number.isFinite(value))return Math.abs(value)<1e11?value*1000:value;
  if(typeof value!=='string'||!value.trim())return null;
  const normalized=value.trim().replace(' ','T');
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/i.test(normalized))return null;
  const hasZone=/(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  const ms=Date.parse(hasZone?normalized:normalized+(naiveZone==='Asia/Bangkok'?'+07:00':'Z'));
  return Number.isFinite(ms)?ms:null;
}
function getOrderAmountThb(order){
  const currency=String(order.order_currency||'').toUpperCase();
  if(currency&&!currency.startsWith('THB'))return null;
  const raw=order.total_price;
  if(raw==null||typeof raw==='boolean'||!Number.isFinite(Number(raw)))return null;
  return Number(raw)/100;
}
function normalizeOrder(order,team,createdAtMs=parseCreatedAtMs(order.inserted_at)){
  const status=Number(order.status);
  return {
    id:extractId(order.id??order.system_id),
    displayId:String(order.custom_id||order.display_id||order.system_id||order.id||'—').slice(0,80),
    createdAt:typeof order.inserted_at==='string'?order.inserted_at:null,
    createdAtMs:Number.isFinite(createdAtMs)?createdAtMs:null,
    updatedAt:typeof order.updated_at==='string'?order.updated_at:null,
    status:Number.isInteger(status)?status:null,
    statusName:String(order.status_name||STATUS_NAMES[status]||'Không rõ').slice(0,80),
    amountThb:getOrderAmountThb(order),
    quantity:Number.isFinite(Number(order.total_quantity))&&Number(order.total_quantity)>=0?Number(order.total_quantity):null,
    warehouseId:extractId(order.warehouse_id),
    source:typeof order.account_name==='string'?order.account_name.slice(0,100):'',
    employeeName:String(team==='sale'?(order.assigning_seller?.name||''):(order.marketer?.name||'')).slice(0,100),
  };
}
function toTimestamps(date){
  const start=Math.floor(new Date(`${date}T00:00:00+07:00`).getTime()/1000);
  return {start,end:start+86400-1};
}
async function fetchPancake(fetchImpl,url){
  let resp;
  try {resp=await fetchImpl(url,{headers:{Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(20000)});}
  catch {throw new DayOrdersError('Không kết nối được API Pancake.');}
  if(resp.status===401||resp.status===403)throw new DayOrdersError('Pancake từ chối quyền xem đơn hàng; kiểm tra API key.');
  if(resp.status===429)throw new DayOrdersError('Pancake giới hạn lượt gọi, thử lại sau.',503);
  if(!resp.ok)throw new DayOrdersError(`Pancake trả lỗi HTTP ${resp.status}.`);
  try {return await resp.json();}catch{throw new DayOrdersError('Pancake trả dữ liệu không phải JSON.');}
}
// Only SUPPORTED analytics dimensions: Time.day and User.id, not Order.id.
function extractReportCount(rows,date,employeeId){
  if(!Array.isArray(rows))return null;
  const matched=rows.filter(r=>r&&extractId(r['User.id'])===employeeId&&r['Time.day']===date);
  if(!matched.length)return rows.length?null:0;
  let result=0;
  for(const r of matched){
    const c=Number(r?.success?.order_count);
    if(!Number.isSafeInteger(c)||c<0)return null;
    result+=c;
  }
  return result;
}
function createDayOrdersService({fetchImpl=fetch,now=()=>new Date(),limit=MAX_PAGES}={}){
  async function fetchReportCount(shop,key,date,employeeId,team){
    const {start,end}=toTimestamps(date);
    const to=Math.min(now().getTime(),end*1000+999);
    const url=new URL(`${API_BASE}/${shop}/analytics/sale`);
    for(const [k,v] of [
      ['api_key',key],['since',new Date(start*1000).toISOString()],['until',new Date(to).toISOString()],
      ['split_by[]','Time.day'],['split_by[]','User.id'],
      ['filter[User.id][]',employeeId],['select_fields[]','order_count'],
      ['user_type',team==='sale'?'assign':'marketer'],['success_status','1'],['success_record','inserted_at'],
    ])url.searchParams.append(k,String(v));
    const json=await fetchPancake(fetchImpl,url);
    if(json?.success!==true||!Array.isArray(json.data))return null;
    return extractReportCount(json.data,date,employeeId);
  }
  async function fetchPage(shop,key,date,page){
    const {start,end}=toTimestamps(date);
    const url=new URL(`${API_BASE}/${shop}/orders`);
    for(const [k,v] of [
      ['api_key',key],['page_size',PAGE_SIZE],['page_number',page],
      ['updateStatus','inserted_at'],['startDateTime',start],['endDateTime',end],
      ['option_sort','inserted_at_desc'],['include_removed','0'],
    ])url.searchParams.set(k,String(v));
    const json=await fetchPancake(fetchImpl,url);
    if(json?.success!==true||!Array.isArray(json.data))throw new DayOrdersError('Pancake trả danh sách đơn không hợp lệ.');
    return json;
  }
  async function load({date,employeeId,team}){
    const input=validateInput({date,employeeId,team},now());
    const initial={date,team,employeeId,orders:[],future:input.future,truncated:false,scanned:0,
      totalEntries:null,unassigned:0,unmatchedEmployee:0,missingCount:null,outsideDate:0,
      unknownDate:0,expectedCount:null,basis:'created_assigned'};
    if(input.future)return initial;
    const shop=String(process.env.PANCAKE_SHOP_ID||'').trim();
    const key=String(process.env.PANCAKE_API_KEY||'').trim();
    if(!/^\d+$/.test(shop)||!key)throw new DayOrdersError('Backend thiếu cấu hình API Pancake.',503);
    // Failure of analytics cannot hide the order list.
    const [reportResult,first]=await Promise.all([
      fetchReportCount(shop,key,date,employeeId,team).then(count=>({count})).catch(()=>({count:null})),
      fetchPage(shop,key,date,1),
    ]);
    const announced=Number(first.total_pages);
    const hasPageCount=Number.isSafeInteger(announced)&&announced>=1;
    const count=hasPageCount?Math.min(announced,limit):limit;
    const batches=[first];
    let reachedEnd=!hasPageCount&&first.data.length<PAGE_SIZE;
    for(let begin=2;begin<=count&&!reachedEnd;begin+=3){
      const pages=Array.from({length:Math.min(3,count-begin+1)},(_,i)=>begin+i);
      const next=await Promise.all(pages.map(p=>fetchPage(shop,key,date,p)));
      batches.push(...next);
      if(!hasPageCount&&next.some(p=>p.data.length<PAGE_SIZE))reachedEnd=true;
    }
    const seen=new Set(),matching=[];
    let scanned=0,outsideDate=0,unknownDate=0,unassigned=0,unmatchedEmployee=0;
    for(const page of batches)for(const order of page.data){
      if(!order||typeof order!=='object')continue;
      const id=extractId(order.id??order.system_id);
      if(!id||seen.has(id))continue;
      seen.add(id);scanned++;
      const ms=parseCreatedAtMs(order.inserted_at);
      if(ms===null){unknownDate++;continue;}
      if(bangkokDateFromMs(ms)!==date){outsideDate++;continue;}
      const assignedIds=getAssignedIds(order,team);
      if(!assignedIds.length){unassigned++;continue;}
      if(!assignedIds.includes(employeeId)){unmatchedEmployee++;continue;}
      matching.push(normalizeOrder(order,team,ms));
    }
    matching.sort((a,b)=>b.createdAtMs-a.createdAtMs||b.id.localeCompare(a.id));
    const expectedCount=reportResult.count;
    const truncated=hasPageCount?announced>limit:!reachedEnd;
    return {...initial,future:false,orders:matching,expectedCount,
      missingCount:expectedCount==null?null:Math.max(0,expectedCount-matching.length),
      truncated,scanned,outsideDate,unknownDate,unassigned,unmatchedEmployee,
      totalEntries:Number.isSafeInteger(Number(first.total_entries))?Number(first.total_entries):null,
      updatedAt:now().toISOString()};
  }
  return {load};
}
module.exports={DayOrdersError,validDate,bangkokToday,bangkokDateFromMs,validateInput,extractId,
  getAssignedIds,parseCreatedAtMs,getOrderAmountThb,normalizeOrder,toTimestamps,
  extractReportCount,createDayOrdersService};
