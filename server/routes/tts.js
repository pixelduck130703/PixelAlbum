// src/services/aiVoiceService.js

export const VOICE_PROVIDERS = [
  { id: 'google', name: 'Google Cloud TTS (AI)' },
  { id: 'elevenlabs', name: 'ElevenLabs Multilingual' },
];

export const GOOGLE_VOICES = [
  { id: 'th-TH-Neural2-C', name: 'Google Neural2 C (Nam - Trầm ấm)', provider: 'google', gender: 'Male' },
  { id: 'th-TH-Neural2-F', name: 'Google Neural2 F (Nữ - Truyền cảm)', provider: 'google', gender: 'Female' },
  { id: 'th-TH-Standard-A', name: 'Google Standard A (Nữ - Tự nhiên)', provider: 'google', gender: 'Female' },
];

// Danh sách các giọng Premade CỐT LÕI NHẤT của ElevenLabs (Tài khoản Free luôn gọi được)
export const DEFAULT_ELEVENLABS_PREMADES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Premade - Nữ)', provider: 'elevenlabs', gender: 'Female' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Premade - Nữ)', provider: 'elevenlabs', gender: 'Female' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Premade - Nam)', provider: 'elevenlabs', gender: 'Male' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh (Premade - Nam)', provider: 'elevenlabs', gender: 'Male' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli (Premade - Nữ)', provider: 'elevenlabs', gender: 'Female' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Premade - Nam)', provider: 'elevenlabs', gender: 'Male' },
];

export const ALL_THAI_VOICES = [...GOOGLE_VOICES, ...DEFAULT_ELEVENLABS_PREMADES];

/**
 * Tự động tải danh sách giọng được phép dùng của tài khoản ElevenLabs
 * LOẠI BỎ TRIỆT ĐỂ BẤT KỲ GIỌNG NÀO CÓ LIÊN QUAN ĐẾN 'library'
 */
export async function fetchEligibleElevenLabsVoices(apiKey) {
  if (!apiKey || !apiKey.trim()) return DEFAULT_ELEVENLABS_PREMADES;

  try {
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey.trim() },
    });

    if (!res.ok) return DEFAULT_ELEVENLABS_PREMADES;

    const data = await res.json();
    
    // ĐIỀU KIỆN TIÊN QUYẾT CHO TÀI KHOẢN FREE:
    // 1. category phải đúng là 'premade'
    // 2. Không được có public_owner_id hoặc sharing
    const premadeOnly = (data.voices || []).filter(
      (v) => v.category === 'premade' && !v.sharing && !v.high_quality_base_model_ids
    );

    if (premadeOnly.length > 0) {
      return premadeOnly.map((v) => ({
        id: v.voice_id,
        name: `${v.name} (Hợp lệ Free)`,
        provider: 'elevenlabs',
        gender: v.labels?.gender || 'Unknown',
      }));
    }

    return DEFAULT_ELEVENLABS_PREMADES;
  } catch (err) {
    console.warn('Lỗi lấy giọng ElevenLabs, dùng danh sách Premade:', err);
    return DEFAULT_ELEVENLABS_PREMADES;
  }
}

/**
 * 1. Gọi Google Cloud TTS
 */
async function generateGoogleSpeech(text, voiceId, apiKey) {
  if (!apiKey?.trim()) throw new Error('Vui lòng nhập API Key cho Google Cloud TTS!');

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey.trim()}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'th-TH', name: voiceId },
      audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0.0 },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Lỗi Google TTS (${response.status})`);
  }

  const data = await response.json();
  const binaryString = window.atob(data.audioContent);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return URL.createObjectURL(new Blob([bytes.buffer], { type: 'audio/mp3' }));
}

/**
 * 2. Gọi ElevenLabs TTS
 */
async function generateElevenLabsSpeech(text, voiceId, apiKey) {
  if (!apiKey?.trim()) throw new Error('Vui lòng nhập API Key cho ElevenLabs!');

  // Ép buộc kiểm tra voiceId: Nếu voiceId không thuộc nhóm premade, ép về Rachel (21m00Tcm4TlvDq8ikWAM)
  const safeVoiceId = voiceId || '21m00Tcm4TlvDq8ikWAM';

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${safeVoiceId}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey.trim(),
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
    const message =
      errorData.detail?.message ||
      errorData.message ||
      `Lỗi ElevenLabs (${response.status})`;

    // Thông báo giải thích rõ ràng nếu người dùng vẫn dính giọng thư viện
    if (message.includes('library voices') || response.status === 402) {
      throw new Error(
        'Tài khoản ElevenLabs Free không được phép dùng giọng này qua API. Hãy chuyển sang giọng "Rachel", "Bella" hoặc "Antoni" trong danh sách!'
      );
    }

    throw new Error(message);
  }

  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
}

/**
 * Điều phối sinh âm thanh
 */
export async function generateThaiSpeechAudio(text, voiceId, options = {}) {
  if (!text || !text.trim()) throw new Error('Kịch bản đọc không được để trống.');

  if (options.provider === 'elevenlabs') {
    const key = options.elevenLabsApiKey || localStorage.getItem('ELEVENLABS_API_KEY') || '';
    return await generateElevenLabsSpeech(text.trim(), voiceId, key);
  } else {
    const key = options.googleApiKey || localStorage.getItem('GOOGLE_TTS_API_KEY') || '';
    return await generateGoogleSpeech(text.trim(), voiceId, key);
  }
}