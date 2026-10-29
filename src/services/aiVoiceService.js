export const VOICE_PROVIDERS = [
  { id: 'gemini', name: 'Google AI Studio' },
  { id: 'elevenlabs', name: 'ElevenLabs (Chưa hay)' },
];

// DANH SÁCH GIỌNG GEMINI TTS (MẶC ĐỊNH LÀ ORUS Ở ĐẦU TIÊN)
export const GEMINI_TTS_VOICES = [
  { 
    id: 'Orus', 
    name: 'Orus (Nam)', 
    provider: 'gemini', 
    gender: 'Male',

  },
  { 
    id: 'Sadaltager', 
    name: 'Sadaltager (Nam)', 
    provider: 'gemini', 
    gender: 'Male',

  },
  { 
    id: 'Aoede', 
    name: 'Aoede (Nữ)', 
    provider: 'gemini', 
    gender: 'Female',

  },
  { 
    id: 'Kore', 
    name: 'Kore (Nữ)', 
    provider: 'gemini', 
    gender: 'Female',

  },
  { 
    id: 'Zephyr', 
    name: 'Zephyr (Nữ)', 
    provider: 'gemini', 
    gender: 'Female',

  },
  { 
    id: 'Leda', 
    name: 'Leda (Nữ)', 
    provider: 'gemini', 
    gender: 'Female',

  },
  { 
    id: 'Calliope', 
    name: 'Calliope (Nữ)', 
    provider: 'gemini', 
    gender: 'Female',

  },
  { 
    id: 'Puck', 
    name: 'Puck (Nam)', 
    provider: 'gemini', 
    gender: 'Male',

  },

  { 
    id: 'Fenrir', 
    name: 'Fenrir (Nam)', 
    provider: 'gemini', 
    gender: 'Male',

  },
  { 
    id: 'Charon', 
    name: 'Charon (Nam)', 
    provider: 'gemini', 
    gender: 'Male',

  },
];

export const GEMINI_VOICES = GEMINI_TTS_VOICES;

export const DEFAULT_ELEVENLABS_PREMADES = [
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George (Nam)', provider: 'elevenlabs', gender: 'Male' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily (Nữ)', provider: 'elevenlabs', gender: 'Female' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda (Nữ)', provider: 'elevenlabs', gender: 'Female' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger (Nam)', provider: 'elevenlabs', gender: 'Male' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura (Nữ)', provider: 'elevenlabs', gender: 'Female' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (Nam)', provider: 'elevenlabs', gender: 'Male' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Nữ)', provider: 'elevenlabs', gender: 'Female' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (Nữ)', provider: 'elevenlabs', gender: 'Female' },
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
        name: `${v.name} (${String(v.labels?.gender || '').toLowerCase() === 'male' ? 'Nam' : String(v.labels?.gender || '').toLowerCase() === 'female' ? 'Nữ' : 'Chưa rõ giới tính'})`,
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

