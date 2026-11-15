const geoip = require("geoip-lite");
const DeviceDetector = require("device-detector-js");
const deviceDetector = new DeviceDetector();

function getClientIp(req) {
  let ip =
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    (req.headers["x-forwarded-for"]
      ? req.headers["x-forwarded-for"].split(",")[0].trim()
      : null) ||
    req.ip ||
    req.socket?.remoteAddress ||
    "";
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }
  if (ip.includes(":") && !ip.includes("::")) {
    ip = ip.split(":")[0];
  }
  return ip.trim();
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

module.exports = { getClientIp, getIpLocation, deviceDetector };
