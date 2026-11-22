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
  }

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600" aria-label="Quyền riêng tư album">
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-blue-600" checked={allowed} onChange={onChange} aria-describedby="album-location-explanation" />
        <span className="font-semibold text-slate-800">Cho phép chia sẻ vị trí gần đúng khi xem album (không bắt buộc)</span>
      </label>
      <p id="album-location-explanation" className="mt-1 pl-7 text-xs leading-relaxed">
        Khi mở album, nếu trình duyệt đã cấp quyền vị trí, tỉnh/thành và tọa độ làm tròn khoảng 1 km sẽ được lưu trong lịch sử cho quản trị viên xem thay cho IP, kể cả xem trên Google Maps. Tọa độ đã làm tròn được gửi tới dịch vụ tra tên địa điểm và tới Google Maps khi quản trị viên mở bản đồ. Nếu không bật hoặc không lấy được vị trí, hệ thống dùng IP như trước. Lựa chọn được ghi nhớ trên trình duyệt này; bạn có thể tắt tại đây bất cứ lúc nào. Không ảnh hưởng đến việc mở album.
      </p>
      {error && <p role="alert" className="mt-1 pl-7 text-xs text-red-600">{error}</p>}
    </section>
  );
}
