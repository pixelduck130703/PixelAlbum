import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

const GRADUATION_DATE = new Date("2026-09-05T08:00:00+07:00");

const GRADUATE_NAME = "NGUYỄN TUẤN HÙNG";
const GRADUATE_IMAGE = "/images/graduation-avatar.jpg";
const PHONE_NUMBER = "0353 463 942";
const PHONE_DISPLAY = "0353 463 942";
const MAP_URL = "https://maps.app.goo.gl/DZYdV7Dw1UVcMa3F8";
const MUSIC_URL = "/music/graduation.mp3";
const MUSIC_TITLE = "Graduation Music";


const INVITATION_ANIMATIONS = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(36px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-28px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes zoomIn {
    from {
      opacity: 0;
      transform: scale(0.86);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes softFloat {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes glowPulse {
    0%, 100% {
      opacity: 0.2;
      transform: scale(1);
    }
    50% {
      opacity: 0.48;
      transform: scale(1.08);
    }
  }

  @keyframes twinkle {
    0%, 100% {
      opacity: 0.18;
      transform: scale(0.9) rotate(0deg);
    }
    50% {
      opacity: 0.75;
      transform: scale(1.15) rotate(8deg);
    }
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-180%) skewX(-20deg);
    }
    100% {
      transform: translateX(280%) skewX(-20deg);
    }
  }

  @keyframes swayLeft {
    0%, 100% {
      transform: rotate(0.8deg);
    }
    50% {
      transform: rotate(-0.5deg);
    }
  }

  @keyframes swayRight {
    0%, 100% {
      transform: rotate(-0.8deg);
    }
    50% {
      transform: rotate(0.5deg);
    }
  }

  @keyframes numberPulse {
    0%, 100% {
      transform: scale(1);
      text-shadow: 0 0 0 rgba(251, 191, 36, 0);
    }
    50% {
      transform: scale(1.06);
      text-shadow: 0 0 18px rgba(251, 191, 36, 0.45);
    }
  }

  @keyframes modalPop {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(18px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .inv-fade-up {
    animation: fadeInUp 0.9s cubic-bezier(.22,1,.36,1) both;
  }

  .inv-fade-down {
    animation: fadeInDown 0.9s cubic-bezier(.22,1,.36,1) both;
  }

  .inv-zoom-in {
    animation: zoomIn 1s cubic-bezier(.22,1,.36,1) both;
  }

  .inv-float {
    animation: softFloat 4s ease-in-out infinite;
  }

  .inv-glow {
    animation: glowPulse 3.5s ease-in-out infinite;
  }

  .inv-twinkle {
    animation: twinkle 2.8s ease-in-out infinite;
  }

  .inv-number {
    animation: numberPulse 2.2s ease-in-out infinite;
  }

  .inv-sash-left {
    transform-origin: top center;
    animation: swayLeft 5s ease-in-out infinite;
  }

  .inv-sash-right {
    transform-origin: top center;
    animation: swayRight 5s ease-in-out infinite;
  }

  .inv-shimmer {
    position: relative;
    overflow: hidden;
  }

  .inv-shimmer::after {
    content: "";
    position: absolute;
    inset: 0;
    width: 34%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,0.35),
      transparent
    );
    animation: shimmer 3.6s ease-in-out infinite;
    pointer-events: none;
  }

  .inv-modal {
    animation: modalPop 0.3s cubic-bezier(.22,1,.36,1) both;
  }

  .inv-delay-1 { animation-delay: 0.12s; }
  .inv-delay-2 { animation-delay: 0.24s; }
  .inv-delay-3 { animation-delay: 0.36s; }
  .inv-delay-4 { animation-delay: 0.48s; }
  .inv-delay-5 { animation-delay: 0.60s; }


  @keyframes roadMove {
    from {
      background-position: 0 0;
    }
    to {
      background-position: 72px 0;
    }
  }

  @keyframes vehicleFloat {
    0%, 100% {
      transform: translateX(0) translateY(0);
    }
    50% {
      transform: translateX(12px) translateY(-4px);
    }
  }

  @keyframes routePulse {
    0%, 100% {
      opacity: 0.25;
      filter: drop-shadow(0 0 0 rgba(37, 99, 235, 0));
    }
    50% {
      opacity: 0.9;
      filter: drop-shadow(0 0 10px rgba(37, 99, 235, 0.35));
    }
  }

  .utc-light-page {
    background:
      radial-gradient(circle at top, rgba(59,130,246,0.12), transparent 38%),
      linear-gradient(180deg, #ffffff 0%, #f8fbff 38%, #eef5ff 100%);
  }

  .utc-road-pattern {
    background-image:
      linear-gradient(90deg, transparent 0 44%, rgba(37,99,235,0.08) 44% 56%, transparent 56%),
      repeating-linear-gradient(90deg, transparent 0 22px, rgba(245,158,11,0.18) 22px 42px, transparent 42px 72px);
    background-size: 100% 100%, 72px 3px;
    background-repeat: no-repeat, repeat-x;
    background-position: center, bottom 28px left;
    animation: roadMove 12s linear infinite;
  }

  .utc-card-light {
    position: relative;
    overflow: hidden;
    background: rgba(255,255,255,0.9);
    box-shadow:
      0 18px 45px rgba(30,64,175,0.10),
      inset 0 1px 0 rgba(255,255,255,0.9);
  }

  .utc-card-light::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent, rgba(59,130,246,0.06), transparent);
    transform: translateX(-140%);
    animation: shimmer 5s ease-in-out infinite;
    pointer-events: none;
  }

  .utc-route-node {
    animation: routePulse 3s ease-in-out infinite;
  }

  .utc-vehicle {
    animation: vehicleFloat 5s ease-in-out infinite;
  }


  @keyframes languageFadeIn {
    from {
      opacity: 0;
      transform: translateY(12px);
      filter: blur(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
      filter: blur(0);
    }
  }

  @keyframes languageFadeOut {
    from {
      opacity: 1;
      transform: translateY(0);
      filter: blur(0);
    }
    to {
      opacity: 0;
      transform: translateY(-12px);
      filter: blur(6px);
    }
  }

  .inv-language-enter {
    animation: languageFadeIn 0.45s cubic-bezier(.22,1,.36,1) both;
  }

  .inv-language-leave {
    animation: languageFadeOut 0.25s ease both;
    pointer-events: none;
  }


  @keyframes musicPulse {
    0%, 100% {
      transform: scale(1);
      box-shadow:
        0 14px 35px rgba(37,99,235,0.18),
        0 0 0 0 rgba(37,99,235,0.18);
    }
    50% {
      transform: scale(1.06);
      box-shadow:
        0 18px 42px rgba(37,99,235,0.24),
        0 0 0 10px rgba(37,99,235,0);
    }
  }

  @keyframes musicBarOne {
    0%, 100% {
      height: 8px;
    }
    50% {
      height: 22px;
    }
  }

  @keyframes musicBarTwo {
    0%, 100% {
      height: 18px;
    }
    50% {
      height: 7px;
    }
  }

  @keyframes musicBarThree {
    0%, 100% {
      height: 12px;
    }
    50% {
      height: 26px;
    }
  }

  @keyframes musicLabelIn {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .music-button-playing {
    animation: musicPulse 2.2s ease-in-out infinite;
  }

  .music-bar-one {
    animation: musicBarOne 0.8s ease-in-out infinite;
  }

  .music-bar-two {
    animation: musicBarTwo 0.95s ease-in-out infinite;
  }

  .music-bar-three {
    animation: musicBarThree 0.7s ease-in-out infinite;
  }

  .music-label-enter {
    animation: musicLabelIn 0.3s cubic-bezier(.22,1,.36,1) both;
  }


  @keyframes watermarkFloat {
    0%, 100% {
      transform: translateY(0) rotate(var(--wm-rotate, 0deg));
    }
    50% {
      transform: translateY(-12px) rotate(var(--wm-rotate, 0deg));
    }
  }

  @keyframes watermarkPulse {
    0%, 100% {
      opacity: 0.08;
      filter: blur(0);
    }
    50% {
      opacity: 0.14;
      filter: blur(0.2px);
    }
  }

  @keyframes watermarkSlide {
    from {
      transform: translateX(-4%);
    }
    to {
      transform: translateX(4%);
    }
  }

  .it-watermark-float {
    animation:
      watermarkFloat 7s ease-in-out infinite,
      watermarkPulse 5s ease-in-out infinite;
  }

  .it-watermark-slide {
    animation: watermarkSlide 10s ease-in-out infinite alternate;
  }

  .it-watermark-chip {
    position: relative;
  }

  .it-watermark-chip::before,
  .it-watermark-chip::after {
    content: "";
    position: absolute;
    inset: -10px;
    border: 2px dashed currentColor;
    border-radius: 18px;
    opacity: 0.35;
  }

  @media (prefers-reduced-motion: reduce) {
    .inv-fade-up,
    .inv-fade-down,
    .inv-zoom-in,
    .inv-float,
    .inv-glow,
    .inv-twinkle,
    .inv-number,
    .inv-sash-left,
    .inv-sash-right,
    .inv-shimmer::after,
    .inv-modal,
    .inv-language-enter,
    .inv-language-leave,
    .music-button-playing,
    .music-bar-one,
    .music-bar-two,
    .music-bar-three,
    .music-label-enter,
    .it-watermark-float,
    .it-watermark-slide {
      animation: none !important;
    }
  }
`;

const TRANSLATIONS = {
    vi: {
        locale: "vi-VN",
        back: "Quay lại trang chủ",
        university: "Trường Đại học Giao thông Vận tải",
        universityEnglish: "University of Transport and Communications",
        invitation: "THIỆP MỜI",
        graduationCeremony: "LỄ TỐT NGHIỆP",
        invitationText:
            "Trân trọng kính mời bạn đến tham dự lễ tốt nghiệp của",
        degree: "Cử nhân Công nghệ Thông tin",
        course: "Khóa học 2022 – 2026",
        ceremonyStarted: "Lễ tốt nghiệp đã bắt đầu!",
        day: "Ngày",
        hour: "Giờ",
        minute: "Phút",
        second: "Giây",
        eventDateLabel: "Ngày tổ chức",
        eventDate: "Thứ Bảy, 05/09/2026",
        eventTimeLabel: "Thời gian",
        eventTime: "08:00 sáng",
        locationLabel: "Địa điểm",
        locationLine1: "Hội trường lớn",
        locationLine2: "Trường Đại học Giao thông Vận tải",
        seeYou: "Hẹn gặp bạn tại buổi lễ!",
        viewMap: "Xem địa điểm",
        contact: "Liên hệ",
        contactTitle: "Liên hệ",
        phoneLabel: "Số điện thoại",
        close: "Đóng",
        callNow: "Gọi ngay",
        footer: "UTC · K63 · Lễ tốt nghiệp",
        musicOn: "Đang phát nhạc",
        musicOff: "Bật nhạc nền",
        musicPlayError: "Trình duyệt không thể phát nhạc.",
    },

    en: {
        locale: "en-US",
        back: "Back to home",
        university: "University of Transport and Communications",
        universityEnglish: "Hanoi, Vietnam",
        invitation: "INVITATION",
        graduationCeremony: "GRADUATION CEREMONY",
        invitationText:
            "You are cordially invited to attend the university graduation ceremony of",
        degree: "Information of Technology",
        course: "Academic years 2022 – 2026",
        ceremonyStarted: "The graduation ceremony has begun!",
        day: "Days",
        hour: "Hours",
        minute: "Minutes",
        second: "Seconds",
        eventDateLabel: "Date",
        eventDate: "Saturday, September 5, 2026",
        eventTimeLabel: "Time",
        eventTime: "8:00 AM",
        locationLabel: "Venue",
        locationLine1: "Grand Hall",
        locationLine2: "University of Transport and Communications",
        seeYou: "Looking forward to seeing you at the ceremony!",
        viewMap: "View location",
        contact: "Contact",
        contactTitle: "Contact",
        phoneLabel: "Phone number",
        close: "Close",
        callNow: "Call now",
        footer: "UTC · Class of 2026 · Graduation Ceremony",
        musicOn: "Music playing",
        musicOff: "Play background music",
        musicPlayError: "The browser could not play the music.",
    },

    zh: {
        locale: "zh-CN",
        back: "返回首页",
        university: "交通运输大学",
        universityEnglish: "University of Transport and Communications",
        invitation: "邀请函",
        graduationCeremony: "毕业典礼",
        invitationText: "诚挚邀请您参加大学毕业典礼，共同见证",
        degree: "信息技术学士",
        course: "2022—2026学年",
        ceremonyStarted: "毕业典礼已经开始！",
        day: "天",
        hour: "小时",
        minute: "分钟",
        second: "秒",
        eventDateLabel: "日期",
        eventDate: "2026年9月5日，星期六",
        eventTimeLabel: "时间",
        eventTime: "上午8:00",
        locationLabel: "地点",
        locationLine1: "大学礼堂",
        locationLine2: "交通运输大学",
        seeYou: "期待在毕业典礼上与您相见！",
        viewMap: "查看地点",
        contact: "联系",
        contactTitle: "联系方式",
        phoneLabel: "电话号码",
        close: "关闭",
        callNow: "立即拨打",
        footer: "UTC · 2026届 · 毕业典礼",
        musicOn: "正在播放音乐",
        musicOff: "播放背景音乐",
        musicPlayError: "浏览器无法播放音乐。",
    },
};

function Invitation() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showPhone, setShowPhone] = useState(false);
    const audioRef = useRef(null);
    const [musicPlaying, setMusicPlaying] = useState(false);
    const [musicLoading, setMusicLoading] = useState(false);
    const [musicError, setMusicError] = useState("");
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem("invitationLanguage") || "vi";
    });
    const [contentVisible, setContentVisible] = useState(true);
    const [languageChanging, setLanguageChanging] = useState(false);

    const t = TRANSLATIONS[language] || TRANSLATIONS.vi;

    const [showMusicGuide, setShowMusicGuide] = useState(() => {
        return !sessionStorage.getItem("music-guide");
    });

    const closeMusicGuide = () => {
        sessionStorage.setItem("music-guide", "1");
        setShowMusicGuide(false);
    };

    useEffect(() => {
        const timer = window.setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        let started = false;

        const startMusic = async () => {
            if (started) return;

            const audio = audioRef.current;
            if (!audio) return;

            started = true;

            try {
                await audio.play();
                setMusicPlaying(true);
            } catch {
                started = false;
            }
        };

        window.addEventListener("pointerdown", startMusic, { once: true });
        window.addEventListener("keydown", startMusic, { once: true });

        return () => {
            window.removeEventListener("pointerdown", startMusic);
            window.removeEventListener("keydown", startMusic);
        };
    }, []);

    useEffect(() => {
        let started = false;

        const startMusic = async () => {
            if (started) return;
            started = true;

            const audio = audioRef.current;

            if (!audio) return;

            try {
                setMusicError("");
                await audio.play();
                setMusicPlaying(true);
            } catch (error) {
                console.error(error);
                setMusicPlaying(false);
            }

            removeEvents();
        };

        const removeEvents = () => {
            window.removeEventListener("pointerdown", startMusic);
            window.removeEventListener("touchstart", startMusic);
            window.removeEventListener("keydown", startMusic);
            window.removeEventListener("scroll", startMusic);
        };

        window.addEventListener("pointerdown", startMusic, {
            once: true,
        });

        window.addEventListener("touchstart", startMusic, {
            once: true,
        });

        window.addEventListener("keydown", startMusic, {
            once: true,
        });

        window.addEventListener("scroll", startMusic, {
            once: true,
            passive: true,
        });

        return removeEvents;
    }, []);

    useEffect(() => {
        localStorage.setItem("invitationLanguage", language);
        document.documentElement.lang = language === "zh" ? "zh-CN" : language;
    }, [language]);

    useEffect(() => {
        if (!showPhone) {
            return;
        }

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setShowPhone(false);
            }
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [showPhone]);

    useEffect(() => {
        const audio = audioRef.current;

        return () => {
            if (audio) {
                audio.pause();
            }
        };
    }, []);

    const toggleMusic = async () => {
        const audio = audioRef.current;

        if (!audio || musicLoading) return;

        setMusicError("");

        if (musicPlaying) {
            audio.pause();
            setMusicPlaying(false);
            return;
        }

        try {
            setMusicLoading(true);
            await audio.play();
            setMusicPlaying(true);
        } catch (error) {
            console.error(error);
            setMusicPlaying(false);
            setMusicError(t.musicPlayError);
        } finally {
            setMusicLoading(false);
        }
    };

    const handleMusicEnded = () => {
        setMusicPlaying(false);
    };

    const handleMusicError = () => {
        setMusicPlaying(false);
        setMusicLoading(false);
        setMusicError(t.musicPlayError);
    };

    const handleLanguageChange = (newLanguage) => {
        if (
            newLanguage === language ||
            languageChanging
        ) {
            return;
        }

        setLanguageChanging(true);
        setContentVisible(false);

        window.setTimeout(() => {
            setLanguage(newLanguage);

            window.requestAnimationFrame(() => {
                setContentVisible(true);

                window.setTimeout(() => {
                    setLanguageChanging(false);
                }, 450);
            });
        }, 250);
    };

    const countdown = useMemo(() => {
        const difference =
            GRADUATION_DATE.getTime() - currentTime.getTime();

        if (difference <= 0) {
            return {
                completed: true,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
            };
        }

        const totalSeconds = Math.floor(difference / 1000);

        return {
            completed: false,
            days: Math.floor(totalSeconds / 86400),
            hours: Math.floor((totalSeconds % 86400) / 3600),
            minutes: Math.floor((totalSeconds % 3600) / 60),
            seconds: totalSeconds % 60,
        };
    }, [currentTime]);

    return (
        <div className="utc-light-page utc-road-pattern relative min-h-screen overflow-x-hidden text-slate-900">
            <style>{INVITATION_ANIMATIONS}</style>
            {/* Hai dải sash cố định hai bên màn hình */}
            <div className="inv-sash-left pointer-events-none fixed inset-y-0 left-0 z-20 hidden w-[128px] xl:block 2xl:w-[148px]">
                <GraduationSash side="left" />
            </div>

            <div className="inv-sash-right pointer-events-none fixed inset-y-0 right-0 z-20 hidden w-[128px] xl:block 2xl:w-[148px]">
                <GraduationSash side="right" />
            </div>

            {/* Nền trang trí */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.10),transparent_32%)]" />
            <div className="pointer-events-none absolute -left-40 top-36 h-[500px] w-[500px] rounded-full bg-blue-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-40 bottom-20 h-[500px] w-[500px] rounded-full bg-amber-300/20 blur-3xl" />

            <div className="pointer-events-none absolute inset-0 opacity-20">
                <div className="inv-twinkle absolute left-[8%] top-[12%] text-4xl text-amber-600">
                    ◆
                </div>

                <div className="inv-twinkle inv-delay-2 absolute right-[12%] top-[8%] text-3xl text-amber-600">
                    ◆
                </div>

                <div className="inv-twinkle inv-delay-3 absolute left-[15%] top-[35%] text-2xl text-amber-600">
                    ✦
                </div>

                <div className="inv-twinkle inv-delay-4 absolute right-[18%] top-[32%] text-3xl text-amber-600">
                    ✦
                </div>
            </div>

            {/* Watermark Công nghệ thông tin */}
            <InformationTechnologyWatermark />

            {/* Họa tiết giao thông */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="utc-vehicle absolute left-[4%] top-[20%] hidden text-5xl opacity-20 lg:block">
                    🚆
                </div>

                <div className="utc-vehicle inv-delay-2 absolute right-[5%] top-[34%] hidden text-5xl opacity-20 lg:block">
                    🚌
                </div>

                <div className="absolute left-[8%] top-[58%] hidden h-32 w-32 lg:block">
                    <div className="absolute left-0 top-1/2 h-1 w-full rounded-full bg-blue-200" />
                    <div className="utc-route-node absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-4 border-white bg-blue-600 shadow" />
                    <div className="utc-route-node inv-delay-2 absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-amber-400 shadow" />
                    <div className="utc-route-node inv-delay-4 absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-4 border-white bg-blue-600 shadow" />
                </div>

                <div className="absolute right-[9%] top-[16%] hidden h-40 w-40 rounded-full border border-blue-200/70 lg:block">
                    <div className="absolute left-1/2 top-0 h-full w-px bg-blue-200/70" />
                    <div className="absolute left-0 top-1/2 h-px w-full bg-blue-200/70" />
                    <div className="utc-route-node absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 shadow" />
                </div>
            </div>

            {/* Quay lại */}
            <Link
                to="/"
                className="fixed left-3 top-3 z-50 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-3 py-2 text-sm font-semibold text-blue-700 shadow-lg backdrop-blur-md transition hover:bg-blue-50 sm:left-6 sm:top-6 sm:px-4"
            >
                <span aria-hidden="true">←</span>
                <span className="hidden sm:inline">{t.back}</span>
            </Link>

            {/* Chuyển ngôn ngữ */}
            <LanguageSwitcher
                language={language}
                onChange={handleLanguageChange}
                disabled={languageChanging}
            />

            <audio
                ref={audioRef}
                src={MUSIC_URL}
                loop
                preload="metadata"
                onEnded={handleMusicEnded}
                onError={handleMusicError}
            />

            <MusicController
                playing={musicPlaying}
                loading={musicLoading}
                error={musicError}
                title={MUSIC_TITLE}
                playingLabel={t.musicOn}
                pausedLabel={t.musicOff}
                onToggle={toggleMusic}
            />

            <main
                key={language}
                className={`relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center px-4 pb-14 pt-24 sm:px-6 sm:pb-20 sm:pt-20 xl:px-8 ${contentVisible
                    ? "inv-language-enter"
                    : "inv-language-leave"
                    }`}
                aria-busy={languageChanging}
                style={{
                    fontFamily:
                        language === "zh"
                            ? "'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', sans-serif"
                            : "Inter, Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
            >
                <div className="absolute left-4 top-16 hidden rotate-[-12deg] text-8xl opacity-90 lg:block">
                    🎓
                </div>

                {/* Logo UTC */}
                <section className="inv-fade-down text-center">
                    <div className="inv-float mx-auto flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
                        <div className="h-full w-full overflow-hidden rounded-full shadow-[0_15px_35px_rgba(37,99,235,0.18)]">
                            <img
                                src="/images/UTC.png"
                                alt="UTC"
                                className="h-full w-full rounded-full object-cover"
                            />
                        </div>
                    </div>

                    <p className="mt-5 text-sm font-bold uppercase tracking-[0.12em] text-amber-600 sm:text-lg sm:tracking-[0.2em]">
                        {t.university}
                    </p>

                    {t.universityEnglish && (
                        <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-slate-500 sm:text-sm sm:tracking-[0.25em]">
                            {t.universityEnglish}
                        </p>
                    )}
                </section>

                {/* Tiêu đề */}
                <section className="inv-fade-up inv-delay-1 mt-9 text-center">
                    <p
                        className="text-5xl font-black leading-[1.15] text-amber-600 drop-shadow-lg sm:text-7xl lg:text-8xl"
                        style={{
                            fontFamily:
                                language === "zh"
                                    ? "'Noto Serif SC', 'Songti SC', serif"
                                    : "'Playfair Display', serif",
                        }}
                    >
                        {t.invitation}
                    </p>

                    <h1
                        className="mt-3 text-3xl font-bold uppercase leading-[1.2] tracking-[0.04em] text-slate-800 sm:text-5xl lg:text-6xl"
                        style={{
                            fontFamily:
                                language === "zh"
                                    ? "'Noto Serif SC', 'Songti SC', serif"
                                    : "'Playfair Display', serif",
                        }}
                    >
                        {t.graduationCeremony}
                    </h1>

                    <div className="mx-auto mt-6 flex max-w-xl items-center gap-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400" />
                        <span className="text-2xl text-amber-600">🎓</span>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400" />
                    </div>

                    <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-lg sm:leading-8">
                        {t.invitationText}
                    </p>
                </section>

                {/* Ảnh đại diện */}
                <section className="inv-zoom-in inv-delay-2 mt-10 text-center">
                    <div className="relative mx-auto w-fit">

                        {/* Hiệu ứng phát sáng */}
                        <div className="inv-glow absolute -inset-8 rounded-full bg-blue-400/20 blur-3xl" />

                        {/* Vòng ngoài */}
                        <div className="relative h-60 w-60 rounded-full bg-gradient-to-br from-blue-700 via-blue-500 to-amber-400 p-[5px] shadow-[0_20px_60px_rgba(37,99,235,0.25)] sm:h-80 sm:w-80">

                            {/* Vòng trắng */}
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-white">

                                {/* Ảnh */}
                                <div className="relative h-[94%] w-[94%] overflow-hidden rounded-full">
                                    <img
                                        src={GRADUATE_IMAGE}
                                        alt={GRADUATE_NAME}
                                        className="h-full w-full object-cover transition duration-700 hover:scale-110"
                                        onError={(event) => {
                                            event.currentTarget.onerror = null;
                                            event.currentTarget.src =
                                                "https://placehold.co/700x700?text=Graduation";
                                        }}
                                    />

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent" />
                                </div>
                            </div>
                        </div>

                        {/* Icon tốt nghiệp */}
                        <div className="absolute bottom-3 right-3 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-amber-400 to-yellow-500 text-3xl shadow-xl">
                            🎓
                        </div>

                        {/* Chấm trang trí */}
                        <div className="absolute left-3 top-6 h-3 w-3 rounded-full bg-blue-500 shadow-lg" />
                        <div className="absolute right-6 top-10 h-2.5 w-2.5 rounded-full bg-amber-400 shadow-lg" />
                        <div className="absolute bottom-8 left-6 h-2.5 w-2.5 rounded-full bg-blue-300 shadow-lg" />
                    </div>

                    <h2
                        className="mt-8 whitespace-nowrap px-2 text-[30px] font-bold text-blue-800 drop-shadow-sm sm:text-6xl lg:text-7xl"
                        style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            lineHeight: 1.25,
                        }}
                    >
                        {GRADUATE_NAME}
                    </h2>

                    <p className="mt-2 text-lg font-semibold tracking-[0.35em] text-amber-500 uppercase">
                        Information Technology
                    </p>

                    <div className="mx-auto mt-5 flex max-w-sm items-center gap-3">
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-blue-500 to-amber-400" />

                        <span className="text-xl text-amber-500">✦</span>

                        <span className="text-xl text-blue-600">◆</span>

                        <span className="text-xl text-amber-500">✦</span>

                        <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-blue-500 to-amber-400" />
                    </div>
                </section>

                {/* Học vị */}
                <section className="utc-card-light inv-fade-up inv-delay-3 mt-9 w-full max-w-3xl rounded-3xl border border-blue-200 p-5 sm:p-7">
                    <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-3xl text-blue-700">
                            💻
                        </div>

                        <div>
                            <h3 className="mt-1 whitespace-nowrap text-center text-[clamp(14px,4vw,30px)] font-black uppercase text-amber-600"
                            >
                                {t.degree}
                            </h3>

                            <p className="mt-2 text-sm font-medium uppercase tracking-[0.08em] text-slate-600 sm:text-base sm:tracking-[0.12em]">
                                {t.course}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Đếm ngược */}
                <section className="inv-fade-up inv-delay-4 mt-10 w-full max-w-4xl text-center">
                    <h3 className="text-base font-bold uppercase tracking-[0.1em] text-slate-600 sm:text-xl">
                        {t.countdownTitle}
                    </h3>

                    {countdown.completed ? (
                        <div className="mt-5 rounded-3xl border border-amber-400 bg-blue-600/10 px-6 py-8 backdrop-blur">
                            <p className="text-5xl">🎓🎉</p>

                            <p className="mt-4 text-2xl font-black text-amber-600">
                                {t.ceremonyStarted}
                            </p>
                        </div>
                    ) : (
                        <div className="utc-card-light mt-5 grid grid-cols-4 overflow-hidden rounded-3xl border border-blue-200">
                            <CountdownItem
                                value={countdown.days}
                                label={t.day}
                            />

                            <CountdownItem
                                value={countdown.hours}
                                label={t.hour}
                                withBorder
                            />

                            <CountdownItem
                                value={countdown.minutes}
                                label={t.minute}
                                withBorder
                            />

                            <CountdownItem
                                value={countdown.seconds}
                                label={t.second}
                                withBorder
                            />
                        </div>
                    )}
                </section>

                {/* Thông tin lễ */}
                <section className="inv-fade-up inv-delay-5 mt-10 grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
                    <InvitationInfo
                        icon="📅"
                        label={t.eventDateLabel}
                        value={t.eventDate}
                    />

                    <InvitationInfo
                        icon="🕗"
                        label={t.eventTimeLabel}
                        value={t.eventTime}
                    />

                    <InvitationInfo
                        icon="📍"
                        label={t.locationLabel}
                        value={
                            <>
                                {t.locationLine1}
                                <br />
                                {t.locationLine2}
                            </>
                        }
                    />
                </section>

                {/* Chữ ký */}
                <section className="inv-fade-up mt-10 text-center">
                    <p
                        className="text-3xl italic text-amber-600 sm:text-5xl"
                        style={{
                            fontFamily:
                                language === "zh"
                                    ? "'Noto Serif SC', serif"
                                    : "'Cormorant Garamond', serif",
                        }}
                    >
                        {t.seeYou}
                    </p>

                    <div className="mx-auto mt-5 h-px w-56 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                </section>

                {/* Nút chức năng */}
                <div className="inv-fade-up mt-10 grid w-full max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
                    <a
                        href={MAP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inv-shimmer flex min-h-[56px] items-center justify-center gap-3 rounded-2xl border border-amber-400 bg-gradient-to-r from-amber-300 to-yellow-400 px-6 py-4 font-bold text-blue-950 shadow-xl transition hover:-translate-y-1 hover:scale-[1.02]"
                    >
                        <span className="text-xl">📍</span>
                        <span>{t.viewMap}</span>
                    </a>

                    <button
                        type="button"
                        onClick={() => setShowPhone(true)}
                        className="inv-shimmer flex min-h-[56px] items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 font-bold text-white shadow-xl transition hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl"
                    >
                        <span className="text-xl">📞</span>
                        <span>{t.contact}</span>
                    </button>
                </div>

                <footer className="mt-12 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400 sm:tracking-[0.2em]">
                        {t.footer}
                    </p>
                </footer>
            </main>

            {/* Popup liên hệ */}
            {showPhone && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
                    onClick={() => setShowPhone(false)}
                    role="presentation"
                >
                    <div
                        className="inv-modal w-full max-w-sm rounded-3xl border border-blue-200 bg-white p-6 text-slate-900 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="contact-dialog-title"
                    >
                        <div className="text-center">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-5xl">
                                📞
                            </div>

                            <h2
                                id="contact-dialog-title"
                                className="mt-5 text-2xl font-bold text-slate-800"
                            >
                                {t.contactTitle}
                            </h2>

                            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">
                                    {t.phoneLabel}
                                </p>

                                <p className="mt-2 text-3xl font-black tracking-wider text-green-600">
                                    {PHONE_DISPLAY}
                                </p>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPhone(false)}
                                    className="rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 transition hover:bg-slate-200"
                                >
                                    {t.close}
                                </button>

                                <a
                                    href={`tel:${PHONE_NUMBER}`}
                                    className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-3 text-center font-semibold text-slate-900 transition hover:from-green-600 hover:to-emerald-700"
                                >
                                    {t.callNow}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showMusicGuide && (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
                >
                    <div className="inv-modal w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">

                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-5xl">
                            🎵
                        </div>

                        <h2 className="mt-5 text-2xl font-bold text-slate-800">
                            Chào mừng bạn
                        </h2>

                        <p className="mt-4 leading-7 text-slate-600">
                            Để có trải nghiệm tốt nhất khi xem thiệp mời,
                            hãy mở bằng máy tính, thay đổi ngôn ngữ và nhấn vào biểu tượng
                            <span className="mx-1 text-xl">🔊</span>
                            ở góc dưới bên phải để phát nhạc nền.
                        </p>

                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={closeMusicGuide}
                                className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 font-bold text-white transition hover:scale-105"
                            >
                                Đã hiểu
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}





function InformationTechnologyWatermark() {
    const desktopTechnologies = [
        {
            name: "AI",
            short: "AI",
            className:
                "left-[3%] top-[14%] border-blue-500 bg-blue-100/95 text-blue-800",
            rotate: "-7deg",
        },
        {
            name: "SQL",
            short: "SQL",
            className:
                "right-[3%] top-[17%] border-amber-500 bg-amber-100/95 text-amber-800",
            rotate: "7deg",
        },
        {
            name: "React",
            short: "⚛",
            className:
                "left-[7%] top-[31%] border-cyan-500 bg-cyan-100/95 text-cyan-800",
            rotate: "-5deg",
        },
        {
            name: "Node.js",
            short: "JS",
            className:
                "right-[7%] top-[34%] border-emerald-500 bg-emerald-100/95 text-emerald-800",
            rotate: "5deg",
        },
        {
            name: "Git",
            short: "Git",
            className:
                "left-[3%] top-[50%] border-orange-500 bg-orange-100/95 text-orange-800",
            rotate: "-6deg",
        },
        {
            name: "JavaScript",
            short: "JS",
            className:
                "right-[3%] top-[53%] border-yellow-500 bg-yellow-100/95 text-yellow-800",
            rotate: "6deg",
        },
        {
            name: "TypeScript",
            short: "TS",
            className:
                "left-[9%] top-[70%] border-blue-500 bg-blue-100/95 text-blue-800",
            rotate: "-4deg",
        },
        {
            name: "PostgreSQL",
            short: "PG",
            className:
                "right-[9%] top-[72%] border-indigo-500 bg-indigo-100/95 text-indigo-800",
            rotate: "4deg",
        },
        {
            name: "Docker",
            short: "DK",
            className:
                "left-[28%] top-[82%] border-sky-500 bg-sky-100/95 text-sky-800",
            rotate: "-3deg",
        },
        {
            name: "API",
            short: "API",
            className:
                "right-[28%] top-[83%] border-violet-500 bg-violet-100/95 text-violet-800",
            rotate: "3deg",
        },
    ];

    const mobileTechnologies = [
        {
            name: "AI",
            short: "AI",
            className:
                "left-2 top-[16%] border-blue-500 bg-blue-100 text-blue-800",
        },
        {
            name: "SQL",
            short: "SQL",
            className:
                "right-2 top-[22%] border-amber-500 bg-amber-100 text-amber-800",
        },
        {
            name: "React",
            short: "⚛",
            className:
                "left-3 top-[35%] border-cyan-500 bg-cyan-100 text-cyan-800",
        },
        {
            name: "Node",
            short: "JS",
            className:
                "right-3 top-[42%] border-emerald-500 bg-emerald-100 text-emerald-800",
        },
        {
            name: "Git",
            short: "Git",
            className:
                "left-2 top-[56%] border-orange-500 bg-orange-100 text-orange-800",
        },
        {
            name: "TypeScript",
            short: "TS",
            className:
                "right-2 top-[63%] border-blue-500 bg-blue-100 text-blue-800",
        },
        {
            name: "PostgreSQL",
            short: "PG",
            className:
                "left-3 top-[76%] border-indigo-500 bg-indigo-100 text-indigo-800",
        },
        {
            name: "Docker",
            short: "DK",
            className:
                "right-3 top-[82%] border-sky-500 bg-sky-100 text-sky-800",
        },
    ];

    const utcMarks = [
        {
            className:
                "left-[22%] top-[22%] h-24 w-24 sm:h-32 sm:w-32",
            rotate: "-8deg",
            opacity: 0.28,
        },
        {
            className:
                "right-[22%] top-[25%] h-20 w-20 sm:h-28 sm:w-28",
            rotate: "8deg",
            opacity: 0.24,
        },
        {
            className:
                "left-[18%] top-[55%] h-20 w-20 sm:h-28 sm:w-28",
            rotate: "-5deg",
            opacity: 0.24,
        },
        {
            className:
                "right-[18%] top-[58%] h-24 w-24 sm:h-32 sm:w-32",
            rotate: "6deg",
            opacity: 0.28,
        },
        {
            className:
                "left-1/2 top-[74%] h-28 w-28 -translate-x-1/2 sm:h-40 sm:w-40",
            rotate: "0deg",
            opacity: 0.24,
        },
    ];

    return (
        <div
            className="pointer-events-none absolute inset-0 z-[1] overflow-hidden select-none"
            aria-hidden="true"
        >
            {/* Lưới công nghệ */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.075)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.075)_1px,transparent_1px)] bg-[size:34px_34px]" />

            {/* Các dải chữ công nghệ */}
            <div className="it-watermark-slide absolute left-[-5%] top-[8%] w-[110%] overflow-hidden whitespace-nowrap font-mono text-[11px] font-black tracking-[0.28em] text-blue-800 opacity-[0.24] sm:text-sm">
                AI • SQL • REACT • NODE.JS • GIT • JAVASCRIPT • TYPESCRIPT • POSTGRESQL • DOCKER
            </div>

            <div className="it-watermark-slide absolute left-[-5%] top-[47%] w-[110%] overflow-hidden whitespace-nowrap font-mono text-[10px] font-black tracking-[0.26em] text-amber-700 opacity-[0.22] sm:text-xs">
                API • DATABASE • CLOUD • SERVER • CLIENT • NETWORK • SECURITY • FULLSTACK • UTC
            </div>

            <div className="it-watermark-slide absolute bottom-[5%] left-[-5%] w-[110%] overflow-hidden whitespace-nowrap font-mono text-[10px] font-black tracking-[0.25em] text-blue-800 opacity-[0.20] sm:text-xs">
                01000001 01001001 00100000 01010011 01010001 01001100 00100000 01010010 01000101 01000001 01000011 01010100
            </div>

            {/* Logo UTC rải rác */}
            {utcMarks.map((item, index) => (
                <div
                    key={`utc-mark-${index}`}
                    className={`it-watermark-float absolute ${item.className}`}
                    style={{
                        "--wm-rotate": item.rotate,
                        animationDelay: `${index * 0.55}s`,
                        opacity: item.opacity,
                    }}
                >
                    <div className="h-full w-full rounded-full bg-white/80 p-1 shadow-[0_12px_30px_rgba(37,99,235,0.15)] backdrop-blur-sm">
                        <img
                            src="/images/UTC.png"
                            alt=""
                            className="h-full w-full rounded-full object-contain"
                        />
                    </div>
                </div>
            ))}

            {/* Desktop và tablet */}
            <div className="hidden md:block">
                {desktopTechnologies.map((item, index) => (
                    <div
                        key={item.name}
                        className={`it-watermark-float absolute flex min-w-[116px] flex-col items-center rounded-3xl border-2 px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] ${item.className}`}
                        style={{
                            "--wm-rotate": item.rotate,
                            animationDelay: `${index * 0.35}s`,
                            opacity: 0.62,
                        }}
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-current/30 bg-white/90 font-mono text-2xl font-black shadow-sm">
                            {item.short}
                        </div>

                        <p className="mt-2 whitespace-nowrap font-mono text-sm font-black uppercase tracking-[0.1em]">
                            {item.name}
                        </p>
                    </div>
                ))}

                <div
                    className="it-watermark-float absolute left-[36%] top-[39%] rounded-3xl border-2 border-blue-500 bg-blue-100/95 px-5 py-4 font-mono text-4xl font-black text-blue-800 shadow-lg"
                    style={{
                        "--wm-rotate": "-4deg",
                        opacity: 0.5,
                    }}
                >
                    &lt;/&gt;
                </div>

                <div
                    className="it-watermark-float absolute right-[35%] top-[42%] rounded-3xl border-2 border-amber-500 bg-amber-100/95 px-5 py-4 font-mono text-3xl font-black text-amber-800 shadow-lg"
                    style={{
                        "--wm-rotate": "4deg",
                        opacity: 0.5,
                        animationDelay: "0.7s",
                    }}
                >
                    {"{ }"}
                </div>

                <div
                    className="it-watermark-chip it-watermark-float absolute left-1/2 top-[61%] flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-3xl border-2 border-indigo-500 bg-indigo-100/95 font-mono text-xl font-black text-indigo-800 shadow-lg"
                    style={{
                        "--wm-rotate": "0deg",
                        opacity: 0.48,
                    }}
                >
                    CPU
                </div>
            </div>

            {/* Mobile */}
            <div className="md:hidden">
                {mobileTechnologies.map((item, index) => (
                    <div
                        key={item.name}
                        className={`it-watermark-float absolute flex min-w-[86px] flex-col items-center rounded-2xl border-2 px-3 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.14)] ${item.className}`}
                        style={{
                            "--wm-rotate": index % 2 === 0 ? "-5deg" : "5deg",
                            animationDelay: `${index * 0.32}s`,
                            opacity: 0.56,
                        }}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-current/30 bg-white/95 font-mono text-xl font-black">
                            {item.short}
                        </div>

                        <p className="mt-1 whitespace-nowrap font-mono text-[10px] font-black uppercase tracking-[0.07em]">
                            {item.name}
                        </p>
                    </div>
                ))}

                <div
                    className="it-watermark-float absolute left-1/2 top-[31%] -translate-x-1/2 rounded-2xl border-2 border-blue-500 bg-blue-100/95 px-4 py-3 font-mono text-3xl font-black text-blue-800 shadow-md"
                    style={{
                        "--wm-rotate": "0deg",
                        opacity: 0.48,
                    }}
                >
                    &lt;/&gt;
                </div>

                <div
                    className="it-watermark-float absolute left-1/2 top-[69%] -translate-x-1/2 rounded-2xl border-2 border-amber-500 bg-amber-100/95 px-4 py-3 font-mono text-lg font-black text-amber-800 shadow-md"
                    style={{
                        "--wm-rotate": "0deg",
                        opacity: 0.48,
                    }}
                >
                    API • DB • CLOUD
                </div>
            </div>
        </div>
    );
}

function MusicController({
    playing,
    loading,
    error,
    title,
    playingLabel,
    pausedLabel,
    onToggle,
}) {
    return (
        <div className="fixed bottom-4 right-4 z-[90] flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
            {playing && (
                <div className="music-label-enter max-w-[220px] rounded-2xl border border-blue-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 items-end gap-1">
                            <span className="music-bar-one w-1.5 rounded-full bg-blue-600" />
                            <span className="music-bar-two w-1.5 rounded-full bg-amber-400" />
                            <span className="music-bar-three w-1.5 rounded-full bg-blue-500" />
                        </div>

                        <div className="min-w-0 text-left">
                            <p className="truncate text-xs font-black uppercase tracking-wide text-blue-700">
                                {playingLabel}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-slate-500">
                                {title}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="max-w-[240px] rounded-xl border border-red-200 bg-white/95 px-3 py-2 text-xs font-semibold text-red-600 shadow-lg backdrop-blur">
                    {error}
                </div>
            )}

            <button
                type="button"
                onClick={onToggle}
                disabled={loading}
                className={`group flex h-14 w-14 items-center justify-center rounded-full border border-blue-200 bg-white/95 text-blue-700 shadow-[0_14px_35px_rgba(37,99,235,0.18)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-70 sm:h-16 sm:w-16 ${playing ? "music-button-playing" : ""
                    }`}
                aria-label={playing ? playingLabel : pausedLabel}
                title={playing ? playingLabel : pausedLabel}
            >
                {loading ? (
                    <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-blue-200 border-t-blue-600" />
                ) : (
                    <span className="text-2xl sm:text-3xl">
                        {playing ? "🔊" : "🔇"}
                    </span>
                )}

                <span className="pointer-events-none absolute right-[calc(100%+10px)] hidden whitespace-nowrap rounded-xl bg-blue-700 px-3 py-2 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100 sm:block">
                    {playing ? playingLabel : pausedLabel}
                </span>
            </button>
        </div>
    );
}

function LanguageSwitcher({ language, onChange, disabled = false }) {
    const languages = [
        {
            code: "vi",
            shortLabel: "VI",
            flag: "🇻🇳",
            ariaLabel: "Tiếng Việt",
        },
        {
            code: "en",
            shortLabel: "EN",
            flag: "🇬🇧",
            ariaLabel: "English",
        },
        {
            code: "zh",
            shortLabel: "中文",
            flag: "🇨🇳",
            ariaLabel: "中文",
        },
    ];

    return (
        <div className="fixed right-3 top-3 z-50 flex overflow-hidden rounded-full border border-blue-200 bg-white/90 p-1 shadow-lg backdrop-blur-md sm:right-6 sm:top-6">
            {languages.map((item) => {
                const active = language === item.code;

                return (
                    <button
                        key={item.code}
                        type="button"
                        onClick={() => onChange(item.code)}
                        disabled={disabled}
                        className={`flex min-h-[38px] items-center gap-1 rounded-full px-2.5 text-xs font-bold transition duration-300 disabled:cursor-wait disabled:opacity-70 sm:px-3 sm:text-sm ${active
                            ? "bg-blue-600 text-white shadow"
                            : "text-slate-600 hover:bg-blue-50"
                            }`}
                        aria-label={item.ariaLabel}
                        aria-pressed={active}
                    >
                        <span aria-hidden="true">{item.flag}</span>
                        <span>{item.shortLabel}</span>
                    </button>
                );
            })}
        </div>
    );
}

function CountdownItem({
    value,
    label,
    withBorder = false,
}) {
    return (
        <div
            className={`px-1 py-5 text-center sm:px-4 sm:py-7 ${withBorder ? "border-l border-blue-100" : ""
                }`}
        >
            <p className="inv-number font-serif text-3xl font-black tabular-nums text-amber-600 sm:text-5xl">
                {String(value).padStart(2, "0")}
            </p>

            <p className="mt-2 break-words text-[9px] font-bold uppercase tracking-wide text-slate-600 sm:text-sm">
                {label}
            </p>
        </div>
    );
}

function InvitationInfo({
    icon,
    label,
    value,
}) {
    return (
        <div className="utc-card-light flex min-h-[160px] flex-col items-center justify-center rounded-3xl border border-blue-200 p-5 text-center transition hover:-translate-y-1 hover:border-amber-300">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-3xl">
                {icon}
            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
            </p>

            <p className="mt-2 font-bold leading-6 text-amber-600">
                {value}
            </p>
        </div>
    );
}

function GraduationSash({ side }) {
    const isLeft = side === "left";

    return (
        <div className="relative flex h-full items-center justify-center py-6">
            <div
                className={`relative h-[88vh] min-h-[650px] w-[104px] overflow-hidden bg-gradient-to-b from-white via-blue-50 to-blue-100 shadow-[0_20px_60px_rgba(30,64,175,0.18)] 2xl:w-[118px] ${isLeft ? "rotate-[0.8deg]" : "-rotate-[0.8deg]"
                    }`}
                style={{
                    clipPath:
                        "polygon(0 0, 100% 0, 100% 92%, 50% 100%, 0 92%)",
                    fontFamily:
                        "Inter, Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
            >
                <div
                    className="absolute inset-[5px] border-2 border-blue-600/90"
                    style={{
                        clipPath:
                            "polygon(0 0, 100% 0, 100% 92%, 50% 100%, 0 92%)",
                    }}
                />

                <div
                    className="absolute inset-[9px] border border-amber-400/60"
                    style={{
                        clipPath:
                            "polygon(0 0, 100% 0, 100% 92%, 50% 100%, 0 92%)",
                    }}
                />

                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.07),transparent),repeating-linear-gradient(0deg,transparent_0px,transparent_30px,rgba(37,99,235,0.05)_31px)]" />
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/10 to-transparent" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-blue-600/10" />

                <div className="relative z-10 flex h-full flex-col items-center px-2 py-5 text-center">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center 2xl:h-16 2xl:w-16">
                        <img
                            src="/images/UTC.png"
                            alt="UTC"
                            className="h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(251,191,36,0.35)]"
                        />
                    </div>

                    {isLeft ? (
                        <>
                            <div className="mt-6 flex min-h-0 flex-1 items-center justify-center">
                                <p
                                    className="[writing-mode:vertical-rl] rotate-180 text-[12px] font-black uppercase tracking-[0.18em] text-blue-900 2xl:text-[13px]"
                                    style={{
                                        textRendering: "geometricPrecision",
                                    }}
                                >
                                    University of Transport and Communications
                                </p>
                            </div>

                            <div className="mb-12 shrink-0">
                                <div className="mx-auto mb-3 h-px w-11 bg-amber-300" />

                                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-600 2xl:text-xs">
                                    Class of
                                </p>

                                <p className="mt-1 text-3xl font-black leading-none text-blue-900 2xl:text-4xl">
                                    2026
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mt-7 shrink-0">
                                <p className="mt-2 text-[11px] font-black uppercase leading-[1.45] tracking-wide text-amber-600 2xl:text-[13px]">
                                    Information of
                                    <br />
                                    Technology
                                </p>
                            </div>

                            <div className="mt-5 h-px w-12 shrink-0 bg-amber-300" />

                            <div className="mt-5 shrink-0 text-center">
                                <p className="mt-1 text-4xl font-black leading-none text-blue-900 2xl:text-5xl">
                                    K63 UTC
                                </p>
                            </div>

                            <div className="mt-5 flex min-h-0 flex-1 items-center justify-center">
                                <p
                                    className="[writing-mode:vertical-rl] rotate-180 text-[17px] font-black uppercase tracking-[0.32em] text-amber-600 2xl:text-xl"
                                    style={{
                                        textRendering: "geometricPrecision",
                                    }}
                                >
                                    Graduation
                                </p>
                            </div>

                            <div className="mb-12 shrink-0">
                                <p
                                    className="-rotate-6 text-base font-bold italic leading-5 text-amber-600 2xl:text-lg"
                                    style={{
                                        fontFamily:
                                            "Georgia, 'Times New Roman', serif",
                                    }}
                                >
                                    The way to
                                    <br />
                                    success
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Invitation;