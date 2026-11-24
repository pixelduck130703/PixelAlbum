#!/usr/bin/env node
/**
 * PixelAlbum V19.7 - yêu cầu thêm chỉ số thống kê đã có trong API Pancake.
 * Thay đổi tối thiểu đúng hàm getSaleReport hiện tại. Sao lưu trước khi sửa.
 * Chạy: node scripts/upgrade-sale-v19-7.cjs --dry-run
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(process.cwd(), 'server/services/pancakeSales.js');
const dry = process.argv.includes('--dry-run');
function stop(message) { console.error('V19.7:', message); process.exit(1); }
if (!fs.existsSync(file)) stop('Không thấy server/services/pancakeSales.js. Hãy chạy tại thư mục gốc birthday-search.');
const source = fs.readFileSync(file, 'utf8');
const start = source.indexOf('async function getSaleReport(');
if (start === -1) stop('Chưa có hàm getSaleReport. Hãy cài đầy đủ V19.6 trước.');
const end = source.indexOf('\nmodule.exports', start);
if (end === -1) stop('Không xác định được điểm kết thúc hàm getSaleReport. Giữ nguyên file để kiểm tra thủ công.');
const before = source.slice(0, start);
let body = source.slice(start, end);
const after = source.slice(end);
const additions = ["['select_fields[]','product_count']", "['select_fields[]','discount']", "['select_fields[]','shipping_fee']", "['select_fields[]','avg_price']"];
if (additions.every(value => body.includes(value))) { console.log('V19.7: 4 chỉ số API đã được cài, không cần làm lại.'); process.exit(0); }
if (body.includes(additions[0]) || body.includes(additions[1]) || body.includes(additions[2]) || body.includes(additions[3])) stop('Hàm API đã có một phần chỉ số khác với V19.7. Không tự sửa để tránh trùng.');
const anchor = "['select_fields[]','order_count'],";
if (!body.includes(anchor)) stop('Không thấy vị trí select_fields[] trong hàm getSaleReport. Không tự sửa.');
body = body.replace(anchor, `${anchor}\n    ${additions.map(a => `${a},`).join(' ')}`);
const updated = before + body + after;
console.log('V19.7:', dry ? 'XEM TRƯỚC, chưa thay đổi' : 'BỔ SUNG CHỈ SỐ SALE');
console.log(' - product_count, discount, shipping_fee, avg_price');
console.log(' - Không sửa Marketing, Kho hàng, database hoặc cấu hình bảo mật');
if (dry) process.exit(0);
const backupPath = path.join(process.cwd(), '.pixelalbum-backups', 'v19-7-sale-' + new Date().toISOString().replace(/[:.]/g, '-'), 'server/services/pancakeSales.js');
try {
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.writeFileSync(backupPath, source);
  fs.writeFileSync(file, updated);
  console.log('OK. Sao lưu:', path.relative(process.cwd(), backupPath));
  console.log('Khởi động lại backend sau khi cài.');
} catch (e) {
  try { fs.writeFileSync(file, source); } catch {}
  stop('Không cập nhật được: ' + e.message);
}
