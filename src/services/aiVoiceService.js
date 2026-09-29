// src/services/aiVoiceService.js

export const VOICE_PROVIDERS = [
  { id: 'gemini', name: 'Google AI Studio' },
  { id: 'elevenlabs', name: 'ElevenLabs (Chưa hay)' },
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

/**
 * Chuyển Blob URL (tạo từ file máy tính) sang object Base64 chuẩn cho Gemini API
 */
async function fileUrlToGenerativePart(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  const base64Data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  return {
    inlineData: {
      data: base64Data,
      mimeType: blob.type || 'image/jpeg',
    },
  };
}

/**
 * AI tự động nhìn ảnh sản phẩm thời trang và viết kịch bản quảng cáo tiếng Thái dài 15 - 18 giây
 */
/**
 * AI tự động nhìn ảnh sản phẩm thời trang và viết kịch bản quảng cáo tiếng Thái dài 15 - 18 giây
 * (Đã có cơ chế Auto-Retry & Fallback chống lỗi High Demand / 503)
 */
export async function generateThaiScriptFromImage(imageUrl, apiKey, extraUserNote = '') {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Vui lòng nhập Google AI Studio API Key!');
  }
  if (!imageUrl) {
    throw new Error('Vui lòng tải lên ít nhất 1 ảnh sản phẩm để AI nhận diện mẫu trang phục!');
  }

  const cleanKey = apiKey.trim();
  const imagePart = await fileUrlToGenerativePart(imageUrl);

  const hiddenSystemPrompt = `
Bạn là chuyên gia phân tích thiết kế thời trang nam và nữ, đồng thời là biên kịch quảng cáo chuyên nghiệp dành cho thị trường Thái Lan.

Hãy phân tích thật kỹ sản phẩm thời trang trong HÌNH ẢNH hoặc VIDEO tôi cung cấp, sau đó tạo một đoạn mô tả quảng cáo bằng tiếng Thái để chuyển trực tiếp thành giọng đọc AI Voice, thời lượng khoảng 15–20 giây.

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

**2. PHÂN TÍCH HÌNH ẢNH HOẶC VIDEO**

- Với hình ảnh: Quan sát kỹ toàn bộ sản phẩm và những chi tiết nhỏ nhất.
- Với video: Phân tích nhiều khung hình xuyên suốt video, đặc biệt chú ý những cảnh quay cận họa tiết, logo, chữ in, chất liệu và cấu trúc áo.
- Nếu có nhiều phiên bản của cùng một thiết kế, chỉ tập trung vào các đặc điểm thiết kế chung.
- Phân biệt chính xác chữ in trên sản phẩm với phụ đề, watermark hoặc chữ quảng cáo trong hình ảnh và video.
- Không suy đoán những chi tiết không thể quan sát rõ.

**3. QUY TẮC BẮT BUỘC**

- Tuyệt đối không đề cập đến bất kỳ màu sắc nào vì sản phẩm có thể có nhiều phiên bản màu khác nhau.
- Tự nhận diện sản phẩm dành cho nam, nữ hoặc unisex.
- Đưa chi tiết độc đáo và thu hút nhất lên ngay đầu lời thoại.
- Ưu tiên chữ in, logo và họa tiết khi chúng là điểm nhấn chính của sản phẩm.
- Nếu chữ in có thể nhận diện chính xác, hãy giữ nguyên nội dung. Nếu không rõ, chỉ mô tả hình thức trang trí, tuyệt đối không tự sáng tạo chữ.
- Không sử dụng những câu mở đầu chung chung, sáo rỗng hoặc giống nhau cho tất cả sản phẩm.
- Không cần liệt kê mọi đặc điểm; chỉ chọn những chi tiết quan trọng nhất để đảm bảo thời lượng.
- Không tự sáng tạo chất liệu, thương hiệu, công dụng, giá bán hoặc chương trình khuyến mãi.
- Không mô tả người mẫu, quần, đồng hồ, phông nền hoặc hiệu ứng video.
- Sử dụng ngôn ngữ bán hàng tiếng Thái tự nhiên, tinh tế, hấp dẫn và có sức thuyết phục.
- Phải làm nổi bật phong cách và giá trị thẩm mỹ riêng biệt của từng thiết kế.

**4. ĐỊNH DẠNG ĐẦU RA**

Chỉ xuất ra DUY NHẤT một đoạn văn tiếng Thái hoàn chỉnh, thời lượng đọc khoảng 15–20 giây.

Không có tiêu đề, emoji, hashtag, dấu gạch đầu dòng, bản dịch hay lời giải thích.

Lời thoại phải có nhịp ngắt tự nhiên, phù hợp để chuyển trực tiếp sang Text-to-Speech.

Mở đầu bằng chi tiết nổi bật nhất của sản phẩm, tiếp tục mô tả ngắn gọn những đặc điểm quan trọng còn lại, nhấn mạnh phong cách thời trang và kết thúc bằng một câu kêu gọi khách hàng nhắn tin đặt mua ngay.

MỤC TIÊU CUỐI CÙNG: Chỉ trong 15–20 giây, khách hàng phải nhận ra điểm khác biệt của sản phẩm, hình dung được thiết kế, cảm nhận được phong cách và có mong muốn đặt mua ngay.
`.trim();

  const payload = {
    contents: [
      {
        parts: [
          { text: hiddenSystemPrompt + (extraUserNote ? `\nGhi chú thêm từ người bán: ${extraUserNote}` : '') },
          imagePart,
        ],
      },
    ],
  };

  // Danh sách model ưu tiên: nếu flash bận sẽ tự đổi sang flash-lite
  const candidateModels = ['gemini-3.8-flash', 'gemini-3.8-flash-lite'];

  for (const model of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;

    // Thử tối đa 2 lần cho mỗi model nếu gặp lỗi quá tải
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          const thaiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (thaiText) return thaiText;
        }

        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || '';

        // Nếu máy chủ báo bận (503 / high demand) thì tạm dừng 1.5 giây rồi thử lại
        if (response.status === 503 || errMsg.includes('high demand') || errMsg.includes('overloaded')) {
          if (attempt < 2) {
            await new Promise((res) => setTimeout(res, 1500));
            continue;
          }
        } else if (response.status === 429) {
          throw new RateLimitError('Đã vượt hạn mức gọi API trong phút. Vui lòng chờ 20 giây.', 20);
        } else {
          // Các lỗi khác (sai key, v.v.) thì throw trực tiếp
          throw new Error(errMsg || `Lỗi API (${response.status})`);
        }
      } catch (err) {
        if (err instanceof RateLimitError) throw err;
        if (attempt === 2 && model === candidateModels[candidateModels.length - 1]) {
          throw err;
        }
      }
    }
  }

  throw new Error('Máy chủ Google AI hiện đang quá tải lượt yêu cầu. Bạn hãy bấm thử lại sau 5 - 10 giây nhé!');
}

