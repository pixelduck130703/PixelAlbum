import { useEffect, useMemo, useState } from 'react';
import EmployeeTargetManager from '../sales/components/EmployeeTargetManager';
import { fetchSalesEmployees, fetchSalesWarehouses, salesErrorMessage } from '../../services/salesService';
import './SaleDashboard.css';
import { fetchSaleReport, fetchSaleTargets, saveSaleTargets } from './saleService';
import { todayInBangkok } from '../sales/models/salesDashboardModel';

// Quản lý mục tiêu Sale ngay trong tab Sale, lưu ở bảng PostgreSQL riêng.
// Không dựa vào tên chứa "Sale" vì nhân viên có thể đặt tên bất kỳ.
export default function SaleTargetManager({ month, onMonthChange, rate, refresh, onSaved }) {
  const today = todayInBangkok();
  const [roster, setRoster] = useState([]);
  const [activeIds, setActiveIds] = useState([]);
  const [all, setAll] = useState(false);
  const [state, setState] = useState({month:'',targets:null,canEdit:false,error:''});
  const [loadError, setLoadError] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [warehouses, setWarehouses] = useState([{id:'',name:'Tất cả kho'}]);
  const maxMonth = today.slice(0,7);
  useEffect(() => {
    let disposed=false;const controller=new AbortController();
    fetchSalesWarehouses(controller.signal)
      .then(items=>{if(!disposed)setWarehouses([{id:'',name:'Tất cả kho'},...items])}).catch(()=>{});
    return ()=>{disposed=true;controller.abort()};
  },[refresh]);
  useEffect(()=>{
    const controller=new AbortController();
    setLoadError('');
    const start=`${month}-01`;
    const end=month>maxMonth ? null : month===maxMonth ? today : `${month}-${String(new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate()).padStart(2,'0')}`;
    if(!end) {setRoster([]);setActiveIds([]);return ()=>controller.abort()}
    Promise.allSettled([
      fetchSalesEmployees('',month,controller.signal),
      fetchSaleReport(start,end,'assign',warehouse,controller.signal),
    ]).then(([employeeResult,reportResult])=>{
      if(controller.signal.aborted)return;
      const employees=employeeResult.status==='fulfilled'?employeeResult.value:[];
      if(reportResult.status==='rejected') {
        setRoster(employees);setActiveIds([]);
        setLoadError(salesErrorMessage(reportResult.reason));
        return;
      }
      const report=reportResult.value;
      // Lấy đủ nhân viên Sale từ dữ liệu phân công, không phụ thuộc nhân viên Marketing.
      const people=new Map(employees.map(person=>[person.id,person]));
      for (const row of report.rows) {
        if (row.employeeId && row.employeeId !== '__unassigned__' && !people.has(row.employeeId)) {
          people.set(row.employeeId,{id:row.employeeId,name:row.name});
        }
      }
      setRoster([...people.values()]);
      setActiveIds(report.rows.filter(row=>row.revenueThb>0).map(row=>row.employeeId));
    });
    return ()=>controller.abort();
  },[month,maxMonth,today,warehouse,refresh]);
  useEffect(()=>{
    const controller=new AbortController();
    fetchSaleTargets(month,controller.signal)
      .then(result=>{if(!controller.signal.aborted)setState({month,...result,error:''})})
      .catch(error=>{if(!controller.signal.aborted)setState({month,targets:null,canEdit:false,error:salesErrorMessage(error)})});
    return ()=>controller.abort();
  },[month,refresh]);
  const employees=useMemo(()=>{
    const ids=new Set(activeIds);
    const saved=state.month===month?state.targets:{};
    return roster.filter(person=>all||ids.has(person.id)||(saved?.[`${person.id}:${month}`]??0)>0);
  },[roster,activeIds,all,state,month]);
  async function saveTargets(targetMonth,changes) {
    const result=await saveSaleTargets(targetMonth,changes);
    setState(previous=>previous.month===targetMonth?{...previous,targets:{...previous.targets,...result.targets}}:previous);
    onSaved?.();
    return result;
  }
  return <div className="sa-goal-admin">
    <div className="sa-goal-admin-tools">
      <strong>Quản lý mục tiêu Sale</strong>
      <label><input type="checkbox" checked={all} onChange={event=>setAll(event.target.checked)}/> Hiện cả nhân viên chưa có đơn</label>
    </div>
    {loadError && <p className="sa-alert" role="alert">Không tải được nhân viên Sale: {loadError}</p>}
    <EmployeeTargetManager key="sale-target-manager" employees={employees} month={month} onMonthChange={onMonthChange}
      warehouseId={warehouse} warehouseOptions={warehouses} onWarehouseChange={setWarehouse}
      targets={state.month===month?state.targets:null} legacyTargets={{}}
      error={state.month===month?state.error:''}
      canEdit={state.month===month&&state.canEdit&&!state.error} onSave={saveTargets} rate={rate}/>
  </div>;
}
