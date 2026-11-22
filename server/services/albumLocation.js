// Dữ liệu chia sẻ từ client không phải chứng cứ xác minh vị trí thực tế.
function normalizeSharedLocation(value) {
  if (!value || value.consent !== true || typeof value.latitude !== 'number' || typeof value.longitude !== 'number' || !Number.isFinite(value.latitude) || !Number.isFinite(value.longitude) || Math.abs(value.latitude) > 90 || Math.abs(value.longitude) > 180) return null;
  const latitude = Number(value.latitude.toFixed(2));
  const longitude = Number(value.longitude.toFixed(2));
  const label = typeof value.label === 'string' ? value.label.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 160) : '';
  return { latitude, longitude, label, consent: true };
}

async function resolveAlbumLocation(req, getClientIp, getIpLocation) {
  const sharedLocation = normalizeSharedLocation(req.body?.sharedLocation);
  if (sharedLocation) {
    const { latitude, longitude, label } = sharedLocation;
    return { ipAddress: null, location: label || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`, locationSource: 'shared', sharedLocation };
  }
  const ipAddress = getClientIp(req) || null;
  return { ipAddress, location: await getIpLocation(ipAddress), locationSource: 'ip', sharedLocation: null };
}

module.exports = { normalizeSharedLocation, resolveAlbumLocation };