async function getDynamicAvailableModels(apiKey) {
  const cleanKey = apiKey.trim();
  const listRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`
  );
  const listData = await listRes.json();

  if (!listRes.ok) {
    throw new Error(
      listData.error?.message ||
        'API Key không hợp lệ. Vui lòng lấy key tại https://aistudio.google.com/apikey'
    );
  }

  const models = (listData.models || [])
    .filter(
      (m) =>
        m.supportedGenerationMethods &&
        m.supportedGenerationMethods.includes('generateContent') &&
        !m.name.includes('embedding') &&
        !m.name.includes('aqa')
    )
    .map((m) => m.name.replace('models/', ''));

  models.sort((a, b) => {
    const getPriority = (name) => {
      if (name.includes('2.5-flash')) return 10;
      if (name.includes('3.8-flash')) return 9;
      if (name.includes('2.0-flash')) return 8;
      if (name.includes('flash')) return 7;
      if (name.includes('2.5-pro')) return 6;
      if (name.includes('pro')) return 5;
      return 1;
    };
    return getPriority(b) - getPriority(a);
  });

  return models;
}

async function generateGeminiTtsSpeech(text, voiceName = 'Orus', apiKey) {
  const cleanKey = (apiKey || localStorage.getItem('CUSTOM_GEMINI_KEY') || localStorage.getItem('user_gemini_api_key') || '').trim();
  if (!cleanKey) {
    throw new Error('Vui lòng nhập API Key cho Google AI Studio!');
  }

  // Một hướng dẫn đọc chung cho tất cả giọng Gemini.
  const expression = 'Dynamic fashion review voice, modern Thai e-commerce style, upbeat rhythm, highly confident, friendly yet aggressive selling tone, sharp and engaging pronunciation.';

  let modelsToTry = ['gemini-2.5-flash', 'gemini-3.8-flash-tts', 'gemini-2.0-flash'];
  try {
    const liveModels = await getDynamicAvailableModels(cleanKey);
    const liveFlash = liveModels.filter((m) => m.includes('flash'));
    if (liveFlash.length > 0) modelsToTry = [...liveFlash, ...modelsToTry];
  } catch (e) {
    // fallback
  }

  let lastErr = null;
  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
    const payload = {
      contents: [
        {
          parts: [{ text: `[Voice Direction: ${expression}]\n${text}` }],
        },
      ],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName || 'Orus',
            },
          },
        },
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 429) {
        throw new RateLimitError('Đã chạm hạn mức của Gemini. Vui lòng chờ 20 giây.', 20);
      }

      if (response.ok) {
        const result = await response.json();
        const candidatePart = result.candidates?.[0]?.content?.parts?.find(
          (p) => p.inlineData && p.inlineData.mimeType?.startsWith('audio/')
        );

        if (candidatePart) {
          const base64Audio = candidatePart.inlineData.data;
          const binaryString = window.atob(base64Audio);
          const pcmBytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            pcmBytes[i] = binaryString.charCodeAt(i);
          }
          const wavBlob = createWavBlobFromPcm(pcmBytes, 24000, 1);
          return URL.createObjectURL(wavBlob);
        }
      }
    } catch (e) {
      if (e instanceof RateLimitError) throw e;
      lastErr = e;
    }
  }

  throw lastErr || new Error('Không thể tạo âm thanh từ Gemini TTS.');
}

async function generateElevenLabsSpeech(text, voiceId, apiKey) {
  const cleanKey = (apiKey || localStorage.getItem('CUSTOM_ELEVENLABS_KEY') || '').trim();
  if (!cleanKey) {
    throw new Error('Vui lòng nhập ElevenLabs API Key ở ô cấu hình!');
  }

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
    throw new Error(errorData.detail?.message || errorData.message || `Lỗi ElevenLabs (${response.status})`);
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

async function compressImageForAI(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxDim = 800;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Không thể đọc dữ liệu ảnh.'));
    img.src = url;
  });
}

export async function extractFrameFromVideo(videoUrl) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    let isDone = false;
    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
    };

    const capture = () => {
      if (isDone) return;
      isDone = true;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 720;
        canvas.height = Math.round((720 * (video.videoHeight || 1280)) / (video.videoWidth || 720));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        cleanup();
        resolve(dataUrl);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onloadedmetadata = () => {
      const targetTime = video.duration > 2 ? 1.0 : (video.duration || 1) / 2;
      video.currentTime = Math.max(0.1, targetTime);
    };

    video.onseeked = () => capture();
    video.oncanplay = () => {
      if (video.videoWidth > 0 && !isDone) capture();
    };

    video.onerror = () => {
      if (!isDone) {
        isDone = true;
        cleanup();
        reject(new Error('Không thể đọc dữ liệu từ video để chụp khung hình.'));
      }
    };

    video.src = videoUrl;

    setTimeout(() => {
      if (!isDone) {
        if (video.videoWidth > 0) capture();
        else {
          isDone = true;
          cleanup();
          reject(new Error('Hết thời gian chờ đọc khung hình từ video.'));
        }
      }
    }, 4500);
  });
}

const HIDDEN_PROMPT = `Bạn là chuyên gia phân tích thiết kế thời trang nam và nữ, đồng thời là biên kịch quảng cáo chuyên nghiệp dành cho thị trường Thái Lan.
Hãy phân tích thật kỹ sản phẩm thời trang trong HÌNH ẢNH hoặc VIDEO tôi cung cấp, sau đó tạo một đoạn mô tả quảng cáo bằng tiếng Thái để chuyển trực tiếp thành giọng đọc AI Voice, thời lượng khoảng 10-15 giây.

**1. NGUYÊN TẮC ƯU TIÊN QUAN TRỌNG NHẤT**
Không mô tả sản phẩm theo thứ tự thông thường. Hãy tự xác định những chi tiết đặc trưng, nổi bật và có khả năng thu hút người mua nhất của từng thiết kế, sau đó đưa chúng lên đầu lời thoại.
Thứ tự ưu tiên khi phân tích:
1. **CHỮ IN VÀ SLOGAN:** Quan sát thật kỹ tất cả dòng chữ xuất hiện trực tiếp trên áo. Nhận diện chính xác nội dung, kiểu chữ, cách sắp xếp và vị trí. Nếu dòng chữ là điểm nhấn chính của sản phẩm, hãy ưu tiên giới thiệu ngay trong câu mở đầu.
2. **LOGO VÀ BIỂU TƯỢNG:** Phân tích hình dáng logo, các ký tự cách điệu, đường nét, cấu trúc và vị trí. Nhấn mạnh những đặc điểm giúp logo trở nên độc đáo.
3. **HỌA TIẾT VÀ CHI TIẾT THIẾT KẾ:** Phân tích các hình in, hoa văn, đường kẻ, họa tiết thêu, ren, nơ, cúc áo, chi tiết phối và những điểm nhấn tạo nên sự khác biệt của sản phẩm.
4. **KIỂU DÁNG:** Xác định chính xác loại áo, thiết kế cổ, tay áo, vai áo, form dáng, độ ôm, độ rộng, đường may và những đặc điểm nổi bật trong cấu trúc.
5. **CHẤT LIỆU:** Mô tả đặc điểm bề mặt vải, độ mềm mại, kết cấu, độ đứng form và độ rủ dựa trên những gì có thể quan sát thực tế. Không tự khẳng định thành phần hoặc tính năng vải nếu chưa có căn cứ.
6. **PHONG CÁCH:** Đặc biệt nhấn mạnh phong cách đặc trưng của sản phẩm như lịch lãm, sang trọng, tối giản, trẻ trung, cá tính, thanh lịch hoặc nữ tính tùy theo thiết kế thực tế.
LƯU Ý: Thứ tự trên chỉ là mức độ ưu tiên, không phải khuôn mẫu bắt buộc. Nếu chiếc áo nổi bật nhờ kiểu cổ, chi tiết ren, đường cắt may hoặc thiết kế đặc biệt thay vì chữ in hay logo, hãy đưa chi tiết đó lên đầu tiên.

**2. QUY TẮC BẮT BUỘC**
- Tuyệt đối không đề cập đến bất kỳ màu sắc nào vì sản phẩm có thể có nhiều phiên bản màu khác nhau.
- Tự nhận diện sản phẩm dành cho nam, nữ hoặc unisex.
- Đưa chi tiết độc đáo và thu hút nhất lên ngay đầu lời thoại.
- Ưu tiên chữ in, logo và họa tiết khi chúng là điểm nhấn chính của sản phẩm.
- Không sử dụng những câu mở đầu chung chung, sáo rỗng hoặc giống nhau cho tất cả sản phẩm.
- Không cần liệt kê mọi đặc điểm; chỉ chọn những chi tiết quan trọng nhất để đảm bảo thời lượng.
- Không tự sáng tạo chất liệu, thương hiệu, công dụng, giá bán hoặc chương trình khuyến mãi.
- Không mô tả người mẫu, quần, đồng hồ, phông nền hoặc hiệu ứng video.
- Sử dụng ngôn ngữ bán hàng tiếng Thái tự nhiên, tinh tế, hấp dẫn và có sức thuyết phục.
- Phải làm nổi bật phong cách và giá trị thẩm mỹ riêng biệt của từng thiết kế.

**3. ĐỊNH DẠNG ĐẦU RA**
Chỉ xuất ra DUY NHẤT một đoạn văn tiếng Thái hoàn chỉnh, không có thêm ngôn ngữ nào khác, thời lượng đọc khoảng 10-15 giây.
Không có tiêu đề, emoji, hashtag, dấu gạch đầu dòng, bản dịch hay lời giải thích.
Lời thoại phải có nhịp ngắt tự nhiên, phù hợp để chuyển trực tiếp sang Text-to-Speech.
Mở đầu bằng chi tiết nổi bật nhất của sản phẩm, tiếp tục mô tả ngắn gọn những đặc điểm quan trọng còn lại, nhấn mạnh phong cách thời trang và kết thúc bằng một câu kêu gọi khách hàng nhắn tin đặt mua ngay.`;

export async function generateThaiScriptFromImage(imageUrl, apiKey = '', extraUserNote = '') {
  const cleanKey = (apiKey || localStorage.getItem('CUSTOM_GEMINI_KEY') || localStorage.getItem('user_gemini_api_key') || '').trim();
  if (!cleanKey) {
    throw new Error('Vui lòng nhập Google AI Studio API Key ở ô cấu hình!');
  }
  if (!imageUrl) {
    throw new Error('Vui lòng tải lên ít nhất 1 ảnh hoặc video sản phẩm để AI nhận diện!');
  }

  const compressedDataUrl = await compressImageForAI(imageUrl);
  const base64Data = compressedDataUrl.split(',')[1];

  const availableModels = await getDynamicAvailableModels(cleanKey);
  if (availableModels.length === 0) {
    throw new Error('Không tìm thấy model nào khả dụng cho API Key này.');
  }

  const promptFinal = extraUserNote
    ? `${HIDDEN_PROMPT}\n\nGhi chú thêm từ người bán: ${extraUserNote}`
    : HIDDEN_PROMPT;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: promptFinal },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          },
        ],
      },
    ],
  };

  let lastErrMessage = '';

  for (const model of availableModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (res.ok) {
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (textOutput) return textOutput;
      } else {
        lastErrMessage = data.error?.message || `Lỗi từ model ${model}`;
        console.warn(`Model ${model} không thành công:`, lastErrMessage);
      }
    } catch (err) {
      lastErrMessage = err.message;
    }
  }

  throw new Error(lastErrMessage || 'Tất cả các model Google AI đều đang bận. Vui lòng bấm thử lại sau 5 giây!');
}

export async function translateThaiToVietnamese(thaiText, apiKey = '', signal = null) {
  if (!thaiText || !thaiText.trim()) {
    throw new Error('Chưa có nội dung tiếng Thái để dịch!');
  }

  const cleanKey = (apiKey || localStorage.getItem('CUSTOM_GEMINI_KEY') || localStorage.getItem('user_gemini_api_key') || '').trim();
  if (!cleanKey) {
    throw new Error('Vui lòng nhập Google AI Studio API Key ở ô cấu hình!');
  }

  const prompt = `Bạn là chuyên gia dịch thuật và biên kịch quảng cáo bán hàng thời trang.
Nhiệm vụ: Hãy dịch đoạn kịch bản bán hàng tiếng Thái sau sang TIẾNG VIỆT tự nhiên, cuốn hút, đúng văn phong quảng cáo chốt đơn TikTok/Reels.
Chỉ trả về duy nhất văn bản tiếng Việt đã dịch, không kèm lời giải thích, ghi chú phiên âm hay ngoặc kép:
${thaiText.trim()}`;

  const availableModels = await getDynamicAvailableModels(cleanKey).catch(() => ['gemini-2.5-flash', 'gemini-3.8-flash']);

  for (const model of availableModels) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
        signal: signal,
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      }
    } catch (err) {
      if (err.name === 'AbortError') throw err;
    }
  }

  throw new Error('Không thể dịch văn bản lúc này.');
}

function generateFallbackTimeline(count = 1, totalSec = 6) {
  const duration = Math.max(totalSec, 3);
  if (count <= 1) {
    const perScene = +(duration / 4).toFixed(2);
    return [
      { imageIndex: 0, duration: perScene, effect: 'flash', focus: 'full' },
      { imageIndex: 0, duration: perScene, effect: 'kenburns', focus: 'top' },
      { imageIndex: 0, duration: perScene, effect: 'pan', focus: 'bottom' },
      { imageIndex: 0, duration: +(duration - perScene * 3).toFixed(2), effect: 'pulse', focus: 'full' },
    ];
  }

  const perSlide = +(duration / count).toFixed(2);
  const effects = ['flash', 'kenburns', 'pan', 'pulse', 'zoomout'];
  return Array.from({ length: count }, (_, idx) => ({
    imageIndex: idx,
    duration: perSlide,
    effect: effects[idx % effects.length],
    focus: 'full',
  }));
}

export async function analyzeVideoScriptWithAi(promptText, imagesCount = 1, apiKey = '', targetDuration = 6) {
  const duration = Math.max(targetDuration, 3);
  return generateFallbackTimeline(imagesCount, duration);
}