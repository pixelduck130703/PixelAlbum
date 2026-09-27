// src/services/grokVideoService.js

/**
 * Chuyển Blob URL (tạo từ file máy tính) sang DataURL (Base64) để gửi lên xAI API
 */
export async function convertBlobUrlToBase64(blobUrl) {
  const res = await fetch(blobUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Gọi Grok API để sinh video nhân vật cử động thực tế từ 1 ảnh tĩnh (~6 giây)
 */
export async function generateGrokMotionVideo({
  imageUrl,
  promptText,
  apiKey,
  aspectRatio = '9:16',
  onStatusUpdate,
}) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Vui lòng nhập xAI (Grok) API Key (bắt đầu bằng xai-...)!');
  }
  if (!imageUrl) {
    throw new Error('Vui lòng tải lên ít nhất 1 ảnh sản phẩm / người mẫu!');
  }

  const cleanKey = apiKey.trim();

  let finalImageInput = imageUrl;
  if (imageUrl.startsWith('blob:')) {
    if (onStatusUpdate) onStatusUpdate('Đang mã hóa ảnh sang định dạng AI...');
    finalImageInput = await convertBlobUrlToBase64(imageUrl);
  }

  // Tối ưu hóa prompt kịch bản thành chuyển động nhân vật thời trang mượt mà
  const motionPrompt = `${promptText || 'Người mẫu thời trang nhẹ nhàng tạo dáng, xoay nhẹ người khoe chi tiết trang phục'}. The person in the photo moves naturally, subtly turning and showing the outfit details, lifelike clothing wrinkles and fabric physics, smooth fashion commercial lookbook.`;

  if (onStatusUpdate) onStatusUpdate('Đang gửi lệnh tạo video tới xAI Grok...');

  // 1. Gửi lệnh tạo video bất đồng bộ
  const initRes = await fetch('https://api.x.ai/v1/videos/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cleanKey}`,
    },
    body: JSON.stringify({
      model: 'grok-imagine-video',
      prompt: motionPrompt,
      image: {
        url: finalImageInput,
      },
      duration: 6,
      aspect_ratio: aspectRatio === '4:3' ? '4:3' : '9:16',
      resolution: '720p',
    }),
  });

  if (!initRes.ok) {
    const errData = await initRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || errData.message || `Lỗi xAI API (${initRes.status})`);
  }

  const initData = await initRes.json();
  const requestId = initData.request_id || initData.id;

  if (!requestId) {
    throw new Error('Không nhận được mã yêu cầu (request_id) từ xAI Grok.');
  }

  // 2. Vòng lặp Polling kiểm tra tiến trình hoàn thành
  const pollUrl = `https://api.x.ai/v1/videos/${requestId}`;
  let videoUrl = null;
  let attempts = 0;
  const maxAttempts = 60; // Tối đa 180s

  while (attempts < maxAttempts) {
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 3000));

    if (onStatusUpdate) {
      onStatusUpdate(`Grok đang render chuyển động vật lý (${attempts * 3}s)...`);
    }

    try {
      const checkRes = await fetch(pollUrl, {
        headers: {
          Authorization: `Bearer ${cleanKey}`,
        },
      });

      if (!checkRes.ok) continue;

      const checkData = await checkRes.json();
      const status = checkData.status;

      if (status === 'done' || status === 'completed') {
        videoUrl = checkData.video?.url || checkData.url || checkData.output_url;
        break;
      }

      if (status === 'failed') {
        throw new Error(checkData.error?.message || 'Grok báo lỗi xử lý video.');
      }
    } catch (e) {
      if (e.message.includes('Grok báo lỗi')) throw e;
    }
  }

  if (!videoUrl) {
    throw new Error('Quá thời gian chờ render từ Grok AI (Timeout). Vui lòng thử lại!');
  }

  return videoUrl;
}