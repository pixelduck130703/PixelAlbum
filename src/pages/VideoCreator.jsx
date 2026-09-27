// src/pages/VideoCreator.jsx
import React, { useState, useRef, useEffect } from 'react';
import { AudioMixer } from '../services/audioMixer';
import { VideoRenderer } from '../services/videoRenderer';
import {
  generateThaiSpeechAudio,
  analyzeVideoScriptWithAi,
  generateThaiScriptFromImage,
  extractFrameFromVideo, // 👈 ĐÃ BỔ SUNG: Khắc phục lỗi crash khi tải video
  GEMINI_TTS_VOICES,
  DEFAULT_ELEVENLABS_PREMADES,
  VOICE_PROVIDERS,
  RateLimitError,
  fetchAllElevenLabsVoices,
} from '../services/aiVoiceService';
import { generateGrokMotionVideo } from '../services/grokVideoService';

export default function VideoCreator() {
  const [mediaType, setMediaType] = useState('images');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [aspectRatio, setAspectRatio] = useState('9:16');

  // Kéo thả files
  const [isDraggingOverUpload, setIsDraggingOverUpload] = useState(false);
  const [isDraggingOverVoice, setIsDraggingOverVoice] = useState(false);
  const [isDraggingOverBgm, setIsDraggingOverBgm] = useState(false);

  // Mặc định chọn Hiệu ứng Canvas bên trái
  const [effectMode, setEffectMode] = useState('preset');
  const [selectedEffect, setSelectedEffect] = useState('kenburns');
  const [customScriptPrompt, setCustomScriptPrompt] = useState(
    'Người mẫu mỉm cười nhẹ, xoay nhẹ người sang trái khoe trọn form dáng trang phục, vạt áo cử động tự nhiên mượt mà.'
  );

  // xAI Grok API States
  const [xaiApiKey, setXaiApiKey] = useState(
    localStorage.getItem('CUSTOM_XAI_KEY') || ''
  );
  const [isGeneratingGrok, setIsGeneratingGrok] = useState(false);
  const [grokStatusText, setGrokStatusText] = useState('');
  const [isAiDirecting, setIsAiDirecting] = useState(false);

  // Mặc định chọn File MP3 trong máy
  const [voiceSourceType, setVoiceSourceType] = useState('file');
  const [voiceFile, setVoiceFile] = useState(null);
  const [voiceName, setVoiceName] = useState('');
  const [voiceVolume, setVoiceVolume] = useState(1.0);

  // Cấu hình Nhà cung cấp AI
  const [selectedProvider, setSelectedProvider] = useState('gemini');
  const [selectedVoiceId, setSelectedVoiceId] = useState(GEMINI_TTS_VOICES?.[0]?.id || 'Sadaltager');
  const [customElevenVoiceId, setCustomElevenVoiceId] = useState('');

  const [geminiApiKey, setGeminiApiKey] = useState(
    localStorage.getItem('CUSTOM_GEMINI_KEY') || 'AQ.Ab8RN6JBV__jToQkVPcnyf3ux4U-niG1KvjnNQeW5uYoKdMMLg'
  );
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState(
    localStorage.getItem('CUSTOM_ELEVENLABS_KEY') || 'sk_1b9707067e6f7cce7ceee1c56d2018865aae6f3319c0d1c3'
  );
  const [elevenVoiceList, setElevenVoiceList] = useState(DEFAULT_ELEVENLABS_PREMADES || []);
  const [keySavedStatus, setKeySavedStatus] = useState(false);

  const [geminiCooldown, setGeminiCooldown] = useState(0);

  // Kịch bản đọc tiếng Thái (mặc định mẫu sẵn 15-18s)
  const [thaiScript, setThaiScript] = useState(
    'อยากได้ลุคสตรีทเท่ๆ ที่ใส่แล้วหุ่นเพรียวขึ้นทันตาไหมครับ? แนะนำเสื้อยืดโอเวอร์ไซส์ตัวนี้เลย ลายสกรีนคมชัดสไตล์เรโทร ช่วยพรางหุ่นได้เนียนตามากๆ ผ้าคอตตอนแท้ร้อยเปอร์เซ็นต์ นุ่ม สบาย ระบายอากาศดี ไม่ร้อนแน่นอน มีไซส์ตั้งแต่ M จนถึง 4XL สั่งซื้อวันนี้โปรโมชั่นพิเศษสองตัวส่งฟรี ทักแชทสั่งเลยครับ!'
  );
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isWritingScript, setIsWritingScript] = useState(false);

  const [isPlayingVoicePreview, setIsPlayingVoicePreview] = useState(false);
  const previewAudioRef = useRef(null);

  // CẤU HÌNH NHẠC NỀN (BGM)
  const [bgmSourceType, setBgmSourceType] = useState('file');
  const [bgmFile, setBgmFile] = useState(null);
  const [bgmName, setBgmName] = useState('');
  const [bgmVolume, setBgmVolume] = useState(0.4);

  const [isPlayingUploadedBgmPreview, setIsPlayingUploadedBgmPreview] = useState(false);
  const uploadedBgmPreviewAudioRef = useRef(null);

  // Kho nhạc tự lưu của người dùng (từ file máy tính)
  const [customBgmList, setCustomBgmList] = useState(() => {
    try {
      const saved = localStorage.getItem('USER_CUSTOM_BGMS');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedCustomBgmId, setSelectedCustomBgmId] = useState('');
  const [playingCustomBgmPreviewId, setPlayingCustomBgmPreviewId] = useState(null);
  const customBgmPreviewAudioRef = useRef(null);

  const [isPreviewingVideo, setIsPreviewingVideo] = useState(false);
  const [previewDuration, setPreviewDuration] = useState(6);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputVideoUrl, setOutputVideoUrl] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const previewCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const voiceFileInputRef = useRef(null);
  const bgmFileInputRef = useRef(null);
  const activeRendererRef = useRef(null);
  const activeMixerRef = useRef(null);

  useEffect(() => {
    if (geminiCooldown <= 0) return;
    const timer = setInterval(() => {
      setGeminiCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [geminiCooldown]);

  useEffect(() => {
    if (elevenLabsApiKey && typeof fetchAllElevenLabsVoices === 'function') {
      fetchAllElevenLabsVoices(elevenLabsApiKey).then((voices) => {
        if (voices && voices.length > 0) {
          setElevenVoiceList(voices);
        }
      });
    }

    return () => {
      stopAllActivities();
    };
  }, []);

  useEffect(() => {
    if (uploadedBgmPreviewAudioRef.current) {
      uploadedBgmPreviewAudioRef.current.volume = Math.min(Math.max(bgmVolume, 0), 1.0);
    }
    if (customBgmPreviewAudioRef.current) {
      customBgmPreviewAudioRef.current.volume = Math.min(Math.max(bgmVolume, 0), 1.0);
    }
  }, [bgmVolume]);

  const handleSaveGeminiKey = () => {
    localStorage.setItem('CUSTOM_GEMINI_KEY', geminiApiKey.trim());
    setGeminiCooldown(0);
    setKeySavedStatus(true);
    setTimeout(() => setKeySavedStatus(false), 2000);
  };

  const handleSaveElevenKey = async () => {
    const clean = elevenLabsApiKey.trim();
    localStorage.setItem('CUSTOM_ELEVENLABS_KEY', clean);
    if (typeof fetchAllElevenLabsVoices === 'function') {
      const voices = await fetchAllElevenLabsVoices(clean);
      if (voices && voices.length > 0) {
        setElevenVoiceList(voices);
      }
    }
    setKeySavedStatus(true);
    setTimeout(() => setKeySavedStatus(false), 2000);
  };

  const handleSaveXaiKey = (value) => {
    setXaiApiKey(value);
    localStorage.setItem('CUSTOM_XAI_KEY', value.trim());
  };

  const stopAllActivities = () => {
    if (activeRendererRef.current) activeRendererRef.current.stop();
    if (activeMixerRef.current) activeMixerRef.current.stop();
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (uploadedBgmPreviewAudioRef.current) {
      uploadedBgmPreviewAudioRef.current.pause();
      uploadedBgmPreviewAudioRef.current = null;
      setIsPlayingUploadedBgmPreview(false);
    }
    if (customBgmPreviewAudioRef.current) {
      customBgmPreviewAudioRef.current.pause();
      customBgmPreviewAudioRef.current = null;
      setPlayingCustomBgmPreviewId(null);
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsPreviewingVideo(false);
    setIsPlayingVoicePreview(false);
    setPreviewCurrentTime(0);
    setProgress(0);
  };

  const formatTime = (seconds) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProviderChange = (providerId) => {
    setSelectedProvider(providerId);
    setKeySavedStatus(false);
    if (providerId === 'gemini') {
      setSelectedVoiceId(GEMINI_TTS_VOICES?.[0]?.id || 'Sadaltager');
    } else {
      setSelectedVoiceId(elevenVoiceList?.[0]?.id || DEFAULT_ELEVENLABS_PREMADES?.[0]?.id || 'JBFqnCBsd6RMkjVDRZzb');
    }
  };

  const getEffectiveVoiceId = () => {
    if (selectedProvider === 'elevenlabs' && customElevenVoiceId.trim()) {
      return customElevenVoiceId.trim();
    }
    return selectedVoiceId;
  };

  // 1. TƯ LIỆU ẢNH / VIDEO
  const processMediaFiles = (files) => {
    const validFiles = Array.from(files).filter((file) => {
      if (mediaType === 'images') {
        return file.type.startsWith('image/');
      }
      return file.type.startsWith('video/');
    });

    if (!validFiles.length) {
      alert(`Vui lòng chọn đúng tệp ${mediaType === 'images' ? 'hình ảnh' : 'video'}!`);
      return;
    }

    const urls = validFiles.map((file) => URL.createObjectURL(file));
    setMediaFiles((prev) => [...prev, ...urls]);
  };

  const handleMediaUpload = (e) => {
    if (e.target.files && e.target.files.length) {
      processMediaFiles(e.target.files);
    }
  };

  const handleFileDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverUpload(true);
  };

  const handleFileDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDraggingOverUpload) setIsDraggingOverUpload(true);
  };

  const handleFileDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDraggingOverUpload(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverUpload(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processMediaFiles(e.dataTransfer.files);
    }
  };

  // 2. TỆP VOICE TỰ TẢI
  const processVoiceFile = (file) => {
    if (!file || !file.type.startsWith('audio/')) {
      alert('Vui lòng chọn tệp âm thanh (MP3, WAV, M4A, OGG)!');
      return;
    }
    setVoiceFile(URL.createObjectURL(file));
    setVoiceName(file.name);
  };

  const handleVoiceUpload = (e) => {
    const file = e.target.files[0];
    if (file) processVoiceFile(file);
  };

  const handleVoiceDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverVoice(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processVoiceFile(e.dataTransfer.files[0]);
    }
  };

  // 3. TỆP BGM
  const processBgmFile = (file) => {
    if (!file || !file.type.startsWith('audio/')) {
      alert('Vui lòng chọn tệp nhạc nền hợp lệ (.mp3, .wav)!');
      return;
    }

    if (uploadedBgmPreviewAudioRef.current) {
      uploadedBgmPreviewAudioRef.current.pause();
      uploadedBgmPreviewAudioRef.current = null;
      setIsPlayingUploadedBgmPreview(false);
    }

    const url = URL.createObjectURL(file);
    setBgmFile(url);
    setBgmName(file.name);
  };

  const handleBgmUpload = (e) => {
    const file = e.target.files[0];
    if (file) processBgmFile(file);
  };

  const handleBgmDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverBgm(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processBgmFile(e.dataTransfer.files[0]);
    }
  };

  const togglePreviewUploadedBgm = (e) => {
    e?.stopPropagation();
    if (!bgmFile) {
      alert('Chưa có tệp nhạc nào được tải lên!');
      return;
    }

    if (isPlayingUploadedBgmPreview) {
      if (uploadedBgmPreviewAudioRef.current) {
        uploadedBgmPreviewAudioRef.current.pause();
        uploadedBgmPreviewAudioRef.current = null;
      }
      setIsPlayingUploadedBgmPreview(false);
      return;
    }

    if (customBgmPreviewAudioRef.current) {
      customBgmPreviewAudioRef.current.pause();
      setPlayingCustomBgmPreviewId(null);
    }

    const audio = new Audio(bgmFile);
    uploadedBgmPreviewAudioRef.current = audio;
    audio.volume = Math.min(Math.max(bgmVolume, 0), 1.0);
    audio.onended = () => setIsPlayingUploadedBgmPreview(false);
    audio.onerror = () => setIsPlayingUploadedBgmPreview(false);

    setIsPlayingUploadedBgmPreview(true);
    audio.play().catch(() => setIsPlayingUploadedBgmPreview(false));
  };

  const handleSaveCurrentBgmToStorage = () => {
    if (!bgmFile || !bgmName) {
      alert('Vui lòng tải file nhạc lên trước khi lưu!');
      return;
    }

    const newSong = {
      id: 'bgm_' + Date.now(),
      title: bgmName.replace(/\.[^/.]+$/, ''),
      desc: 'Nhạc tải từ máy',
      url: bgmFile,
    };

    const updated = [newSong, ...customBgmList];
    setCustomBgmList(updated);
    try {
      localStorage.setItem('USER_CUSTOM_BGMS', JSON.stringify(updated));
    } catch {}
    alert(`Đã lưu "${newSong.title}" vào kho nhạc!`);
  };

  // 4. KHO NHẠC TỰ LƯU
  const handleSelectCustomBgm = (item) => {
    setSelectedCustomBgmId(item.id);
    setBgmFile(item.url);
    setBgmName(item.title);
  };

  const togglePreviewCustomBgm = (e, item) => {
    e.stopPropagation();
    if (playingCustomBgmPreviewId === item.id) {
      if (customBgmPreviewAudioRef.current) {
        customBgmPreviewAudioRef.current.pause();
        customBgmPreviewAudioRef.current = null;
      }
      setPlayingCustomBgmPreviewId(null);
      return;
    }

    if (uploadedBgmPreviewAudioRef.current) {
      uploadedBgmPreviewAudioRef.current.pause();
      setIsPlayingUploadedBgmPreview(false);
    }
    if (customBgmPreviewAudioRef.current) {
      customBgmPreviewAudioRef.current.pause();
    }

    const audio = new Audio(item.url);
    customBgmPreviewAudioRef.current = audio;
    audio.volume = Math.min(Math.max(bgmVolume, 0), 1.0);
    audio.onended = () => setPlayingCustomBgmPreviewId(null);
    audio.onerror = () => setPlayingCustomBgmPreviewId(null);

    setPlayingCustomBgmPreviewId(item.id);
    audio.play().catch(() => setPlayingCustomBgmPreviewId(null));
  };

  const handleDeleteCustomBgm = (e, id) => {
    e.stopPropagation();
    const updated = customBgmList.filter((b) => b.id !== id);
    setCustomBgmList(updated);
    try {
      localStorage.setItem('USER_CUSTOM_BGMS', JSON.stringify(updated));
    } catch {}
    if (selectedCustomBgmId === id) {
      setSelectedCustomBgmId('');
      setBgmFile(null);
      setBgmName('');
    }
  };

  // SẮP XẾP TƯ LIỆU
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const updated = [...mediaFiles];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, moved);
    setMediaFiles(updated);
    setDraggedIndex(null);
  };
  const removeMedia = (index) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  // AI TỰ ĐỘNG NHÌN ẢNH / VIDEO VIẾT KỊCH BẢN TIẾNG THÁI (15 - 18s)
  const handleAutoGenerateThaiScript = async () => {
    if (mediaFiles.length === 0) {
      alert('Vui lòng tải lên ít nhất 1 ảnh hoặc video ở mục 01!');
      return;
    }
    if (!geminiApiKey || !geminiApiKey.trim()) {
      alert('Vui lòng nhập Google AI Studio API Key ở ô cấu hình!');
      return;
    }

    try {
      setIsWritingScript(true);
      
      // Nếu là video, tự trích xuất 1 frame ảnh đại diện; nếu là ảnh thì dùng trực tiếp
      let imageInput = mediaFiles[0];
      if (mediaType === 'video') {
        imageInput = await extractFrameFromVideo(mediaFiles[0]);
      }

      const generatedScript = await generateThaiScriptFromImage(
        imageInput,
        geminiApiKey,
        customScriptPrompt
      );
      setThaiScript(generatedScript);
    } catch (err) {
      alert('Không thể tạo văn bản tự động: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setIsWritingScript(false);
    }
  };

  // NÚT NGHE THỬ GIỌNG ĐỌC
  const togglePreviewVoice = async () => {
    if (isPlayingVoicePreview) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setIsPlayingVoicePreview(false);
      return;
    }

    if (voiceSourceType === 'ai' && (!thaiScript || !thaiScript.trim())) {
      alert('Vui lòng nhập văn bản kịch bản hoặc bấm nút tạo kịch bản trước khi nghe thử!');
      return;
    }

    try {
      setIsGeneratingVoice(true);
      let audioUrl = voiceFile;

      if (voiceSourceType === 'ai') {
        const activeVoiceId = getEffectiveVoiceId();
        audioUrl = await generateThaiSpeechAudio(thaiScript, activeVoiceId, {
          provider: selectedProvider,
          geminiApiKey,
          elevenLabsApiKey,
        });
      }

      if (!audioUrl) throw new Error('Không nhận được tệp âm thanh.');

      if (previewAudioRef.current) previewAudioRef.current.pause();

      const audio = new Audio(audioUrl);
      previewAudioRef.current = audio;
      audio.volume = Math.min(voiceVolume, 1.0);
      audio.onended = () => setIsPlayingVoicePreview(false);
      audio.onerror = () => setIsPlayingVoicePreview(false);

      setIsPlayingVoicePreview(true);
      await audio.play();
    } catch (err) {
      console.error('Chi tiết lỗi:', err);
      setIsPlayingVoicePreview(false);

      if (err instanceof RateLimitError || err.retryAfter) {
        if (selectedProvider === 'gemini') {
          setGeminiCooldown(err.retryAfter || 23);
        }
        alert(`Gemini đang đợi giới hạn lượt gọi (${err.retryAfter || 20}s). Hãy đổi API Key mới hoặc chuyển sang tab ElevenLabs!`);
      } else {
        alert('Lỗi: ' + (err.message || 'Không thể phát âm thanh.'));
      }
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  // GỌI GROK IMAGE-TO-VIDEO API TẠO CHUYỂN ĐỘNG NHÂN VẬT THỰC TẾ
  const handleGenerateGrokMotion = async () => {
    if (mediaFiles.length === 0) {
      alert('Vui lòng tải lên 1 ảnh sản phẩm / người mẫu trước khi tạo chuyển động!');
      return;
    }
    if (!xaiApiKey || !xaiApiKey.trim()) {
      alert('Vui lòng nhập xAI Grok API Key trong ô bên dưới trước!');
      return;
    }

    stopAllActivities();
    setIsGeneratingGrok(true);
    setGrokStatusText('Đang kết nối xAI Grok...');

    try {
      const videoResultUrl = await generateGrokMotionVideo({
        imageUrl: mediaFiles[0],
        promptText: customScriptPrompt || 'Người mẫu thời trang nhẹ nhàng xoay người tạo dáng khoe trang phục',
        apiKey: xaiApiKey,
        aspectRatio: aspectRatio,
        onStatusUpdate: (msg) => setGrokStatusText(msg),
      });

      setOutputVideoUrl(videoResultUrl);
      setPreviewDuration(6);
      alert('Đã tạo thành công video nhân vật chuyển động bằng Grok AI!');
    } catch (err) {
      console.error(err);
      alert('Lỗi Grok API: ' + (err.message || 'Không thể tạo video.'));
    } finally {
      setIsGeneratingGrok(false);
      setGrokStatusText('');
    }
  };

  const getVideoDimensions = () => {
    return aspectRatio === '4:3' ? { width: 960, height: 720 } : { width: 720, height: 1280 };
  };

  const prepareSession = async (isPreview = false) => {
    let finalVoiceSrc = voiceFile;
    if (voiceSourceType === 'ai') {
      if (!thaiScript || !thaiScript.trim()) {
        throw new Error('Vui lòng nhập nội dung tiếng Thái hoặc bấm tạo kịch bản!');
      }
      setIsGeneratingVoice(true);
      try {
        const activeVoiceId = getEffectiveVoiceId();
        finalVoiceSrc = await generateThaiSpeechAudio(thaiScript, activeVoiceId, {
          provider: selectedProvider,
          geminiApiKey,
          elevenLabsApiKey,
        });
      } catch (err) {
        if ((err instanceof RateLimitError || err.retryAfter) && selectedProvider === 'gemini') {
          setGeminiCooldown(err.retryAfter || 23);
        }
        throw err;
      } finally {
        setIsGeneratingVoice(false);
      }
    }

    if (!finalVoiceSrc && voiceSourceType === 'file') {
      throw new Error('Vui lòng chọn hoặc kéo thả file MP3 giọng đọc từ máy!');
    }

    const mixer = new AudioMixer();
    activeMixerRef.current = mixer;
    const audioStream = mixer.setup(finalVoiceSrc, bgmFile, bgmVolume, voiceVolume, isPreview);

    // Tự động nhận diện độ dài thực tế của file âm thanh (khớp 15-18s hoặc theo câu thoại tự nhập)
    let voiceDuration = await mixer.getVoiceDuration();
    let targetDuration = Math.max(Math.ceil(voiceDuration) || 6, 3);
    let aiTimeline = null;

    if (effectMode === 'script') {
      setIsAiDirecting(true);
      try {
        aiTimeline = await analyzeVideoScriptWithAi(
          customScriptPrompt,
          mediaFiles.length,
          geminiApiKey,
          targetDuration
        );
      } finally {
        setIsAiDirecting(false);
      }
    }

    setPreviewDuration(targetDuration);

    const { width, height } = getVideoDimensions();
    const renderer = new VideoRenderer(previewCanvasRef.current, { width, height });
    activeRendererRef.current = renderer;

    return { mixer, renderer, audioStream, targetDuration, aiTimeline };
  };

  const handleTogglePreviewVideo = async () => {
    if (isPreviewingVideo) {
      stopAllActivities();
      return;
    }

    if (mediaFiles.length === 0) {
      alert('Vui lòng tải lên ít nhất 1 ảnh sản phẩm để xem trước!');
      return;
    }

    stopAllActivities();
    setOutputVideoUrl(null);
    setIsPreviewingVideo(true);

    try {
      const { mixer, renderer, targetDuration, aiTimeline } = await prepareSession(true);
      await mixer.play();

      renderer.startPreview({
        files: mediaFiles,
        effectMode,
        selectedEffect,
        aiTimeline,
        totalDuration: targetDuration,
        onProgress: (p) => {
          const clamped = Math.min(Math.max(p, 0), 1);
          setProgress(Math.round(clamped * 100));
          setPreviewCurrentTime(clamped * targetDuration);
        },
        onPreviewEnd: () => {
          mixer.stop();
          setIsPreviewingVideo(false);
          setProgress(0);
          setPreviewCurrentTime(0);
        },
      });
    } catch (err) {
      console.error(err);
      stopAllActivities();
      alert(err.message || 'Lỗi khi xem trước video.');
    }
  };

  const handleSeek = (newTime) => {
    if (!previewDuration || previewDuration === 0) return;
    const clampedTime = Math.min(Math.max(newTime, 0), previewDuration);
    setPreviewCurrentTime(clampedTime);
    setProgress(Math.round((clampedTime / previewDuration) * 100));

    if (activeMixerRef.current && typeof activeMixerRef.current.seek === 'function') {
      activeMixerRef.current.seek(clampedTime);
    }
    if (activeRendererRef.current && typeof activeRendererRef.current.seek === 'function') {
      activeRendererRef.current.seek(clampedTime);
    }
  };

  const handleStartRender = async () => {
    if (mediaFiles.length === 0) {
      alert('Vui lòng tải lên ít nhất 1 ảnh sản phẩm!');
      return;
    }

    stopAllActivities();
    setRendering(true);
    setProgress(0);
    setOutputVideoUrl(null);

    try {
      const { mixer, renderer, audioStream, targetDuration, aiTimeline } = await prepareSession(false);
      await mixer.play();

      renderer.startRender({
        files: mediaFiles,
        effectMode,
        selectedEffect,
        aiTimeline,
        totalDuration: targetDuration,
        audioStream,
        onProgress: (p) => setProgress(Math.round(p * 100)),
        onComplete: (videoUrl) => {
          mixer.stop();
          setOutputVideoUrl(videoUrl);
          setRendering(false);
        },
        onCancel: () => {
          mixer.stop();
          setRendering(false);
          setProgress(0);
          alert('Đã huỷ xuất video.');
        },
      });
    } catch (err) {
      console.error(err);
      stopAllActivities();
      setRendering(false);
      alert(err.message || 'Đã xảy ra lỗi khi tạo video.');
    }
  };

  const handleCancelRender = () => {
    if (activeRendererRef.current) activeRendererRef.current.cancel();
    if (activeMixerRef.current) activeMixerRef.current.stop();
  };

  const currentVoiceOptions = selectedProvider === 'gemini' ? (GEMINI_TTS_VOICES || []) : (elevenVoiceList || []);

  // Ước tính độ dài thời gian đọc dựa theo số lượng ký tự tiếng Thái (~16 ký tự/giây)
  const estimatedSeconds = Math.max(1, Math.round((thaiScript.trim().length || 0) / 16));

  return (
    <div style={styles.fullscreenApp}>
      {/* HEADER: NÚT TRANG CHỦ BÊN TRÁI, TIÊU ĐỀ CHÍNH GIỮA */}
      <header style={styles.topNavbar}>
        <button
          type="button"
          onClick={() => (window.location.href = '/')}
          style={styles.homeBtn}
        >
          <span>🏠</span>
          <span>Trang chủ</span>
        </button>

        <div style={styles.headerCenter}>
          <span style={styles.brandBadge}>VALLEY TEAM</span>
          <h1 style={styles.appTitle}>Dựng Video</h1>
        </div>
      </header>

      {/* WORKSPACE BODY */}
      <div style={styles.workspaceBody}>
        {/* SIDEBAR BÊN TRÁI */}
        <div style={styles.sidebarPanel}>
          {/* Card 0: Khung hình */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardStep}>📐</span>
              <h3 style={styles.cardTitle}>Tỉ lệ khung hình</h3>
            </div>
            <div style={styles.tabGroup}>
              <button
                style={{
                  ...styles.tabButton,
                  backgroundColor: aspectRatio === '9:16' ? '#ffffff' : 'transparent',
                  color: aspectRatio === '9:16' ? '#0284c7' : '#64748b',
                  boxShadow: aspectRatio === '9:16' ? '0 2px 6px rgba(2, 132, 199, 0.12)' : 'none',
                }}
                onClick={() => setAspectRatio('9:16')}
              >
                📱 9:16 (Dọc)
              </button>
              <button
                style={{
                  ...styles.tabButton,
                  backgroundColor: aspectRatio === '4:3' ? '#ffffff' : 'transparent',
                  color: aspectRatio === '4:3' ? '#0284c7' : '#64748b',
                  boxShadow: aspectRatio === '4:3' ? '0 2px 6px rgba(2, 132, 199, 0.12)' : 'none',
                }}
                onClick={() => setAspectRatio('4:3')}
              >
                📺 4:3 (Ngang)
              </button>
            </div>
          </div>

          {/* Card 1: Tư liệu */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardStep}>01</span>
              <h3 style={styles.cardTitle}>Tư liệu</h3>
            </div>

            <div style={styles.tabGroup}>
              <button
                style={{
                  ...styles.tabButton,
                  backgroundColor: mediaType === 'images' ? '#ffffff' : 'transparent',
                  color: mediaType === 'images' ? '#0284c7' : '#64748b',
                  boxShadow: mediaType === 'images' ? '0 2px 6px rgba(2, 132, 199, 0.12)' : 'none',
                }}
                onClick={() => {
                  setMediaType('images');
                  setMediaFiles([]);
                }}
              >
                📸 Ảnh
              </button>
              <button
                style={{
                  ...styles.tabButton,
                  backgroundColor: mediaType === 'video' ? '#ffffff' : 'transparent',
                  color: mediaType === 'video' ? '#0284c7' : '#64748b',
                  boxShadow: mediaType === 'video' ? '0 2px 6px rgba(2, 132, 199, 0.12)' : 'none',
                }}
                onClick={() => {
                  setMediaType('video');
                  setMediaFiles([]);
                }}
              >
                🎬 Video
              </button>
            </div>

            <div
              style={{
                ...styles.uploadBox,
                borderColor: isDraggingOverUpload ? '#0284c7' : '#94a3b8',
                backgroundColor: isDraggingOverUpload ? '#e0f2fe' : '#f8fafc',
                transform: isDraggingOverUpload ? 'scale(1.02)' : 'scale(1)',
              }}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              onDragEnter={handleFileDragEnter}
              onDragOver={handleFileDragOver}
              onDragLeave={handleFileDragLeave}
              onDrop={handleFileDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={mediaType === 'images' ? 'image/*' : 'video/*'}
                multiple={mediaType === 'images'}
                style={{ display: 'none' }}
                onChange={handleMediaUpload}
              />
              <div style={{ fontSize: 32, marginBottom: 6 }}>
                {isDraggingOverUpload ? '📥' : '➕'}
              </div>
              <p style={{ margin: 0, fontWeight: 700, color: '#0284c7', fontSize: 14 }}>
                {isDraggingOverUpload
                  ? `Thả ${mediaType === 'images' ? 'ảnh' : 'video'} vào đây ngay!`
                  : `Bấm để chọn hoặc kéo thả ${mediaType === 'images' ? 'ảnh người mẫu / sản phẩm (Chỉ cần 1 ảnh)' : 'video gốc'}`}
              </p>
            </div>

            {mediaFiles.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 10px 0' }}>
                  💡 <b>Kéo thả</b> để đổi thứ tự xuất hiện ({mediaFiles.length} tư liệu):
                </p>
                <div style={styles.sortableList}>
                  {mediaFiles.map((src, idx) => (
                    <div
                      key={idx}
                      draggable={mediaType === 'images'}
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, idx)}
                      style={{
                        ...styles.sortableItem,
                        opacity: draggedIndex === idx ? 0.35 : 1,
                        cursor: mediaType === 'images' ? 'grab' : 'default',
                      }}
                    >
                      <span style={styles.orderBadge}>#{idx + 1}</span>
                      {mediaType === 'images' ? (
                        <img src={src} alt="" style={styles.previewThumb} draggable={false} />
                      ) : (
                        <video src={src} style={styles.previewThumb} />
                      )}
                      <button onClick={() => removeMedia(idx)} style={styles.deleteBtn}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Hiệu ứng chuyển cảnh & Grok AI */}
          {mediaType === 'images' && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardStep}>🎨</span>
                <h3 style={styles.cardTitle}>Dựng Video</h3>
              </div>

              {/* TAB GROUP: CANVAS BÊN TRÁI (MẶC ĐỊNH), GROK AI BÊN PHẢI */}
              <div style={styles.tabGroup}>
                <button
                  style={{
                    ...styles.tabButton,
                    backgroundColor: effectMode === 'preset' ? '#ffffff' : 'transparent',
                    color: effectMode === 'preset' ? '#0284c7' : '#64748b',
                    boxShadow: effectMode === 'preset' ? '0 2px 6px rgba(2, 132, 199, 0.12)' : 'none',
                  }}
                  onClick={() => setEffectMode('preset')}
                >
                  ⚡ Hiệu ứng Canvas (8)
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.tabButton,
                    background:
                      effectMode === 'script'
                        ? 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #6366f1 100%)'
                        : 'linear-gradient(135deg, #f5f3ff 0%, #eff6ff 50%, #fdf2f8 100%)',
                    borderColor: effectMode === 'script' ? 'transparent' : '#c7d2fe',
                    color: effectMode === 'script' ? '#ffffff' : '#4338ca',
                    boxShadow:
                      effectMode === 'script'
                        ? '0 4px 14px rgba(99, 102, 241, 0.35)'
                        : '0 1px 3px rgba(0, 0, 0, 0.03)',
                    fontWeight: 700,
                  }}
                  onClick={() => setEffectMode('script')}
                >
                  ✨ Grok AI (Chưa có API Key)
                </button>
              </div>

              {effectMode === 'preset' ? (
                /* PHẦN HIỆU ỨNG CANVAS (BÊN TRÁI) */
                <div>
                  <label style={styles.label}>Chọn kiểu chuyển cảnh hình ảnh:</label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: 10,
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {[
                      { id: 'dynamic', label: '🎲 Tự đổi động', desc: 'Xoay vòng đa dạng từng ảnh' },
                      { id: 'kenburns', label: '🔍 Zoom In', desc: 'Phóng to nhẹ chi tiết sản phẩm' },
                      { id: 'zoomout', label: '🔭 Zoom Out', desc: 'Thu nhỏ từ chi tiết ra toàn cảnh' },
                      { id: 'pan', label: '↔️ Lia ngang', desc: 'Trượt Lookbook Cinematic' },
                      { id: 'flash', label: '⚡ Flash Pop', desc: 'Chớp sáng nhẹ giật nhanh TikTok' },
                      { id: 'pulse', label: '💓 Pulse Beat', desc: 'Nhịp đập co giãn theo tiếng bass' },
                      { id: 'spin', label: '🌀 Xoay nhẹ', desc: 'Nghiêng góc thời trang năng động' },
                      { id: 'crossfade', label: '✨ Crossfade', desc: 'Hòa tan mờ chồng giữa hai ảnh' },
                    ].map((item) => {
                      const isSelected = selectedEffect === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedEffect(item.id)}
                          style={{
                            boxSizing: 'border-box',
                            width: '100%',
                            minWidth: 0,
                            padding: '11px 12px',
                            borderWidth: 1.5,
                            borderStyle: 'solid',
                            borderColor: isSelected ? '#0284c7' : '#e2e8f0',
                            backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                            borderRadius: 10,
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.18s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            boxShadow: isSelected
                              ? '0 2px 8px rgba(2, 132, 199, 0.12)'
                              : '0 1px 2px rgba(0,0,0,0.02)',
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: 13,
                              color: isSelected ? '#0284c7' : '#0f172a',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              width: '100%',
                            }}
                          >
                            {isSelected ? '✓ ' : ''}
                            {item.label}
                          </div>
                          <div
                            style={{
                              fontSize: 11.5,
                              color: isSelected ? '#0369a1' : '#64748b',
                              marginTop: 3,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              width: '100%',
                            }}
                          >
                            {item.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* PHẦN GROK AI (BÊN PHẢI) */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ ...styles.label, margin: 0 }}>Kịch bản chuyển động:</label>
                  </div>
                  <textarea
                    rows="3"
                    style={styles.textarea}
                    value={customScriptPrompt}
                    onChange={(e) => setCustomScriptPrompt(e.target.value)}
                    placeholder="Ví dụ: Người mẫu mỉm cười nhẹ, xoay người khoe form dáng và vạt áo bay tự nhiên..."
                  />

                  {/* KHU VỰC CẤU HÌNH XAI GROK API KEY */}
                  <div style={{ marginTop: 10, padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                        🔑 xAI Grok API Key:
                      </span>
                      {xaiApiKey && <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>✓ Đã lưu</span>}
                    </div>
                    <input
                      type="password"
                      placeholder="xai-..."
                      value={xaiApiKey}
                      onChange={(e) => handleSaveXaiKey(e.target.value)}
                      style={{ ...styles.keyInput, fontSize: 12, padding: '6px 10px' }}
                    />
                  </div>

                  {/* NÚT GROK AI VỚI HIỆU ỨNG AI GRADIENT GLOW */}
                  <button
                    type="button"
                    disabled={isGeneratingGrok || isPreviewingVideo}
                    onClick={handleGenerateGrokMotion}
                    style={{
                      ...styles.grokAiBtn,
                      opacity: isGeneratingGrok ? 0.75 : 1,
                      cursor: isGeneratingGrok ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isGeneratingGrok
                      ? `⏳ ${grokStatusText || 'Grok đang tạo video...'}`
                      : '✨ Grok AI'}
                  </button>

                  {/* NÚT XEM TRƯỚC NHANH CANVAS (Đã sửa nhãn hiển thị chính xác) */}
                  <button
                    type="button"
                    disabled={isAiDirecting}
                    onClick={handleTogglePreviewVideo}
                    style={styles.aiPreviewTriggerBtn}
                  >
                    {isAiDirecting
                      ? '🧠 Gemini AI đang phân tích...'
                      : isPreviewingVideo
                      ? '⏹️ Dừng xem trước'
                      : '⚡ Xem trước góc máy (Canvas)'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Card 3: Giọng đọc AI & Kéo thả Voice */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardStep}>02</span>
              <h3 style={styles.cardTitle}>Voice</h3>
            </div>

            <div style={styles.tabGroup}>
              <button
                style={{
                  ...styles.tabButton,
                  backgroundColor: voiceSourceType === 'file' ? '#ffffff' : 'transparent',
                  color: voiceSourceType === 'file' ? '#0284c7' : '#64748b',
                  boxShadow: voiceSourceType === 'file' ? '0 2px 6px rgba(2, 132, 199, 0.12)' : 'none',
                }}
                onClick={() => setVoiceSourceType('file')}
              >
                📁 File MP3 trong máy
              </button>
              <button
                style={{
                  ...styles.tabButton,
                  backgroundColor: voiceSourceType === 'ai' ? '#ffffff' : 'transparent',
                  color: voiceSourceType === 'ai' ? '#0284c7' : '#64748b',
                  boxShadow: voiceSourceType === 'ai' ? '0 2px 6px rgba(2, 132, 199, 0.12)' : 'none',
                }}
                onClick={() => setVoiceSourceType('ai')}
              >
                ✨ AI Đọc Tiếng Thái
              </button>
            </div>

            {voiceSourceType === 'file' ? (
              <div style={{ marginBottom: 14 }}>
                <label style={styles.label}>Tải tệp MP3 / WAV giọng đọc từ máy tính:</label>
                <div
                  style={{
                    ...styles.audioDropZone,
                    borderColor: isDraggingOverVoice ? '#0284c7' : '#cbd5e1',
                    backgroundColor: isDraggingOverVoice ? '#e0f2fe' : '#f8fafc',
                  }}
                  onClick={() => voiceFileInputRef.current && voiceFileInputRef.current.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'copy';
                    setIsDraggingOverVoice(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!e.currentTarget.contains(e.relatedTarget)) setIsDraggingOverVoice(false);
                  }}
                  onDrop={handleVoiceDrop}
                >
                  <input
                    ref={voiceFileInputRef}
                    type="file"
                    accept="audio/*"
                    style={{ display: 'none' }}
                    onChange={handleVoiceUpload}
                  />
                  <span style={{ fontSize: 24 }}>🎙️</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: voiceName ? '#0284c7' : '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {voiceName ? `✓ ${voiceName}` : 'Bấm để chọn hoặc kéo thả file âm thanh vào đây'}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                      {isDraggingOverVoice ? 'Thả file giọng đọc vào đây ngay!' : 'Hỗ trợ định dạng MP3, WAV, M4A, OGG'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 14 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={styles.label}>Chọn nhà cung cấp Voice AI:</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {VOICE_PROVIDERS.map((p) => {
                      const isSelected = selectedProvider === p.id;
                      const isGemini = p.id === 'gemini';

                      if (isGemini) {
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleProviderChange(p.id)}
                            style={{
                              ...styles.providerBtn,
                              background: isSelected
                                ? 'linear-gradient(135deg, #4285F4 0%, #9B72CF 50%, #D96570 100%)'
                                : 'linear-gradient(135deg, #f0fdf4 0%, #f5f3ff 50%, #eff6ff 100%)',
                              borderColor: isSelected ? 'transparent' : '#c4b5fd',
                              color: isSelected ? '#ffffff' : '#4f46e5',
                              boxShadow: isSelected
                                ? '0 4px 14px rgba(155, 114, 207, 0.35)'
                                : '0 1px 3px rgba(0, 0, 0, 0.04)',
                            }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                              <span>✨</span> {p.name}
                            </span>
                          </button>
                        );
                      }

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleProviderChange(p.id)}
                          style={{
                            ...styles.providerBtn,
                            backgroundColor: isSelected ? '#0284c7' : '#f8fafc',
                            borderColor: isSelected ? '#0284c7' : '#cbd5e1',
                            color: isSelected ? '#ffffff' : '#475569',
                            boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',
                          }}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedProvider === 'gemini' ? (
                  <div style={styles.keyConfigBox}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        🔑 Google AI Studio API Key:
                      </span>
                      {keySavedStatus && <span style={styles.savedBadge}>✓ Đã lưu</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Nhập Gemini API Key (AQ.Ab8...)"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        style={styles.keyInput}
                      />
                      <button type="button" onClick={handleSaveGeminiKey} style={styles.saveBtn}>
                        Lưu
                      </button>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#0284c7', marginTop: 6, fontWeight: 600 }}>
                      ⚡ Model: gemini-3.8-flash-tts
                    </div>
                  </div>
                ) : (
                  <div style={{ ...styles.keyConfigBox, borderColor: '#a7f3d0', backgroundColor: '#f0fdf4' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>
                        🔓 ElevenLabs API Key:
                      </span>
                      {keySavedStatus && (
                        <span style={{ ...styles.savedBadge, backgroundColor: '#bbf7d0', color: '#15803d' }}>
                          ✓ Đã lưu & Nạp giọng
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Nhập ElevenLabs API Key (sk_...)"
                        value={elevenLabsApiKey}
                        onChange={(e) => setElevenLabsApiKey(e.target.value)}
                        style={styles.keyInput}
                      />
                      <button
                        type="button"
                        onClick={handleSaveElevenKey}
                        style={{ ...styles.saveBtn, backgroundColor: '#059669' }}
                      >
                        Lưu & Nạp
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 10, marginTop: 12 }}>
                  <label style={styles.label}>
                    Chọn chất giọng ({selectedProvider === 'gemini' ? 'Google AI Studio TTS' : 'ElevenLabs'}):
                  </label>
                  <select
                    value={selectedVoiceId}
                    onChange={(e) => setSelectedVoiceId(e.target.value)}
                    style={styles.selectBox}
                  >
                    {currentVoiceOptions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProvider === 'elevenlabs' && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={styles.label}>Hoặc nhập Voice ID tùy chỉnh (Custom ID):</label>
                    <input
                      type="text"
                      placeholder="Dán ID giọng bất kỳ (VD: 21m00Tcm4TlvDq8ikWAM)..."
                      value={customElevenVoiceId}
                      onChange={(e) => setCustomElevenVoiceId(e.target.value)}
                      style={styles.keyInput}
                    />
                  </div>
                )}

                {/* KHU VỰC NHẬP / TẠO KỊCH BẢN TIẾNG THÁI (15-18S) */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                    <label style={{ ...styles.label, margin: 0 }}>
                      Kịch bản tiếng Thái:
                    </label>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11.5, color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>
                        ~{estimatedSeconds} giây
                      </span>

                      {/* NÚT AI TỰ ĐỘNG VIẾT KỊCH BẢN TỪ ẢNH */}
                      <button
                        type="button"
                        disabled={isWritingScript}
                        onClick={handleAutoGenerateThaiScript}
                        style={{
                          padding: '5px 12px',
                          fontSize: 12,
                          fontWeight: 700,
                          background: 'linear-gradient(135deg, #4285F4 0%, #9B72CF 50%, #D96570 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 6,
                          cursor: isWritingScript ? 'not-allowed' : 'pointer',
                          opacity: isWritingScript ? 0.7 : 1,
                          boxShadow: '0 2px 8px rgba(155, 114, 207, 0.3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        {isWritingScript ? '🧠 AI đang viết bài 15-18s...' : '✨ AI Viết Theo Ảnh (15-18s)'}
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows="5"
                    style={{ ...styles.textarea, fontSize: 13, lineHeight: 1.6 }}
                    value={thaiScript}
                    onChange={(e) => setThaiScript(e.target.value)}
                    placeholder="Bạn có thể tự nhập văn bản tiếng Thái tùy ý vào đây, hoặc bấm nút 'AI Viết Theo Ảnh (15-18s)' ở trên..."
                  />
                  <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                    💡 Có thể tự sửa/thêm văn bản theo ý muốn, hoặc dùng AI.
                  </div>
                </div>
              </div>
            )}

            {/* NÚT NGHE THỬ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={togglePreviewVoice}
                  style={{
                    ...styles.previewVoiceBtn,
                    backgroundColor: isPlayingVoicePreview
                      ? '#ef4444'
                      : selectedProvider === 'elevenlabs'
                      ? '#059669'
                      : '#0284c7',
                    cursor: 'pointer',
                  }}
                >
                  {isGeneratingVoice
                    ? '⚙️ Đang tạo âm thanh...'
                    : isPlayingVoicePreview
                    ? '⏹️ Dừng nghe voice'
                    : '🔊 Nghe thử giọng đọc'}
                </button>

                {selectedProvider === 'gemini' && geminiCooldown > 0 && (
                  <span style={styles.cooldownBadge}>
                    ⏳ Google chờ: {geminiCooldown}s
                  </span>
                )}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={styles.label}>Âm lượng giọng đọc:</span>
                <span style={{ color: '#db2777', fontWeight: 700, fontSize: 14 }}>
                  {Math.round(voiceVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={voiceVolume}
                onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                style={{ width: '100%', height: 6, accentColor: '#db2777' }}
              />
            </div>
          </div>

          {/* Card 4: BGM */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardStep}>03</span>
              <h3 style={styles.cardTitle}>Nhạc nền</h3>
            </div>

            <div style={styles.tabGroup}>
              <button
                style={{
                  ...styles.tabButton,
                  backgroundColor: bgmSourceType === 'file' ? '#ffffff' : 'transparent',
                  color: bgmSourceType === 'file' ? '#0284c7' : '#64748b',
                  boxShadow: bgmSourceType === 'file' ? '0 2px 6px rgba(2, 132, 199, 0.12)' : 'none',
                }}
                onClick={() => setBgmSourceType('file')}
              >
                📁 Tải từ máy tính
              </button>
              <button
                style={{
                  ...styles.tabButton,
                  backgroundColor: bgmSourceType === 'preset' ? '#ffffff' : 'transparent',
                  color: bgmSourceType === 'preset' ? '#0284c7' : '#64748b',
                  boxShadow: bgmSourceType === 'preset' ? '0 2px 6px rgba(2, 132, 199, 0.12)' : 'none',
                }}
                onClick={() => setBgmSourceType('preset')}
              >
                🎶 Kho nhạc đã lưu ({customBgmList.length})
              </button>
            </div>

            {bgmSourceType === 'file' ? (
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    ...styles.audioDropZone,
                    borderColor: isDraggingOverBgm ? '#0284c7' : '#cbd5e1',
                    backgroundColor: isDraggingOverBgm ? '#e0f2fe' : '#f8fafc',
                  }}
                  onClick={() => bgmFileInputRef.current && bgmFileInputRef.current.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'copy';
                    setIsDraggingOverBgm(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!e.currentTarget.contains(e.relatedTarget)) setIsDraggingOverBgm(false);
                  }}
                  onDrop={handleBgmDrop}
                >
                  <input
                    ref={bgmFileInputRef}
                    type="file"
                    accept="audio/*"
                    style={{ display: 'none' }}
                    onChange={handleBgmUpload}
                  />
                  <span style={{ fontSize: 26 }}>🎵</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: bgmName ? '#0284c7' : '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {bgmName ? `✓ ${bgmName}` : 'Bấm để chọn file nhạc hoặc kéo thả vào đây'}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                      {isDraggingOverBgm ? 'Thả tệp nhạc vào đây ngay!' : 'Hỗ trợ định dạng MP3, WAV, M4A, AAC'}
                    </div>
                  </div>
                </div>

                {bgmFile && (
                  <div style={styles.uploadedActionRow}>
                    <button
                      type="button"
                      onClick={togglePreviewUploadedBgm}
                      style={{
                        ...styles.listenBgmBtn,
                        backgroundColor: isPlayingUploadedBgmPreview ? '#ef4444' : '#0284c7',
                      }}
                    >
                      {isPlayingUploadedBgmPreview ? '⏹️ Dừng nghe' : '▶️ Nghe thử bài này'}
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveCurrentBgmToStorage}
                      style={styles.saveToPresetBtn}
                    >
                      ⭐ Lưu vào kho nhạc
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: 14 }}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>
                    Danh sách bài hát bạn đã lưu:
                  </span>
                </div>

                {customBgmList.length === 0 ? (
                  <div style={styles.emptyCustomBgmBox}>
                    Chưa có bài nhạc nào được lưu.<br />
                    Hãy qua tab <b>"📁 Tải từ máy tính"</b> chọn file nhạc rồi bấm <b>"Lưu vào kho nhạc"</b>!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                    {customBgmList.map((item) => {
                      const isSelected = selectedCustomBgmId === item.id;
                      const isPreviewPlaying = playingCustomBgmPreviewId === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectCustomBgm(item)}
                          style={{
                            ...styles.presetBgmItem,
                            borderColor: isSelected ? '#0284c7' : '#e2e8f0',
                            backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 13.5, color: isSelected ? '#0284c7' : '#0f172a' }}>
                              {isSelected ? '✓ ' : ''}
                              {item.title}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{item.desc}</div>
                          </div>

                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={(e) => togglePreviewCustomBgm(e, item)}
                              style={{
                                ...styles.bgmPreviewSmallBtn,
                                backgroundColor: isPreviewPlaying ? '#ef4444' : '#e0f2fe',
                                color: isPreviewPlaying ? '#ffffff' : '#0284c7',
                              }}
                            >
                              {isPreviewPlaying ? '⏹️' : '▶️'}
                            </button>

                            <button
                              type="button"
                              title="Xóa bài này"
                              onClick={(e) => handleDeleteCustomBgm(e, item.id)}
                              style={styles.deleteMiniBtn}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={styles.label}>Âm lượng nhạc nền:</span>
                <span style={{ color: '#0284c7', fontWeight: 700, fontSize: 14 }}>
                  {Math.round(bgmVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={bgmVolume}
                onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                style={{ width: '100%', height: 6, accentColor: '#0284c7' }}
              />
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: KHU VỰC PREVIEW VIDEO & TIMELINE */}
        <div style={styles.previewStage}>
          <div style={styles.stageCanvasWrapper}>
            <div
              style={{
                ...styles.mockupContainer,
                ...(aspectRatio === '9:16' ? styles.aspectRatio916 : styles.aspectRatio43),
              }}
            >
              {outputVideoUrl ? (
                <video src={outputVideoUrl} controls autoPlay loop style={styles.mockupScreen} />
              ) : mediaType === 'video' && mediaFiles.length > 0 && !isPreviewingVideo && !rendering ? (
                /* HIỂN THỊ TRỰC TIẾP VIDEO THÔ CỦA NGƯỜI DÙNG KHI CHƯA CHẠY RENDER/PREVIEW */
                <video src={mediaFiles[0]} controls autoPlay loop muted style={styles.mockupScreen} />
              ) : (
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    ...styles.mockupScreen,
                    display: mediaFiles.length > 0 ? 'block' : 'none',
                  }}
                />
              )}

              {mediaFiles.length === 0 && !outputVideoUrl && (
                <div style={styles.screenEmpty}>
                  <span style={{ fontSize: 54, opacity: 0.5 }}>👗</span>
                  <p style={{ color: '#64748b', fontSize: 15, textAlign: 'center', marginTop: 12, fontWeight: 500 }}>
                    Chưa có tư liệu.<br />Kéo thả 1 ảnh sản phẩm / video vào bên trái.
                  </p>
                </div>
              )}

              {mediaFiles.length > 0 && !outputVideoUrl && (
                <div key={aspectRatio} style={styles.previewBadge}>
                  {isPreviewingVideo ? '🔊 Đang Preview' : rendering ? '⚙️ Đang Render...' : `Tỉ lệ ${aspectRatio}`}
                </div>
              )}
            </div>
          </div>

          {!outputVideoUrl && (
            <div style={styles.timelineScrubberCard}>
              <div style={styles.timelineHeader}>
                <span style={styles.timelineTitle}>
                  {isPreviewingVideo ? '🎬 Timeline Xem Trước' : '⏸️ Trục thời gian (Sẵn sàng tua)'}
                </span>
                <span style={styles.timelineTimestamp}>
                  {formatTime(previewCurrentTime)} / {formatTime(previewDuration)}
                </span>
              </div>

              <div style={styles.seekerContainer}>
                <input
                  type="range"
                  min="0"
                  max={previewDuration > 0 ? previewDuration : 6}
                  step="0.05"
                  value={previewCurrentTime}
                  disabled={rendering || previewDuration === 0}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  style={{
                    ...styles.scrubberRange,
                    cursor: previewDuration > 0 && !rendering ? 'pointer' : 'not-allowed',
                  }}
                />
              </div>
            </div>
          )}

          {rendering && (
            <div style={styles.progressContainer}>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${progress}%` }} />
              </div>
              <span style={styles.progressText}>
                {isGeneratingVoice ? 'Đang phân tích kịch bản & nạp giọng đọc...' : `Đang render video... ${progress}%`}
              </span>
            </div>
          )}

          <div style={styles.stageActionBar}>
            {!rendering && (
              <button
                onClick={handleTogglePreviewVideo}
                style={{
                  ...styles.previewActionBtn,
                  backgroundColor: isPreviewingVideo ? '#ef4444' : '#f8fafc',
                  color: isPreviewingVideo ? '#ffffff' : '#0284c7',
                  borderColor: isPreviewingVideo ? '#ef4444' : '#bae6fd',
                  cursor: 'pointer',
                }}
              >
                {isPreviewingVideo ? '⏸️ Tạm dừng' : '▶️ Preview'}
              </button>
            )}

            {!rendering ? (
              <button onClick={handleStartRender} style={styles.actionButton}>
                ⚡ Xuất Video ({aspectRatio})
              </button>
            ) : (
              <button onClick={handleCancelRender} style={styles.cancelButton}>
                🛑 HỦY
              </button>
            )}

            {outputVideoUrl && !rendering && (
              <a
                href={outputVideoUrl}
                download={`ads_thoi_trang_${aspectRatio.replace(':', '_')}.webm`}
                style={styles.downloadButton}
              >
                📥 Tải Video Hoàn Thành Về Máy
              </a>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={styles.appFooter}>
        <div style={styles.footerLeft}>
          <span style={styles.footerBrand}>VALLEY TEAM</span>
          <span style={styles.footerDot}>•</span>
          <span style={styles.footerText}>Trình dựng Video AI</span>
          <span style={styles.footerDot}>•</span>
          <span style={styles.footerVersion}>v1.0</span>
        </div>

        <div style={styles.footerRight}>
          <span style={styles.footerText}>© Copyright © 2026 by Nguyễn Tuấn Hùng (Pixel)</span>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  fullscreenApp: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  topNavbar: {
    height: 60,
    padding: '0 28px',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#e2e8f0',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  homeBtn: {
    position: 'absolute',
    left: 24,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    color: '#334155',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  headerCenter: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  brandBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 6,
    background: '#ec4899',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.5,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: 800,
    margin: 0,
    color: '#0f172a',
  },
  workspaceBody: {
    flex: 1,
    minHeight: 0,
    display: 'grid',
    gridTemplateColumns: '540px 1fr',
    overflow: 'hidden',
  },
  sidebarPanel: {
    overflowY: 'auto',
    padding: '24px',
    backgroundColor: '#f8fafc',
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    borderRightColor: '#e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: '20px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cardStep: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 8,
    background: '#e0f2fe',
    color: '#0284c7',
    fontWeight: 800,
    fontSize: 13,
  },
  cardTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#0f172a',
  },
  tabGroup: {
    display: 'flex',
    gap: 8,
    marginBottom: 12,
    backgroundColor: '#f1f5f9',
    padding: 4,
    borderRadius: 10,
  },
  tabButton: {
    flex: 1,
    padding: '10px 12px',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  providerBtn: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  durationBadge: {
    fontSize: 11.5,
    fontWeight: 700,
    backgroundColor: '#eef2ff',
    color: '#4f46e5',
    padding: '3px 8px',
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#c7d2fe',
  },
  grokAiBtn: {
    width: '100%',
    marginTop: 12,
    padding: '12px 18px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #6366f1 100%)',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: 0.3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
    transition: 'all 0.2s ease',
  },
  aiPreviewTriggerBtn: {
    width: '100%',
    marginTop: 8,
    padding: '10px 16px',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    color: '#475569',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  keyConfigBox: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#bae6fd',
    borderRadius: 10,
    padding: '12px 14px',
    marginBottom: 12,
  },
  keyInput: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 12px',
    fontSize: 13,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  saveBtn: {
    padding: '8px 16px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 700,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  savedBadge: {
    fontSize: 11.5,
    color: '#059669',
    fontWeight: 700,
    backgroundColor: '#d1fae5',
    padding: '2px 8px',
    borderRadius: 4,
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: '24px 16px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    userSelect: 'none',
  },
  audioDropZone: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    userSelect: 'none',
  },
  uploadedActionRow: {
    display: 'flex',
    gap: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  listenBgmBtn: {
    flex: 1,
    padding: '8px 14px',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveToPresetBtn: {
    padding: '8px 14px',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  presetBgmItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  bgmPreviewSmallBtn: {
    padding: '6px 12px',
    borderRadius: 6,
    border: 'none',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  deleteMiniBtn: {
    background: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: 6,
    width: 26,
    height: 26,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCustomBgmBox: {
    padding: '16px',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  sortableList: {
    display: 'flex',
    gap: 10,
    overflowX: 'auto',
    paddingBottom: 8,
  },
  sortableItem: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: '#ffffff',
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  previewThumb: {
    width: 88,
    height: 88,
    objectFit: 'cover',
    borderRadius: 8,
    pointerEvents: 'none',
  },
  orderBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    background: 'rgba(15, 23, 42, 0.8)',
    color: '#ffffff',
    fontSize: 11,
    padding: '2px 6px',
    borderRadius: 5,
    fontWeight: 700,
  },
  deleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: 22,
    height: 22,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  },
  selectBox: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    outline: 'none',
    fontSize: 14,
  },
  label: {
    display: 'block',
    fontSize: 13,
    color: '#475569',
    fontWeight: 600,
    marginBottom: 6,
  },
  previewVoiceBtn: {
    padding: '10px 18px',
    borderRadius: 8,
    border: 'none',
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  cooldownBadge: {
    fontSize: 12,
    fontWeight: 700,
    color: '#b45309',
    backgroundColor: '#fef3c7',
    padding: '6px 12px',
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#fde68a',
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    color: '#0f172a',
    padding: '10px 12px',
    fontSize: 13.5,
    lineHeight: 1.5,
    outline: 'none',
    resize: 'vertical',
  },
  previewStage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    padding: '16px 24px',
    height: '100%',
    minHeight: 0,
    boxSizing: 'border-box',
    overflowY: 'auto',
  },
  stageCanvasWrapper: {
    flex: 1,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 0,
    position: 'relative',
  },
  mockupContainer: {
    backgroundColor: '#0f172a',
    borderWidth: 6,
    borderStyle: 'solid',
    borderColor: '#1e293b',
    boxShadow: '0 25px 45px -12px rgba(0, 0, 0, 0.25), 0 10px 20px -5px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'width 0.45s cubic-bezier(0.4, 0, 0.2, 1), height 0.45s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'width, height',
  },
  aspectRatio916: {
    height: 'calc(100vh - 310px)',
    width: 'calc((100vh - 310px) * 9 / 16)',
    maxWidth: 'calc(100% - 32px)',
    borderRadius: 22,
  },
  aspectRatio43: {
    height: 'calc(100vh - 310px)',
    width: 'calc((100vh - 310px) * 4 / 3)',
    maxWidth: 'calc(100% - 32px)',
    borderRadius: 16,
  },
  mockupScreen: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
    transition: 'opacity 0.25s ease',
  },
  previewBadge: {
    position: 'absolute',
    top: 14,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    color: '#f8fafc',
    fontSize: 12,
    padding: '5px 14px',
    borderRadius: 14,
    whiteSpace: 'nowrap',
    fontWeight: 600,
    backdropFilter: 'blur(4px)',
  },
  screenEmpty: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
  },
  timelineScrubberCard: {
    width: '100%',
    maxWidth: 580,
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: '8px 16px',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.04)',
    boxSizing: 'border-box',
  },
  timelineHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#475569',
  },
  timelineTimestamp: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0284c7',
    fontVariantNumeric: 'tabular-nums',
  },
  seekerContainer: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
  },
  scrubberRange: {
    width: '100%',
    height: 7,
    accentColor: '#0284c7',
    borderRadius: 4,
    outline: 'none',
  },
  progressContainer: {
    width: '100%',
    maxWidth: 500,
    marginTop: 8,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 7,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #ec4899, #0284c7)',
    transition: 'width 0.2s ease',
  },
  progressText: {
    display: 'inline-block',
    marginTop: 4,
    fontSize: 12.5,
    fontWeight: 600,
    color: '#0284c7',
  },
  stageActionBar: {
    marginTop: 10,
    width: '100%',
    maxWidth: 580,
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  previewActionBtn: {
    flex: 1,
    padding: '11px 16px',
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    fontSize: 13.5,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  actionButton: {
    flex: 1.2,
    padding: '11px 16px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
  },
  cancelButton: {
    flex: 1,
    padding: '11px 16px',
    borderRadius: 10,
    border: 'none',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: 700,
    cursor: 'pointer',
  },
  downloadButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '11px 18px',
    borderRadius: 10,
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: 700,
    textDecoration: 'none',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
  },
  appFooter: {
    height: 38,
    padding: '0 24px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#64748b',
    flexShrink: 0,
    zIndex: 10,
    userSelect: 'none',
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  footerBrand: {
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  footerDot: {
    color: '#cbd5e1',
  },
  footerText: {
    color: '#64748b',
    fontWeight: 500,
  },
  footerVersion: {
    backgroundColor: '#f1f5f9',
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    color: '#475569',
  },
  footerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
};