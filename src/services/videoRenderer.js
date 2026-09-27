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
  }

  // Vẽ chuyển động camera (hỗ trợ chuyển động trên cùng 1 ảnh)
  renderImageFrame(img, nextImg, progress, effect, slideIndex = 0, focus = 'full') {
    const { ctx, width, height } = this;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    if (!img) return;

    let activeEffect = effect;
    if (effect === 'dynamic') {
      const dynamicList = ['kenburns', 'zoomout', 'pan', 'pulse', 'flash', 'spin'];
      activeEffect = dynamicList[slideIndex % dynamicList.length];
    }

    ctx.save();

    // Điểm tâm biến đổi (Focus camera)
    let originX = width / 2;
    let originY = height / 2;

    if (focus === 'top') {
      originY = height * 0.25; // Tập trung cận phần ngực/cổ áo
    } else if (focus === 'bottom') {
      originY = height * 0.75; // Tập trung phần tà áo/quần
    }

    // 1. Zoom In (Ken Burns)
    if (activeEffect === 'kenburns') {
      const scale = 1.05 + progress * 0.15;
      ctx.translate(originX, originY);
      ctx.scale(scale, scale);
      ctx.translate(-originX, -originY);
      this.drawImageCover(img);
    }
    // 2. Zoom Out
    else if (activeEffect === 'zoomout') {
      const scale = 1.2 - progress * 0.15;
      ctx.translate(originX, originY);
      ctx.scale(scale, scale);
      ctx.translate(-originX, -originY);
      this.drawImageCover(img);
    }
    // 3. Pan Lia Máy (Cinematic Camera)
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
      if (nextImg && progress > 0.72) {
        const fadeAlpha = (progress - 0.72) / 0.28;
        ctx.globalAlpha = Math.min(Math.max(fadeAlpha, 0), 1);
        this.drawImageCover(nextImg);
      }
    }
    // 5. Flash Pop
    else if (activeEffect === 'flash') {
      const scale = 1.08 + progress * 0.08;
      ctx.translate(originX, originY);
      ctx.scale(scale, scale);
      ctx.translate(-originX, -originY);
      this.drawImageCover(img);

      if (progress < 0.2) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * (1 - progress / 0.2)})`;
        ctx.fillRect(0, 0, width, height);
      }
    }
    // 6. Spin & Tilt
    else if (activeEffect === 'spin') {
      const angle = Math.sin(progress * Math.PI) * 0.04;
      const scale = 1.12;
      ctx.translate(originX, originY);
      ctx.rotate(angle);
      ctx.scale(scale, scale);
      ctx.translate(-originX, -originY);
      this.drawImageCover(img);
    }
    // 7. Pulse Beat
    else if (activeEffect === 'pulse') {
      const beat = Math.sin(progress * Math.PI * 4);
      const scale = 1.04 + Math.max(0, beat) * 0.07;
      ctx.translate(originX, originY);
      ctx.scale(scale, scale);
      ctx.translate(-originX, -originY);
      this.drawImageCover(img);
    } else {
      this.drawImageCover(img);
    }

    ctx.restore();
  }

  drawImageCover(img) {
    if (!img) return;
    const { ctx, width, height } = this;
    const imgRatio = img.width / img.height;
    const screenRatio = width / height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > screenRatio) {
      drawHeight = height;
      drawWidth = height * imgRatio;
      offsetX = (width - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = width;
      drawHeight = width / imgRatio;
      offsetX = 0;
      offsetY = (height - drawHeight) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }

  async preloadImages(files) {
    const promises = files.map((src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    });
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
    const images = await this.preloadImages(files);
    if (!images.length) return;

    const isScript = effectMode === 'script' && aiTimeline && aiTimeline.length > 0;
    const finalDurationSec = isScript ? 6 : totalDuration;
    const durationMs = finalDurationSec * 1000;
    const startTime = performance.now();

    const loop = (now) => {
      if (this.isCancelled) return;

      const elapsed = now - startTime;
      const overallProgress = Math.min(elapsed / durationMs, 1);

      if (onProgress) onProgress(overallProgress);

      if (elapsed >= durationMs) {
        if (onPreviewEnd) onPreviewEnd();
        return;
      }

      if (isScript) {
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

        const imgIdx = (activeScene.imageIndex || 0) % images.length;
        const curImg = images[imgIdx];
        const nxtImg = images[(imgIdx + 1) % images.length];

        this.renderImageFrame(
          curImg,
          nxtImg,
          sceneProgress,
          activeScene.effect || 'kenburns',
          imgIdx,
          activeScene.focus || 'full'
        );
      } else {
        const slideDuration = durationMs / images.length;
        const currentSlideIdx = Math.min(Math.floor(elapsed / slideDuration), images.length - 1);
        const slideProgress = (elapsed - currentSlideIdx * slideDuration) / slideDuration;
        this.renderImageFrame(
          images[currentSlideIdx],
          images[currentSlideIdx + 1] || images[0],
          slideProgress,
          selectedEffect,
          currentSlideIdx
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
    const images = await this.preloadImages(files);
    if (!images.length) return;

    const isScript = effectMode === 'script' && aiTimeline && aiTimeline.length > 0;
    const finalDurationSec = isScript ? 6 : totalDuration;
    const durationMs = finalDurationSec * 1000;

    const stream = this.canvas.captureStream(30);
    if (audioStream) {
      audioStream.getAudioTracks().forEach((track) => stream.addTrack(track));
    }

    const recordedChunks = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';

    this.recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4000000 });

    this.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    this.recorder.onstop = () => {
      if (this.isCancelled) {
        if (onCancel) onCancel();
        return;
      }
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
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

      if (isScript) {
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

        const imgIdx = (activeScene.imageIndex || 0) % images.length;
        const curImg = images[imgIdx];
        const nxtImg = images[(imgIdx + 1) % images.length];

        this.renderImageFrame(
          curImg,
          nxtImg,
          sceneProgress,
          activeScene.effect || 'kenburns',
          imgIdx,
          activeScene.focus || 'full'
        );
      } else {
        const slideDuration = durationMs / images.length;
        const currentSlideIdx = Math.min(Math.floor(elapsed / slideDuration), images.length - 1);
        const slideProgress = (elapsed - currentSlideIdx * slideDuration) / slideDuration;
        this.renderImageFrame(
          images[currentSlideIdx],
          images[currentSlideIdx + 1] || images[0],
          slideProgress,
          selectedEffect,
          currentSlideIdx
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