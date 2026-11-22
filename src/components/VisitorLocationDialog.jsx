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
          <h2 id="location-dialog-title" className="mt-1 text-xl font-bold">MEMORIES</h2>
        </header>
        <div className="space-y-3 p-5">
  {!review && (
    <>
      <p className="text-sm leading-6 text-slate-600">
        Bạn có thể tìm kiếm album bằng
        <strong> ngày sinh </strong>
        hoặc
        <strong> họ tên, lớp, địa điểm.</strong>
      </p>

      {/* Bật nhạc nền */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xl text-white shadow-sm">
            🔊
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Bật nhạc nền
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Nhấn vào biểu tượng loa ở góc dưới bên phải để
              phát nhạc nền và có trải nghiệm tốt hơn.
            </p>
          </div>
        </div>
      </div>

      {/* Tìm theo ngày sinh */}
      <div className="rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 p-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-500 text-xl text-white shadow-sm">
            🎂
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Ưu tiên tìm theo ngày sinh
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Nhập đúng <strong>ngày/tháng/năm</strong> để
              tìm kiếm nhanh và chính xác hơn.
            </p>
          </div>
        </div>
      </div>

      {/* Máy chủ miễn phí */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-xl text-white shadow-sm">
            ⏳
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Máy chủ miễn phí
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Lần truy cập đầu tiên có thể mất khoảng
              <strong> 30–60 giây </strong>
              để khởi động máy chủ.
            </p>
          </div>
        </div>
      </div>
    </>
  )}

  {/* Quyền vị trí */}

  {review && (
    <p className="text-xs font-semibold text-slate-600">
      Hiện tại: {
        currentChoice === "both"
          ? "Thời tiết và lịch sử album"
          : currentChoice === "weather"
          ? "Chỉ thời tiết"
          : "Không dùng định vị"
      }
    </p>
  )}

  <div className="grid gap-2 pt-1">
    <button
      type="button"
      onClick={() => onChoose("both")}
      className="min-h-11 rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700"
    >
      Đã hiểu
    </button>
  </div>
</div>
      </section>
    </div>
  );
}
