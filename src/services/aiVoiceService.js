// src/services/aiVoiceService.js

export const VOICE_PROVIDERS = [
  { id: 'gemini', name: 'Google AI Studio' },
  { id: 'elevenlabs', name: 'ElevenLabs Multilingual' },
];

export const GEMINI_TTS_VOICES = [
  { id: 'Sadaltager', name: 'Sadaltager (Nam - Hiểu biết, cao độ vừa)', provider: 'gemini', gender: 'Male' },
  { id: 'Aoede', name: 'Aoede (Nữ - Truyền cảm, bán hàng sôi nổi)', provider: 'gemini', gender: 'Female' },
  { id: 'Puck', name: 'Puck (Nam - Sôi nổi, cuốn hút)', provider: 'gemini', gender: 'Male' },
  { id: 'Charon', name: 'Charon (Nam - Trầm ấm, uy tín)', provider: 'gemini', gender: 'Male' },
  { id: 'Kore', name: 'Kore (Nữ - Êm dịu, tự nhiên)', provider: 'gemini', gender: 'Female' },
  { id: 'Fenrir', name: 'Fenrir (Nam - Mạnh mẽ, dứt khoát)', provider: 'gemini', gender: 'Male' },
];

export const GEMINI_VOICES = GEMINI_TTS_VOICES;

export const DEFAULT_ELEVENLABS_PREMADES = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George (Nam - Trầm ấm, tự nhiên)', provider: 'elevenlabs', gender: 'Male' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily (Nữ - Trong trẻo, truyền cảm)', provider: 'elevenlabs', gender: 'Female' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda (Nữ - Tự nhiên, thanh lịch)', provider: 'elevenlabs', gender: 'Female' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger (Nam - Sôi nổi, bán hàng)', provider: 'elevenlabs', gender: 'Male' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura (Nữ - Tươi sáng, quảng cáo)', provider: 'elevenlabs', gender: 'Female' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (Nam - Uy tín, phát thanh)', provider: 'elevenlabs', gender: 'Male' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Nữ - Truyền cảm)', provider: 'elevenlabs', gender: 'Female' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Nữ - Trẻ trung)', provider: 'elevenlabs', gender: 'Female' },
];

export const DEFAULT_ELEVENLABS_VOICES = DEFAULT_ELEVENLABS_PREMADES;
export const ALL_THAI_VOICES = [...GEMINI_TTS_VOICES, ...DEFAULT_ELEVENLABS_PREMADES];
export const THAI_VOICES = ALL_THAI_VOICES;

const audioCache = new Map();
const activeRequests = new Map();

export class RateLimitError extends Error {
  constructor(message, retryAfterSeconds = 20) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfterSeconds;
  }
}

export async function fetchAllElevenLabsVoices(apiKey) {
  if (!apiKey || !apiKey.trim()) return DEFAULT_ELEVENLABS_PREMADES;
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey.trim() },
    });
    if (!res.ok) return DEFAULT_ELEVENLABS_PREMADES;
    const data = await res.json();
    if (data.voices && data.voices.length > 0) {
      return data.voices.map((v) => ({
        id: v.voice_id,
        name: `${v.name} (${v.category || 'Custom'})`,
        provider: 'elevenlabs',
        gender: v.labels?.gender || 'Unknown',
      }));
    }
    return DEFAULT_ELEVENLABS_PREMADES;
  } catch (err) {
    console.warn('Lỗi lấy danh sách giọng ElevenLabs:', err);
    return DEFAULT_ELEVENLABS_PREMADES;
  }
}

function createWavBlobFromPcm(pcmBytes, sampleRate = 24000, numChannels = 1) {
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const buffer = new ArrayBuffer(44 + pcmBytes.length);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmBytes.length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, pcmBytes.length, true);

  new Uint8Array(buffer, 44).set(pcmBytes);
  return new Blob([buffer], { type: 'audio/wav' });
}

async function generateGeminiTtsSpeech(text, voiceName = 'Sadaltager', apiKey, expression = 'Peppy, bright, enthusiastic') {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Vui lòng nhập API Key cho Google AI Studio!');
  }

  const cleanKey = apiKey.trim();
  const modelName = 'gemini-3.8-flash-tts';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanKey}`;

  const payload = {
    contents: [
      {
        parts: [{ text: `[Tone: ${expression}]\n${text}` }],
      },
    ],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceName || 'Sadaltager',
          },
        },
      },
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (response.status === 429) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || '';
    const waitMatch = message.match(/retry in ([0-9.]+)s/);
    const waitSeconds = waitMatch ? Math.ceil(parseFloat(waitMatch[1])) : 20;

    throw new RateLimitError(
      `Đã chạm hạn mức của Gemini Free. Vui lòng chờ ${waitSeconds + 3} giây.`,
      waitSeconds + 3
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Lỗi Gemini TTS API (${response.status})`);
  }

  const result = await response.json();
  const candidatePart = result.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData && p.inlineData.mimeType?.startsWith('audio/')
  );

  if (!candidatePart) {
    throw new Error('Gemini TTS không phản hồi dữ liệu âm thanh.');
  }

  const base64Audio = candidatePart.inlineData.data;
  const binaryString = window.atob(base64Audio);
  const pcmBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    pcmBytes[i] = binaryString.charCodeAt(i);
  }

  const wavBlob = createWavBlobFromPcm(pcmBytes, 24000, 1);
  return URL.createObjectURL(wavBlob);
}

