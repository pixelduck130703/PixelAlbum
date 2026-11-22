import { useEffect, useRef } from 'react';

export default function VisitorLocationDialog({ currentChoice, review, onChoose, onClose }) {
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.body.style.overflow = previous; };
  }, []);

  function handleKeyDown(event) {
    if (event.key === 'Escape') onClose();
    if (event.key === 'Tab') {
      const buttons = dialogRef.current?.querySelectorAll('button');
      if (!buttons?.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onKeyDown={handleKeyDown}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="location-dialog-title" aria-describedby="location-dialog-text" className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <header className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white">
          <p className="text-xs font-medium text-blue-100">MEMORIES · {review ? 'CÀI ĐẶT' : 'CHÀO MỪNG'}</p>
          <h2 id="location-dialog-title" className="mt-1 text-xl font-bold">Cho phép sử dụng vị trí?</h2>
        </header>
        <div className="space-y-3 p-5">
          {!review && <p className="text-sm text-slate-600">Chào mừng bạn! Tìm album bằng ngày sinh hoặc họ tên.</p>}
          <p id="location-dialog-text" className="text-sm leading-relaxed text-slate-700">Vị trí gần đúng (khoảng 1 km) được dùng để hiển thị thời tiết và tra tên khu vực. Nếu chọn cả album, website chuẩn bị vị trí trong bộ nhớ khi truy cập và chỉ lưu vào lịch sử cho quản trị viên xem trên Google Maps khi bạn mở album. Tọa độ làm tròn có thể gửi đến dịch vụ thời tiết, tra tên địa điểm và Google Maps khi mở bản đồ.</p>
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">Nếu chọn chỉ thời tiết hoặc không cho phép, lịch sử album dùng IP như trước. Bạn vẫn có thể xem album và đổi lựa chọn bất cứ lúc nào.</div>
          {review && <p className="text-xs font-semibold text-slate-600">Hiện tại: {currentChoice === 'both' ? 'Thời tiết và lịch sử album' : currentChoice === 'weather' ? 'Chỉ thời tiết' : 'Không dùng định vị'}</p>}
          <div className="grid gap-2 pt-1">
            <button type="button" onClick={() => onChoose('both')} className="min-h-11 rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Cho phép thời tiết và lịch sử album</button>
            <button type="button" onClick={() => onChoose('weather')} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Chỉ cho phép thời tiết</button>
            <button ref={closeRef} type="button" onClick={() => onChoose('none')} className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Không cho phép</button>
            {review && <button type="button" onClick={onClose} className="py-2 text-xs text-slate-500 underline">Hủy thay đổi</button>}
          </div>
        </div>
      </section>
    </div>
  );
}
