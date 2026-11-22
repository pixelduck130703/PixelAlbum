// Không để việc thống kê hoặc API định vị làm treo nút mở album.
export async function withinDeadline(task, milliseconds, fallback = null) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(task).catch(() => fallback),
      new Promise(resolve => { timer = setTimeout(() => resolve(fallback), milliseconds); }),
    ]);
  } finally { clearTimeout(timer); }
}

export async function recordAndOpenAlbum({ url, getHints, getLocation, hasConsent, postView, navigate, hintTimeout = 400, locationTimeout = 3500, postTimeout = 1800 }) {
  try {
    const [clientHints, sharedLocation] = await Promise.all([
      withinDeadline(getHints, hintTimeout),
      withinDeadline(() => hasConsent() ? getLocation() : null, locationTimeout),
    ]);
    const body = { clientHints, ...(sharedLocation && hasConsent() ? { sharedLocation } : {}) };
    await withinDeadline(() => postView(body, postTimeout), postTimeout);
  } finally {
    // Điều hướng cùng tab, không mở about:blank rồi chờ định vị trong tab nền.
    navigate(url);
  }
}
