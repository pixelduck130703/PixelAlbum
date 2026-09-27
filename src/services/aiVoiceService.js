// src/services/aiVoiceService.js

export const VOICE_PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini TTS (AI Studio)' },
  { id: 'elevenlabs', name: 'ElevenLabs Multilingual' },
];

// Danh sách giọng chuẩn của Gemini 3.8 Flash TTS
export const GEMINI_TTS_VOICES = [
  { id: 'Sadaltager', name: 'Sadaltager (Nam - Hiểu biết, cao độ vừa)', provider: 'gemini', gender: 'Male' },
  { id: 'Aoede', name: 'Aoede (Nữ - Truyền cảm, bán hàng sôi nổi)', provider: 'gemini', gender: 'Female' },
  { id: 'Puck', name: 'Puck (Nam - Sôi nổi, cuốn hút)', provider: 'gemini', gender: 'Male' },
  { id: 'Charon', name: 'Charon (Nam - Trầm ấm, uy tín)', provider: 'gemini', gender: 'Male' },
  { id: 'Kore', name: 'Kore (Nữ - Êm dịu, tự nhiên)', provider: 'gemini', gender: 'Female' },
  { id: 'Fenrir', name: 'Fenrir (Nam - Mạnh mẽ, dứt khoát)', provider: 'gemini', gender: 'Male' },
];

// Giữ alias tránh lỗi import nếu file khác gọi GEMINI_VOICES
export const GEMINI_VOICES = GEMINI_TTS_VOICES;

// Danh sách giọng mặc định gốc của ElevenLabs (Tài khoản Free không bị chặn)
export const DEFAULT_ELEVENLABS_PREMADES = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George (Nam - Trầm ấm, tự nhiên)', provider: 'elevenlabs', gender: 'Male' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily (Nữ - Trong trẻo, truyền cảm)', provider: 'elevenlabs', gender: 'Female' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda (Nữ - Tự nhiên, thanh lịch)', provider: 'elevenlabs', gender: 'Female' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger (Nam - Sôi nổi, bán hàng)', provider: 'elevenlabs', gender: 'Male' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura (Nữ - Tươi sáng, quảng cáo)', provider: 'elevenlabs', gender: 'Female' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (Nam - Uy tín, phát thanh)', provider: 'elevenlabs', gender: 'Male' },
];

export const ALL_THAI_VOICES = [...GEMINI_TTS_VOICES, ...DEFAULT_ELEVENLABS_PREMADES];
export const THAI_VOICES = ALL_THAI_VOICES;

// Đóng gói mảng byte PCM thô 24kHz từ Gemini thành chuẩn WAV Blob
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
  view.setUint16(20, 1, true); // PCM format
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

/**
 * Gọi chuẩn Gemini 3.8 Flash TTS từ Google AI Studio
 */
async function generateGeminiTtsSpeech(text, voiceName = 'Sadaltager', apiKey, expression = 'Peppy, bright, enthusiastic') {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Vui lòng nhập API Key cho Google Gemini TTS!');
  }

  const cleanKey = apiKey.trim();
  const modelName = 'gemini-3.8-flash-tts';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `[Tone: ${expression}]\n${text}`,
          },
        ],
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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Lỗi Gemini TTS API (${response.status})`);
  }

  const result = await response.json();
  const candidatePart = result.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData && p.inlineData.mimeType?.startsWith('audio/')
  );

  if (!candidatePart) {
    throw new Error('Gemini TTS không phản hồi dữ liệu âm thanh. Vui lòng kiểm tra lại kịch bản.');
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

/**
 * 2. Gọi ElevenLabs API (Dùng model multilingual_v2 để đọc tiếng Thái)
 */
async function generateElevenLabsSpeech(text, voiceId, apiKey) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Vui lòng nhập ElevenLabs API Key (bắt đầu bằng sk_...) ở ô cấu hình!');
  }

  const cleanKey = apiKey.trim();
  // Nếu voiceId bị trống hoặc ID cũ, tự động fallback về George (JBFqnCBsd6RMkjVDRZzb)
  const safeVoiceId = voiceId || 'JBFqnCBsd6RMkjVDRZzb';
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
    
    if (message.includes('library voices')) {
      throw new Error('Giọng này thuộc thư viện trả phí. Hãy chọn một trong các giọng: George, Lily, Matilda, Roger trong danh sách!');
    }
    if (response.status === 402 || message.includes('quota') || message.includes('credits')) {
      throw new Error('Tài khoản ElevenLabs Free đã hết hạn ngạch ký tự miễn phí của tháng (402 Payment Required).');
    }
    throw new Error(message);
  }

  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
}

/**
 * Hàm điều phối chính
 */
export async function generateThaiSpeechAudio(text, voiceId, options = {}) {
  if (!text || !text.trim()) throw new Error('Kịch bản đọc không được để trống.');

  if (options.provider === 'elevenlabs') {
    const key = options.elevenLabsApiKey || localStorage.getItem('CUSTOM_ELEVENLABS_KEY') || '';
    return await generateElevenLabsSpeech(text.trim(), voiceId, key);
  } else {
    const key = options.geminiApiKey || localStorage.getItem('CUSTOM_GEMINI_KEY') || '';
    return await generateGeminiTtsSpeech(text.trim(), voiceId, key);
  }
}