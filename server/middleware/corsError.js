function corsError(error, req, res, next) {
  if (error.message.includes("CORS")) {
    return res.status(403).json({ success: false, message: error.message });
  }
  next(error);
}
module.exports = corsError;
