// server/routes/tts.js
const express = require('express');
const router = express.Router();

const VOICE_PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini TTS (AI Studio)' },
  { id: 'elevenlabs', name: 'ElevenLabs Multilingual' },
];

const GEMINI_TTS_VOICES = [
  { id: 'Sadaltager', name: 'Sadaltager (Nam - Hiểu biết, cao độ vừa)', provider: 'gemini', gender: 'Male' },
  { id: 'Aoede', name: 'Aoede (Nữ - Truyền cảm, bán hàng sôi nổi)', provider: 'gemini', gender: 'Female' },
  { id: 'Puck', name: 'Puck (Nam - Sôi nổi, cuốn hút)', provider: 'gemini', gender: 'Male' },
  { id: 'Charon', name: 'Charon (Nam - Trầm ấm, uy tín)', provider: 'gemini', gender: 'Male' },
  { id: 'Kore', name: 'Kore (Nữ - Êm dịu, tự nhiên)', provider: 'gemini', gender: 'Female' },
  { id: 'Fenrir', name: 'Fenrir (Nam - Mạnh mẽ, dứt khoát)', provider: 'gemini', gender: 'Male' },
];

const DEFAULT_ELEVENLABS_PREMADES = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George (Nam - Trầm ấm, tự nhiên)', provider: 'elevenlabs', gender: 'Male' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily (Nữ - Trong trẻo, truyền cảm)', provider: 'elevenlabs', gender: 'Female' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda (Nữ - Tự nhiên, thanh lịch)', provider: 'elevenlabs', gender: 'Female' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger (Nam - Sôi nổi, bán hàng)', provider: 'elevenlabs', gender: 'Male' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura (Nữ - Tươi sáng, quảng cáo)', provider: 'elevenlabs', gender: 'Female' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (Nam - Uy tín, phát thanh)', provider: 'elevenlabs', gender: 'Male' },
];

// Định nghĩa các route xử lý tại đây (nếu có)
router.get('/voices', (req, res) => {
  res.json({
    gemini: GEMINI_TTS_VOICES,
    elevenlabs: DEFAULT_ELEVENLABS_PREMADES,
  });
});

// Xuất theo chuẩn CommonJS
module.exports = router;
module.exports.VOICE_PROVIDERS = VOICE_PROVIDERS;
module.exports.GEMINI_TTS_VOICES = GEMINI_TTS_VOICES;
module.exports.DEFAULT_ELEVENLABS_PREMADES = DEFAULT_ELEVENLABS_PREMADES;