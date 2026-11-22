const geoip = require("geoip-lite");
const { isIP } = require("node:net");
const DeviceDetector = require("device-detector-js");
const deviceDetector = new DeviceDetector();

function normalizeIp(value) {
  if (typeof value !== 'string') return '';
  let ip = value.split(',')[0].trim();
  if (ip.startsWith('::ffff:') && isIP(ip.slice(7)) === 4) ip = ip.slice(7);
  if (isIP(ip)) return ip;
  // Không cắt địa chỉ IPv6 đầy đủ khi xử lý dạng IP:port.
  const bracketed = /^\[([^\]]+)\](?::\d+)?$/.exec(ip);
  if (bracketed && isIP(bracketed[1]) === 6) return bracketed[1];
  const ipv4Port = /^(\d+\.\d+\.\d+\.\d+):\d+$/.exec(ip);
  return ipv4Port && isIP(ipv4Port[1]) === 4 ? ipv4Port[1] : '';
}

function getClientIp(req) {
  for (const value of [req.headers['cf-connecting-ip'], req.headers['x-real-ip'], req.headers['x-forwarded-for'], req.ip, req.socket?.remoteAddress]) {
    const ip = normalizeIp(value);
    if (ip) return ip;
  }
  return '';
}
async function getIpLocation(ip) {
  if (!ip) return "Không rõ vị trí";
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.")
  ) {
    return "Localhost";
  }
  try {
    const geo = geoip.lookup(ip);
    if (geo && (geo.city || geo.country)) {
      const city = geo.city ? geo.city.trim() : "";
      const country = geo.country ? geo.country.trim() : "";
      if (city && country) return `${city}, ${country}`;
      if (city || country) return city || country;
    }
  } catch (e) {}
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`http://ipwho.is/${ip}`, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();
    if (data && data.success) {
      const city = data.city || "";
      const country = data.country_code || data.country || "";
      if (city && country) return `${city}, ${country}`;
      return city || country || ip;
    }
  } catch (err) {}
  return ip;
}

module.exports = { getClientIp, getIpLocation, deviceDetector, normalizeIp };
