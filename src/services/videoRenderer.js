// src/services/videoRenderer.js
export class VideoRenderer {
  constructor(canvas, { width = 720, height = 1280 } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.animId = null;
    this.isCancelled = false;
    this.recorder = null;
    // FPS mục tiêu để tạo cảm giác giật giật (Stop-motion / Low FPS effect)
    this.targetFps = 10;
  }

  // Chuyển progress liên tục (60 FPS) thành progress giật từng nấc theo FPS mục tiêu
  quantizeProgress(progress, durationSec) {
    const totalFrames = Math.max(1, Math.floor(durationSec * this.targetFps));
    return Math.floor(progress * totalFrames) / totalFrames;
  }

  // Vẽ chuyển động camera giật nấc FPS (Sử dụng chính ảnh đầu tiên làm nền thay vì màu đen trống)
  renderImageFrame(img, nextImg, rawProgress, effect, slideIndex = 0, focus = 'full', durationSec = 2, baseBackgroundImg = null) {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);

    // Vẽ ảnh nền cơ sở (ảnh đầu tiên) chống khung hình đen
    if (baseBackgroundImg) {
      this.drawImageCover(baseBackgroundImg);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
    }

    if (!img) return;

    // LÀM GIẬT CHUYỂN ĐỘNG THEO FPS
    const progress = this.quantizeProgress(rawProgress, durationSec);
    let activeEffect = effect;
    if (effect === 'dynamic') {
      const dynamicList = ['kenburns', 'zoomout', 'pan', 'pulse', 'flash', 'spin'];
      activeEffect = dynamicList[slideIndex % dynamicList.length];
    }

    ctx.save();
    let originX = width / 2;
    let originY = height / 2;
    if (focus === 'top') {
      originY = height * 0.25;
    } else if (focus === 'bottom') {
      originY = height * 0.75;
    }

