// src/services/audioMixer.js

export class AudioMixer {
  constructor() {
    this.audioCtx = null;
    this.dest = null;
    this.voiceAudio = null;
    this.bgmAudio = null;
    this.voiceGain = null;
    this.bgmGain = null;
  }

  init() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContextClass();
    this.dest = this.audioCtx.createMediaStreamDestination();
  }

  setup(voiceSrc, bgmSrc, bgmVolume = 0.4, voiceVolume = 1.0, isPreview = false) {
    if (!this.audioCtx) this.init();

    // Voice setup
    if (voiceSrc) {
      this.voiceAudio = new Audio(voiceSrc);
      this.voiceAudio.preload = 'metadata';
      const voiceSource = this.audioCtx.createMediaElementSource(this.voiceAudio);
      this.voiceGain = this.audioCtx.createGain();
      this.voiceGain.gain.value = voiceVolume;

      voiceSource.connect(this.voiceGain);
      this.voiceGain.connect(this.dest);

      if (isPreview) {
        this.voiceGain.connect(this.audioCtx.destination);
      }
    }

    // BGM setup
    if (bgmSrc) {
      this.bgmAudio = new Audio(bgmSrc);
      this.bgmAudio.loop = true;
      const bgmSource = this.audioCtx.createMediaElementSource(this.bgmAudio);
      this.bgmGain = this.audioCtx.createGain();
      this.bgmGain.gain.value = bgmVolume;

      bgmSource.connect(this.bgmGain);
      this.bgmGain.connect(this.dest);

      if (isPreview) {
        this.bgmGain.connect(this.audioCtx.destination);
      }
    }

    return this.dest.stream;
  }

  async play() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    if (this.voiceAudio) await this.voiceAudio.play();
    if (this.bgmAudio) await this.bgmAudio.play();
  }

  stop() {
    if (this.voiceAudio) {
      this.voiceAudio.pause();
      this.voiceAudio.currentTime = 0;
    }
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }

  // Đo thời lượng chuẩn của Voice (hỗ trợ cả trường hợp load bất đồng bộ)
  getVoiceDuration() {
    return new Promise((resolve) => {
      if (!this.voiceAudio) return resolve(0);

      // Nếu đã sẵn sàng
      if (!isNaN(this.voiceAudio.duration) && isFinite(this.voiceAudio.duration) && this.voiceAudio.duration > 0) {
        return resolve(this.voiceAudio.duration);
      }

      // Đợi sự kiện loadedmetadata
      const onLoaded = () => {
        cleanup();
        resolve(this.voiceAudio.duration || 0);
      };

      const onError = () => {
        cleanup();
        resolve(0);
      };

      const cleanup = () => {
        this.voiceAudio.removeEventListener('loadedmetadata', onLoaded);
        this.voiceAudio.removeEventListener('error', onError);
      };

      this.voiceAudio.addEventListener('loadedmetadata', onLoaded);
      this.voiceAudio.addEventListener('error', onError);

      // Timeout dự phòng sau 3s nếu file lỗi
      setTimeout(() => {
        cleanup();
        resolve(this.voiceAudio.duration || 0);
      }, 3000);
    });
  }
}