import { useEffect, useState } from 'react';
import { hasAlbumLocationConsent, setAlbumLocationConsent } from '../services/albumLocation';

export default function AlbumLocationPreference() {
  const [allowed, setAllowed] = useState(hasAlbumLocationConsent);
  const [error, setError] = useState('');

  useEffect(() => {
    const sync = () => setAllowed(hasAlbumLocationConsent());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  function onChange(event) {
    const next = event.target.checked;
    const saved = setAlbumLocationConsent(next);
    setAllowed(hasAlbumLocationConsent());
    setError(saved ? '' : 'Không lưu được lựa chọn. Hãy kiểm tra cài đặt lưu trữ của trình duyệt.');
    // Chỉ xin quyền trình duyệt khi khách chủ động bật lựa chọn này.
    if (saved && next) {
      if (!window.isSecureContext || !navigator.geolocation) {
        setError('Trình duyệt không hỗ trợ định vị an toàn. Lượt xem sẽ dùng IP.');
      } else {
        navigator.geolocation.getCurrentPosition(() => {}, () => {
          if (hasAlbumLocationConsent()) setError('Chưa lấy được vị trí. Hãy kiểm tra quyền Vị trí của website trong trình duyệt.');
        }, { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 });
      }
    }
  }

  return (
    <details className="mx-auto mb-3 w-full max-w-7xl px-4 text-sm text-slate-600 sm:px-6">
      <summary className="cursor-pointer py-2 text-center text-xs font-medium text-slate-600 underline underline-offset-2">Quyền riêng tư và vị trí</summary>
      <section className="rounded-2xl border border-slate-200 bg-white px-4 py-3" aria-label="Quyền riêng tư album">
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-blue-600" checked={allowed} onChange={onChange} aria-describedby="album-location-explanation" />
        <span className="font-semibold text-slate-800">Cho phép chia sẻ vị trí gần đúng khi xem album (không bắt buộc)</span>
      </label>
      <p id="album-location-explanation" className="mt-1 pl-7 text-xs leading-relaxed">
        Khi bật lựa chọn này, trình duyệt có thể yêu cầu cấp quyền vị trí. Khi vào trang chi tiết có album, nếu quyền đã được cấp, website chuẩn bị tọa độ làm tròn khoảng 1 km trong bộ nhớ tạm để mở album nhanh. Chỉ khi bạn bấm xem album, tọa độ gần đây mới được gửi và lưu trong lịch sử cho quản trị viên xem thay cho IP, kể cả trên Google Maps. Nếu không bật hoặc vị trí chưa sẵn sàng, hệ thống dùng IP như trước. Lựa chọn được ghi nhớ trên trình duyệt này; bạn có thể tắt tại đây bất cứ lúc nào. Không ảnh hưởng đến việc mở album.
      </p>
      {error && <p role="alert" className="mt-1 pl-7 text-xs text-red-600">{error}</p>}
      </section>
    </details>
  );
}