async function generateElevenLabsSpeech(text, voiceId, apiKey) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Vui lòng nhập ElevenLabs API Key ở ô cấu hình!');
  }

  const cleanKey = apiKey.trim();
  const safeVoiceId = (voiceId && voiceId.trim()) ? voiceId.trim() : 'JBFqnCBsd6RMkjVDRZzb';
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${safeVoiceId}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': cleanKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail?.message || errorData.message || `Lỗi ElevenLabs (${response.status})`;

    if (message.includes('library voices') || message.includes('Free users cannot use library voices')) {
      throw new Error(
        'Tài khoản Free không hỗ trợ giọng từ thư viện. Vui lòng chọn giọng mặc định (George, Lily, Matilda...) hoặc nâng cấp gói ElevenLabs!'
      );
    }
    if (response.status === 402 || message.includes('quota') || message.includes('credits')) {
      throw new Error('Tài khoản ElevenLabs đã hết hạn ngạch ký tự miễn phí của tháng.');
    }

    throw new Error(message);
  }

  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
}

export async function generateThaiSpeechAudio(text, voiceId, options = {}) {
  if (!text || !text.trim()) throw new Error('Kịch bản đọc không được để trống.');

  const provider = options.provider || 'gemini';
  const cleanText = text.trim();
  const cacheKey = `${provider}::${voiceId || 'default'}::${cleanText}`;

  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey);
  }

  if (activeRequests.has(cacheKey)) {
    return activeRequests.get(cacheKey);
  }

  const requestPromise = (async () => {
    try {
      let audioUrl;
      if (provider === 'elevenlabs') {
        const key = options.elevenLabsApiKey || localStorage.getItem('CUSTOM_ELEVENLABS_KEY') || '';
        audioUrl = await generateElevenLabsSpeech(cleanText, voiceId, key);
      } else {
        const key = options.geminiApiKey || localStorage.getItem('CUSTOM_GEMINI_KEY') || '';
        audioUrl = await generateGeminiTtsSpeech(cleanText, voiceId, key);
      }

      audioCache.set(cacheKey, audioUrl);
      return audioUrl;
    } finally {
      activeRequests.delete(cacheKey);
    }
  })();

  activeRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

function generateFallbackTimeline(count = 1) {
  if (count <= 1) {
    return [
      { imageIndex: 0, duration: 1.5, effect: 'flash', focus: 'full' },
      { imageIndex: 0, duration: 2.0, effect: 'kenburns', focus: 'top' },
      { imageIndex: 0, duration: 1.5, effect: 'pan', focus: 'bottom' },
      { imageIndex: 0, duration: 1.0, effect: 'pulse', focus: 'full' },
    ];
  }

  const perSlide = +(6 / count).toFixed(2);
  const effects = ['flash', 'kenburns', 'pan', 'pulse', 'zoomout'];
  return Array.from({ length: count }, (_, idx) => ({
    imageIndex: idx,
    duration: perSlide,
    effect: effects[idx % effects.length],
    focus: 'full',
  }));
}

export async function analyzeVideoScriptWithAi(promptText, imagesCount = 1, apiKey) {
  if (!apiKey || !apiKey.trim() || !promptText || !promptText.trim()) {
    return generateFallbackTimeline(imagesCount);
  }

  const cleanKey = apiKey.trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cleanKey}`;
  const isSingleImage = imagesCount <= 1;

  const systemInstruction = `Bạn là đạo diễn camera video TikTok thời trang.
Người dùng cung cấp ${imagesCount} ảnh sản phẩm (có thể chỉ có 1 ảnh duy nhất).
Nhiệm vụ: Phân bổ kịch bản thành chuỗi 3 đến 5 cảnh chuyển động camera sao cho TỔNG THỜI LƯỢNG TOÀN BỘ VIDEO XẤP XỈ ĐÚNG 6.0 GIÂY.
Các hiệu ứng hợp lệ: "kenburns", "zoomout", "pan", "flash", "pulse", "spin".
Các điểm lấy nét chuyển động camera ("focus"): "full" (toàn cảnh), "top" (cận cổ áo/ngực áo), "bottom" (form eo/ống quần), "center" (chi tiết họa tiết).
${isSingleImage ? 'LƯU Ý: Vì chỉ có 1 ảnh duy nhất, tất cả các cảnh đều đặt "imageIndex": 0 nhưng thay đổi "focus" và "effect" để tạo chuyển động camera mượt mà.' : ''}
Chỉ trả về JSON thuần (array), không bọc markdown:
[
  { "imageIndex": 0, "duration": 1.5, "effect": "flash", "focus": "full" },
  { "imageIndex": 0, "duration": 2.5, "effect": "kenburns", "focus": "top" },
  { "imageIndex": 0, "duration": 2.0, "effect": "pan", "focus": "bottom" }
]`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${systemInstruction}\n\nKịch bản chỉ đạo từ người dùng: ${promptText}` }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) throw new Error('Không thể phân tích qua Gemini AI');

    const data = await res.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const storyboard = JSON.parse(rawJson);

    if (Array.isArray(storyboard) && storyboard.length > 0) {
      return storyboard;
    }
    return generateFallbackTimeline(imagesCount);
  } catch (err) {
    console.warn('Fallback kịch bản 6s:', err.message);
    return generateFallbackTimeline(imagesCount);
  }
}