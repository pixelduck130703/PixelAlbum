// src/pages/VideoCreator.jsx
import React, { useState, useRef, useEffect } from 'react';
import { AudioMixer } from '../services/audioMixer';
import { VideoRenderer } from '../services/videoRenderer';
import {
    generateThaiSpeechAudio,
    analyzeVideoScriptWithAi,
    generateThaiScriptFromImage,
    extractFrameFromVideo,
    translateThaiToVietnamese,
    GEMINI_TTS_VOICES,
    DEFAULT_ELEVENLABS_PREMADES,
    VOICE_PROVIDERS,
    RateLimitError,
    fetchAllElevenLabsVoices,
} from '../services/aiVoiceService';
import { generateGrokMotionVideo } from '../services/grokVideoService';

// KHO NHẠC MẪU CÓ SẴN (Trong thư mục public/music/)
const DEFAULT_PRESET_BGMS = [
    {
        id: 'Nhacnen1',
        title: 'Nhạc nền 1',
        desc: 'Nhạc nền mẫu hệ thống',
        url: '/music/Nhacnen1.mp3',
        isDefault: true,
    },
    {
        id: 'Nhacnen2',
        title: 'Nhạc nền 2',
        desc: 'Nhạc nền mẫu hệ thống',
        url: '/music/Nhacnen2.mp3',
        isDefault: true,
    },
    {
        id: 'Nhacnen3',
        title: 'Nhạc nền 3',
        desc: 'Nhạc nền mẫu hệ thống',
        url: '/music/Nhacnen3.mp3',
        isDefault: true,
    },
    {
        id: 'Nhacnen4',
        title: 'Nhạc nền 4',
        desc: 'Nhạc nền mẫu hệ thống',
        url: '/music/Nhacnen4.mp3',
        isDefault: true,
    },
];

// NẠP JSZIP TỰ ĐỘNG ĐỂ ĐÓNG GÓI ZIP MÀ KHÔNG CẦN CÀI NPM
const loadJSZip = () => {
    return new Promise((resolve, reject) => {
        if (window.JSZip) return resolve(window.JSZip);
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => resolve(window.JSZip);
        script.onerror = () => reject(new Error('Không thể tải thư viện đóng gói ZIP.'));
        document.body.appendChild(script);
    });
};

