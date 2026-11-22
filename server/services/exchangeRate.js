const URL = 'https://open.er-api.com/v6/latest/THB';
const HOUR = 60 * 60 * 1000;

// Nguồn công khai cập nhật một lần/ngày. Dùng cache chung và không gọi API mỗi phút.
function createExchangeRateReader({ fetchImpl = (...args) => fetch(...args), now = Date.now } = {}) {
  let cached = null;
  let retryAfter = 0;
  let pending = null;

  return async function getExchangeRate() {
    if (now() < retryAfter) {
      if (!cached) throw new Error('Tỷ giá chưa khả dụng');
      return { ...cached.value, stale: cached.failed || now() >= cached.nextUpdate };
    }
    if (pending) return pending;

    pending = (async () => {
      try {
        const response = await fetchImpl(URL, { signal: AbortSignal.timeout(8000), redirect: 'error' });
        if (!response.ok) throw new Error('Tỷ giá chưa khả dụng');
        const json = await response.json();
        const rate = json.rates?.VND;
        const updated = json.time_last_update_unix * 1000;
        const nextUpdate = json.time_next_update_unix * 1000;
        if (json.result !== 'success' || json.base_code !== 'THB' || !Number.isFinite(rate) || rate <= 0 || !Number.isFinite(updated) || updated <= 0 || !Number.isFinite(nextUpdate) || nextUpdate <= updated) {
          throw new Error('Dữ liệu tỷ giá không hợp lệ');
        }
        const value = { rate, updatedAt: new Date(updated).toISOString() };
        cached = { value, nextUpdate, failed: false };
        retryAfter = Math.max(now() + HOUR, nextUpdate);
        return { ...value, stale: now() >= nextUpdate };
      } catch (error) {
        retryAfter = now() + HOUR;
        if (!cached) throw error;
        cached.failed = true;
        return { ...cached.value, stale: true };
      }
    })();
    try { return await pending; }
    finally { pending = null; }
  };
}

module.exports = { createExchangeRateReader, getExchangeRate: createExchangeRateReader() };
