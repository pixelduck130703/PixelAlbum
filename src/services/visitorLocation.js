// Chỉ lưu lựa chọn mục đích; tọa độ giữ tạm trong bộ nhớ của trang.
export const VISITOR_LOCATION_KEY = 'pixelalbum.visitor-location-choice.v1';
const CHOICES = ['both', 'weather', 'none'];
const TTL = 120000;

export function getVisitorLocationPreference(storage) {
  try {
    const value = (storage ?? globalThis.localStorage).getItem(VISITOR_LOCATION_KEY);
    return CHOICES.includes(value) ? value : null;
  } catch { return null; }
}

export function saveVisitorLocationPreference(choice, storage) {
  if (!CHOICES.includes(choice)) return false;
  try {
    (storage ?? globalThis.localStorage).setItem(VISITOR_LOCATION_KEY, choice);
    return true;
  } catch { return false; }
}

export function createVisitorLocationManager({ getChoice = getVisitorLocationPreference, browser = globalThis.navigator, secure = globalThis.isSecureContext, now = Date.now, fetcher = globalThis.fetch } = {}) {
  let cached = null;
  let permission = null;
  let pending = null;
  let generation = 0;
  const allowed = choice => choice === 'both' || choice === 'weather';
  const clear = () => { generation++; cached = null; permission = null; pending = null; };
  const fresh = () => {
    if (!cached) return null;
    if (cached.choice !== getChoice() || now() >= cached.expiresAt || permission?.state !== 'granted') { cached = null; return null; }
    return cached;
  };
  const getAlbumLocation = () => {
    const entry = fresh();
    if (getChoice() !== 'both' || !entry) return null;
    return { consent: true, latitude: entry.latitude, longitude: entry.longitude, label: entry.label || '' };
  };
  async function lookup(entry) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    try {
      const params = new URLSearchParams({ latitude: String(entry.latitude), longitude: String(entry.longitude), localityLanguage: 'vi' });
      const response = await fetcher(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`, { signal: controller.signal });
      if (response.ok) {
        const data = await response.json();
        const label = [data.city || data.principalSubdivision || data.locality, data.countryName].filter(x => typeof x === 'string' && x.trim()).join(', ').slice(0, 160);
        if (cached === entry && getChoice() === entry.choice) entry.label = label;
      }
    } catch { /* Tọa độ vẫn dùng được nếu dịch vụ tra tên lỗi. */ }
    finally { clearTimeout(timer); }
    return entry.label || 'Vị trí của bạn';
  }
  function request({ allowPrompt = false } = {}) {
    const choice = getChoice();
    if (!allowed(choice)) return Promise.reject(new Error('Chưa bật định vị. Bạn có thể tìm thành phố hoặc đổi quyền vị trí.'));
    if (!secure || !browser?.geolocation?.getCurrentPosition) return Promise.reject(new Error('Trình duyệt không hỗ trợ định vị an toàn.'));
    if (fresh()) return Promise.resolve(cached);
    if (pending?.choice === choice) return pending.promise;
    const token = generation;
    const check = () => browser.permissions?.query ? browser.permissions.query({ name: 'geolocation' }) : Promise.resolve(null);
    const read = () => new Promise((resolve, reject) => browser.geolocation.getCurrentPosition(resolve, error => reject(new Error({ 1: 'Quyền vị trí bị chặn.', 2: 'Chưa xác định được vị trí.', 3: 'Lấy vị trí quá lâu.' }[error.code] || 'Không lấy được vị trí.')), { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }));
    // Click chọn mục đích: yêu cầu quyền ngay. Các lần tự động chỉ khi đã granted.
    const acquisition = allowPrompt ? read() : check().then(status => {
      if (token !== generation || getChoice() !== choice || status?.state !== 'granted') throw new Error('Quyền vị trí chưa được cấp.');
      permission = status;
      return read();
    });
    const promise = acquisition.then(async position => {
      if (token !== generation || getChoice() !== choice) throw new Error('Lựa chọn vị trí đã thay đổi.');
      const { latitude, longitude } = position.coords || {};
      if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180) throw new Error('Tọa độ không hợp lệ.');
      const timestamp = Number.isFinite(position.timestamp) ? Math.min(now(), position.timestamp) : now();
      const entry = { latitude: Number(latitude.toFixed(2)), longitude: Number(longitude.toFixed(2)), label: '', choice, expiresAt: timestamp + TTL };
      // Kiểm tra quyền sau lần cấp đầu tiên, không suy ra quyền lưu lịch sử từ thời tiết.
      try { const status = await check(); if (token === generation) permission = status; } catch { /* Không có Permissions API thì chỉ dùng cho thời tiết. */ }
      if (token !== generation || getChoice() !== choice) throw new Error('Lựa chọn vị trí đã thay đổi.');
      cached = entry;
      entry.labelPromise = lookup(entry);
      return entry;
    }).finally(() => { if (pending?.promise === promise) pending = null; });
    pending = { choice, promise };
    return promise;
  }
  return { request, getAlbumLocation, clear };
}

let manager;
const getManager = () => manager ??= createVisitorLocationManager();
export function getVisitorLocation(options) { return getManager().request(options); }
export function getCachedAlbumLocation() { return getManager().getAlbumLocation(); }
export function clearVisitorLocation() { manager?.clear(); }
export async function resolveVisitorCityName(location) { return location?.label || (location?.labelPromise ? await location.labelPromise : 'Vị trí của bạn'); }
