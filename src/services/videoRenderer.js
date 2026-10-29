// src/services/videoRenderer.js

export class VideoRenderer {
  constructor(canvas, { width = 720, height = 1280 } = {}) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;

    this.width = width;
    this.height = height;

    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    this.animId = null;
    this.isCancelled = false;
    this.recorder = null;

    // Giữ nguyên logic chuyển động hiện tại.
    this.targetFps = 10;

    // ================================
    // BACKGROUND RENDER SCHEDULER
    // ================================
    // Worker được dùng làm đồng hồ cho quá trình EXPORT.
    // Preview vẫn giữ requestAnimationFrame như code cũ.
    this.renderWorker = null;
    this.renderWorkerUrl = null;
    this.renderFallbackTimer = null;

    // Track canvas dùng khi MediaRecorder đang export.
    this.renderVideoTrack = null;
  }

  // =========================================================
  // PROGRESS QUANTIZATION
  // =========================================================

  quantizeProgress(progress, durationSec) {
    const totalFrames = Math.max(
      1,
      Math.floor(durationSec * this.targetFps)
    );

    return (
      Math.floor(progress * totalFrames) /
      totalFrames
    );
  }

  // =========================================================
  // RENDER IMAGE FRAME
  // =========================================================

  renderImageFrame(
    img,
    nextImg,
    rawProgress,
    effect,
    slideIndex = 0,
    focus = 'full',
    durationSec = 2,
    baseBackgroundImg = null
  ) {
    const {
      ctx,
      width,
      height
    } = this;

    if (!ctx) return;

    ctx.clearRect(
      0,
      0,
      width,
      height
    );

    /*
     * Background.
     *
     * Giữ nguyên logic cũ:
     * ảnh đầu tiên được dùng làm nền
     * nếu baseBackgroundImg tồn tại.
     */
    if (baseBackgroundImg) {
      this.drawImageCover(
        baseBackgroundImg
      );
    } else {
      ctx.fillStyle = '#0f172a';

      ctx.fillRect(
        0,
        0,
        width,
        height
      );
    }

    if (!img) return;

    const progress =
      this.quantizeProgress(
        rawProgress,
        durationSec
      );

    let activeEffect = effect;

    /*
     * Dynamic:
     * mỗi ảnh một effect,
     * lặp lại sau 4 ảnh.
     */
    if (effect === 'dynamic') {
      const dynamicList = [
        'kenburns',
        'zoomout',
        'panleft',
        'panright',
      ];

      activeEffect =
        dynamicList[
          slideIndex %
          dynamicList.length
        ];
    }

    ctx.save();

    let originX =
      width / 2;

    let originY =
      height / 2;

    if (focus === 'top') {
      originY =
        height * 0.25;

    } else if (
      focus === 'bottom'
    ) {
      originY =
        height * 0.75;
    }

    // =====================================================
    // KEN BURNS
    // =====================================================

    if (
      activeEffect ===
      'kenburns'
    ) {
      const scale =
        1.05 +
        progress * 0.18;

      ctx.translate(
        originX,
        originY
      );

      ctx.scale(
        scale,
        scale
      );

      ctx.translate(
        -originX,
        -originY
      );

      this.drawImageCover(
        img
      );

    // =====================================================
    // ZOOM OUT
    // =====================================================

    } else if (
      activeEffect ===
      'zoomout'
    ) {
      const scale =
        1.22 -
        progress * 0.18;

      ctx.translate(
        originX,
        originY
      );

      ctx.scale(
        scale,
        scale
      );

      ctx.translate(
        -originX,
        -originY
      );

      this.drawImageCover(
        img
      );

    // =====================================================
    // PAN LEFT / RIGHT
    // TURN LEFT / RIGHT
    // =====================================================

    } else if (
      activeEffect ===
        'panleft' ||
      activeEffect ===
        'panright' ||
      activeEffect ===
        'turnleft' ||
      activeEffect ===
        'turnright'
    ) {
      /*
       * Lia ngang:
       * giữ ảnh thẳng,
       * không xoay,
       * không dịch theo chiều dọc.
       */
      const direction =
        (
          activeEffect ===
            'panleft' ||
          activeEffect ===
            'turnleft'
        )
          ? -1
          : 1;

      const scale = 1.15;

      const safeProgress =
        Math.min(
          Math.max(
            progress,
            0
          ),
          1
        );

      /*
       * Giữ biên độ nhỏ hơn
       * phần ảnh dư sau khi zoom
       * để không lộ mép.
       */
      const maxOffset =
        width *
        (scale - 1) /
        2 *
        0.9;

      const offsetX =
        direction *
        (
          safeProgress * 2 -
          1
        ) *
        maxOffset;

      ctx.translate(
        width / 2 +
          offsetX,
        height / 2
      );

      ctx.scale(
        scale,
        scale
      );

      ctx.translate(
        -width / 2,
        -height / 2
      );

      this.drawImageCover(
        img
      );

    // =====================================================
    // PAN
    // =====================================================

    } else if (
      activeEffect ===
      'pan'
    ) {
      const scale =
        1.15;

      const offsetX =
        (
          progress -
          0.5
        ) * 60;

      const offsetY =
        focus === 'top'
          ? 40
          : focus ===
            'bottom'
            ? -40
            : (
                progress -
                0.5
              ) * 30;

      ctx.translate(
        originX +
          offsetX,
        originY +
          offsetY
      );

      ctx.scale(
        scale,
        scale
      );

      ctx.translate(
        -originX,
        -originY
      );

      this.drawImageCover(
        img
      );

    // =====================================================
    // CROSSFADE
    // =====================================================

    } else if (
      activeEffect ===
      'crossfade'
    ) {
      this.drawImageCover(
        img
      );

      if (
        nextImg &&
        progress > 0.7
      ) {
        const fadeAlpha =
          Math.floor(
            (
              (
                progress -
                0.7
              ) /
              0.3
            ) *
            5
          ) / 5;

        ctx.globalAlpha =
          Math.min(
            Math.max(
              fadeAlpha,
              0
            ),
            1
          );

        this.drawImageCover(
          nextImg
        );
      }

    // =====================================================
    // FLASH
    // =====================================================

    } else if (
      activeEffect ===
      'flash'
    ) {
      const scale =
        1.08 +
        progress * 0.1;

      ctx.translate(
        originX,
        originY
      );

      ctx.scale(
        scale,
        scale
      );

      ctx.translate(
        -originX,
        -originY
      );

      this.drawImageCover(
        img
      );

      if (
        progress < 0.2
      ) {
        ctx.fillStyle =
          `rgba(255, 255, 255, ${
            0.45 *
            (
              1 -
              progress /
                0.2
            )
          })`;

        ctx.fillRect(
          0,
          0,
          width,
          height
        );
      }

    // =====================================================
    // SPIN
    // =====================================================

    } else if (
      activeEffect ===
      'spin'
    ) {
      const angle =
        Math.sin(
          progress *
          Math.PI
        ) *
        0.045;

      const scale =
        1.12;

      ctx.translate(
        originX,
        originY
      );

      ctx.rotate(
        angle
      );

      ctx.scale(
        scale,
        scale
      );

      ctx.translate(
        -originX,
        -originY
      );

      this.drawImageCover(
        img
      );

    // =====================================================
    // PULSE
    // =====================================================

    } else if (
      activeEffect ===
      'pulse'
    ) {
      const beat =
        Math.sin(
          progress *
          Math.PI *
          4
        );

      const scale =
        1.04 +
        Math.max(
          0,
          beat
        ) *
        0.08;

      ctx.translate(
        originX,
        originY
      );

      ctx.scale(
        scale,
        scale
      );

      ctx.translate(
        -originX,
        -originY
      );

      this.drawImageCover(
        img
      );

    // =====================================================
    // NONE / FALLBACK
    // =====================================================

    } else {
      this.drawImageCover(
        img
      );
    }

    ctx.restore();
  }

  // =========================================================
  // DRAW IMAGE / VIDEO COVER
  // =========================================================

  drawImageCover(media) {
    if (
      !media ||
      !this.ctx
    ) {
      return;
    }

    const {
      ctx,
      width,
      height
    } = this;

    const mWidth =
      media.videoWidth ||
      media.width;

    const mHeight =
      media.videoHeight ||
      media.height;

    if (
      !mWidth ||
      !mHeight
    ) {
      return;
    }

    const mediaRatio =
      mWidth /
      mHeight;

    const screenRatio =
      width /
      height;

    let drawWidth;
    let drawHeight;
    let offsetX;
    let offsetY;

    if (
      mediaRatio >
      screenRatio
    ) {
      drawHeight =
        height;

      drawWidth =
        height *
        mediaRatio;

      offsetX =
        (
          width -
          drawWidth
        ) /
        2;

      offsetY = 0;

    } else {
      drawWidth =
        width;

      drawHeight =
        width /
        mediaRatio;

      offsetX = 0;

      offsetY =
        (
          height -
          drawHeight
        ) /
        2;
    }

    ctx.drawImage(
      media,
      offsetX,
      offsetY,
      drawWidth,
      drawHeight
    );
  }

  // =========================================================
  // PRELOAD MEDIA ITEM
  // =========================================================

  preloadMediaItem(src) {
    return new Promise(
      (resolve) => {
        if (!src) {
          resolve(null);
          return;
        }

        const img =
          new Image();

        img.crossOrigin =
          'anonymous';

        img.src =
          src;

        img.onload =
          () => {
            resolve(img);
          };

        /*
         * Nếu load bằng Image thất bại,
         * thử xem source có phải video.
         */
        img.onerror =
          () => {
            const video =
              document.createElement(
                'video'
              );

            video.crossOrigin =
              'anonymous';

            video.muted =
              true;

            video.defaultMuted =
              true;

            video.playsInline =
              true;

            video.preload =
              'auto';

            video.src =
              src;

            let isResolved =
              false;

            const finalizeVideo =
              () => {
                if (
                  isResolved
                ) {
                  return;
                }

                isResolved =
                  true;

                resolve(
                  video
                );
              };

            video.onloadeddata =
              () => {
                /*
                 * Seek nhẹ để browser
                 * decode frame đầu.
                 */
                try {
                  video.currentTime =
                    0.05;
                } catch (_) {}
              };

            video.onseeked =
              () => {
                finalizeVideo();
              };

            video.oncanplay =
              () => {
                finalizeVideo();
              };

            video.onerror =
              () => {
                if (
                  !isResolved
                ) {
                  isResolved =
                    true;

                  resolve(
                    null
                  );
                }
              };

            /*
             * Không để preload treo vô hạn.
             */
            setTimeout(
              () => {
                if (
                  !isResolved
                ) {
                  isResolved =
                    true;

                  resolve(
                    video.videoWidth
                      ? video
                      : null
                  );
                }
              },
              2500
            );
          };
      }
    );
  }

  // =========================================================
  // PRELOAD ALL MEDIA
  // =========================================================

  async preloadImages(files) {
    const promises =
      files.map(
        (src) =>
          this.preloadMediaItem(
            src
          )
      );

    const loaded =
      await Promise.all(
        promises
      );

    return loaded.filter(
      Boolean
    );
  }

  // =========================================================
  // ENSURE VIDEO READY
  // =========================================================

  async ensureVideoReadyToDraw(
    video
  ) {
    if (
      !video ||
      video.tagName !==
        'VIDEO'
    ) {
      return;
    }

    try {
      video.currentTime =
        0;
    } catch (_) {}

    try {
      await video.play();
    } catch (_) {}

    if (
      video.readyState <
      2
    ) {
      await new Promise(
        (resolve) => {
          let finished =
            false;

          const finish =
            () => {
              if (
                finished
              ) {
                return;
              }

              finished =
                true;

              video.removeEventListener(
                'canplay',
                finish
              );

              resolve();
            };

          video.addEventListener(
            'canplay',
            finish
          );

          setTimeout(
            finish,
            300
          );
        }
      );
    }
  }

  // =========================================================
  // PREVIEW
  //
  // GIỮ NGUYÊN requestAnimationFrame
  // vì preview đang hiển thị trực tiếp lên UI.
  // =========================================================

  async startPreview({
    files,
    effectMode,
    selectedEffect,
    aiTimeline,
    totalDuration,
    onProgress,
    onPreviewEnd,
  }) {
    this.isCancelled =
      false;

    const mediaList =
      await this.preloadImages(
        files
      );

    if (
      !mediaList.length
    ) {
      return;
    }

    const baseFirstMedia =
      mediaList[0];

    if (
      baseFirstMedia.tagName ===
      'VIDEO'
    ) {
      await this.ensureVideoReadyToDraw(
        baseFirstMedia
      );

      this.ctx.clearRect(
        0,
        0,
        this.width,
        this.height
      );

      this.drawImageCover(
        baseFirstMedia
      );

    } else {
      this.renderImageFrame(
        baseFirstMedia,
        mediaList[1] ||
          baseFirstMedia,
        0,
        selectedEffect,
        0,
        'full',
        2,
        baseFirstMedia
      );
    }

    const isScript =
      effectMode ===
        'script' &&
      aiTimeline &&
      aiTimeline.length >
        0;

    const finalDurationSec =
      totalDuration ||
      6;

    const durationMs =
      finalDurationSec *
      1000;

    const startTime =
      performance.now();

    const loop =
      (now) => {
        if (
          this.isCancelled
        ) {
          return;
        }

        const elapsed =
          now -
          startTime;

        const overallProgress =
          Math.min(
            elapsed /
              durationMs,
            1
          );

        if (
          onProgress
        ) {
          onProgress(
            overallProgress
          );
        }

        /*
         * Preview kết thúc.
         */
        if (
          elapsed >=
          durationMs
        ) {
          mediaList.forEach(
            (m) => {
              if (
                m.tagName ===
                'VIDEO'
              ) {
                m.pause();
              }
            }
          );

          if (
            onPreviewEnd
          ) {
            onPreviewEnd();
          }

          return;
        }

        const currentMedia =
          mediaList[0];

        // ==============================================
        // VIDEO INPUT
        // ==============================================

        if (
          currentMedia &&
          currentMedia.tagName ===
            'VIDEO'
        ) {
          this.ctx.clearRect(
            0,
            0,
            this.width,
            this.height
          );

          if (
            currentMedia.duration &&
            !isNaN(
              currentMedia.duration
            )
          ) {
            const targetSec =
              (
                elapsed /
                1000
              ) %
              currentMedia.duration;

            if (
              Math.abs(
                currentMedia.currentTime -
                targetSec
              ) >
              0.3
            ) {
              currentMedia.currentTime =
                targetSec;
            }
          }

          this.drawImageCover(
            currentMedia
          );

        // ==============================================
        // AI SCRIPT
        // ==============================================

        } else if (
          isScript
        ) {
          let accTime =
            0;

          let activeScene =
            aiTimeline[0];

          let sceneProgress =
            0;

          for (
            let i = 0;
            i <
            aiTimeline.length;
            i++
          ) {
            const scene =
              aiTimeline[i];

            const sceneMs =
              (
                scene.duration ||
                1.5
              ) *
              1000;

            if (
              elapsed >=
                accTime &&
              elapsed <=
                accTime +
                  sceneMs
            ) {
              activeScene =
                scene;

              sceneProgress =
                (
                  elapsed -
                  accTime
                ) /
                sceneMs;

              break;
            }

            accTime +=
              sceneMs;
          }

          const imgIdx =
            (
              activeScene.imageIndex ||
              0
            ) %
            mediaList.length;

          const curImg =
            mediaList[
              imgIdx
            ];

          const nxtImg =
            mediaList[
              (
                imgIdx +
                1
              ) %
              mediaList.length
            ];

          this.renderImageFrame(
            curImg,
            nxtImg,
            sceneProgress,
            activeScene.effect ||
              'kenburns',
            imgIdx,
            activeScene.focus ||
              'full',
            activeScene.duration ||
              1.5,
            baseFirstMedia
          );

        // ==============================================
        // PRESET EFFECT
        // ==============================================

        } else {
          /*
           * Mỗi ảnh tối đa
           * 5 giây.
           *
           * Lặp lại danh sách
           * nếu video dài hơn.
           */
          const slideDuration =
            Math.min(
              durationMs /
                mediaList.length,
              5000
            );

          const slideSequenceIndex =
            Math.floor(
              elapsed /
                slideDuration
            );

          const currentSlideIdx =
            slideSequenceIndex %
            mediaList.length;

          const slideProgress =
            (
              elapsed -
              slideSequenceIndex *
                slideDuration
            ) /
            slideDuration;

          this.renderImageFrame(
            mediaList[
              currentSlideIdx
            ],

            mediaList[
              currentSlideIdx +
                1
            ] ||
              mediaList[0],

            slideProgress,

            selectedEffect,

            slideSequenceIndex,

            'full',

            slideDuration /
              1000,

            baseFirstMedia
          );
        }

        this.animId =
          requestAnimationFrame(
            loop
          );
      };

    this.animId =
      requestAnimationFrame(
        loop
      );
  }

  // =========================================================
  // BACKGROUND RENDER SCHEDULER
  // =========================================================

  /*
   * Scheduler này chỉ dùng cho EXPORT.
   *
   * requestAnimationFrame bị browser giảm mạnh
   * khi tab mất focus.
   *
   * Dedicated Worker phù hợp hơn để làm
   * đồng hồ render trong trường hợp đó.
   */
  startRenderScheduler(
    onTick,
    fps = 30
  ) {
    /*
     * Luôn dọn scheduler cũ
     * trước khi bắt đầu scheduler mới.
     */
    this.stopRenderScheduler();

    const safeFps =
      Math.max(
        1,
        Math.min(
          60,
          Number(fps) ||
            30
        )
      );

    const intervalMs =
      1000 /
      safeFps;

    /*
     * Ưu tiên Dedicated Worker.
     */
    if (
      typeof Worker !==
        'undefined' &&
      typeof Blob !==
        'undefined' &&
      typeof URL !==
        'undefined'
    ) {
      try {
        const workerSource = `
          let timer = null;

          function stopTimer() {
            if (timer !== null) {
              clearInterval(timer);
              timer = null;
            }
          }

          self.onmessage = function(event) {
            const data = event.data || {};

            if (data.type === 'start') {
              stopTimer();

              const fps = Math.max(
                1,
                Math.min(
                  60,
                  Number(data.fps) || 30
                )
              );

              const interval = 1000 / fps;

              timer = setInterval(function() {
                self.postMessage({
                  type: 'tick',
                  now: performance.now()
                });
              }, interval);

            } else if (data.type === 'stop') {
              stopTimer();
            }
          };
        `;

        const workerBlob =
          new Blob(
            [
              workerSource
            ],
            {
              type:
                'application/javascript'
            }
          );

        this.renderWorkerUrl =
          URL.createObjectURL(
            workerBlob
          );

        this.renderWorker =
          new Worker(
            this.renderWorkerUrl
          );

        this.renderWorker.onmessage =
          (event) => {
            if (
              this.isCancelled
            ) {
              return;
            }

            if (
              event.data &&
              event.data.type ===
                'tick'
            ) {
              /*
               * Dùng performance.now()
               * của main thread để cùng
               * time origin với startTime.
               */
              onTick(
                performance.now()
              );
            }
          };

        /*
         * Nếu Worker lỗi,
         * fallback sang timer thường.
         */
        this.renderWorker.onerror =
          () => {
            this.stopRenderScheduler();

            if (
              !this.isCancelled
            ) {
              this.startRenderFallbackScheduler(
                onTick,
                intervalMs
              );
            }
          };

        this.renderWorker.postMessage(
          {
            type:
              'start',

            fps:
              safeFps,
          }
        );

        return;

      } catch (err) {
        console.warn(
          'Không thể khởi tạo render worker, dùng fallback timer:',
          err
        );

        this.stopRenderScheduler();
      }
    }

    /*
     * Browser không hỗ trợ Worker.
     */
    this.startRenderFallbackScheduler(
      onTick,
      intervalMs
    );
  }

  // =========================================================
  // FALLBACK SCHEDULER
  // =========================================================

  startRenderFallbackScheduler(
    onTick,
    intervalMs
  ) {
    const loop =
      () => {
        if (
          this.isCancelled
        ) {
          return;
        }

        onTick(
          performance.now()
        );

        if (
          this.isCancelled
        ) {
          return;
        }

        this.renderFallbackTimer =
          setTimeout(
            loop,
            intervalMs
          );
      };

    this.renderFallbackTimer =
      setTimeout(
        loop,
        intervalMs
      );
  }

  // =========================================================
  // STOP RENDER SCHEDULER
  // =========================================================

  stopRenderScheduler() {
    /*
     * Clear fallback timer.
     */
    if (
      this.renderFallbackTimer !==
      null
    ) {
      clearTimeout(
        this.renderFallbackTimer
      );

      this.renderFallbackTimer =
        null;
    }

    /*
     * Stop worker.
     */
    if (
      this.renderWorker
    ) {
      try {
        this.renderWorker.postMessage(
          {
            type:
              'stop',
          }
        );
      } catch (_) {}

      try {
        this.renderWorker.terminate();
      } catch (_) {}

      this.renderWorker =
        null;
    }

    /*
     * Release Worker blob URL.
     */
    if (
      this.renderWorkerUrl
    ) {
      try {
        URL.revokeObjectURL(
          this.renderWorkerUrl
        );
      } catch (_) {}

      this.renderWorkerUrl =
        null;
    }
  }

  // =========================================================
  // START EXPORT / RENDER
  // =========================================================

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
    this.isCancelled =
      false;

    /*
     * Đảm bảo không còn
     * scheduler của render trước.
     */
    this.stopRenderScheduler();

    const mediaList =
      await this.preloadImages(
        files
      );

    if (
      !mediaList.length
    ) {
      return;
    }

    // =====================================================
    // FIRST FRAME
    // =====================================================

    const baseFirstMedia =
      mediaList[0];

    if (
      baseFirstMedia.tagName ===
      'VIDEO'
    ) {
      await this.ensureVideoReadyToDraw(
        baseFirstMedia
      );

      this.ctx.clearRect(
        0,
        0,
        this.width,
        this.height
      );

      this.drawImageCover(
        baseFirstMedia
      );

    } else {
      this.ctx.clearRect(
        0,
        0,
        this.width,
        this.height
      );

      this.renderImageFrame(
        baseFirstMedia,

        mediaList[1] ||
          baseFirstMedia,

        0,

        selectedEffect,

        0,

        'full',

        2,

        baseFirstMedia
      );
    }

    // =====================================================
    // TIMELINE
    // =====================================================

    const isScript =
      effectMode ===
        'script' &&
      aiTimeline &&
      aiTimeline.length >
        0;

    const finalDurationSec =
      totalDuration ||
      6;

    const durationMs =
      finalDurationSec *
      1000;

    /*
     * FPS output mong muốn.
     */
    const renderFps =
      30;

    // =====================================================
    // CANVAS CAPTURE STREAM
    // =====================================================

    /*
     * Ưu tiên captureStream(0).
     *
     * Với 0 FPS:
     * browser không tự lấy frame liên tục.
     *
     * Sau mỗi lần render,
     * ta gọi requestFrame()
     * để chủ động gửi canvas frame
     * sang MediaRecorder.
     */
    let stream =
      this.canvas.captureStream(
        0
      );

    let videoTrack =
      stream
        .getVideoTracks()[0] ||
      null;

    let manualFrame =
      !!(
        videoTrack &&
        typeof videoTrack.requestFrame ===
          'function'
      );

    /*
     * Browser nào không hỗ trợ
     * CanvasCaptureMediaStreamTrack.requestFrame()
     * thì fallback về captureStream(30).
     */
    if (
      !manualFrame
    ) {
      try {
        if (
          videoTrack
        ) {
          videoTrack.stop();
        }
      } catch (_) {}

      stream =
        this.canvas.captureStream(
          renderFps
        );

      videoTrack =
        stream
          .getVideoTracks()[0] ||
        null;
    }

    this.renderVideoTrack =
      videoTrack;

    // =====================================================
    // AUDIO
    // =====================================================

    /*
     * Giữ nguyên audio stream
     * đang được AudioMixer tạo.
     */
    if (
      audioStream
    ) {
      audioStream
        .getAudioTracks()
        .forEach(
          (track) => {
            stream.addTrack(
              track
            );
          }
        );
    }

    // =====================================================
    // MEDIA RECORDER FORMAT
    // =====================================================

    const recordedChunks =
      [];

    let mimeType =
      'video/webm';

    if (
      MediaRecorder.isTypeSupported(
        'video/mp4;codecs=avc1,mp4a.40.2'
      )
    ) {
      mimeType =
        'video/mp4;codecs=avc1,mp4a.40.2';

    } else if (
      MediaRecorder.isTypeSupported(
        'video/mp4'
      )
    ) {
      mimeType =
        'video/mp4';

    } else if (
      MediaRecorder.isTypeSupported(
        'video/webm;codecs=vp9'
      )
    ) {
      mimeType =
        'video/webm;codecs=vp9';
    }

    // =====================================================
    // MEDIA RECORDER
    // =====================================================

    this.recorder =
      new MediaRecorder(
        stream,
        {
          mimeType,
          videoBitsPerSecond:
            5000000,
        }
      );

    // =====================================================
    // RECORDER DATA
    // =====================================================

    this.recorder.ondataavailable =
      (event) => {
        if (
          event.data &&
          event.data.size >
            0
        ) {
          recordedChunks.push(
            event.data
          );
        }
      };

    // =====================================================
    // RECORDER ERROR
    // =====================================================

    this.recorder.onerror =
      (event) => {
        console.error(
          'MediaRecorder error:',
          event
        );
      };

    // =====================================================
    // RECORDER STOP
    // =====================================================

    this.recorder.onstop =
      () => {
        /*
         * Dừng scheduler trước.
         */
        this.stopRenderScheduler();

        /*
         * Dừng video track
         * do canvas tạo.
         */
        try {
          if (
            this.renderVideoTrack
          ) {
            this.renderVideoTrack.stop();
          }
        } catch (_) {}

        this.renderVideoTrack =
          null;

        /*
         * Pause video source
         * nếu input là video.
         */
        mediaList.forEach(
          (media) => {
            if (
              media.tagName ===
              'VIDEO'
            ) {
              try {
                media.pause();
              } catch (_) {}
            }
          }
        );

        /*
         * Nếu user cancel:
         * giữ nguyên callback cũ.
         */
        if (
          this.isCancelled
        ) {
          if (
            onCancel
          ) {
            onCancel();
          }

          return;
        }

        /*
         * Tạo video Blob.
         */
        const rawType =
          mimeType.split(
            ';'
          )[0];

        const blob =
          new Blob(
            recordedChunks,
            {
              type:
                rawType,
            }
          );

        const videoUrl =
          URL.createObjectURL(
            blob
          );

        if (
          onComplete
        ) {
          onComplete(
            videoUrl
          );
        }
      };

    // =====================================================
    // START RECORDER
    // =====================================================

    /*
     * timeslice = 1000:
     * recorder phát dataavailable
     * khoảng mỗi 1 giây.
     *
     * Không đổi nội dung video,
     * nhưng tránh việc phải giữ
     * một chunk khổng lồ tới cuối.
     */
    this.recorder.start(
      1000
    );

    // =====================================================
    // RENDER TIME
    // =====================================================

    const startTime =
      performance.now();

    /*
     * Hàm yêu cầu canvas capture track
     * lấy frame vừa được vẽ.
     */
    const requestCapturedFrame =
      () => {
        if (
          manualFrame &&
          videoTrack &&
          typeof videoTrack.requestFrame ===
            'function'
        ) {
          try {
            videoTrack.requestFrame();
          } catch (_) {}
        }
      };

    /*
     * Capture frame đầu tiên.
     */
    requestCapturedFrame();

    // =====================================================
    // MAIN RENDER TICK
    // =====================================================

    const renderTick =
      (now) => {
        /*
         * User cancel.
         */
        if (
          this.isCancelled
        ) {
          if (
            this.recorder &&
            this.recorder.state !==
              'inactive'
          ) {
            try {
              this.recorder.stop();
            } catch (_) {}
          }

          return;
        }

        /*
         * Recorder đã stop rồi
         * thì không render thêm.
         */
        if (
          !this.recorder ||
          this.recorder.state ===
            'inactive'
        ) {
          return;
        }

        // ===============================================
        // CURRENT TIME
        // ===============================================

        const elapsed =
          now -
          startTime;

        const overallProgress =
          Math.min(
            elapsed /
              durationMs,
            1
          );

        if (
          onProgress
        ) {
          onProgress(
            overallProgress
          );
        }

        // ===============================================
        // FINISHED
        // ===============================================

        if (
          elapsed >=
          durationMs
        ) {
          /*
           * Capture frame cuối.
           */
          requestCapturedFrame();

          this.stopRenderScheduler();

          if (
            this.recorder &&
            this.recorder.state !==
              'inactive'
          ) {
            try {
              /*
               * Yêu cầu recorder flush
               * dữ liệu hiện tại trước.
               */
              if (
                this.recorder.state ===
                'recording'
              ) {
                try {
                  this.recorder.requestData();
                } catch (_) {}
              }

              this.recorder.stop();

            } catch (_) {}
          }

          return;
        }

        // ===============================================
        // MEDIA
        // ===============================================

        const currentMedia =
          mediaList[0];

        // ===============================================
        // VIDEO INPUT
        // ===============================================

        if (
          currentMedia &&
          currentMedia.tagName ===
            'VIDEO'
        ) {
          this.ctx.clearRect(
            0,
            0,
            this.width,
            this.height
          );

          if (
            currentMedia.duration &&
            !isNaN(
              currentMedia.duration
            )
          ) {
            const targetSec =
              (
                elapsed /
                1000
              ) %
              currentMedia.duration;

            if (
              Math.abs(
                currentMedia.currentTime -
                  targetSec
              ) >
              0.3
            ) {
              try {
                currentMedia.currentTime =
                  targetSec;
              } catch (_) {}
            }
          }

          this.drawImageCover(
            currentMedia
          );

        // ===============================================
        // AI SCRIPT MODE
        // ===============================================

        } else if (
          isScript
        ) {
          let accTime =
            0;

          let activeScene =
            aiTimeline[0];

          let sceneProgress =
            0;

          for (
            let i = 0;
            i <
            aiTimeline.length;
            i++
          ) {
            const scene =
              aiTimeline[i];

            const sceneMs =
              (
                scene.duration ||
                1.5
              ) *
              1000;

            if (
              elapsed >=
                accTime &&
              elapsed <=
                accTime +
                  sceneMs
            ) {
              activeScene =
                scene;

              sceneProgress =
                (
                  elapsed -
                  accTime
                ) /
                sceneMs;

              break;
            }

            accTime +=
              sceneMs;
          }

          const imgIdx =
            (
              activeScene.imageIndex ||
              0
            ) %
            mediaList.length;

          const curImg =
            mediaList[
              imgIdx
            ];

          const nxtImg =
            mediaList[
              (
                imgIdx +
                1
              ) %
              mediaList.length
            ];

          /*
           * Giữ nguyên hàm effect.
           */
          this.renderImageFrame(
            curImg,

            nxtImg,

            sceneProgress,

            activeScene.effect ||
              'kenburns',

            imgIdx,

            activeScene.focus ||
              'full',

            activeScene.duration ||
              1.5,

            baseFirstMedia
          );

        // ===============================================
        // PRESET EFFECT MODE
        // ===============================================

        } else {
          /*
           * Logic cũ:
           *
           * mỗi ảnh tối đa 5 giây.
           */
          const slideDuration =
            Math.min(
              durationMs /
                mediaList.length,
              5000
            );

          const slideSequenceIndex =
            Math.floor(
              elapsed /
                slideDuration
            );

          const currentSlideIdx =
            slideSequenceIndex %
            mediaList.length;

          const slideProgress =
            (
              elapsed -
              slideSequenceIndex *
                slideDuration
            ) /
            slideDuration;

          this.renderImageFrame(
            mediaList[
              currentSlideIdx
            ],

            mediaList[
              currentSlideIdx +
                1
            ] ||
              mediaList[0],

            slideProgress,

            selectedEffect,

            slideSequenceIndex,

            'full',

            slideDuration /
              1000,

            baseFirstMedia
          );
        }

        /*
         * Canvas vừa vẽ xong.
         *
         * Nếu browser hỗ trợ manual frame,
         * chủ động gửi chính frame này
         * sang MediaRecorder.
         */
        requestCapturedFrame();
      };

    // =====================================================
    // START BACKGROUND-FRIENDLY SCHEDULER
    // =====================================================

    this.startRenderScheduler(
      renderTick,
      renderFps
    );
  }

  // =========================================================
  // STOP
  // =========================================================

  stop() {
    this.isCancelled =
      true;

    /*
     * Stop worker/timer render.
     */
    this.stopRenderScheduler();

    /*
     * Preview vẫn dùng RAF,
     * nên cancel RAF nếu tồn tại.
     */
    if (
      this.animId
    ) {
      cancelAnimationFrame(
        this.animId
      );

      this.animId =
        null;
    }

    /*
     * Stop recorder.
     */
    if (
      this.recorder &&
      this.recorder.state !==
        'inactive'
    ) {
      try {
        this.recorder.stop();
      } catch (_) {}
    }

    /*
     * Stop canvas capture track.
     */
    if (
      this.renderVideoTrack
    ) {
      try {
        this.renderVideoTrack.stop();
      } catch (_) {}

      this.renderVideoTrack =
        null;
    }
  }

  // =========================================================
  // CANCEL
  // =========================================================

  cancel() {
    this.stop();
  }
}