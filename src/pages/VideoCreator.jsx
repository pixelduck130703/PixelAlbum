// src/pages/VideoCreator.jsx
import React, { useState, useRef, useEffect } from 'react';
import { AudioMixer } from '../services/audioMixer';
import { VideoRenderer } from '../services/videoRenderer';
import {
    generateThaiSpeechAudio,
    GEMINI_VOICES,
    DEFAULT_ELEVENLABS_PREMADES,
    VOICE_PROVIDERS,
} from '../services/aiVoiceService';

export default function VideoCreator() {
    const [mediaType, setMediaType] = useState('images');
    const [mediaFiles, setMediaFiles] = useState([]);
    const [aspectRatio, setAspectRatio] = useState('9:16');

    const [effectMode, setEffectMode] = useState('preset');
    const [selectedEffect, setSelectedEffect] = useState('kenburns');
    const [customScriptPrompt, setCustomScriptPrompt] = useState(
        'Mỗi set đồ hiển thị 3-4 giây, chuyển cảnh mượt theo nhịp điệu sôi động, nhấn mạnh chất vải và form áo.'
    );

    const [voiceSourceType, setVoiceSourceType] = useState('ai');
    const [voiceFile, setVoiceFile] = useState(null);
    const [voiceName, setVoiceName] = useState('');
    const [voiceVolume, setVoiceVolume] = useState(1.0);

    // QUẢN LÝ NHẬP KEY TRỰC TIẾP TỪ NGƯỜI DÙNG
    const [selectedProvider, setSelectedProvider] = useState('gemini');
    const [selectedVoiceId, setSelectedVoiceId] = useState(GEMINI_VOICES[0].id);

    const [geminiApiKey, setGeminiApiKey] = useState(
        localStorage.getItem('CUSTOM_GEMINI_KEY') || 'AQ.Ab8RN6JBV__jToQkVPcnyf3ux4U-niG1KvjnNQeW5uYoKdMMLg'
    );
    // Đổi 'gemini-2.0-flash' thành 'gemini-3.8-flash'
    const [geminiModel, setGeminiModel] = useState(
        localStorage.getItem('CUSTOM_GEMINI_MODEL') || 'gemini-3.8-flash'
    );
    const [elevenLabsApiKey, setElevenLabsApiKey] = useState(
        localStorage.getItem('CUSTOM_ELEVENLABS_KEY') || 'sk_1b9707067e6f7cce7ceee1c56d2018865aae6f3319c0d1c3'
    );
    const [keySavedStatus, setKeySavedStatus] = useState(false);

    const [thaiScript, setThaiScript] = useState('');
    const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);

    const [isPlayingVoicePreview, setIsPlayingVoicePreview] = useState(false);
    const previewAudioRef = useRef(null);

    const [bgmFile, setBgmFile] = useState(null);
    const [bgmName, setBgmName] = useState('');
    const [bgmVolume, setBgmVolume] = useState(0.4);

    const [isPreviewingVideo, setIsPreviewingVideo] = useState(false);
    const [previewDuration, setPreviewDuration] = useState(0);
    const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
    const [rendering, setRendering] = useState(false);
    const [progress, setProgress] = useState(0);
    const [outputVideoUrl, setOutputVideoUrl] = useState(null);
    const [draggedIndex, setDraggedIndex] = useState(null);

    const previewCanvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const activeRendererRef = useRef(null);
    const activeMixerRef = useRef(null);

    useEffect(() => {
        return () => {
            stopAllActivities();
        };
    }, []);

    const handleSaveGeminiConfig = () => {
        localStorage.setItem('CUSTOM_GEMINI_KEY', geminiApiKey.trim());
        localStorage.setItem('CUSTOM_GEMINI_MODEL', geminiModel.trim());
        setKeySavedStatus(true);
        setTimeout(() => setKeySavedStatus(false), 2000);
    };

    const handleSaveElevenKey = () => {
        localStorage.setItem('CUSTOM_ELEVENLABS_KEY', elevenLabsApiKey.trim());
        setKeySavedStatus(true);
        setTimeout(() => setKeySavedStatus(false), 2000);
    };

    const stopAllActivities = () => {
        if (activeRendererRef.current) activeRendererRef.current.stop();
        if (activeMixerRef.current) activeMixerRef.current.stop();
        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current = null;
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
            setSelectedVoiceId(GEMINI_VOICES[0].id);
        } else {
            setSelectedVoiceId(DEFAULT_ELEVENLABS_PREMADES[0].id);
        }
    };

    const handleMediaUpload = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        const urls = files.map((file) => URL.createObjectURL(file));
        setMediaFiles((prev) => [...prev, ...urls]);
    };

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
            alert('Vui lòng nhập văn bản tiếng Thái trước khi nghe thử!');
            return;
        }

        try {
            setIsPlayingVoicePreview(true);
            let audioUrl = voiceFile;

            if (voiceSourceType === 'ai') {
                audioUrl = await generateThaiSpeechAudio(thaiScript, selectedVoiceId, {
                    provider: selectedProvider,
                    geminiApiKey,
                    geminiModel,
                    elevenLabsApiKey,
                });
            }

            if (!audioUrl) throw new Error('Không nhận được tệp âm thanh.');

            if (previewAudioRef.current) previewAudioRef.current.pause();

            const audio = new Audio(audioUrl);
            previewAudioRef.current = audio;
            audio.volume = Math.min(voiceVolume, 1.0);
            audio.onended = () => setIsPlayingVoicePreview(false);
            audio.onerror = (e) => {
                console.error('Lỗi phát thẻ Audio:', e);
                setIsPlayingVoicePreview(false);
            };

            await audio.play();
        } catch (err) {
            console.error('Chi tiết lỗi:', err);
            setIsPlayingVoicePreview(false);
            alert('Lỗi: ' + (err.message || 'Không thể phát âm thanh.'));
        }
    };

    const handleVoiceUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVoiceFile(URL.createObjectURL(file));
            setVoiceName(file.name);
        }
    };

    const handleBgmUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBgmFile(URL.createObjectURL(file));
            setBgmName(file.name);
        }
    };

    const getVideoDimensions = () => {
        return aspectRatio === '4:3' ? { width: 960, height: 720 } : { width: 720, height: 1280 };
    };

    const prepareSession = async (isPreview = false) => {
        let finalVoiceSrc = voiceFile;
        if (voiceSourceType === 'ai') {
            if (!thaiScript || !thaiScript.trim()) {
                throw new Error('Vui lòng nhập văn bản tiếng Thái cho AI đọc!');
            }
            setIsGeneratingVoice(true);
            finalVoiceSrc = await generateThaiSpeechAudio(thaiScript, selectedVoiceId, {
                provider: selectedProvider,
                geminiApiKey,
                geminiModel,
                elevenLabsApiKey,
            });
            setIsGeneratingVoice(false);
        }

        if (!finalVoiceSrc && voiceSourceType === 'file') {
            throw new Error('Vui lòng chọn file MP3 giọng đọc từ máy!');
        }

        const mixer = new AudioMixer();
        activeMixerRef.current = mixer;
        const audioStream = mixer.setup(finalVoiceSrc, bgmFile, bgmVolume, voiceVolume, isPreview);

        let voiceDuration = await mixer.getVoiceDuration();
        if ((!voiceDuration || isNaN(voiceDuration) || voiceDuration === 0) && voiceSourceType === 'ai') {
            voiceDuration = Math.max(Math.round(thaiScript.trim().length / 12), 3);
        }

        const targetDuration = Math.max(voiceDuration, 2);
        setPreviewDuration(targetDuration);

        const { width, height } = getVideoDimensions();
        const renderer = new VideoRenderer(previewCanvasRef.current, { width, height });
        activeRendererRef.current = renderer;

        return { mixer, renderer, audioStream, targetDuration };
    };

    const handleTogglePreviewVideo = async () => {
        if (isPreviewingVideo) {
            stopAllActivities();
            return;
        }

        if (mediaFiles.length === 0) {
            alert('Vui lòng thêm ít nhất một ảnh hoặc video thô để xem trước!');
            return;
        }

        stopAllActivities();
        setOutputVideoUrl(null);
        setIsPreviewingVideo(true);

        try {
            const { mixer, renderer, targetDuration } = await prepareSession(true);
            await mixer.play();

            renderer.startPreview({
                mode: mediaType,
                files: mediaFiles,
                effectMode,
                selectedEffect,
                scriptPrompt: customScriptPrompt,
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
            alert('Vui lòng thêm ít nhất một ảnh hoặc video thô!');
            return;
        }

        stopAllActivities();
        setRendering(true);
        setProgress(0);
        setOutputVideoUrl(null);

        try {
            const { mixer, renderer, audioStream, targetDuration } = await prepareSession(false);
            await mixer.play();

            renderer.startRender({
                mode: mediaType,
                files: mediaFiles,
                effectMode,
                selectedEffect,
                scriptPrompt: customScriptPrompt,
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

    const currentVoiceOptions = selectedProvider === 'gemini' ? GEMINI_VOICES : DEFAULT_ELEVENLABS_PREMADES;

    return (
        <div style={styles.fullscreenApp}>
            <header style={styles.topNavbar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={styles.brandBadge}>PRO ADS STUDIO</span>
                    <h1 style={styles.appTitle}>Trình Dựng Video Bán Hàng Trực Tiếp</h1>
                </div>
                <div style={styles.appSubtitle}>
                    Thời trang Thái Lan • Nhập API Key trực tiếp • Full HD
                </div>
            </header>

            <div style={styles.workspaceBody}>
                <div style={styles.sidebarPanel}>
                    {/* Card 0: Khung hình */}
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <span style={styles.cardStep}>📐</span>
                            <h3 style={styles.cardTitle}>Tỉ lệ khung hình Video</h3>
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
                                📱 9:16 (TikTok / Reels / Shorts)
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
                                📺 4:3 (Ngang FB Ads, Shopee)
                            </button>
                        </div>
                    </div>

                    {/* Card 1: Tư liệu */}
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <span style={styles.cardStep}>01</span>
                            <h3 style={styles.cardTitle}>Tư liệu hình ảnh / Video thô</h3>
                        </div>

                        <div style={styles.tabGroup}>
                            <button
                                style={{
                                    ...styles.tabButton,
                                    backgroundColor: mediaType === 'images' ? '#ffffff' : 'transparent',
                                    color: mediaType === 'images' ? '#0284c7' : '#64748b',
                                    boxShadow: mediaType === 'images' ? '0 2px 6px rgba(2, 132, 199, 0.12)' : 'none',
                                }}
                                onClick={() => { setMediaType('images'); setMediaFiles([]); }}
                            >
                                📸 Trình chiếu ảnh
                            </button>
                            <button
                                style={{
                                    ...styles.tabButton,
                                    backgroundColor: mediaType === 'video' ? '#ffffff' : 'transparent',
                                    color: mediaType === 'video' ? '#0284c7' : '#64748b',
                                    boxShadow: mediaType === 'video' ? '0 2px 6px rgba(2, 132, 199, 0.12)' : 'none',
                                }}
                                onClick={() => { setMediaType('video'); setMediaFiles([]); }}
                            >
                                🎬 Video thô (Loop nếu ngắn)
                            </button>
                        </div>

                        <div style={styles.uploadBox} onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={mediaType === 'images' ? 'image/*' : 'video/*'}
                                multiple={mediaType === 'images'}
                                style={{ display: 'none' }}
                                onChange={handleMediaUpload}
                            />
                            <div style={{ fontSize: 30, marginBottom: 6 }}>➕</div>
                            <p style={{ margin: 0, fontWeight: 700, color: '#0284c7', fontSize: 14 }}>
                                Bấm vào đây để tải lên {mediaType === 'images' ? 'ảnh sản phẩm' : 'video gốc'}
                            </p>
                            <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, display: 'inline-block' }}>
                                Hỗ trợ chọn nhiều file cùng lúc
                            </span>
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
                                            <button onClick={() => removeMedia(idx)} style={styles.deleteBtn}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Card 2: Hiệu ứng chuyển cảnh */}
                    {mediaType === 'images' && (
                        <div style={styles.card}>
                            <div style={styles.cardHeader}>
                                <span style={styles.cardStep}>🎨</span>
                                <h3 style={styles.cardTitle}>Tùy chọn phong cách dựng Video</h3>
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
                                    ⚡ Hiệu ứng có sẵn
                                </button>
                                <button
                                    style={{
                                        ...styles.tabButton,
                                        backgroundColor: effectMode === 'script' ? '#ffffff' : 'transparent',
                                        color: effectMode === 'script' ? '#0284c7' : '#64748b',
                                        boxShadow: effectMode === 'script' ? '0 2px 6px rgba(2, 132, 199, 0.12)' : 'none',
                                    }}
                                    onClick={() => setEffectMode('script')}
                                >
                                    📝 Nhập kịch bản dựng
                                </button>
                            </div>

                            {effectMode === 'preset' ? (
                                <div>
                                    <label style={styles.label}>Chọn kiểu chuyển cảnh hình ảnh:</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                        {[
                                            { id: 'kenburns', label: '🔍 Ken Burns', desc: 'Zoom phóng to nhẹ' },
                                            { id: 'crossfade', label: '✨ Crossfade', desc: 'Mờ dần chuyển tiếp' },
                                            { id: 'pan', label: '↔️ Pan lia ảnh', desc: 'Trượt cinematic' },
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setSelectedEffect(item.id)}
                                                style={{
                                                    ...styles.effectCardBtn,
                                                    backgroundColor: selectedEffect === item.id ? '#f0f9ff' : '#f8fafc',
                                                    borderColor: selectedEffect === item.id ? '#0284c7' : '#e2e8f0',
                                                }}
                                            >
                                                <div style={{ fontWeight: 700, fontSize: 13.5, color: selectedEffect === item.id ? '#0284c7' : '#1e293b' }}>
                                                    {item.label}
                                                </div>
                                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{item.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label style={styles.label}>Kịch bản chỉ đạo dựng (Prompt cho Engine):</label>
                                    <textarea
                                        rows="3"
                                        style={styles.textarea}
                                        value={customScriptPrompt}
                                        onChange={(e) => setCustomScriptPrompt(e.target.value)}
                                        placeholder="Ví dụ: Mỗi trang phục hiển thị khoảng 3-4 giây, chuyển động nhanh theo tiết tấu nhạc..."
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Card 3: Giọng đọc AI & Ô nhập API Key trực tiếp */}
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <span style={styles.cardStep}>02</span>
                            <h3 style={styles.cardTitle}>Giọng đọc quảng cáo (Voice AI)</h3>
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
                                <label style={styles.label}>Tải tệp MP3 / WAV từ máy tính của bạn:</label>
                                <label style={styles.fileInputButton}>
                                    <span>{voiceName || 'Chọn tệp voice từ máy...'}</span>
                                    <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleVoiceUpload} />
                                </label>
                            </div>
                        ) : (
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={styles.label}>Chọn nhà cung cấp Voice AI:</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {VOICE_PROVIDERS.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => handleProviderChange(p.id)}
                                                style={{
                                                    ...styles.providerBtn,
                                                    backgroundColor: selectedProvider === p.id ? '#0284c7' : '#f8fafc',
                                                    borderColor: selectedProvider === p.id ? '#0284c7' : '#cbd5e1',
                                                    color: selectedProvider === p.id ? '#ffffff' : '#475569',
                                                }}
                                            >
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* KHU VỰC NHẬP KEY TRỰC TIẾP */}
                                {selectedProvider === 'gemini' ? (
                                    <div style={styles.keyConfigBox}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                                🔑 Google Gemini API Key:
                                            </span>
                                            {keySavedStatus && (
                                                <span style={styles.savedBadge}>✓ Đã lưu vào trình duyệt</span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                            <input
                                                type="text"
                                                placeholder="Nhập Gemini API Key (AQ.Ab8... hoặc AIzaSy...)"
                                                value={geminiApiKey}
                                                onChange={(e) => setGeminiApiKey(e.target.value)}
                                                style={styles.keyInput}
                                            />
                                            <button type="button" onClick={handleSaveGeminiConfig} style={styles.saveBtn}>
                                                Lưu
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 11.5, color: '#64748b' }}>Model:</span>
                                            <input
                                                type="text"
                                                placeholder="gemini-2.0-flash"
                                                value={geminiModel}
                                                onChange={(e) => setGeminiModel(e.target.value)}
                                                style={{ ...styles.keyInput, maxWidth: 160, padding: '4px 8px', fontSize: 11.5 }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div style={styles.keyConfigBox}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                                🔑 ElevenLabs API Key:
                                            </span>
                                            {keySavedStatus && (
                                                <span style={styles.savedBadge}>✓ Đã lưu vào trình duyệt</span>
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
                                            <button type="button" onClick={handleSaveElevenKey} style={styles.saveBtn}>
                                                Lưu
                                            </button>
                                        </div>
                                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 6 }}>
                                            💡 Khuyên dùng các giọng Premade (Rachel, Bella) để tài khoản Free không bị lỗi quota/thư viện.
                                        </div>
                                    </div>
                                )}

                                <div style={{ marginBottom: 10, marginTop: 12 }}>
                                    <label style={styles.label}>
                                        Chọn chất giọng ({selectedProvider === 'gemini' ? 'Google Gemini AI' : 'ElevenLabs'}):
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

                                <label style={styles.label}>Nhập kịch bản tiếng Thái để AI đọc truyền cảm:</label>
                                <textarea
                                    rows="3"
                                    style={styles.textarea}
                                    value={thaiScript}
                                    onChange={(e) => setThaiScript(e.target.value)}
                                    placeholder="Nhập nội dung quảng cáo tiếng Thái vào đây..."
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                            <button
                                type="button"
                                onClick={togglePreviewVoice}
                                style={{
                                    ...styles.previewVoiceBtn,
                                    backgroundColor: isPlayingVoicePreview ? '#ef4444' : '#0284c7',
                                }}
                            >
                                {isPlayingVoicePreview ? '⏹️ Dừng nghe voice' : '🔊 Nghe thử giọng đọc'}
                            </button>
                            <span style={{ fontSize: 13, color: '#64748b' }}>Kiểm tra âm lượng & ngữ điệu</span>
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
                            <h3 style={styles.cardTitle}>Nhạc nền (Mặc định 40%)</h3>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <label style={styles.fileInputButton}>
                                <span>{bgmName || 'Chọn file nhạc nền từ máy (.mp3)...'}</span>
                                <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={handleBgmUpload} />
                            </label>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={styles.label}>Âm lượng BGM:</span>
                                <span style={{ color: '#0284c7', fontWeight: 700, fontSize: 14 }}>
                                    {Math.round(bgmVolume * 100)}%
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="0.8"
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
                                <video src={outputVideoUrl} controls autoPlay style={styles.mockupScreen} />
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
                                        Chưa có tư liệu.<br />Thêm ảnh hoặc video ở cột điều khiển bên trái.
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
                                    max={previewDuration > 0 ? previewDuration : 10}
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
                                {isGeneratingVoice ? 'Đang nạp giọng đọc tiếng Thái...' : `Đang render video... ${progress}%`}
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
                                }}
                            >
                                {isPreviewingVideo ? '⏸️ Tạm dừng preview' : '▶️ Xem trước video (Có âm thanh)'}
                            </button>
                        )}

                        {!rendering ? (
                            <button onClick={handleStartRender} style={styles.actionButton}>
                                ⚡ Bắt Đầu Xuất Video ({aspectRatio})
                            </button>
                        ) : (
                            <button onClick={handleCancelRender} style={styles.cancelButton}>
                                🛑 HỦY XUẤT VIDEO
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
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
    appSubtitle: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: 500,
    },
    workspaceBody: {
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '540px 1fr',
        overflow: 'hidden',
        height: 'calc(100vh - 60px)',
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
        flex: 1,
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
        borderColor: '#94a3b8',
        borderRadius: 10,
        padding: '22px 16px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: '#f8fafc',
        transition: 'all 0.2s ease',
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
    effectCardBtn: {
        padding: '12px 10px',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 10,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
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
    fileInputButton: {
        display: 'block',
        padding: '11px 14px',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '#cbd5e1',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13.5,
        color: '#334155',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontWeight: 500,
    },
    previewVoiceBtn: {
        padding: '8px 16px',
        borderRadius: 8,
        border: 'none',
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        padding: '20px 28px',
        position: 'relative',
        height: '100%',
        boxSizing: 'border-box',
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
        height: 'calc(100vh - 250px)',
        width: 'calc((100vh - 250px) * 9 / 16)',
        maxWidth: 'calc(100% - 32px)',
        borderRadius: 26,
    },
    aspectRatio43: {
        height: 'calc(100vh - 250px)',
        width: 'calc((100vh - 250px) * 4 / 3)',
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
        marginTop: 12,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: '10px 16px',
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
        marginBottom: 6,
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
        height: 8,
        accentColor: '#0284c7',
        borderRadius: 4,
        outline: 'none',
    },
    progressContainer: {
        width: '100%',
        maxWidth: 500,
        marginTop: 10,
        textAlign: 'center',
    },
    progressBar: {
        width: '100%',
        height: 8,
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
        marginTop: 6,
        fontSize: 13,
        fontWeight: 600,
        color: '#0284c7',
    },
    stageActionBar: {
        marginTop: 14,
        width: '100%',
        maxWidth: 580,
        display: 'flex',
        gap: 12,
        justifyContent: 'center',
    },
    previewActionBtn: {
        flex: 1,
        padding: '13px 18px',
        borderRadius: 10,
        borderWidth: 1,
        borderStyle: 'solid',
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    },
    actionButton: {
        flex: 1.2,
        padding: '13px 18px',
        borderRadius: 10,
        border: 'none',
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
    },
    cancelButton: {
        flex: 1,
        padding: '13px 18px',
        borderRadius: 10,
        border: 'none',
        backgroundColor: '#ef4444',
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 700,
        cursor: 'pointer',
    },
    downloadButton: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '13px 20px',
        borderRadius: 10,
        backgroundColor: '#10b981',
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 700,
        textDecoration: 'none',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
    },
};