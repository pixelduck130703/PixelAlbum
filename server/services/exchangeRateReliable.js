'use strict';

// Lớp dự phòng cho API THB -> VND. Không thay đổi bộ tính doanh số hoặc Pancake.
// Những nguồn này cung cấp tỷ giá tham chiếu, không phải tỷ giá mua/bán của ngân hàng.
const PROVIDERS = Object.freeze([
  { name: 'Frankfurter', url: 'https://api.frankfurter.dev/v2/rate/THB/VND', parse: (json) => ({ rate: json.rate, date: json.date }) },
  { name: 'Currency API', url: 'https://latest.currency-api.pages.dev/v1/currencies/thb.json', parse: (json) => ({ rate: json.thb?.vnd, date: json.date }) },
  { name: 'ExchangeRate API', url: 'https://open.er-api.com/v6/latest/THB', parse: (json) => ({ rate: json.result === 'success' && json.base_code === 'THB' ? json.rates?.VND : null, date: json.time_last_update_unix ? new Date(json.time_last_update_unix * 1000).toISOString() : null }) },
]);

function validRate(rate) {
  const n = Number(rate);
  // Guard against inverted pairs and malformed data; intentionally generous range.
  return Number.isFinite(n) && n >= 100 && n <= 2000 ? n : null;
}

function normalize(response, source, nowMs) {
  const rate = validRate(response?.rate);
  if (rate === null) throw new Error('Tỷ giá THB/VND không hợp lệ');
  const rawDate = response?.updatedAt ?? response?.date ?? null;
  const iso = rawDate && Number.isFinite(Date.parse(rawDate)) ? new Date(rawDate).toISOString() : new Date(nowMs).toISOString();
  return { rate, updatedAt: iso, stale: response?.stale === true, source };
}

async function fetchProvider(provider, fetchImpl, timeoutMs, nowMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(provider.url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response?.ok) throw new Error(`Nguồn ${provider.name} trả về ${response?.status || 'lỗi'}`);
    const json = await response.json();
    const parsed = provider.parse(json);
    return normalize(parsed, provider.name, nowMs);
  } finally {
    clearTimeout(timer);
  }
}

function createExchangeRateReliable({ fetchImpl = globalThis.fetch, now = Date.now, cacheMs = 6 * 60 * 60 * 1000, timeoutMs = 4500, maxStaleMs = 7 * 86400000, providers = PROVIDERS } = {}) {
  let cache = null;
  let cachedAt = 0;
  let inFlight = null;

  async function get(originalGetExchangeRate) {
    if (cache && now() - cachedAt < cacheMs) return { ...cache };
    if (inFlight) return inFlight;

    inFlight = (async () => {
      // Keep the currently deployed service as the primary provider.
      if (typeof originalGetExchangeRate === 'function') {
        try {
          let primaryTimeout;
          let primary;
          try {
            primary = await Promise.race([
              Promise.resolve().then(originalGetExchangeRate),
              new Promise((_, reject) => { primaryTimeout = setTimeout(() => reject(new Error('Hết thời gian chờ nguồn chính')), timeoutMs); }),
            ]);
          } finally { clearTimeout(primaryTimeout); }
          const result = normalize(primary, primary?.source || 'ExchangeRate API', now());
          if (!result.stale) { cache = result; cachedAt = now(); }
          return result;
        } catch { /* Next, try independent providers. */ }
      }

      try {
        // Use independent sources in parallel to minimize the user's wait.
        const response = await Promise.any(providers.map((provider) => fetchProvider(provider, fetchImpl, timeoutMs, now())));
        cache = response;
        cachedAt = now();
        return { ...response };
      } catch {
        if (cache && now() - cachedAt <= maxStaleMs) {
          return { ...cache, stale: true };
        }
        throw new Error('Không truy xuất được tỷ giá THB/VND từ các nguồn.');
      }
    })().finally(() => { inFlight = null; });
    return inFlight;
  }
  return { get };
}

const singleton = createExchangeRateReliable();
module.exports = {
  getExchangeRateReliable: singleton.get,
  createExchangeRateReliable,
  validRate,
};