// Fallback tạo storyboard phân cảnh chuyển động theo độ dài mong muốn (6s, 15s, 18s...)
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

/**
 * Phân tích kịch bản dựng AI: Biến ảnh tĩnh thành chuỗi chuyển động camera thích ứng theo thời lượng tổng (6s hoặc 15-18s)
 */
export async function analyzeVideoScriptWithAi(promptText, imagesCount = 1, apiKey, targetDuration = 6) {
  const duration = Math.max(targetDuration, 3);
  if (!apiKey || !apiKey.trim() || !promptText || !promptText.trim()) {
    return generateFallbackTimeline(imagesCount, duration);
  }

  const cleanKey = apiKey.trim();
  const isSingleImage = imagesCount <= 1;

  const systemInstruction = `Bạn là đạo diễn camera video TikTok thời trang.
Người dùng cung cấp ${imagesCount} ảnh sản phẩm (có thể chỉ có 1 ảnh duy nhất).
Nhiệm vụ: Phân bổ kịch bản thành chuỗi từ 4 đến 7 cảnh chuyển động camera sao cho TỔNG THỜI LƯỢNG TOÀN BỘ VIDEO XẤP XỈ ĐÚNG ${duration.toFixed(1)} GIÂY.
Các hiệu ứng hợp lệ: "kenburns", "zoomout", "pan", "flash", "pulse", "spin".
Các điểm lấy nét chuyển động camera ("focus"): "full" (toàn cảnh), "top" (cận cổ áo/ngực áo), "bottom" (form eo/ống quần), "center" (chi tiết họa tiết).
${isSingleImage ? 'LƯU Ý: Vì chỉ có 1 ảnh duy nhất, tất cả các cảnh đều đặt "imageIndex": 0 nhưng thay đổi linh hoạt "focus" và "effect" để tạo chuyển động camera mượt mà xuyên suốt.' : ''}
Chỉ trả về JSON thuần (array), không bọc markdown:
[
  { "imageIndex": 0, "duration": 3.5, "effect": "flash", "focus": "full" },
  { "imageIndex": 0, "duration": 4.5, "effect": "kenburns", "focus": "top" },
  { "imageIndex": 0, "duration": 4.5, "effect": "pan", "focus": "bottom" },
  { "imageIndex": 0, "duration": 3.5, "effect": "pulse", "focus": "full" }
]`;

  const models = ['gemini-3.8-flash', 'gemini-3.8-flash-lite'];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemInstruction}\n\nKịch bản chỉ đạo từ người dùng: ${promptText}` }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const storyboard = JSON.parse(rawJson);

      if (Array.isArray(storyboard) && storyboard.length > 0) {
        return storyboard;
      }
    } catch {
      continue;
    }
  }

  return generateFallbackTimeline(imagesCount, duration);
}
/**
 * Trích xuất 1 khung hình từ video để gửi lên AI phân tích trang phục
 */
export async function extractFrameFromVideo(videoUrl) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.currentTime = 1.0; // Lấy frame ở giây thứ 1 để tránh màn đen mở đầu

    video.onloadeddata = () => {
      video.currentTime = Math.min(1.0, video.duration / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 1280;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve(dataUrl);
    };

    video.onerror = () => reject(new Error('Không thể đọc khung hình từ video đã tải lên.'));
  });
}

/**
 * Dịch kịch bản tiếng Thái sang tiếng Việt chuẩn văn phong bán hàng thời trang
 * (Hỗ trợ abort signal để hủy dịch bất kỳ lúc nào)
 */
export async function translateThaiToVietnamese(thaiText, apiKey, signal = null) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Vui lòng nhập Google AI Studio API Key ở ô cấu hình!');
  }
  if (!thaiText || !thaiText.trim()) {
    throw new Error('Chưa có nội dung tiếng Thái để dịch!');
  }

  const cleanKey = apiKey.trim();
  const prompt = `Bạn là chuyên gia dịch thuật và biên kịch quảng cáo bán hàng thời trang.
