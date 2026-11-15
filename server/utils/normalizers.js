function normalizeSecurityAnswer(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}
function normalizeOptionalText(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}
function normalizeOptionalDate(value) {
  return value ? String(value).slice(0, 10) : null;
}

module.exports = { normalizeSecurityAnswer, normalizeOptionalText, normalizeOptionalDate };