export default function VideoCreator() {
    // TAB ĐANG CHỌN (images | divide | video) ĐỂ ĐỔI MÀU NÚT NỔI BẬT
    const [activeTab, setActiveTab] = useState('images');

    // MODAL POPUP CẮT ẢNH (IMAGE DIVIDE MODAL)
    const [isDivideModalOpen, setIsDivideModalOpen] = useState(false);
    const [divideSourceImage, setDivideSourceImage] = useState(null);
    const [divideSourceName, setDivideSourceName] = useState('');
    const [divideRows, setDivideRows] = useState(2);
    const [divideCols, setDivideCols] = useState(2);
    const [isSplittingImage, setIsSplittingImage] = useState(false);
    const [isZipping, setIsZipping] = useState(false);
    const [dividedPieces, setDividedPieces] = useState([]);
    const [isDraggingOverDivideModal, setIsDraggingOverDivideModal] = useState(false);
    const divideFileInputRef = useRef(null);

    // KÉO DI CHUYỂN CỬA SỔ POPUP CẮT ẢNH (DRAGGABLE POPUP)
    const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
    const isDraggingWindowRef = useRef(false);
    const dragStartPosRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

    // POPUP CẢNH BÁO TƯ LIỆU ĐÃ CÓ ẢNH
    const [showMediaExistPopup, setShowMediaExistPopup] = useState(false);
    const pendingPiecesRef = useRef([]);

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
        localStorage.getItem('CUSTOM_GEMINI_KEY') || localStorage.getItem('user_gemini_api_key') || ''
    );
    const [elevenLabsApiKey, setElevenLabsApiKey] = useState(
        localStorage.getItem('CUSTOM_ELEVENLABS_KEY') || 'sk_1b9707067e6f7cce7ceee1c56d2018865aae6f3319c0d1c3'
    );
    const [elevenVoiceList, setElevenVoiceList] = useState(DEFAULT_ELEVENLABS_PREMADES || []);
    const [keySavedStatus, setKeySavedStatus] = useState(false);

    const [geminiCooldown, setGeminiCooldown] = useState(0);

    // Kịch bản đọc tiếng Thái (mặc định để trống)
    const [thaiScript, setThaiScript] = useState('');
    const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
    const [isWritingScript, setIsWritingScript] = useState(false);
    const [scriptStatusText, setScriptStatusText] = useState('');

    // Dịch nghĩa tiếng Việt & AbortController
    const [vietnameseScript, setVietnameseScript] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);
    const translationAbortRef = useRef(null);

    const [isPlayingVoicePreview, setIsPlayingVoicePreview] = useState(false);
    const previewAudioRef = useRef(null);

    // CẤU HÌNH NHẠC NỀN (BGM)
    const [bgmSourceType, setBgmSourceType] = useState('file');
    const [bgmFile, setBgmFile] = useState(null);
    const [bgmName, setBgmName] = useState('');
    const [bgmVolume, setBgmVolume] = useState(0.4);

    const [isPlayingUploadedBgmPreview, setIsPlayingUploadedBgmPreview] = useState(false);
    const uploadedBgmPreviewAudioRef = useRef(null);

    // Kho nhạc: Nhạc mẫu có sẵn + nhạc lưu trong localStorage
    const [customBgmList, setCustomBgmList] = useState(() => {
        try {
            const saved = localStorage.getItem('USER_CUSTOM_BGMS');
            const userBgms = saved ? JSON.parse(saved) : [];
            return [...DEFAULT_PRESET_BGMS, ...userBgms];
        } catch {
            return DEFAULT_PRESET_BGMS;
        }
    });

    const [selectedCustomBgmId, setSelectedCustomBgmId] = useState('');
    const [playingCustomBgmPreviewId, setPlayingCustomBgmPreviewId] = useState(null);
    const customBgmPreviewAudioRef = useRef(null);

    // POPUP MODAL THÔNG BÁO CHƯA CÓ NHẠC NỀN
    const [showNoBgmPrompt, setShowNoBgmPrompt] = useState(false);

    // POPUP MODAL LOADING PREVIEW
    const [isPreviewPreparing, setIsPreviewPreparing] = useState(false);
    const [preparingStatusText, setPreparingStatusText] = useState('');

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

    // XỬ LÝ KÉO DI CHUYỂN CỬA SỔ MODAL CẮT ẢNH
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDraggingWindowRef.current) return;
            const deltaX = e.clientX - dragStartPosRef.current.startX;
            const deltaY = e.clientY - dragStartPosRef.current.startY;
            setModalPos({
                x: dragStartPosRef.current.initialX + deltaX,
                y: dragStartPosRef.current.initialY + deltaY,
            });
        };

        const handleMouseUp = () => {
            isDraggingWindowRef.current = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleStartDragModal = (e) => {
        if (e.target.tagName.toLowerCase() === 'button') return;
        isDraggingWindowRef.current = true;
        dragStartPosRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialX: modalPos.x,
            initialY: modalPos.y,
        };
    };

    const handleSaveGeminiKey = () => {
        const clean = geminiApiKey.trim();
        localStorage.setItem('CUSTOM_GEMINI_KEY', clean);
        localStorage.setItem('user_gemini_api_key', clean);
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
        if (customBgmPreviewAudioRef.current) {
            customBgmPreviewAudioRef.current.pause();
            customBgmPreviewAudioRef.current = null;
            setPlayingCustomBgmPreviewId(null);
        }
        if (uploadedBgmPreviewAudioRef.current) {
            uploadedBgmPreviewAudioRef.current.pause();
            uploadedBgmPreviewAudioRef.current = null;
            setIsPlayingUploadedBgmPreview(false);
        }
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (translationAbortRef.current) {
            translationAbortRef.current.abort();
            translationAbortRef.current = null;
        }
        setIsTranslating(false);
        setIsPreviewingVideo(false);
        setIsPlayingVoicePreview(false);
        setIsPreviewPreparing(false);
        setShowNoBgmPrompt(false);
        setShowMediaExistPopup(false);
        setPreviewCurrentTime(0);
        setProgress(0);
    };

    // HÀM RESET TẤT CẢ VỀ TRẠNG THÁI BAN ĐẦU ĐỂ TẠO VIDEO MỚI
    const handleResetAll = () => {
        const confirmReset = window.confirm('Bạn có chắc chắn muốn xóa tất cả và tạo video mới không? Toàn bộ tư liệu, kịch bản và âm thanh sẽ được làm mới.');
        if (!confirmReset) return;

        stopAllActivities();

        // Thu hồi URLs để giải phóng RAM
        if (outputVideoUrl && outputVideoUrl.startsWith('blob:')) {
            try { URL.revokeObjectURL(outputVideoUrl); } catch { }
        }
        mediaFiles.forEach((url) => {
            try {
                if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
            } catch { }
        });
        if (voiceFile && voiceFile.startsWith('blob:')) {
            try { URL.revokeObjectURL(voiceFile); } catch { }
        }
        if (divideSourceImage && divideSourceImage.startsWith('blob:')) {
            try { URL.revokeObjectURL(divideSourceImage); } catch { }
        }

        // Reset toàn bộ States về mặc định ban đầu
        setOutputVideoUrl(null);
        setMediaFiles([]);
        setThaiScript('');
        setVietnameseScript('');
        setVoiceFile(null);
        setVoiceName('');
        setVoiceSourceType('file');
        setVoiceVolume(1.0);

        setBgmFile(null);
        setBgmName('');
        setSelectedCustomBgmId('');
        setBgmSourceType('file');
        setBgmVolume(0.4);

        setDivideSourceImage(null);
        setDivideSourceName('');
        setDividedPieces([]);
        setDivideRows(2);
        setDivideCols(2);

        setMediaType('images');
        setActiveTab('images');
        setEffectMode('preset');
        setSelectedEffect('kenburns');
        setAspectRatio('9:16');
        setProgress(0);
        setPreviewCurrentTime(0);
        setPreviewDuration(6);
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

    // LOGIC CHIA NHỎ ẢNH BẰNG CANVAS TRẢ VỀ MẢNG DATAURL
    const executeDivideImage = async () => {
        if (!divideSourceImage) return [];
        const r = parseInt(divideRows, 10);
        const c = parseInt(divideCols, 10);
        if (isNaN(r) || isNaN(c) || r < 1 || c < 1 || r > 10 || c > 10) {
            throw new Error('Số hàng và số cột phải từ 1 đến 10!');
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = divideSourceImage;
        });

        const pieceWidth = Math.floor(img.width / c);
        const pieceHeight = Math.floor(img.height / r);
        const newPieces = [];

        for (let row = 0; row < r; row++) {
            for (let col = 0; col < c; col++) {
                const canvas = document.createElement('canvas');
                canvas.width = pieceWidth;
                canvas.height = pieceHeight;
                const ctx = canvas.getContext('2d');

                ctx.drawImage(
                    img,
                    col * pieceWidth,
                    row * pieceHeight,
                    pieceWidth,
                    pieceHeight,
                    0,
                    0,
                    pieceWidth,
                    pieceHeight
                );

                const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
                newPieces.push(dataUrl);
            }
        }
        return newPieces;
    };

    const processDivideImageFile = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            alert('Vui lòng chọn hoặc thả tệp hình ảnh hợp lệ (.jpg, .png, .webp)!');
            return;
        }
        const url = URL.createObjectURL(file);
        setDivideSourceImage(url);
        setDivideSourceName(file.name);
        setDividedPieces([]);
    };

    const handleDivideImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) processDivideImageFile(file);
    };

    // XỬ LÝ KÉO THẢ TỆP ẢNH VÀO POPUP CẮT ẢNH
    const handleDivideDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOverDivideModal(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) processDivideImageFile(file);
    };

    // HÀM XÓA ẢNH ĐANG CHỜ CẮT
    const handleClearDivideImage = () => {
        if (divideSourceImage?.startsWith('blob:')) {
            try {
                URL.revokeObjectURL(divideSourceImage);
            } catch { }
        }
        setDivideSourceImage(null);
        setDivideSourceName('');
        setDividedPieces([]);
        if (divideFileInputRef.current) {
            divideFileInputRef.current.value = '';
        }
    };

    // BẤM NÚT CHIA ẢNH TRONG POPUP
    const handlePerformDivideImage = async () => {
        if (!divideSourceImage) {
            alert('Vui lòng tải lên ảnh cần chia nhỏ trước!');
            return;
        }
        setIsSplittingImage(true);
        try {
            const pieces = await executeDivideImage();
            setDividedPieces(pieces);

            // NẾU ĐÃ CÓ TƯ LIỆU SẴN -> BẬT POPUP HỎI THAY THẾ
            if (mediaFiles.length > 0) {
                pendingPiecesRef.current = pieces;
                setShowMediaExistPopup(true);
            } else {
                setMediaType('images');
                setActiveTab('images');
                setMediaFiles(pieces);
                setIsDivideModalOpen(false); // Cắt xong tự đóng modal
            }
        } catch (err) {
            console.error(err);
            alert('Không thể chia ảnh: ' + (err.message || 'Lỗi không xác định'));
        } finally {
            setIsSplittingImage(false);
        }
    };

    // XỬ LÝ LỰA CHỌN THAY THẾ TOÀN BỘ TỪ POPUP
    const handleConfirmOverwriteMedia = () => {
        setMediaType('images');
        setActiveTab('images');
        setMediaFiles(pendingPiecesRef.current);
        pendingPiecesRef.current = [];
        setShowMediaExistPopup(false);
        setIsDivideModalOpen(false);
    };

    // TẢI XUỐNG CÁC MẢNH ẢNH DƯỚI DẠNG FILE ZIP
    const handleDownloadZip = async () => {
        if (!divideSourceImage) {
            alert('Vui lòng tải ảnh lên trước!');
            return;
        }

        setIsZipping(true);
        try {
            let pieces = dividedPieces;
            if (!pieces || pieces.length === 0) {
                pieces = await executeDivideImage();
                setDividedPieces(pieces);
            }

            const JSZip = await loadJSZip();
            const zip = new JSZip();
            const baseFileName = (divideSourceName || 'image').replace(/\.[^/.]+$/, '');

            pieces.forEach((dataUrl, idx) => {
                const base64Data = dataUrl.split(',')[1];
                zip.file(`${baseFileName}_piece_${idx + 1}.jpg`, base64Data, { base64: true });
            });

            const content = await zip.generateAsync({ type: 'blob' });
            const zipUrl = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = zipUrl;
            a.download = `${baseFileName}_divided_${divideRows}x${divideCols}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(zipUrl);
        } catch (err) {
            console.error(err);
            alert('Lỗi đóng gói ZIP: ' + (err.message || 'Không thể tạo file ZIP.'));
        } finally {
            setIsZipping(false);
        }
    };

    // 1. TƯ LIỆU ẢNH / VIDEO
    const processMediaFiles = (files) => {
        if (!files || !files.length) return;
        try {
            const validFiles = Array.from(files).filter((file) => {
                if (!file || !file.type) return false;
                if (mediaType === 'images') {
                    return file.type.startsWith('image/');
                }
                return file.type.startsWith('video/');
            });

            if (!validFiles.length) {
                alert(`Vui lòng chọn đúng tệp ${mediaType === 'images' ? 'hình ảnh (.jpg, .png, .webp)' : 'video (.mp4, .webm, .mov)'}!`);
                return;
            }

            const urls = validFiles.map((file) => URL.createObjectURL(file));
            setMediaFiles((prev) => [...prev, ...urls]);
        } catch (err) {
            console.error(err);
            alert('Không thể đọc file. Vui lòng thử lại!');
        }
    };

    const handleMediaUpload = (e) => {
        if (e.target.files && e.target.files.length) {
            processMediaFiles(e.target.files);
            e.target.value = '';
        }
    };

    const handleClearAllMedia = (e) => {
        e?.stopPropagation();
        if (!mediaFiles.length) return;

        stopAllActivities();
        mediaFiles.forEach((url) => {
            try {
                if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
            } catch { }
        });

        setMediaFiles([]);
        setOutputVideoUrl(null);
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
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
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
        const file = e.target.files?.[0];
        if (file) processVoiceFile(file);
    };

    const handleVoiceDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOverVoice(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) processVoiceFile(file);
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
        const file = e.target.files?.[0];
        if (file) processBgmFile(file);
    };

    const handleBgmDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOverBgm(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) processBgmFile(file);
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
            isDefault: false,
        };

        let saved = [];
        try {
            saved = JSON.parse(localStorage.getItem('USER_CUSTOM_BGMS') || '[]');
        } catch { }

        const updated = [newSong, ...saved];
        try {
            localStorage.setItem('USER_CUSTOM_BGMS', JSON.stringify(updated));
        } catch { }

        setCustomBgmList([...DEFAULT_PRESET_BGMS, ...updated]);
        alert(`Đã lưu "${newSong.title}" vào kho nhạc!`);
    };

    // 4. KHO NHẠC TỰ LƯU + CÓ SẴN
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
        audio.onerror = () => {
            setPlayingCustomBgmPreviewId(null);
            alert(`Không tìm thấy file nhạc "${item.title}". Hãy chắc chắn file đã được đặt vào thư mục public/music/!`);
        };

        setPlayingCustomBgmPreviewId(item.id);
        audio.play().catch(() => setPlayingCustomBgmPreviewId(null));
    };

    const handleDeleteCustomBgm = (e, id) => {
        e.stopPropagation();
        const target = customBgmList.find((b) => b.id === id);
        if (target?.isDefault) {
            alert('Không thể xóa bài hát mặc định của hệ thống!');
            return;
        }

        let saved = [];
        try {
            saved = JSON.parse(localStorage.getItem('USER_CUSTOM_BGMS') || '[]');
        } catch { }

        const updated = saved.filter((b) => b.id !== id);
        try {
            localStorage.setItem('USER_CUSTOM_BGMS', JSON.stringify(updated));
        } catch { }

        setCustomBgmList([...DEFAULT_PRESET_BGMS, ...updated]);

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
        if (moved) {
            updated.splice(dropIndex, 0, moved);
            setMediaFiles(updated);
        }
        setDraggedIndex(null);
    };
    const removeMedia = (index) => {
        setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    };

    // AI TỰ ĐỘNG NHÌN ẢNH / VIDEO VIẾT KỊCH BẢN TIẾNG THÁI (15 - 20s)
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
            let imageInput = mediaFiles[0];

            if (mediaType === 'video') {
                setScriptStatusText('Đang trích xuất khung hình video...');
                imageInput = await extractFrameFromVideo(mediaFiles[0]);
            }

            setScriptStatusText('AI đang phân tích & tạo kịch bản tiếng Thái...');
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
            setScriptStatusText('');
        }
    };

    // BẮT ĐẦU DỊCH NGHĨA SANG TIẾNG VIỆT
    const handleTranslateToVietnamese = async () => {
        if (!thaiScript || !thaiScript.trim()) {
            alert('Vui lòng nhập hoặc tạo kịch bản tiếng Thái trước khi dịch!');
            return;
        }
        if (!geminiApiKey || !geminiApiKey.trim()) {
            alert('Vui lòng nhập Google AI Studio API Key ở ô cấu hình!');
            return;
        }

        const controller = new AbortController();
        translationAbortRef.current = controller;

        try {
            setIsTranslating(true);
            const viText = await translateThaiToVietnamese(thaiScript, geminiApiKey, controller.signal);
            setVietnameseScript(viText);
        } catch (err) {
            if (err.name === 'AbortError') return;
            alert('Lỗi dịch: ' + (err.message || 'Không thể dịch văn bản.'));
        } finally {
            setIsTranslating(false);
            translationAbortRef.current = null;
        }
    };

    const handleCancelTranslation = () => {
        if (translationAbortRef.current) {
            translationAbortRef.current.abort();
            translationAbortRef.current = null;
        }
        setIsTranslating(false);
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

    // GỌI GROK IMAGE-TO-VIDEO API
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
        if (aspectRatio === '3:4') return { width: 720, height: 960 };
        if (aspectRatio === '1:1') return { width: 800, height: 800 };
        return { width: 720, height: 1280 };
    };

    // HÀM CHUẨN BỊ SESSION: TỰ ĐỘNG VIẾT KỊCH BẢN VÀ TỰ TẠO GIỌNG ĐỌC NẾU THIẾU
    const prepareSession = async (isPreview = false) => {
        let currentMedia = [...mediaFiles];

        // TỰ ĐỘNG CẮT ẢNH NẾU NGƯỜI DÙNG ĐÃ CHỌN ẢNH CẮT NHƯNG CHƯA BẤM CẮT
        if (currentMedia.length === 0 && divideSourceImage) {
            setPreparingStatusText(`Đang tự động cắt ảnh thành ${divideRows * divideCols} ô...`);
            const pieces = await executeDivideImage();
            if (pieces.length > 0) {
                setDividedPieces(pieces);
                setMediaType('images');
                setActiveTab('images');
                setMediaFiles(pieces);
                currentMedia = pieces;
            }
        }

        let currentScript = thaiScript?.trim() || '';

        // 1. NẾU CHỌN DÙNG VOICE AI MÀ CHƯA CÓ VĂN BẢN KỊCH BẢN -> TỰ ĐỘNG VIẾT KỊCH BẢN
        if (voiceSourceType === 'ai' && !currentScript) {
            if (currentMedia.length === 0) {
                throw new Error('Vui lòng tải lên ảnh hoặc video để AI có thể viết kịch bản!');
            }

            setIsWritingScript(true);
            setScriptStatusText('Tự động tạo kịch bản từ hình ảnh/video...');
            setPreparingStatusText('Đang phân tích thiết kế & tự động tạo kịch bản...');

            try {
                let imageInput = currentMedia[0];
                if (mediaType === 'video') {
                    setScriptStatusText('Đang trích xuất khung hình video...');
                    setPreparingStatusText('Đang trích xuất khung hình từ video...');
                    imageInput = await extractFrameFromVideo(currentMedia[0]);
                }

                setScriptStatusText('AI đang phân tích sản phẩm và viết kịch bản...');
                setPreparingStatusText('AI đang sáng tạo kịch bản tiếng Thái...');
                const generatedScript = await generateThaiScriptFromImage(
                    imageInput,
                    geminiApiKey,
                    customScriptPrompt
                );

                currentScript = generatedScript.trim();
                setThaiScript(currentScript);
            } catch (err) {
                throw new Error('Không thể tự động viết kịch bản: ' + (err.message || 'Lỗi AI'));
            } finally {
                setIsWritingScript(false);
                setScriptStatusText('');
            }
        }

        // 2. TỰ ĐỘNG TẠO FILE VOICE NẾU CHƯA CÓ
        let finalVoiceSrc = voiceFile;
        if (voiceSourceType === 'ai') {
            if (!currentScript) {
                throw new Error('Không có nội dung kịch bản để tạo giọng đọc!');
            }

            setIsGeneratingVoice(true);
            setPreparingStatusText('Đang nạp giọng đọc AI...');
            try {
                const activeVoiceId = getEffectiveVoiceId();
                finalVoiceSrc = await generateThaiSpeechAudio(currentScript, activeVoiceId, {
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

        // 3. THIẾT LẬP MIXER VÀ THỜI LƯỢNG VIDEO THEO ĐỘ DÀI GIỌNG ĐỌC
        setPreparingStatusText('Đang đồng bộ âm thanh & khung hình...');
        const mixer = new AudioMixer();
        activeMixerRef.current = mixer;
        const audioStream = mixer.setup(finalVoiceSrc, bgmFile, bgmVolume, voiceVolume, isPreview);

        let voiceDuration = await mixer.getVoiceDuration();
        let targetDuration = Math.max(Math.ceil(voiceDuration) || 6, 3);
        setPreviewDuration(targetDuration);

        let aiTimeline = null;
        if (effectMode === 'script') {
            setIsAiDirecting(true);
            try {
                aiTimeline = await analyzeVideoScriptWithAi(
                    customScriptPrompt,
                    currentMedia.length,
                    geminiApiKey,
                    targetDuration
                );
            } finally {
                setIsAiDirecting(false);
            }
        }

        // Đảm bảo canvas luôn tồn tại trước khi khởi tạo VideoRenderer
        if (!previewCanvasRef.current) {
            throw new Error('Khung hiển thị video chưa sẵn sàng. Vui lòng tải lại trang.');
        }

        const { width, height } = getVideoDimensions();
        const renderer = new VideoRenderer(previewCanvasRef.current, { width, height });
        activeRendererRef.current = renderer;

        return { mixer, renderer, audioStream, targetDuration, aiTimeline, readyMedia: currentMedia };
    };

    // HÀM BẮT ĐẦU CHẠY PREVIEW THỰC SỰ
    const startPreviewProcess = async () => {
        stopAllActivities();
        // Xóa outputVideoUrl tạm thời khi xem preview để khung hình Canvas hiển thị
        setOutputVideoUrl(null);

        const needsScript = voiceSourceType === 'ai' && !thaiScript.trim();
        const needsVoice = voiceSourceType === 'ai';
        const needsDivide = mediaFiles.length === 0 && divideSourceImage;

        if (needsScript || needsVoice || needsDivide) {
            setIsPreviewPreparing(true);
            setPreparingStatusText('Đang khởi tạo video...');
        }

        try {
            const { mixer, renderer, targetDuration, aiTimeline, readyMedia } = await prepareSession(true);
            await mixer.play();

            setIsPreviewPreparing(false);
            setIsPreviewingVideo(true);

            renderer.startPreview({
                files: readyMedia || mediaFiles,
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
            setIsPreviewPreparing(false);
            alert(err.message || 'Lỗi khi chuẩn bị video xem trước.');
        }
    };

    // HÀM BẤM NÚT PREVIEW (KIỂM TRA CÓ NHẠC NỀN HAY CHƯA)
    const handleTogglePreviewVideo = async () => {
        if (isPreviewingVideo) {
            stopAllActivities();
            return;
        }

        if (mediaFiles.length === 0 && !divideSourceImage) {
            alert('Vui lòng tải lên ít nhất 1 ảnh hoặc video ở mục 01 để xem trước!');
            return;
        }

        // NẾU CHƯA CÓ NHẠC NỀN -> HIỂN THỊ POPUP THÔNG BÁO CHO NGƯỜI DÙNG BỎ QUA HOẶC CHỌN NHẠC
        if (!bgmFile) {
            setShowNoBgmPrompt(true);
            return;
        }

        startPreviewProcess();
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
        if (mediaFiles.length === 0 && !divideSourceImage) {
            alert('Vui lòng tải lên ít nhất 1 ảnh hoặc video!');
            return;
        }

        stopAllActivities();
        setRendering(true);
        setProgress(0);
        setOutputVideoUrl(null);

        try {
            const { mixer, renderer, audioStream, targetDuration, aiTimeline, readyMedia } = await prepareSession(false);
            await mixer.play();

            renderer.startRender({
                files: readyMedia || mediaFiles,
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
                    setProgress(100);
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
    const estimatedSeconds = Math.max(0, Math.round((thaiScript.trim().length || 0) / 16));

    return (
        <div style={styles.fullscreenApp}>
            {/* THÊM ANIMATION KEYFRAMES CHO POPUP SPINNER */}
            <style>{`
                @keyframes spinAnimation {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>

            {/* POPUP MODAL CẮT ẢNH CHUYÊN DỤNG (HỖ TRỢ KÉO THẢ TỆP & DI CHUYỂN CỬA SỔ) */}
            {isDivideModalOpen && (
                <div style={styles.loadingOverlay}>
                    <div
                        style={{
                            ...styles.dividerModalWindow,
                            transform: `translate(${modalPos.x}px, ${modalPos.y}px)`,
                        }}
                    >
                        {/* Header Modal: Cho phép nhấn giữ chuột để kéo di chuyển cửa sổ */}
                        <div
                            style={styles.dividerModalHeader}
                            onMouseDown={handleStartDragModal}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'none' }}>
                                <div style={styles.dividerIconBadge}>✂</div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                                        Chia nhỏ hình ảnh (Image Divide)
                                    </h3>
                                    <span style={{ fontSize: 12, color: '#64748b' }}>
                                        Kéo thả ảnh vào khung bên dưới để cắt
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDivideModalOpen(false);
                                    setActiveTab(mediaType);
                                }}
                                style={styles.closeModalBtn}
                                title="Đóng cửa sổ"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Thân Modal: Hỗ trợ Kéo - Thả ảnh trực tiếp từ máy tính */}
                        {!divideSourceImage ? (
                            <div
                                style={{
                                    ...styles.modalUploadDropArea,
                                    borderColor: isDraggingOverDivideModal ? '#0284c7' : '#94a3b8',
                                    backgroundColor: isDraggingOverDivideModal ? '#e0f2fe' : '#f8fafc',
                                }}
                                onClick={() => divideFileInputRef.current && divideFileInputRef.current.click()}
                                onDragEnter={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsDraggingOverDivideModal(true);
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.dataTransfer.dropEffect = 'copy';
                                    setIsDraggingOverDivideModal(true);
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!e.currentTarget.contains(e.relatedTarget)) {
                                        setIsDraggingOverDivideModal(false);
                                    }
                                }}
                                onDrop={handleDivideDrop}
                            >
                                <input
                                    ref={divideFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleDivideImageUpload}
                                />
                                <div style={styles.uploadIllustrationCircle}>
                                    {isDraggingOverDivideModal ? '📥' : '🖼️'}
                                </div>
                                <h4 style={{ margin: '0 0 6px 0', fontSize: 15, fontWeight: 700, color: '#0284c7' }}>
                                    {isDraggingOverDivideModal ? 'Thả tệp ảnh vào đây ngay!' : 'Bấm để chọn hoặc kéo thả ảnh vào đây'}
                                </h4>
                                <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
                                    Hỗ trợ định dạng JPG, PNG, WEBP. Ảnh sắc nét, giữ nguyên độ phân giải.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Khung Xem trước với Lưới cắt Overlay trực quan */}
                                <div style={styles.previewImageGridCard}>
                                    <div style={styles.previewImageContainer}>
                                        <img
                                            src={divideSourceImage}
                                            alt="Divide Source"
                                            style={styles.previewDivideImg}
                                        />
                                        {/* Lưới cắt trực quan phủ lên ảnh */}
                                        <div
                                            style={{
                                                ...styles.gridOverlayContainer,
                                                gridTemplateRows: `repeat(${divideRows}, 1fr)`,
                                                gridTemplateColumns: `repeat(${divideCols}, 1fr)`,
                                            }}
                                        >
                                            {Array.from({ length: divideRows * divideCols }).map((_, idx) => (
                                                <div key={idx} style={styles.gridOverlayCell}>
                                                    <span style={styles.gridCellNumberBadge}>#{idx + 1}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Nút xóa ảnh nguồn */}
                                    <button
                                        type="button"
                                        onClick={handleClearDivideImage}
                                        style={styles.removeDivideImgBtn}
                                        title="Xóa và chọn ảnh khác"
                                    >
                                        🗑️ Đổi ảnh khác
                                    </button>
                                </div>

                                {/* Bảng điều khiển cấu hình hàng và cột */}
                                <div style={styles.gridControlsPanel}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                                            Kích thước lưới chia:
                                        </span>
                                        <span style={styles.gridSummaryBadge}>
                                            Tổng cộng: <b>{divideRows * divideCols} mảnh</b>
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                        {/* Stepper Hàng */}
                                        <div style={styles.stepperBox}>
                                            <span style={styles.stepperLabel}>Số hàng:</span>
                                            <div style={styles.stepperControlRow}>
                                                <button
                                                    type="button"
                                                    onClick={() => setDivideRows((prev) => Math.max(1, prev - 1))}
                                                    style={styles.stepperBtn}
                                                >
                                                    -
                                                </button>
                                                <span style={styles.stepperValue}>{divideRows}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setDivideRows((prev) => Math.min(10, prev + 1))}
                                                    style={styles.stepperBtn}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <span style={{ fontSize: 18, fontWeight: 800, color: '#94a3b8' }}>×</span>

                                        {/* Stepper Cột */}
                                        <div style={styles.stepperBox}>
                                            <span style={styles.stepperLabel}>Số cột:</span>
                                            <div style={styles.stepperControlRow}>
                                                <button
                                                    type="button"
                                                    onClick={() => setDivideCols((prev) => Math.max(1, prev - 1))}
                                                    style={styles.stepperBtn}
                                                >
                                                    -
                                                </button>
                                                <span style={styles.stepperValue}>{divideCols}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setDivideCols((prev) => Math.min(10, prev + 1))}
                                                    style={styles.stepperBtn}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Nút bấm hành động */}
                                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                                    <button
                                        type="button"
                                        disabled={isSplittingImage}
                                        onClick={handlePerformDivideImage}
                                        style={styles.modalPrimaryActionBtn}
                                    >
                                        {isSplittingImage ? '⏳ Đang cắt ảnh...' : `✂️️ Cắt ${divideRows * divideCols} ô & Thêm vào tư liệu`}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={isZipping || isSplittingImage}
                                        onClick={handleDownloadZip}
                                        style={styles.modalSecondaryZipBtn}
                                        title="Tải tệp ZIP về máy tính"
                                    >
                                        {isZipping ? '📦...' : '📦 Tải file ZIP'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* POPUP THÔNG BÁO: TƯ LIỆU ĐÃ CÓ ẢNH KHI NGƯỜI DÙNG BẤM CHIA ẢNH */}
            {showMediaExistPopup && (
                <div style={styles.loadingOverlay}>
                    <div style={styles.loadingModal}>
                        <div style={{ fontSize: 42, marginBottom: 8 }}>⚠️</div>
                        <h3 style={styles.loadingTitle}>Mục tư liệu đã có ảnh!</h3>
                        <p style={styles.loadingSubtitle}>
                            Hiện tại Mục 01 Tư liệu đang có <b>{mediaFiles.length} tệp</b>. Bạn có muốn thay thế toàn bộ bằng các mảnh ảnh vừa cắt này không?
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 4 }}>
                            <button
                                type="button"
                                onClick={handleConfirmOverwriteMedia}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: 8,
                                    border: 'none',
                                    backgroundColor: '#0284c7',
                                    color: '#ffffff',
                                    fontSize: 13.5,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                🔄 Thay thế toàn bộ ({pendingPiecesRef.current.length} ảnh mới)
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    pendingPiecesRef.current = [];
                                    setShowMediaExistPopup(false);
                                }}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: 8,
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: '#ffffff',
                                    color: '#64748b',
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                Hủy bỏ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* POPUP THÔNG BÁO: CHƯA CÓ NHẠC NỀN */}
            {showNoBgmPrompt && (
                <div style={styles.loadingOverlay}>
                    <div style={styles.loadingModal}>
                        <div style={{ fontSize: 44, marginBottom: 12 }}>🎵</div>
                        <h3 style={styles.loadingTitle}>Chưa chọn nhạc nền!</h3>
                        <p style={styles.loadingSubtitle}>
                            Video chưa được thêm bài nhạc nền nào. Bạn có muốn bỏ qua và tiếp tục phát preview không nhạc không?
                        </p>
                        <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 6 }}>
                            <button
                                type="button"
                                onClick={() => setShowNoBgmPrompt(false)}
                                style={{
                                    flex: 1,
                                    padding: '10px 14px',
                                    borderRadius: 8,
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: '#ffffff',
                                    color: '#475569',
                                    fontSize: 13.5,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                Chọn nhạc nền
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowNoBgmPrompt(false);
                                    startPreviewProcess();
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px 14px',
                                    borderRadius: 8,
                                    border: 'none',
                                    backgroundColor: '#0284c7',
                                    color: '#ffffff',
                                    fontSize: 13.5,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                Bỏ qua & Xem luôn
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* POPUP THÔNG BÁO: ĐANG TẠO VIDEO, VUI LÒNG CHỜ */}
            {isPreviewPreparing && (
                <div style={styles.loadingOverlay}>
                    <div style={styles.loadingModal}>
                        <div style={styles.spinner} />
                        <h3 style={styles.loadingTitle}>Đang tạo video, vui lòng chờ...</h3>
                        <p style={styles.loadingSubtitle}>
                            {preparingStatusText || 'Hệ thống đang chuẩn bị kịch bản & nạp giọng đọc AI...'}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                stopAllActivities();
                                setIsPreviewPreparing(false);
                            }}
                            style={styles.cancelPreviewPrepBtn}
                        >
                            Hủy bỏ
                        </button>
                    </div>
                </div>
            )}

            {/* HEADER */}
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
                        <div style={{ display: 'flex', gap: 8 }}>
                            {[
                                { id: '9:16', label: '📱 9:16 (Dọc)' },
                                { id: '3:4', label: '🔲 3:4 (Lookbook)' },
                                { id: '1:1', label: '⬛ 1:1 (Vuông)' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    style={{
                                        ...styles.tabButton,
                                        backgroundColor: aspectRatio === item.id ? '#0284c7' : '#ffffff',
                                        color: aspectRatio === item.id ? '#ffffff' : '#64748b',
                                        fontWeight: aspectRatio === item.id ? 700 : 600,
                                        boxShadow: aspectRatio === item.id ? '0 2px 6px rgba(2, 132, 199, 0.25)' : 'none',
                                    }}
                                    onClick={() => setAspectRatio(item.id)}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Card 1: Tư liệu (3 NÚT NỔI BẬT MÀU KHI ĐƯỢC CHỌN) */}
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <span style={styles.cardStep}>01</span>
                            <h3 style={styles.cardTitle}>Tư liệu</h3>
                        </div>

                        {/* 3 NÚT LỰA CHỌN: ẢNH | CẮT ẢNH | VIDEO (ĐỔI MÀU NỔI BẬT RÕ RÀNG) */}
                        <div style={styles.tabGroup}>
                            <button
                                style={{
                                    ...styles.tabButton,
                                    backgroundColor: activeTab === 'images' ? '#0284c7' : '#ffffff',
                                    color: activeTab === 'images' ? '#ffffff' : '#475569',
                                    fontWeight: activeTab === 'images' ? 700 : 600,
                                    boxShadow: activeTab === 'images' ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
                                    border: activeTab === 'images' ? 'none' : '1px solid #e2e8f0',
                                }}
                                onClick={() => {
                                    setActiveTab('images');
                                    setMediaType('images');
                                    setMediaFiles([]);
                                }}
                            >
                                📸 Ảnh
                            </button>

                            {/* NÚT CẮT ẢNH Ở GIỮA -> CHUYỂN MÀU NỔI BẬT & MỞ POPUP */}
                            <button
                                style={{
                                    ...styles.tabButton,
                                    backgroundColor: activeTab === 'divide' ? '#0284c7' : '#ffffff',
                                    color: activeTab === 'divide' ? '#ffffff' : '#475569',
                                    fontWeight: activeTab === 'divide' ? 700 : 600,
                                    boxShadow: activeTab === 'divide' ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
                                    border: activeTab === 'divide' ? 'none' : '1px solid #e2e8f0',
                                }}
                                onClick={() => {
                                    setActiveTab('divide');
                                    setIsDivideModalOpen(true);
                                }}
                            >
                                ✂️ Cắt ảnh
                            </button>

                            <button
                                style={{
                                    ...styles.tabButton,
                                    backgroundColor: activeTab === 'video' ? '#0284c7' : '#ffffff',
                                    color: activeTab === 'video' ? '#ffffff' : '#475569',
                                    fontWeight: activeTab === 'video' ? 700 : 600,
                                    boxShadow: activeTab === 'video' ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none',
                                    border: activeTab === 'video' ? 'none' : '1px solid #e2e8f0',
                                }}
                                onClick={() => {
                                    setActiveTab('video');
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
                                    : `Bấm để chọn hoặc kéo thả ${mediaType === 'images' ? 'ảnh' : 'video'}`}
                            </p>
                        </div>

                        {mediaFiles.length > 0 && (
                            <div style={{ marginTop: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                                        💡 <b>Kéo thả</b> để đổi thứ tự xuất hiện ({mediaFiles.length} tư liệu):
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleClearAllMedia}
                                        style={styles.clearAllBtn}
                                        title="Xóa tất cả ảnh/video đã tải lên"
                                    >
                                        🗑️ Xóa tất cả ({mediaFiles.length})
                                    </button>
                                </div>

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

                    {/* Card: Hiệu ứng chuyển cảnh & Grok AI (thuộc tư liệu hình ảnh) */}
                    {mediaType === 'images' && (
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <span style={styles.cardStep}>🎨</span>
                                <h3 style={styles.cardTitle}>Dựng Video</h3>
                            </div>

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

                                    <div style={{ marginTop: 10, padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                                                🔑 xAI Grok API Key:
                                            </span>
                                            {xaiApiKey && <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>✓ Đã lưu</span>}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="xai-..."
                                            value={xaiApiKey}
                                            onChange={(e) => handleSaveXaiKey(e.target.value)}
                                            style={{ ...styles.keyInput, fontSize: 12, padding: '6px 10px' }}
                                        />
                                    </div>

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

                                    <button
                                        type="button"
                                        disabled={isAiDirecting}
                                        onClick={handleTogglePreviewVideo}
                                        style={styles.aiPreviewTriggerBtn}
                                    >
                                        {isAiDirecting
                                            ? '🧠 AI đang phân tích...'
                                            : isPreviewingVideo
                                                ? '⏹️ Dừng xem trước'
                                                : '⚡ Xem trước góc máy (Canvas)'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Card 2: Giọng đọc AI & Kéo thả Voice */}
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <span style={styles.cardStep}>02</span>
                            <h3 style={styles.cardTitle}>Voice & Kịch bản</h3>
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
                                            Hỗ trợ định dạng MP3, WAV, M4A, OGG
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
                                                placeholder="Dán key (AIzaSy...)"
                                                value={geminiApiKey}
                                                onChange={(e) => setGeminiApiKey(e.target.value)}
                                                style={styles.keyInput}
                                            />
                                            <button type="button" onClick={handleSaveGeminiKey} style={styles.saveBtn}>
                                                Lưu Key
                                            </button>
                                        </div>
                                        <div style={{ fontSize: 11.5, color: '#0284c7', marginTop: 6, fontWeight: 600 }}>
                                            ⚡ Tự động dò tìm model khả dụng của Google
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

                                {/* KHU VỰC NHẬP / TẠO KỊCH BẢN TIẾNG THÁI */}
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                                        <label style={{ ...styles.label, margin: 0 }}>
                                            Kịch bản tiếng Thái:
                                        </label>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 11.5, color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>
                                                ~{estimatedSeconds} giây
                                            </span>

                                            {/* NÚT AI TỰ ĐỘNG VIẾT KỊCH BẢN */}
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
                                                {isWritingScript
                                                    ? `🧠 ${scriptStatusText || 'Đang tạo văn bản...'}`
                                                    : mediaType === 'video'
                                                        ? '✨ AI Viết Theo Video'
                                                        : '✨ AI Viết Theo Ảnh'}
                                            </button>

                                            <button
                                                type="button"
                                                title="Xóa kịch bản hiện tại"
                                                onClick={() => setThaiScript('')}
                                                style={{
                                                    padding: '5px 8px',
                                                    fontSize: 13,
                                                    backgroundColor: '#fee2e2',
                                                    color: '#dc2626',
                                                    border: 'none',
                                                    borderRadius: 6,
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>

                                    {/* Ô VĂN BẢN ĐỂ TRỐNG MỖI LẦN TRUY CẬP */}
                                    <textarea
                                        rows="5"
                                        style={{ ...styles.textarea, fontSize: 13, lineHeight: 1.6 }}
                                        value={thaiScript}
                                        onChange={(e) => setThaiScript(e.target.value)}
                                        placeholder="Nhập kịch bản tiếng Thái tùy ý hoặc bấm nút 'AI Viết' ở trên (nếu để trống, bấm Preview sẽ tự động viết)..."
                                    />
                                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                                        💡 {mediaType === 'video' ? 'Hệ thống tự cắt 1 khung hình từ video để AI nhận diện mẫu trang phục.' : 'Có thể tự sửa/thêm văn bản theo ý muốn, hoặc dùng AI tự động tạo.'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NÚT NGHE THỬ VÀ NÚT DỊCH NGHĨA TIẾNG VIỆT */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
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
                                            ? '⏹️️ Dừng nghe voice'
                                            : '🔊 Nghe thử giọng đọc'}
                                </button>

                                {!isTranslating ? (
                                    <button
                                        type="button"
                                        onClick={handleTranslateToVietnamese}
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: 8,
                                            border: '1px solid #cbd5e1',
                                            backgroundColor: '#ffffff',
                                            color: '#334155',
                                            fontSize: 13.5,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        🇻🇳 Dịch
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleCancelTranslation}
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: 8,
                                            border: 'none',
                                            backgroundColor: '#fee2e2',
                                            color: '#dc2626',
                                            fontSize: 13.5,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        🛑 Hủy dịch
                                    </button>
                                )}

                                {selectedProvider === 'gemini' && geminiCooldown > 0 && (
                                    <span style={styles.cooldownBadge}>
                                        ⏳ Google chờ: {geminiCooldown}s
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Ô BẢN DỊCH TIẾNG VIỆT */}
                        {(vietnameseScript || isTranslating) && (
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <label style={{ ...styles.label, margin: 0, color: '#059669' }}>
                                        🇻🇳 Bản dịch nghĩa tiếng Việt:
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isTranslating) handleCancelTranslation();
                                            setVietnameseScript('');
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#94a3b8',
                                            fontSize: 12,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        ✕ Đóng ô dịch
                                    </button>
                                </div>
                                <textarea
                                    rows="3"
                                    style={{
                                        ...styles.textarea,
                                        backgroundColor: '#f0fdf4',
                                        borderColor: '#bbf7d0',
                                        color: '#166534',
                                        fontSize: 13,
                                        lineHeight: 1.5,
                                    }}
                                    value={isTranslating ? 'Đang chuyển ngữ kịch bản sang tiếng Việt...' : vietnameseScript}
                                    onChange={(e) => setVietnameseScript(e.target.value)}
                                    placeholder="Bản dịch tiếng Việt sẽ xuất hiện tại đây..."
                                />
                            </div>
                        )}

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

                    {/* Card 3: Nhạc nền */}
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
                                            Hỗ trợ định dạng MP3, WAV, M4A, AAC
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
                                            {isPlayingUploadedBgmPreview ? '⏹️️ Dừng nghe' : '▶ Nghe thử bài này'}
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
                                        Danh sách bài hát ({customBgmList.length}):
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
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span style={{ fontWeight: 700, fontSize: 13.5, color: isSelected ? '#0284c7' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {isSelected ? '✓ ' : ''}{item.title}
                                                            </span>
                                                            {item.isDefault && (
                                                                <span style={styles.defaultBadge}>Có sẵn</span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.desc}
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 8 }}>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => togglePreviewCustomBgm(e, item)}
                                                            style={{
                                                                ...styles.bgmPreviewSmallBtn,
                                                                backgroundColor: isPreviewPlaying ? '#ef4444' : '#e0f2fe',
                                                                color: isPreviewPlaying ? '#ffffff' : '#0284c7',
                                                            }}
                                                        >
                                                            {isPreviewPlaying ? '⏹' : '▶'}
                                                        </button>

                                                        {!item.isDefault && (
                                                            <button
                                                                type="button"
                                                                title="Xóa bài này"
                                                                onClick={(e) => handleDeleteCustomBgm(e, item.id)}
                                                                style={styles.deleteMiniBtn}
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
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
                                ...(aspectRatio === '9:16'
                                    ? styles.aspectRatio916
                                    : aspectRatio === '3:4'
                                        ? styles.aspectRatio34
                                        : styles.aspectRatio11),
                            }}
                        >
                            {/* 1. Video xuất ra thành phẩm (ẩn khi người dùng bấm xem preview để nhường chỗ cho Canvas) */}
                            {outputVideoUrl && !isPreviewingVideo && (
                                <video src={outputVideoUrl} controls autoPlay loop style={styles.mockupScreen} />
                            )}

                            {/* 2. Video xem trước tĩnh khi người dùng vừa upload video (chưa bấm preview) */}
                            {!outputVideoUrl && mediaType === 'video' && mediaFiles.length > 0 && !isPreviewingVideo && !rendering && (
                                <video src={mediaFiles[0]} controls autoPlay loop muted style={styles.mockupScreen} />
                            )}

                            {/* 3. Canvas luôn luôn nằm trong DOM (hiển thị khi Preview hoặc Render hoặc khi đang ở chế độ ảnh) */}
                            <canvas
                                ref={previewCanvasRef}
                                style={{
                                    ...styles.mockupScreen,
                                    display: (isPreviewingVideo || rendering || (!outputVideoUrl && mediaType === 'images' && mediaFiles.length > 0)) ? 'block' : 'none',
                                }}
                            />

                            {/* 4. Trạng thái trống */}
                            {mediaFiles.length === 0 && !outputVideoUrl && !divideSourceImage && (
                                <div style={styles.screenEmpty}>
                                    <span style={{ fontSize: 30, opacity: 0.5 }}>🩳👖🧥👗</span>
                                    <p style={{ color: '#64748b', fontSize: 15, textAlign: 'center', marginTop: 12, fontWeight: 500 }}>
                                        Chưa có tư liệu.<br />Kéo thả ảnh hoặc video vào bên trái.
                                    </p>
                                </div>
                            )}

                            {(mediaFiles.length > 0 || divideSourceImage) && !outputVideoUrl && (
                                <div key={aspectRatio} style={styles.previewBadge}>
                                    {isPreviewingVideo ? '🔊 Đang Preview' : rendering ? '⚙️ Đang Render...' : `Tỉ lệ ${aspectRatio}`}
                                </div>
                            )}
                        </div>
                    </div>

                    {(!outputVideoUrl || isPreviewingVideo) && (
                        <div style={styles.timelineScrubberCard}>
                            <div style={styles.timelineHeader}>
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
                        {/* NÚT PREVIEW LUÔN XUẤT HIỆN KHI KHÔNG TRONG QUÁ TRÌNH RENDER (KỂ CẢ ĐÃ CÓ VIDEO XUẤT XONG) */}
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
                                {isPreviewingVideo ? '⏸ Tạm dừng' : '▶️ Preview'}
                            </button>
                        )}

                        {/* NÚT XUẤT VIDEO (KHI CHƯA RENDER HOẶC KHI ĐANG PREVIEW ĐỂ XUẤT LẠI) */}
                        {!rendering && (!outputVideoUrl || isPreviewingVideo) && (
                            <button onClick={handleStartRender} style={styles.actionButton}>
                                ⚡ Xuất Video ({aspectRatio})
                            </button>
                        )}

                        {/* NÚT HỦY KHI ĐANG RENDER */}
                        {rendering && (
                            <button onClick={handleCancelRender} style={styles.cancelButton}>
                                🛑 HỦY
                            </button>
                        )}

                        {/* NÚT TẢI XUỐNG VÀ NÚT TẠO VIDEO MỚI KHI RENDER XONG (HIỂN THỊ KHI KHÔNG PREVIEW) */}
                        {outputVideoUrl && !rendering && !isPreviewingVideo && (
                            <div style={{ display: 'flex', gap: 10, flex: 2 }}>
                                <a
                                    href={outputVideoUrl}
                                    download={`ads_thoi_trang_${aspectRatio.replace(':', '_')}.mp4`}
                                    style={styles.downloadButton}
                                >
                                    📥 Tải Video (.mp4)
                                </a>

                                <button
                                    type="button"
                                    onClick={handleResetAll}
                                    style={styles.newVideoResetBtn}
                                    title="Xóa toàn bộ tư liệu và tạo video mới từ đầu"
                                >
                                    🔄 Tạo video mới
                                </button>
                            </div>
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
                    <span style={styles.footerVersion}>v2.1</span>
                    <span style={styles.footerVersion}>Cập nhật: 01/10/2026</span>
                </div>

                {/* KHU VỰC LOGO CÔNG NGHỆ SỬ DỤNG TRONG DỰ ÁN */}
                <div style={styles.footerCenterTech}>
                    <div style={styles.techIconsList}>
                        {/* React */}
                        <span title="React.js (Frontend Framework)" style={styles.techBadge}>
                            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="React" style={styles.techIconImg} />
                            <span>React</span>
                        </span>

                        {/* Node.js */}
                        <span title="Node.js (Runtime)" style={styles.techBadge}>
                            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" alt="NodeJS" style={styles.techIconImg} />
                            <span>Node.js</span>
                        </span>

                        {/* Express */}
                        <span title="ExpressJS (Backend API Service)" style={styles.techBadge}>
                            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" alt="Express" style={{ ...styles.techIconImg, filter: 'invert(0.2)' }} />
                            <span>Express</span>
                        </span>

                        {/* Google Gemini AI */}
                        <span title="Google Gemini 2.5/3.8 Flash (AI Script & TTS)" style={styles.techBadge}>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" alt="Gemini AI" style={styles.techIconImg} />
                            <span>Gemini</span>
                        </span>

                        {/* ElevenLabs TTS */}
                        <span title="ElevenLabs (Multilingual AI Voice TTS)" style={styles.techBadge}>
                            <span style={{ fontSize: 13, fontWeight: 900, color: '#000000', lineHeight: 1 }}>❙❙</span>
                            <span>ElevenLabs</span>
                        </span>

                        {/* Web Audio & Canvas */}
                        <span title="HTML5 Canvas & Web Audio API (Render Engine)" style={styles.techBadge}>
                            <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" alt="HTML5 Canvas" style={styles.techIconImg} />
                            <span>Canvas 2D</span>
                        </span>
                    </div>
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
    loadingOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingModal: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: '30px 32px',
        width: '90%',
        maxWidth: 420,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
    },
    closeModalBtn: {
        background: '#f1f5f9',
        border: 'none',
        borderRadius: '50%',
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 14,
        color: '#64748b',
        fontWeight: 'bold',
        transition: 'all 0.15s ease',
    },
    dividerModalWindow: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: '24px 28px',
        width: '92%',
        maxWidth: 500,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.38), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        userSelect: 'none',
        transition: 'box-shadow 0.2s ease',
    },
    dividerModalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 14,
        borderBottom: '1px solid #f1f5f9',
        marginBottom: 16,
        cursor: 'move',
    },
    dividerIconBadge: {
        width: 38,
        height: 38,
        borderRadius: 10,
        background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        color: '#0284c7',
        boxShadow: '0 2px 5px rgba(2, 132, 199, 0.15)',
    },
    modalUploadDropArea: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#94a3b8',
        borderRadius: 16,
        padding: '36px 20px',
        textAlign: 'center',
        backgroundColor: '#f8fafc',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        userSelect: 'none',
    },
    uploadIllustrationCircle: {
        width: 60,
        height: 60,
        borderRadius: '50%',
        backgroundColor: '#e0f2fe',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        margin: '0 auto 12px auto',
    },
    previewImageGridCard: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 14,
        border: '1px solid #e2e8f0',
    },
    previewImageContainer: {
        position: 'relative',
        display: 'inline-block',
        lineHeight: 0,
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
        maxWidth: '100%',
    },
    previewDivideImg: {
        maxHeight: 180,
        maxWidth: '100%',
        objectFit: 'contain',
        display: 'block',
        pointerEvents: 'none',
    },
    gridOverlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'grid',
        pointerEvents: 'none',
    },
    gridOverlayCell: {
        border: '1px dashed rgba(2, 132, 199, 0.85)',
        backgroundColor: 'rgba(2, 132, 199, 0.08)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
    },
    gridCellNumberBadge: {
        fontSize: 10.5,
        fontWeight: 800,
        color: '#ffffff',
        backgroundColor: 'rgba(2, 132, 199, 0.85)',
        padding: '1px 5px',
        borderRadius: 4,
        backdropFilter: 'blur(2px)',
    },
    removeDivideImgBtn: {
        marginTop: 10,
        padding: '5px 12px',
        fontSize: 12,
        fontWeight: 700,
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
    },
    gridControlsPanel: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: '12px 14px',
        border: '1px solid #e2e8f0',
    },
    gridSummaryBadge: {
        fontSize: 12,
        color: '#0284c7',
        backgroundColor: '#e0f2fe',
        padding: '2px 8px',
        borderRadius: 6,
    },
    stepperBox: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
    },
    stepperLabel: {
        fontSize: 12,
        fontWeight: 600,
        color: '#64748b',
    },
    stepperControlRow: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        border: '1px solid #cbd5e1',
        overflow: 'hidden',
    },
    stepperBtn: {
        width: 36,
        height: 36,
        border: 'none',
        backgroundColor: '#f1f5f9',
        color: '#334155',
        fontSize: 16,
        fontWeight: 800,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.15s ease',
    },
    stepperValue: {
        flex: 1,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 800,
        color: '#0f172a',
    },
    modalPrimaryActionBtn: {
        flex: 1,
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        color: '#ffffff',
        border: 'none',
        borderRadius: 10,
        fontSize: 13.5,
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
        transition: 'all 0.15s ease',
    },
    modalSecondaryZipBtn: {
        padding: '12px 16px',
        backgroundColor: '#10b981',
        color: '#ffffff',
        border: 'none',
        borderRadius: 10,
        fontSize: 13.5,
        fontWeight: 700,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
    },
    spinner: {
        width: 46,
        height: 46,
        borderWidth: 4,
        borderStyle: 'solid',
        borderColor: '#e2e8f0',
        borderTopColor: '#0284c7',
        borderRadius: '50%',
        animation: 'spinAnimation 0.85s linear infinite',
        marginBottom: 16,
    },
    loadingTitle: {
        margin: 0,
        fontSize: 18,
        fontWeight: 800,
        color: '#0f172a',
    },
    loadingSubtitle: {
        margin: '10px 0 20px 0',
        fontSize: 13.5,
        color: '#64748b',
        lineHeight: 1.5,
    },
    cancelPreviewPrepBtn: {
        padding: '8px 20px',
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#cbd5e1',
        backgroundColor: '#f8fafc',
        color: '#475569',
        fontSize: 13,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
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
    deletePieceAbsoluteBtn: {
        position: 'absolute',
        top: 4,
        right: 'calc(50% - 95px)',
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
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
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
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
    defaultBadge: {
        fontSize: 10.5,
        fontWeight: 700,
        backgroundColor: '#e0f2fe',
        color: '#0369a1',
        padding: '1px 6px',
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
    clearAllBtn: {
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: 700,
        backgroundColor: '#fee2e2',
        color: '#dc2626',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
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
    aspectRatio34: {
        height: 'calc(100vh - 310px)',
        width: 'calc((100vh - 310px) * 3 / 4)',
        maxWidth: 'calc(100% - 32px)',
        borderRadius: 16,
    },
    aspectRatio11: {
        height: 'calc(100vh - 310px)',
        width: 'calc(100vh - 310px)',
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
        flex: 1.2,
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
        transition: 'all 0.15s ease',
    },
    newVideoResetBtn: {
        flex: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '11px 16px',
        borderRadius: 10,
        border: '1px solid #cbd5e1',
        backgroundColor: '#ffffff',
        color: '#334155',
        fontSize: 13.5,
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        transition: 'all 0.15s ease',
    },
    appFooter: {
        height: 48,
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
        gap: 16,
    },
    footerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        whiteSpace: 'nowrap',
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
    footerCenterTech: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        overflowX: 'auto',
    },
    techIconsList: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    },
    techBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 8px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        color: '#334155',
        cursor: 'default',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
    },
    techIconImg: {
        width: 14,
        height: 14,
        objectFit: 'contain',
    },
    footerRight: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        whiteSpace: 'nowrap',
    },
};