// Public Open-Meteo endpoints: non-commercial use, no API key required.
export { getVisitorLocation } from './visitorLocation.js';
const cache = new Map();
const CACHE_MS = 10 * 60 * 1000;

async function fetchJSON(url, signal) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 12000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(response.status === 429
      ? 'Dịch vụ thời tiết đang quá tải. Vui lòng thử lại sau.'
      : 'Không tải được dữ liệu thời tiết. Vui lòng thử lại.');
    return await response.json();
  } catch (error) {
    if (timedOut) throw new Error('Kết nối thời tiết quá lâu. Vui lòng thử lại.', { cause: error });
    if (error.name === 'TypeError') throw new Error('Không kết nối được dịch vụ thời tiết. Hãy kiểm tra mạng.', { cause: error });
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

export async function getWeather(location, signal) {
  const { latitude, longitude } = location;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error('Tọa độ không hợp lệ.');
  // Round coordinates to about 1 km; no location is stored persistently.
  const key = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  const saved = cache.get(key);
  if (saved && Date.now() - saved.savedAt < CACHE_MS) return saved.data;
  const params = new URLSearchParams({
    latitude: latitude.toFixed(2), longitude: longitude.toFixed(2),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
    temperature_unit: 'celsius', wind_speed_unit: 'kmh', timezone: 'auto', forecast_days: '1',
  });
  const data = await fetchJSON(`https://api.open-meteo.com/v1/forecast?${params}`, signal);
  if (!Number.isFinite(data.current?.temperature_2m)) throw new Error('Chưa có dữ liệu thời tiết cho vị trí này.');
  if (cache.size >= 20) cache.delete(cache.keys().next().value);
  cache.set(key, { savedAt: Date.now(), data });
  return data;
}

export async function searchCities(name, signal) {
  if (name.trim().length < 2) throw new Error('Nhập ít nhất 2 ký tự tên thành phố.');
  const params = new URLSearchParams({ name: name.trim(), count: '5', language: 'vi', format: 'json' });
  const data = await fetchJSON(`https://geocoding-api.open-meteo.com/v1/search?${params}`, signal);
  return (data.results || []).map(city => ({
    latitude: city.latitude, longitude: city.longitude, id: city.id,
    label: [...new Set([city.name, city.admin1, city.country].filter(Boolean))].join(', '),
  }));
}

export function describeWeather(code, isDay = 1) {
  if (code === 0) return { icon: isDay ? '☀️' : '🌙', text: isDay ? 'Trời quang' : 'Đêm quang đãng' };
  if ([1, 2].includes(code)) return { icon: '🌤️', text: 'Ít mây' };
  if (code === 3) return { icon: '☁️', text: 'Nhiều mây' };
  if ([45, 48].includes(code)) return { icon: '🌫️', text: 'Sương mù' };
  if ([51, 53, 55, 56, 57].includes(code)) return { icon: '🌦️', text: 'Mưa phùn' };
  if ([61, 63, 65, 66, 67].includes(code)) return { icon: '🌧️', text: 'Có mưa' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: '❄️', text: 'Có tuyết' };
  if ([80, 81, 82].includes(code)) return { icon: '🌧️', text: 'Mưa rào' };
  if ([95, 96, 99].includes(code)) return { icon: '⛈️', text: 'Mưa dông' };
  return { icon: '🌡️', text: 'Thời tiết hiện tại' };
}
