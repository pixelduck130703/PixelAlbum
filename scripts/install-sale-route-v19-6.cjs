#!/usr/bin/env node
/** Thêm /sale-dashboard vào App.jsx như /sales-dashboard, giữ cùng auth guard. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const root=process.cwd();const dry=process.argv.includes('--dry-run');
function stop(m){console.error('V19.6:',m);process.exit(1);}
const rel=['src/App.jsx','src/App.tsx'].find(f=>fs.existsSync(path.join(root,f)));
if(!rel)stop('Không tìm thấy src/App.jsx hoặc App.tsx. Chưa sửa.');
if(!fs.existsSync(path.join(root,'src/features/sale/SaleDashboard.jsx')))stop('Chưa copy file SaleDashboard.jsx từ ZIP.');
let code=fs.readFileSync(path.join(root,rel),'utf8');
const original=code;
const importRegex=/^[\t ]*import\s+SaleDashboard\s+from\s+(['"])([^'"\r\n]+)\1\s*;?/m;
const correctImport="import SaleDashboard from './features/sale/SaleDashboard';";
if(importRegex.test(code))code=code.replace(importRegex,correctImport);
else {
  const marketingImport=/(^[\t ]*import\s+SalesDashboard\s+from\s+(['"])[^'"\r\n]+\2\s*;?)/m;
  if(!marketingImport.test(code))stop('Không thấy import SalesDashboard trong App, cần xem file App thực tế.');
  code=code.replace(marketingImport,`$1\n${correctImport}`);
}
function routeEnd(str,start){
  let depth=0,quoted='';
  for(let i=start;i<str.length-1;i++){
    const c=str[i];
    if(quoted){if(c==='\\')i++;else if(c===quoted)quoted='';continue;}
    if(c==='"'||c==="'"){quoted=c;continue;}
    if(c==='{')depth++;if(c==='}')depth--;
    if(depth===0&&c==='/'&&str[i+1]==='>')return i+2;
    if(depth===0&&c==='>')return -1;
  }
  return -1;
}
if(!/\bpath\s*=\s*(['"])\/sale-dashboard\1/.test(code)){
  const m=/\bpath\s*=\s*(['"])\/sales-dashboard\1/.exec(code);
  if(!m)stop('Không tìm thấy route /sales-dashboard để giữ cùng quyền truy cập.');
  const at=code.lastIndexOf('<Route',m.index);
  const end=at<0?-1:routeEnd(code,at);
  if(end<0)stop('Route Marketing có dạng JSX khác; không tự sửa. Hãy xem App.jsx.');
  const tag=code.slice(at,end);
  if(!/\bSalesDashboard\b/.test(tag))stop('Route Marketing không dùng SalesDashboard như dự kiến.');
  const replacement=tag.replace(/\bpath\s*=\s*(['"])\/sales-dashboard\1/,'path="/sale-dashboard"').replace(/\bSalesDashboard\b/g,'SaleDashboard');
  const indentation=(/\n([\t ]*)[^\n]*$/.exec(code.slice(0,at))||[])[1]||'';
  code=code.slice(0,end)+'\n'+indentation+replacement+code.slice(end);
}
if(code===original){console.log('V19.6: Route Sale đã đúng.');process.exit(0);}
console.log('V19.6:',dry?'XEM TRƯỚC':'THÊM ROUTE',rel,'=> /sale-dashboard (giữ guard Marketing)');
if(dry)process.exit(0);
const backup=path.join(root,'.pixelalbum-backups','v19-6-sale-route-'+new Date().toISOString().replace(/[:.]/g,'-'),rel);
try{fs.mkdirSync(path.dirname(backup),{recursive:true});fs.writeFileSync(backup,original);fs.writeFileSync(path.join(root,rel),code);}catch(e){try{fs.writeFileSync(path.join(root,rel),original);}catch{}stop('Không thể ghi App: '+e.message);}
console.log('OK. Backup tại '+path.relative(root,backup).replace(/\\/g,'/'));
