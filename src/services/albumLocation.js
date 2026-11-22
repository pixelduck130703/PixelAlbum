import { getVisitorLocationPreference, saveVisitorLocationPreference } from './visitorLocation.js';

// Chỉ lưu lựa chọn, không lưu tọa độ vào localStorage.
export function hasAlbumLocationConsent(storage) {
  return getVisitorLocationPreference(storage) === 'both';
}

export function setAlbumLocationConsent(allowed, storage) {
  return saveVisitorLocationPreference(allowed === true ? 'both' : 'none', storage);
}

// Chỉ chuẩn bị vị trí gần đúng trong bộ nhớ (không gửi mạng, không localStorage).
export function createPreparedAlbumLocation({ hasConsent, browser = globalThis.navigator, secure = globalThis.isSecureContext, now = Date.now, ttl = 120000 } = {}) {
  let permission = null;
  let cached = null;
  let disposed = false;
  let pending = null;
  const get = () => {
    if (disposed || !hasConsent() || permission?.state !== 'granted' || !cached || now() >= cached.expiresAt) {
      cached = null;
      return null;
    }
    return cached.value;
  };
  const prepare = () => {
    if (get() || disposed || !hasConsent() || !secure || !browser?.permissions?.query || !browser?.geolocation?.getCurrentPosition) return Promise.resolve();
    if (pending) return pending;
    pending = (async () => {
      try {
        permission = await browser.permissions.query({ name: 'geolocation' });
        if (disposed || !hasConsent() || permission.state !== 'granted') return;
        const position = await new Promise((resolve, reject) => browser.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }));
        if (disposed || !hasConsent() || permission.state !== 'granted') return;
        const { latitude, longitude } = position.coords || {};
        if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180) return;
        const timestamp = Number.isFinite(position.timestamp) ? Math.min(now(), position.timestamp) : now();
        cached = { expiresAt: timestamp + ttl, value: { consent: true, latitude: Number(latitude.toFixed(2)), longitude: Number(longitude.toFixed(2)), label: '' } };
      } catch { /* Không có vị trí: dùng IP. */ }
      finally { pending = null; }
    })();
    return pending;
  };
  return { prepare, get, dispose: () => { disposed = true; cached = null; permission = null; } };
}

// Chỉ dùng vị trí cho lượt xem khi có đồng ý riêng, không tái sử dụng ngầm
// quyền được cấp cho dự báo thời tiết. Không xin quyền trình duyệt mới.
export async function getSharedAlbumLocation(consented, browser = globalThis.navigator, secure = globalThis.isSecureContext, fetcher = globalThis.fetch) {
  if (!consented || !secure || !browser?.permissions?.query || !browser?.geolocation?.getCurrentPosition) return null;
  try {
    const permission = await browser.permissions.query({ name: 'geolocation' });
    if (permission.state !== 'granted') return null;
    const coords = await new Promise((resolve, reject) => {
      browser.geolocation.getCurrentPosition(({ coords: position }) => resolve(position), reject, {
        enableHighAccuracy: false, timeout: 4000, maximumAge: 0,
      });
    });
    if (!Number.isFinite(coords.latitude) || Math.abs(coords.latitude) > 90 || !Number.isFinite(coords.longitude) || Math.abs(coords.longitude) > 180) return null;
    const latitude = Number(coords.latitude.toFixed(2));
    const longitude = Number(coords.longitude.toFixed(2));
    let label = '';
    // Chỉ gửi tọa độ đã làm tròn để tìm tên tỉnh/thành, không gửi vị trí chi tiết.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    try {
      const params = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), localityLanguage: 'vi' });
      const response = await fetcher(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`, { signal: controller.signal });
      if (response.ok) {
        const data = await response.json();
        label = [data.city || data.principalSubdivision || data.locality, data.countryName].filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()).join(', ').slice(0, 160);
      }
    } catch { /* Vẫn ghi tọa độ gần đúng nếu không tra được tên thành phố. */ }
    finally { clearTimeout(timer); }
    return { consent: true, latitude, longitude, label };
  } catch { return null; }
}

// Không dùng IP cuối ngày để hiển thị vị trí của một lượt đã chia sẻ GPS.
export function albumLocationDisplay(detail, daily) {
  if (detail?.locationSource === 'shared') {
    const { consent, latitude, longitude } = detail.sharedLocation || {};
    const validCoordinates = consent === true && Number.isFinite(latitude) && Math.abs(latitude) <= 90 && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
    const coordinates = validCoordinates ? `${latitude.toFixed(2)},${longitude.toFixed(2)}` : null;
    return {
      label: detail.location || 'Vị trí đã chia sẻ',
      title: 'Vị trí gần đúng do người xem đồng ý chia sẻ (không lưu IP cho lượt này)' + (coordinates ? ` · ${coordinates} · Mở Google Maps` : ''),
      shared: true,
      mapsUrl: coordinates ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}` : null,
    };
  }
  const ip = Object.hasOwn(detail || {}, 'ipAddress') ? detail.ipAddress : (daily?.ipAddress || daily?.ip_address);
  return { label: detail?.location || ip || 'Không rõ vị trí', title: ip ? `IP: ${ip} · Vị trí ước lượng theo IP` : 'Chưa có IP', shared: false, mapsUrl: null };
}