Nhiệm vụ: Hãy dịch đoạn kịch bản bán hàng tiếng Thái sau sang TIẾNG VIỆT tự nhiên, cuốn hút, đúng văn phong quảng cáo chốt đơn TikTok/Reels.
Chỉ trả về duy nhất văn bản tiếng Việt đã dịch, không kèm lời giải thích, ghi chú phiên âm hay ngoặc kép:
${thaiText.trim()}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  const candidateModels = ['gemini-3.8-flash', 'gemini-3.8-flash-lite', 'gemini-2.5-flash'];
  let lastErrorMessage = '';

  for (const model of candidateModels) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;

    for (let attempt = 1; attempt <= 2; attempt++) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: signal, // 👈 Truyền signal vào fetch để có thể hủy lập tức
        });

        if (response.ok) {
          const data = await response.json();
          const translated = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (translated) return translated;
        }

        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || '';
        lastErrorMessage = errMsg;

        if (response.status === 503 || errMsg.includes('high demand') || errMsg.includes('overloaded')) {
          if (attempt < 2) {
            await new Promise((res) => setTimeout(res, 1500));
            continue;
          }
        } else if (response.status === 429) {
          throw new RateLimitError('Đã vượt hạn mức gọi API trong phút. Vui lòng đợi 20 giây.', 20);
        } else if (response.status === 404) {
          break;
        } else if (errMsg) {
          throw new Error(errMsg);
        }
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        if (err instanceof RateLimitError) throw err;
        lastErrorMessage = err.message || lastErrorMessage;
      }
    }
  }

  throw new Error(
    lastErrorMessage
      ? `Lỗi từ Google AI: ${lastErrorMessage}`
      : 'Máy chủ Google AI đang tạm thời bận. Bạn hãy bấm thử lại sau 3 - 5 giây!'
  );
}