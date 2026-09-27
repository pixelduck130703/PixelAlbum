// src/services/videoRenderer.js

export class VideoRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = options.width || 720;
    this.height = options.height || 1280;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.animationFrameId = null;
    this.isRendering = false;
    this.isPreviewing = false;
    this.isCancelled = false;
    this.activeVideoElement = null;
  }

  drawImageCustom(img, scale = 1.0, offsetX = 0, offsetY = 0, alpha = 1.0) {
    const { width, height } = this.canvas;
    const iw = img.naturalWidth || img.videoWidth;
    const ih = img.naturalHeight || img.videoHeight;
    const r = Math.max(width / iw, height / ih) * scale;
    const nw = iw * r;
    const nh = ih * r;
    const cx = (width - nw) / 2 + offsetX;
    const cy = (height - nh) / 2 + offsetY;

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(img, cx, cy, nw, nh);
    this.ctx.restore();
  }

  // Khung vẽ vòng lặp dùng chung cho cả Preview và Render
  async setupAnimationLoop({ mode, files, effectMode, selectedEffect, scriptPrompt, totalDuration, onProgress, onEnded }) {
    const maxDuration = Math.min(totalDuration || 30, 30);
    const startTime = performance.now();

    if (mode === 'video') {
      this.activeVideoElement = document.createElement('video');
      this.activeVideoElement.src = files[0];
      this.activeVideoElement.muted = true;
      this.activeVideoElement.playsInline = true;
      await this.activeVideoElement.play();

      const loop = () => {
        if (!this.isRendering && !this.isPreviewing) return;
        const elapsed = (performance.now() - startTime) / 1000;
        if (onProgress) onProgress(Math.min(elapsed / maxDuration, 1));

        if (this.activeVideoElement.ended || this.activeVideoElement.currentTime >= this.activeVideoElement.duration - 0.05) {
          this.activeVideoElement.currentTime = 0;
          this.activeVideoElement.play();
        }

        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.drawImageCustom(this.activeVideoElement, 1.0);

        if (elapsed < maxDuration) {
          this.animationFrameId = requestAnimationFrame(loop);
        } else {
          onEnded();
        }
      };
      this.animationFrameId = requestAnimationFrame(loop);
    }

    if (mode === 'images') {
      const loadedImages = await Promise.all(
        files.map((src) => new Promise((res) => {
          const img = new Image();
          img.src = src;
          img.onload = () => res(img);
        }))
      );

      const slideDuration = maxDuration / loadedImages.length;

      const loop = () => {
        if (!this.isRendering && !this.isPreviewing) return;
        const elapsed = (performance.now() - startTime) / 1000;
        if (onProgress) onProgress(Math.min(elapsed / maxDuration, 1));

        const currentIndex = Math.min(Math.floor(elapsed / slideDuration), loadedImages.length - 1);
        const nextIndex = Math.min(currentIndex + 1, loadedImages.length - 1);
        const currentImg = loadedImages[currentIndex];
        const nextImg = loadedImages[nextIndex];

        const slideElapsed = elapsed - currentIndex * slideDuration;
        const p = slideElapsed / slideDuration;

        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Phân nhánh logic hiệu ứng
        if (effectMode === 'preset') {
          if (selectedEffect === 'kenburns') {
            const scale = 1.0 + p * 0.15;
            this.drawImageCustom(currentImg, scale);
          } else if (selectedEffect === 'pan') {
            const offset = (p - 0.5) * 50;
            this.drawImageCustom(currentImg, 1.1, offset, 0);
          } else if (selectedEffect === 'crossfade') {
            if (p > 0.7 && currentIndex < loadedImages.length - 1) {
              const fadeProgress = (p - 0.7) / 0.3;
              this.drawImageCustom(currentImg, 1.0, 0, 0, 1.0 - fadeProgress);
              this.drawImageCustom(nextImg, 1.0, 0, 0, fadeProgress);
            } else {
              this.drawImageCustom(currentImg, 1.0);
            }
          }
        } else {
          // Chế độ kịch bản tự nhập: kết hợp nhịp zoom và chuyển động năng động
          const dynamicScale = 1.03 + Math.sin(p * Math.PI) * 0.08;
          this.drawImageCustom(currentImg, dynamicScale);
        }

        if (elapsed < maxDuration) {
          this.animationFrameId = requestAnimationFrame(loop);
        } else {
          onEnded();
        }
      };
      this.animationFrameId = requestAnimationFrame(loop);
    }
  }

  // 1. Chạy Preview (Chỉ vẽ lên canvas hiển thị, không record)
  async startPreview(params) {
    this.stop();
    this.isPreviewing = true;
    await this.setupAnimationLoop({
      ...params,
      onEnded: () => {
        this.stop();
        if (params.onPreviewEnd) params.onPreviewEnd();
      },
    });
  }

  // 2. Chạy Xuất Video chính thức (Có MediaRecorder)
  async startRender(params) {
    this.stop();
    this.isRendering = true;
    this.isCancelled = false;
    this.recordedChunks = [];

    const canvasStream = this.canvas.captureStream(30);
    const tracks = [...canvasStream.getVideoTracks()];
    if (params.audioStream) {
      tracks.push(...params.audioStream.getAudioTracks());
    }
    const combinedStream = new MediaStream(tracks);

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    this.mediaRecorder = new MediaRecorder(combinedStream, { mimeType });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };

    this.mediaRecorder.onstop = () => {
      if (this.isCancelled) {
        if (params.onCancel) params.onCancel();
        return;
      }
      const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(blob);
      if (params.onComplete) params.onComplete(videoUrl, blob);
    };

    this.mediaRecorder.start();

    await this.setupAnimationLoop({
      ...params,
      onEnded: () => {
        this.finishRender();
      },
    });
  }

  stop() {
    this.isRendering = false;
    this.isPreviewing = false;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.activeVideoElement) {
      this.activeVideoElement.pause();
      this.activeVideoElement = null;
    }
  }

  finishRender() {
    this.stop();
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  cancel() {
    this.isCancelled = true;
    this.finishRender();
  }
}