    // 1. Zoom In (Ken Burns) giật FPS
    if (activeEffect === 'kenburns') {
      const scale = 1.05 + progress * 0.18;
      ctx.translate(originX, originY);
      ctx.scale(scale, scale);
      ctx.translate(-originX, -originY);
      this.drawImageCover(img);
    }
    // 2. Zoom Out giật FPS
    else if (activeEffect === 'zoomout') {
      const scale = 1.22 - progress * 0.18;
      ctx.translate(originX, originY);
      ctx.scale(scale, scale);
      ctx.translate(-originX, -originY);
      this.drawImageCover(img);
    }
    // 3. Pan Lia Máy giật FPS
    else if (activeEffect === 'pan') {
      const scale = 1.15;
      const offsetX = (progress - 0.5) * 60;
      const offsetY = focus === 'top' ? 40 : focus === 'bottom' ? -40 : (progress - 0.5) * 30;
      ctx.translate(originX + offsetX, originY + offsetY);
      ctx.scale(scale, scale);
      ctx.translate(-originX, -originY);
      this.drawImageCover(img);
    }
    // 4. Crossfade
    else if (activeEffect === 'crossfade') {
      this.drawImageCover(img);
      if (nextImg && progress > 0.7) {
        const fadeAlpha = Math.floor(((progress - 0.7) / 0.3) * 5) / 5;
        ctx.globalAlpha = Math.min(Math.max(fadeAlpha, 0), 1);
        this.drawImageCover(nextImg);
      }
    }
    // 5. Flash Pop giật FPS
    else if (activeEffect === 'flash') {
      const scale = 1.08 + progress * 0.1;
      ctx.translate(originX, originY);
      ctx.scale(scale, scale);
      ctx.translate(-originX, -originY);
      this.drawImageCover(img);
      if (progress < 0.2) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.45 * (1 - progress / 0.2)})`;
        ctx.fillRect(0, 0, width, height);
      }
    }
    // 6. Spin & Tilt giật FPS
    else if (activeEffect === 'spin') {
      const angle = Math.sin(progress * Math.PI) * 0.045;
      const scale = 1.12;
      ctx.translate(originX, originY);
      ctx.rotate(angle);
      ctx.scale(scale, scale);
      ctx.translate(-originX, -originY);
      this.drawImageCover(img);
    }
    // 7. Pulse Beat giật FPS
    else if (activeEffect === 'pulse') {
      const beat = Math.sin(progress * Math.PI * 4);
      const scale = 1.04 + Math.max(0, beat) * 0.08;
      ctx.translate(originX, originY);
      ctx.scale(scale, scale);
      ctx.translate(-originX, -originY);
      this.drawImageCover(img);
    } else {
      this.drawImageCover(img);
    }
    ctx.restore();
  }

  drawImageCover(media) {
    if (!media) return;
    const { ctx, width, height } = this;
    const mWidth = media.videoWidth || media.width;
    const mHeight = media.videoHeight || media.height;
    if (!mWidth || !mHeight) return;
    const mediaRatio = mWidth / mHeight;
    const screenRatio = width / height;
    let drawWidth, drawHeight, offsetX, offsetY;
    if (mediaRatio > screenRatio) {
      drawHeight = height;
      drawWidth = height * mediaRatio;
      offsetX = (width - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = width;
      drawHeight = width / mediaRatio;
      offsetX = 0;
      offsetY = (height - drawHeight) / 2;
    }
    ctx.drawImage(media, offsetX, offsetY, drawWidth, drawHeight);
  }

  // Tải trước an toàn cho cả Image lẫn Video
  preloadMediaItem(src) {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.autoplay = true;
        video.loop = true;
        video.src = src;
        let isResolved = false;
        const onReady = () => {
          if (isResolved) return;
          isResolved = true;
          video.play().catch(() => {});
          resolve(video);
        };
        video.onloadeddata = onReady;
        video.oncanplay = onReady;
        video.onloadedmetadata = () => {
          if (video.duration) onReady();
        };
        video.onerror = () => {
          if (!isResolved) {
            isResolved = true;
            resolve(null);
          }
        };
        setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            video.play().catch(() => {});
            resolve(video);
          }
        }, 1500);
      };
    });
  }

  async preloadImages(files) {
    const promises = files.map((src) => this.preloadMediaItem(src));
    const loaded = await Promise.all(promises);
    return loaded.filter(Boolean);
  }

  async startPreview({
    files,
    effectMode,
    selectedEffect,
    aiTimeline,
    totalDuration,
    onProgress,
    onPreviewEnd,
  }) {
    this.isCancelled = false;
    const mediaList = await this.preloadImages(files);
    if (!mediaList.length) return;

    mediaList.forEach((m) => {
      if (m.tagName === 'VIDEO') {
        m.currentTime = 0;
        m.play().catch(() => {});
      }
    });

    const isScript = effectMode === 'script' && aiTimeline && aiTimeline.length > 0;
    const finalDurationSec = totalDuration || 6;
    const durationMs = finalDurationSec * 1000;
    const baseFirstImage = mediaList[0];

    // Vẽ khung hình đầu tiên ngay lập tức lên Canvas
    if (baseFirstImage.tagName === 'VIDEO') {
      this.drawImageCover(baseFirstImage);
    } else {
      this.renderImageFrame(baseFirstImage, mediaList[1] || baseFirstImage, 0, selectedEffect, 0, 'full', 2, baseFirstImage);
    }

    const startTime = performance.now();
    const loop = (now) => {
      if (this.isCancelled) return;
      const elapsed = now - startTime;
      const overallProgress = Math.min(elapsed / durationMs, 1);
      if (onProgress) onProgress(overallProgress);
      if (elapsed >= durationMs) {
        mediaList.forEach((m) => {
          if (m.tagName === 'VIDEO') m.pause();
        });
        if (onPreviewEnd) onPreviewEnd();
        return;
      }
      const currentMedia = mediaList[0];

      // Nếu là Video
      if (currentMedia && currentMedia.tagName === 'VIDEO') {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawImageCover(baseFirstImage);
        if (currentMedia.duration && !isNaN(currentMedia.duration)) {
          const targetSec = (elapsed / 1000) % currentMedia.duration;
          if (Math.abs(currentMedia.currentTime - targetSec) > 0.3) {
            currentMedia.currentTime = targetSec;
          }
        }
        this.drawImageCover(currentMedia);
      }
      // Nếu là Ảnh theo AI Timeline
      else if (isScript) {
        let accTime = 0;
        let activeScene = aiTimeline[0];
        let sceneProgress = 0;
        for (let i = 0; i < aiTimeline.length; i++) {
          const scene = aiTimeline[i];
          const sceneMs = (scene.duration || 1.5) * 1000;
          if (elapsed >= accTime && elapsed <= accTime + sceneMs) {
            activeScene = scene;
            sceneProgress = (elapsed - accTime) / sceneMs;
            break;
          }
          accTime += sceneMs;
        }
        const imgIdx = (activeScene.imageIndex || 0) % mediaList.length;
        const curImg = mediaList[imgIdx];
        const nxtImg = mediaList[(imgIdx + 1) % mediaList.length];
        this.renderImageFrame(
          curImg,
          nxtImg,
          sceneProgress,
          activeScene.effect || 'kenburns',
          imgIdx,
          activeScene.focus || 'full',
          activeScene.duration || 1.5,
          baseFirstImage
        );
      }
      // Nếu là Ảnh chạy Effect thông thường
      else {
        const slideDuration = durationMs / mediaList.length;
        const currentSlideIdx = Math.min(Math.floor(elapsed / slideDuration), mediaList.length - 1);
        const slideProgress = (elapsed - currentSlideIdx * slideDuration) / slideDuration;
        this.renderImageFrame(
          mediaList[currentSlideIdx],
          mediaList[currentSlideIdx + 1] || mediaList[0],
          slideProgress,
          selectedEffect,
          currentSlideIdx,
          'full',
          slideDuration / 1000,
          baseFirstImage
        );
      }
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  async startRender({
    files,
    effectMode,
    selectedEffect,
    aiTimeline,
    totalDuration,
    audioStream,
    onProgress,
    onComplete,
    onCancel,
  }) {
    this.isCancelled = false;
    const mediaList = await this.preloadImages(files);
    if (!mediaList.length) return;

    mediaList.forEach((m) => {
      if (m.tagName === 'VIDEO') {
        m.currentTime = 0;
        m.play().catch(() => {});
      }
    });

    const isScript = effectMode === 'script' && aiTimeline && aiTimeline.length > 0;
    const finalDurationSec = totalDuration || 6;
    const durationMs = finalDurationSec * 1000;
    const baseFirstImage = mediaList[0];

    // VẼ KHUNG HÌNH ĐẦU TIÊN LÊN CANVAS TRƯỚC KHI BẮT ĐẦU RECORDER ĐỂ KHÔNG BỊ ĐEN
    this.ctx.clearRect(0, 0, this.width, this.height);
    if (baseFirstImage.tagName === 'VIDEO') {
      this.drawImageCover(baseFirstImage);
    } else {
      this.renderImageFrame(baseFirstImage, mediaList[1] || baseFirstImage, 0, selectedEffect, 0, 'full', 2, baseFirstImage);
    }

    const stream = this.canvas.captureStream(30);
    if (audioStream) {
      audioStream.getAudioTracks().forEach((track) => stream.addTrack(track));
    }
    const recordedChunks = [];
    let mimeType = 'video/webm';
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')) {
      mimeType = 'video/mp4;codecs=avc1,mp4a.40.2';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9';
    }

    this.recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5000000 });
    this.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };
    this.recorder.onstop = () => {
      mediaList.forEach((m) => {
        if (m.tagName === 'VIDEO') m.pause();
      });
      if (this.isCancelled) {
        if (onCancel) onCancel();
        return;
      }
      const rawType = mimeType.split(';')[0];
      const blob = new Blob(recordedChunks, { type: rawType });
      const videoUrl = URL.createObjectURL(blob);
      if (onComplete) onComplete(videoUrl);
    };

    this.recorder.start();
    const startTime = performance.now();

    const renderLoop = (now) => {
      if (this.isCancelled) {
        this.recorder.stop();
        return;
      }
      const elapsed = now - startTime;
      const overallProgress = Math.min(elapsed / durationMs, 1);
      if (onProgress) onProgress(overallProgress);
      if (elapsed >= durationMs) {
        this.recorder.stop();
        return;
      }
      const currentMedia = mediaList[0];
      if (currentMedia && currentMedia.tagName === 'VIDEO') {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawImageCover(baseFirstImage);
        this.drawImageCover(currentMedia);
      } else if (isScript) {
        let accTime = 0;
        let activeScene = aiTimeline[0];
        let sceneProgress = 0;
        for (let i = 0; i < aiTimeline.length; i++) {
          const scene = aiTimeline[i];
          const sceneMs = (scene.duration || 1.5) * 1000;
          if (elapsed >= accTime && elapsed <= accTime + sceneMs) {
            activeScene = scene;
            sceneProgress = (elapsed - accTime) / sceneMs;
            break;
          }
          accTime += sceneMs;
        }
        const imgIdx = (activeScene.imageIndex || 0) % mediaList.length;
        const curImg = mediaList[imgIdx];
        const nxtImg = mediaList[(imgIdx + 1) % mediaList.length];
        this.renderImageFrame(
          curImg,
          nxtImg,
          sceneProgress,
          activeScene.effect || 'kenburns',
          imgIdx,
          activeScene.focus || 'full',
          activeScene.duration || 1.5,
          baseFirstImage
        );
      } else {
        const slideDuration = durationMs / mediaList.length;
        const currentSlideIdx = Math.min(Math.floor(elapsed / slideDuration), mediaList.length - 1);
        const slideProgress = (elapsed - currentSlideIdx * slideDuration) / slideDuration;
        this.renderImageFrame(
          mediaList[currentSlideIdx],
          mediaList[currentSlideIdx + 1] || mediaList[0],
          slideProgress,
          selectedEffect,
          currentSlideIdx,
          'full',
          slideDuration / 1000,
          baseFirstImage
        );
      }
      this.animId = requestAnimationFrame(renderLoop);
    };
    this.animId = requestAnimationFrame(renderLoop);
  }

  stop() {
    this.isCancelled = true;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
  }

  cancel() {
    this.stop();
  }
}