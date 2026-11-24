/*
 * PixelAlbum V19 - chèn route Kho hàng cạnh Marketing, giữ nguyên route guards.
 * Hoạt động với React Router <Route ... /> thông dụng. Nếu code khác cấu trúc,
 * chỉ báo lỗi, không sửa nửa chừng: xem HUONG_DAN.md để thêm thủ công.
 */
const fs=require('node:fs');
const path=require('node:path');
const cwd=process.cwd();
const file=['src/App.jsx','src/App.tsx'].map(p=>path.join(cwd,p)).find(fs.existsSync);
function stop(msg){console.error('V19:',msg);process.exitCode=1;}
function routeEnd(code, start){
  let braces=0,quoted='';
  for(let i=start;i<code.length-1;i++){
    const c=code[i];
    if(quoted){if(c==='\\')i++;else if(c===quoted)quoted='';continue;}
    if(c==='"'||c==="'"){quoted=c;continue;}
    if(c==='{')braces++;
    if(c==='}')braces--;
    if(c==='/'&&code[i+1]==='>'&&braces===0)return i+2;
    if(c==='>'&&braces===0)return -1; // route lồng hoặc không tự đóng: không sửa tự động
  }
  return -1;
}
if(!file)stop('Không tìm thấy src/App.jsx hoặc src/App.tsx.');
else{
  const input=fs.readFileSync(file,'utf8');
  if(input.includes('path="/warehouse-dashboard"')||input.includes("path='/warehouse-dashboard'"))console.log('V19: route Kho hàng đã tồn tại.');
  else {
    const importMatch=/import\s+SalesDashboard\s+from\s+(['"])[^'"\n]+\1\s*;?/.exec(input);
    const pathMatch=/\bpath\s*=\s*(['"])\/sales-dashboard\1/.exec(input);
    if(!importMatch||!pathMatch)stop('Không nhận diện import/route SalesDashboard trong App. Xem HUONG_DAN.md để thêm thủ công.');
    else{
      const at=input.lastIndexOf('<Route',pathMatch.index);
      const end=at<0?-1:routeEnd(input,at);
      if(end<0)stop('Route Marketing không phải <Route ... /> trực tiếp. Không tự sửa.');
      else{
        const originalTag=input.slice(at,end);
        if(!originalTag.includes('SalesDashboard'))stop('Route Marketing không tham chiếu SalesDashboard theo mẫu. Không tự sửa.');
        else{
          const duplicate=originalTag.replace('/sales-dashboard','/warehouse-dashboard').replace(/\bSalesDashboard\b/g,'WarehouseDashboard');
          const indent=/\n([^\n<]*)$/.exec(input.slice(0,at))?.[1]||'';
          let next=input.slice(0,end)+'\n'+indent+duplicate+input.slice(end);
          const oldImport=importMatch[0];
          const newImport=oldImport.replace(/\bSalesDashboard\b/g,'WarehouseDashboard').replace(/\.\/pages\/SalesDashboard/, './pages/WarehouseDashboard');
          // Nếu đường import SalesDashboard là custom path, route mới vẫn dùng wrapper ổn định.
          const wrapperImport=/^import\s+WarehouseDashboard\s+from\s+(['"])\.\/pages\/WarehouseDashboard\1;?$/;
          const importLine=wrapperImport.test(newImport)?newImport:"import WarehouseDashboard from './pages/WarehouseDashboard';";
          next=next.replace(oldImport,oldImport+'\n'+importLine);
          fs.writeFileSync(file+'.v19-backup',input);
          fs.writeFileSync(file,next);
          console.log('Đã thêm route /warehouse-dashboard cạnh /sales-dashboard, giữ nguyên wrapper kiểm soát truy cập.');
        }
      }
    }
  }
}
