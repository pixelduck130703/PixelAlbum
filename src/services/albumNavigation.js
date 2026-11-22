// Gửi ngay trong click handler, không tạo tab trắng hoặc chờ định vị/API.
export function queueAlbumView(url, body, browser = globalThis.navigator, fetcher = globalThis.fetch) {
  const data = JSON.stringify(body);
  try {
    // Chuỗi text/plain tránh preflight; endpoint album hỗ trợ cả JSON cũ lẫn beacon.
    if (browser?.sendBeacon?.(url, data)) return;
  } catch { /* Fallback keepalive nếu trình duyệt không nhận beacon. */ }
  try {
    void Promise.resolve(fetcher(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: data, keepalive: true })).catch(() => {});
  } catch { /* Không để lỗi mạng chặn album. */ }
}

export function recordAndOpenAlbum({ url, getHints, getLocation, hasConsent, postView, navigate }) {
  try {
    const clientHints = getHints() || null;
    const sharedLocation = hasConsent() ? getLocation() : null;
    const body = { clientHints, ...(sharedLocation && hasConsent() ? { sharedLocation } : {}) };
    void Promise.resolve(postView(body)).catch(() => {});
  } catch { /* Một lỗi thống kê không thể ngăn hành động mở album. */ }
  finally {
    navigate(url);
  }
}
