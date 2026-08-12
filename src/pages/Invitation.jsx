import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

const GRADUATION_DATE = new Date("2026-09-05T08:00:00+07:00");

const GRADUATE_NAME = "NGUYỄN TUẤN HÙNG";
const GRADUATE_IMAGE = "/images/graduation-avatar.jpg";
const PHONE_NUMBER = "0353 463 942";
const PHONE_DISPLAY = "0353 463 942";
const MAP_URL = "https://maps.app.goo.gl/DZYdV7Dw1UVcMa3F8";
const MUSIC_URL = "/music/graduation.mp3";
const MUSIC_TITLE = "A LITTLE DREAM OF ME";


const INVITATION_ANIMATIONS = `
  /* ==========================
     HIỆU ỨNG ĐUNG ĐƯA SASH
  ========================== */

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

  .inv-sash-left {
    transform-origin: top center;
    animation: swayLeft 5s ease-in-out infinite;
  }

  .inv-sash-right {
    transform-origin: top center;
    animation: swayRight 5s ease-in-out infinite;
  }

  /* ==========================
     HIỆU ỨNG CHUYỂN NGÔN NGỮ SANG TRỌNG (LUXURY TEXT TRANSITION)
  ========================== */

  @keyframes luxuryTextIn {
    0% {
      opacity: 0;
      transform: scale(0.96) translateY(4px);
      filter: blur(8px);
    }
    60% {
      filter: blur(0px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
      filter: blur(0px);
    }
  }

  @keyframes luxuryTextOut {
    0% {
      opacity: 1;
      transform: scale(1) translateY(0);
      filter: blur(0px);
    }
    100% {
      opacity: 0;
      transform: scale(1.03) translateY(-4px);
      filter: blur(8px);
    }
  }

  .inv-text-enter {
    animation: luxuryTextIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    will-change: transform, opacity, filter;
  }

  .inv-text-leave {
    animation: luxuryTextOut 0.22s ease-in forwards;
    will-change: transform, opacity, filter;
    pointer-events: none;
  }

  /* ==========================
     KIỂU TĨNH
  ========================== */

  .utc-light-page {
    background:
      radial-gradient(
        circle at top,
        rgba(59,130,246,0.12),
        transparent 38%
      ),
      linear-gradient(
        180deg,
        #ffffff 0%,
        #f8fbff 38%,
        #eef5ff 100%
      );
  }

  .utc-card-light {
    position: relative;
    overflow: hidden;
    background: rgba(255,255,255,0.9);
    box-shadow:
      0 18px 45px rgba(30,64,175,0.10),
      inset 0 1px 0 rgba(255,255,255,0.9);
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
    .inv-sash-left,
    .inv-sash-right,
    .inv-text-enter,
    .inv-text-leave {
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
        countdownTitle: "Đếm ngược đến lễ tốt nghiệp",
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
        campusMap: "Sơ đồ trường",
        parkingGuide: "Hướng dẫn gửi xe",
        parkingInstruction: "Xe máy đi vào cổng 2 và cổng 3 để gửi xe. Cổng 1 chỉ dành cho ô tô của giảng viên.",
        phoneLabel: "Số điện thoại",
        close: "Đóng",
        callNow: "Gọi ngay",
        footer: "UTC · K63 · Lễ tốt nghiệp",
        musicOn: "Đang phát nhạc",
        musicOff: "Bật nhạc nền",
        musicPlayError: "Trình duyệt không thể phát nhạc.",
        guideTitle: "Chào mừng bạn",
        guideText: "Để có trải nghiệm tốt nhất khi xem thiệp mời, hãy mở bằng máy tính, thay đổi ngôn ngữ và nhấn vào biểu tượng 🔊 ở góc dưới bên phải để phát nhạc nền.",
        guideButton: "Đã hiểu",
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
        degree: "Information Technology",
        course: "Academic years 2022 – 2026",
        ceremonyStarted: "The graduation ceremony has begun!",
        countdownTitle: "Countdown to graduation",
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
        campusMap: "Campus map",
        parkingGuide: "Parking Instructions",
        parkingInstruction: "Motorcycles should enter through Gate 2 or Gate 3 for parking. Gate 1 is reserved for faculty cars only.",
        phoneLabel: "Phone number",
        close: "Close",
        callNow: "Call now",
        footer: "UTC · Class of 2026 · Graduation Ceremony",
        musicOn: "Music playing",
        musicOff: "Play background music",
        musicPlayError: "The browser could not play the music.",
        guideTitle: "Welcome",
        guideText: "For the best experience, please view on desktop, switch languages, and click the 🔊 icon at the bottom right to play background music.",
        guideButton: "Got it",
    },

    de: {
        locale: "de-DE",
        back: "Zurück zur Startseite",
        university: "Universität für Verkehr und Kommunikation",
        universityEnglish: "University of Transport and Communications",
        invitation: "EINLADUNG",
        graduationCeremony: "DIE ABSCHLUSSFEIER",
        invitationText:
            "Wir laden Sie herzlich zur akademischen Abschlussfeier ein von",
        degree: "Informationstechnologie",
        course: "Studienjahrgang 2022 – 2026",
        ceremonyStarted: "Die Abschlussfeier hat begonnen!",
        countdownTitle: "Countdown zur Abschlussfeier",
        day: "Tage",
        hour: "Stunden",
        minute: "Minuten",
        second: "Sekunden",
        eventDateLabel: "Datum",
        eventDate: "Samstag, 05. September 2026",
        eventTimeLabel: "Uhrzeit",
        eventTime: "08:00 Uhr",
        locationLabel: "Ort",
        locationLine1: "Großer Hörsaal",
        locationLine2: "Universität für Verkehr und Kommunikation",
        seeYou: "Wir freuen uns darauf, Sie bei der Feier zu begrüßen!",
        viewMap: "Standort anzeigen",
        contact: "Kontakt",
        contactTitle: "Kontakt aufnehmen",
        campusMap: "Campusplan",
        parkingGuide: "Parkhinweise",
        parkingInstruction: "Motorräder und Roller nutzen bitte Tor 2 oder Tor 3 zum Parken. Tor 1 ist ausschließlich für Dozentenfahrzeuge reserviert.",
        phoneLabel: "Telefonnummer",
        close: "Schließen",
        callNow: "Jetzt anrufen",
        footer: "UTC · Jahrgang 2026 · Abschlussfeier",
        musicOn: "Musik läuft",
        musicOff: "Hintergrundmusik abspielen",
        musicPlayError: "Der Browser konnte die Musik nicht abspielen.",
        guideTitle: "Willkommen",
        guideText: "Für das beste Erlebnis öffnen Sie die Einladung bitte auf dem PC, wechseln Sie die Sprache und klicken Sie unten rechts auf das 🔊 Symbol, um die Hintergrundmusik einzuschalten.",
        guideButton: "Verstanden",
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
        countdownTitle: "毕业典礼倒计时",
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
        campusMap: "校园地图",
        parkingGuide: "停车指南",
        parkingInstruction: "摩托车请从2号门或3号门进入停车。1号门仅供教师车辆使用。",
        phoneLabel: "电话号码",
        close: "关闭",
        callNow: "立即拨打",
        footer: "UTC · 2026届 · 毕业典礼",
        musicOn: "正在播放音乐",
        musicOff: "播放背景音乐",
        musicPlayError: "浏览器无法播放音乐。",
        guideTitle: "欢迎",
        guideText: "为了获得最佳体验，请使用电脑打开，切换语言，并点击右下角的 🔊 图标播放背景音乐。",
        guideButton: "明白了",
    },
};

function Invitation() {
    const [showCampusMap, setShowCampusMap] = useState(false);
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
        let langAttr = language;
        if (language === "zh") langAttr = "zh-CN";
        if (language === "de") langAttr = "de-DE";
        document.documentElement.lang = langAttr;
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
                }, 400);
            });
        }, 220);
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

    // Chuỗi Class áp dụng hiệu ứng chuyển đổi chữ mượt mà
    const textAnimClass = contentVisible ? "inv-text-enter" : "inv-text-leave";

    return (
        <div className="utc-light-page relative min-h-screen overflow-x-hidden text-slate-900">
            <style>{INVITATION_ANIMATIONS}</style>
            
            {/* Hai dải sash cố định hai bên màn hình (CỐ ĐỊNH TĨNH) */}
            <div className="inv-sash-left pointer-events-none fixed inset-y-0 left-0 z-20 hidden w-[128px] xl:block 2xl:w-[148px]">
                <GraduationSash side="left" />
            </div>

            <div className="inv-sash-right pointer-events-none fixed inset-y-0 right-0 z-20 hidden w-[128px] xl:block 2xl:w-[148px]">
                <GraduationSash side="right" />
            </div>

            {/* SASH MINI MOBILE / TABLET (CỐ ĐỊNH TĨNH) */}
            <div className="inv-sash-left pointer-events-none fixed left-0 top-[118px] z-[2] xl:hidden">
                <div className="relative h-[350px] w-[38px] sm:w-[42px]">
                    <div
                        className="absolute inset-x-0 top-0 h-[326px] overflow-hidden bg-gradient-to-b from-blue-950 via-blue-700 to-blue-800 shadow-[0_14px_32px_rgba(30,64,175,0.22)]"
                        style={{
                            clipPath:
                                "polygon(6% 0,94% 0,100% 90%,50% 100%,0 90%)",
                        }}
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.13),transparent_24%,rgba(255,255,255,0.04)_52%,transparent_76%,rgba(0,0,0,0.09))]" />
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,transparent_0px,transparent_18px,rgba(255,255,255,0.035)_19px)]" />

                        <div
                            className="absolute inset-[3px] border border-amber-300/80"
                            style={{
                                clipPath:
                                    "polygon(6% 0,94% 0,100% 90%,50% 100%,0 90%)",
                            }}
                        />

                        <div
                            className="absolute inset-[6px] border border-white/20"
                            style={{
                                clipPath:
                                    "polygon(6% 0,94% 0,100% 90%,50% 100%,0 90%)",
                            }}
                        />

                        <div className="absolute inset-x-0 top-5 flex justify-center">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
                                <img
                                    src="/images/UTC.png"
                                    alt=""
                                    className="h-6 w-6 rounded-full object-contain"
                                />
                            </div>
                        </div>

                        <div className="absolute inset-x-0 top-[62px] text-center">
                            <p className="text-[8px] font-black tracking-[0.12em] text-amber-300">
                                K63
                            </p>
                        </div>

                        <p className="absolute left-1/2 top-[92px] -translate-x-1/2 [writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-[7px] font-black uppercase tracking-[0.16em] text-white">
                            Đại học Giao thông Vận tải
                        </p>

                        <div className="absolute inset-x-0 bottom-[58px] text-center">
                            <div className="mx-auto mb-2 h-px w-4 bg-amber-300/80" />
                            <p className="text-[6px] font-black uppercase tracking-[0.12em] text-amber-300">
                                Class
                            </p>
                            <p className="mt-1 text-[11px] font-black leading-none text-white">
                                2026
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="inv-sash-right pointer-events-none fixed right-0 top-[148px] z-[2] xl:hidden">
                <div className="relative h-[330px] w-[36px] sm:w-[40px]">
                    <div
                        className="absolute inset-x-0 top-0 h-[306px] overflow-hidden bg-gradient-to-b from-white via-blue-50 to-blue-100 shadow-[0_14px_30px_rgba(30,64,175,0.18)]"
                        style={{
                            clipPath:
                                "polygon(6% 0,94% 0,100% 90%,50% 100%,0 90%)",
                        }}
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.95),transparent_34%,rgba(37,99,235,0.03)_66%,rgba(37,99,235,0.08))]" />
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,transparent_0px,transparent_18px,rgba(37,99,235,0.035)_19px)]" />

                        <div
                            className="absolute inset-[3px] border border-blue-700/80"
                            style={{
                                clipPath:
                                    "polygon(6% 0,94% 0,100% 90%,50% 100%,0 90%)",
                            }}
                        />

                        <div
                            className="absolute inset-[6px] border border-amber-300/55"
                            style={{
                                clipPath:
                                    "polygon(6% 0,94% 0,100% 90%,50% 100%,0 90%)",
                            }}
                        />

                        <div className="absolute inset-x-0 top-5 flex justify-center">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
                                <img
                                    src="/images/FIT-UTC.png"
                                    alt=""
                                    className="h-7 w-7 rounded-full object-contain"
                                />
                            </div>
                        </div>

                        <p className="absolute left-1/2 top-[58px] -translate-x-1/2 [writing-mode:vertical-rl] whitespace-nowrap text-[12px] font-black uppercase tracking-[0.13em] text-blue-900">
                            Graduation UTC
                        </p>

                        <div className="absolute inset-x-0 bottom-[58px] text-center">
                            <p className="text-[6px] font-black uppercase tracking-[0.08em] text-amber-600">
                                THE
                            </p>
                            <p className="text-[6px] font-black uppercase tracking-[0.08em] text-amber-600">
                                WAY
                            </p>
                            <p className="text-[6px] font-black uppercase tracking-[0.08em] text-amber-600">
                                TO
                            </p>
                            <p className="text-[6px] font-black uppercase tracking-[0.08em] text-amber-600">
                                SUCCESS
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nền trang trí (CỐ ĐỊNH TĨNH) */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.15),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_34%)]" />

                <div className="absolute -left-28 top-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl sm:h-[500px] sm:w-[500px]" />
                <div className="absolute -right-24 top-[38%] h-64 w-64 rounded-full bg-amber-300/20 blur-3xl sm:h-[500px] sm:w-[500px]" />

                <div className="absolute -right-16 top-[620px] h-44 w-44 rounded-full border border-blue-300/30 sm:h-64 sm:w-64">
                    <div className="absolute left-1/2 top-0 h-full w-px bg-blue-300/20" />
                    <div className="absolute left-0 top-1/2 h-px w-full bg-blue-300/20" />
                    <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-amber-400 shadow" />
                </div>

                <div className="absolute left-[-80px] top-[900px] h-[180px] w-[320px] rotate-[-10deg] rounded-[50%] border-b-2 border-blue-200/40 sm:w-[500px]" />
                <div className="absolute right-[-130px] top-[1280px] h-[200px] w-[360px] rotate-[12deg] rounded-[50%] border-t-2 border-amber-300/40" />

                <div
                    className="absolute inset-0 opacity-[0.16]"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle, rgba(37,99,235,0.35) 1px, transparent 1px)",
                        backgroundSize: "28px 28px",
                    }}
                />

                <span className="absolute left-[9%] top-[420px] text-3xl text-blue-500/15">
                    ◆
                </span>
                <span className="absolute right-[10%] top-[760px] text-3xl text-amber-500/20">
                    ✦
                </span>
                <span className="absolute left-[12%] top-[1180px] text-4xl text-blue-500/10">
                    ✦
                </span>
                <span className="absolute right-[11%] top-[1550px] text-3xl text-amber-500/15">
                    ◆
                </span>
            </div>

            {/* Watermark Công nghệ thông tin (CỐ ĐỊNH TĨNH) */}
            <InformationTechnologyWatermark />

            {/* Họa tiết giao thông (CỐ ĐỊNH TĨNH) */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
                <div className="absolute left-[4%] top-[20%] hidden text-5xl opacity-10 lg:block">
                    🚆
                </div>

                <div className="absolute right-[5%] top-[34%] hidden text-5xl opacity-10 lg:block">
                    🚌
                </div>

                <div className="absolute left-[8%] top-[58%] hidden h-32 w-32 lg:block">
                    <div className="absolute left-0 top-1/2 h-1 w-full rounded-full bg-blue-200" />
                    <div className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-4 border-white bg-blue-600 shadow" />
                    <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-amber-400 shadow" />
                    <div className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-4 border-white bg-blue-600 shadow" />
                </div>

                <div className="absolute right-[9%] top-[16%] hidden h-40 w-40 rounded-full border border-blue-200/70 lg:block">
                    <div className="absolute left-1/2 top-0 h-full w-px bg-blue-200/70" />
                    <div className="absolute left-0 top-1/2 h-px w-full bg-blue-200/70" />
                    <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 shadow" />
                </div>
            </div>

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

            {/* KHU VỰC NỘI DUNG CHÍNH */}
            <main
                key={language}
                className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center px-4 pb-14 pt-24 sm:px-6 sm:pb-20 sm:pt-20 xl:px-8"
                aria-busy={languageChanging}
                style={{
                    fontFamily:
                        language === "zh"
                            ? "'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', sans-serif"
                            : language === "de"
                            ? "'Inter', 'Roboto', 'Segoe UI', sans-serif"
                            : "Inter, Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
            >
                <div className="absolute left-4 top-16 hidden rotate-[-12deg] text-8xl opacity-90 lg:block">
                    🎓
                </div>

                {/* Logo UTC */}
                <section className="text-center">
                    <div className="mx-auto flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
                        <div className="h-full w-full overflow-hidden rounded-full shadow-[0_15px_35px_rgba(37,99,235,0.18)]">
                            <img
                                src="/images/UTC.png"
                                alt="UTC"
                                className="h-full w-full rounded-full object-cover"
                            />
                        </div>
                    </div>

                    <div className={textAnimClass}>
                        <p className="mt-5 text-sm font-bold uppercase tracking-[0.12em] text-amber-600 sm:text-lg sm:tracking-[0.2em]">
                            {t.university}
                        </p>

                        {t.universityEnglish && (
                            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-slate-500 sm:text-sm sm:tracking-[0.25em]">
                                {t.universityEnglish}
                            </p>
                        )}
                    </div>
                </section>

                {/* Tiêu đề */}
                <section className="mt-9 text-center">
                    <div className={textAnimClass}>
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
                    </div>

                    <div className="mx-auto mt-6 flex max-w-xl items-center gap-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400" />
                        <span className="text-2xl text-amber-600">🎓</span>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400" />
                    </div>

                    <div className={textAnimClass}>
                        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-lg sm:leading-8">
                            {t.invitationText}
                        </p>
                    </div>
                </section>

                {/* Ảnh đại diện (CỐ ĐỊNH TĨNH) */}
                <section className="mt-10 text-center">
                    <div className="relative mx-auto w-fit">
                        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300/30 sm:h-[355px] sm:w-[355px]" />
                        <div className="absolute left-1/2 top-1/2 h-[330px] w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/20 sm:h-[385px] sm:w-[385px]" />

                        <div className="relative h-[270px] w-[270px] rounded-full bg-gradient-to-br from-blue-800 via-blue-500 to-amber-400 p-[5px] shadow-[0_25px_70px_rgba(37,99,235,0.30)] sm:h-80 sm:w-80">
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
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

                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent" />
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-2 right-2 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-amber-400 to-yellow-500 text-3xl shadow-xl sm:bottom-3 sm:right-3">
                            🎓
                        </div>

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

                    <div className="mx-auto mt-5 flex max-w-sm items-center gap-3">
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-blue-500 to-amber-400" />
                        <span className="text-xl text-amber-500">✦</span>
                        <span className="text-xl text-blue-600">◆</span>
                        <span className="text-xl text-amber-500">✦</span>
                        <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-blue-500 to-amber-400" />
                    </div>
                </section>

                {/* Học vị */}
                <section className="utc-card-light relative mt-9 w-full max-w-3xl overflow-hidden rounded-3xl border border-blue-200 p-5 sm:p-7">
                    <div className="absolute right-[-25px] top-[-25px] h-28 w-28 rounded-full border-[18px] border-blue-100/50" />

                    <div className="relative flex items-center gap-4 sm:gap-5">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-2xl text-white shadow-lg sm:h-16 sm:w-16 sm:text-3xl">
                            💻
                        </div>

                        <div className={`min-w-0 flex-1 text-left ${textAnimClass}`}>
                            <h3 className="mt-1 text-[15px] font-black uppercase leading-6 text-amber-600 sm:text-2xl">
                                {t.degree}
                            </h3>

                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 sm:text-base">
                                {t.course}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Đếm ngược */}
                <section className="mt-10 w-full max-w-4xl text-center">
                    {countdown.completed ? (
                        <div className="mt-5 rounded-3xl border border-amber-400 bg-blue-600/10 px-6 py-8 backdrop-blur">
                            <p className="text-5xl">🎓🎉</p>

                            <p className={`mt-4 text-2xl font-black text-amber-600 ${textAnimClass}`}>
                                {t.ceremonyStarted}
                            </p>
                        </div>
                    ) : (
                        <div className="utc-card-light mt-5 grid grid-cols-4 overflow-hidden rounded-3xl border border-blue-200">
                            <CountdownItem
                                value={countdown.days}
                                label={t.day}
                                textAnimClass={textAnimClass}
                            />

                            <CountdownItem
                                value={countdown.hours}
                                label={t.hour}
                                withBorder
                                textAnimClass={textAnimClass}
                            />

                            <CountdownItem
                                value={countdown.minutes}
                                label={t.minute}
                                withBorder
                                textAnimClass={textAnimClass}
                            />

                            <CountdownItem
                                value={countdown.seconds}
                                label={t.second}
                                withBorder
                                textAnimClass={textAnimClass}
                            />
                        </div>
                    )}
                </section>

                {/* Thông tin lễ */}
                <section className="utc-card-light mt-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-blue-200">
                    <div className="divide-y divide-blue-100 sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <MobileInfoRow
                            icon="📅"
                            label={t.eventDateLabel}
                            value={t.eventDate}
                            textAnimClass={textAnimClass}
                        />

                        <MobileInfoRow
                            icon="🕗"
                            label={t.eventTimeLabel}
                            value={t.eventTime}
                            textAnimClass={textAnimClass}
                        />

                        <MobileInfoRow
                            icon="📍"
                            label={t.locationLabel}
                            value={
                                <>
                                    {t.locationLine1}
                                    <br />
                                    {t.locationLine2}
                                </>
                            }
                            textAnimClass={textAnimClass}
                        />
                    </div>
                </section>

                {/* Chữ ký */}
                <section className="mt-10 px-4 text-center">
                    <p
                        className={`mx-auto text-3xl italic leading-relaxed text-amber-600 sm:text-5xl ${textAnimClass}`}
                        style={{
                            fontFamily:
                                language === "zh"
                                    ? "'Noto Serif SC', serif"
                                    : "'Cormorant Garamond', serif",
                            textWrap: "balance",
                        }}
                    >
                        {t.seeYou}
                    </p>

                    <div className="mx-auto mt-5 h-px w-56 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                </section>

                {/* Nút chức năng */}
                <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
                    <a
                        href={MAP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-[56px] items-center justify-center gap-3 rounded-2xl border border-amber-400 bg-gradient-to-r from-amber-300 to-yellow-400 px-6 py-4 font-bold text-blue-950 shadow-xl transition hover:-translate-y-1 hover:scale-[1.02]"
                    >
                        <span className="text-xl">📍</span>
                        <span className={textAnimClass}>{t.viewMap}</span>
                    </a>

                    <button
                        type="button"
                        onClick={() => setShowCampusMap(true)}
                        className="flex min-h-[56px] items-center justify-center gap-3 rounded-2xl border border-blue-300 bg-white px-6 py-4 font-bold text-blue-700 shadow-xl transition hover:-translate-y-1 hover:scale-[1.02]"
                    >
                        <span className="text-xl">🗺️</span>
                        <span className={textAnimClass}>{t.campusMap}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowPhone(true)}
                        className="flex min-h-[56px] items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 font-bold text-white shadow-xl transition hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl"
                    >
                        <span className="text-xl">📞</span>
                        <span className={textAnimClass}>{t.contact}</span>
                    </button>
                </div>

                <footer className="mt-12 text-center">
                    <p className={`text-xs font-bold uppercase tracking-[0.12em] text-slate-400 sm:tracking-[0.2em] ${textAnimClass}`}>
                        {t.footer}
                    </p>
                </footer>
            </main>

            {showCampusMap && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                    onClick={() => setShowCampusMap(false)}
                >
                    <div
                        className="relative inline-block overflow-hidden rounded-3xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setShowCampusMap(false)}
                            className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg transition hover:bg-red-500 hover:text-white"
                        >
                            ✕
                        </button>

                        <div className="flex items-center justify-center bg-slate-100 p-2">
                            <img
                                src="/images/campus-map.png"
                                alt={t.campusMap}
                                className="block h-auto max-h-[82vh] w-auto max-w-[95vw] rounded-xl shadow-xl"
                            />
                        </div>

                        <div className="px-5 py-4 text-center">
                            <p
                                className={`text-base font-bold text-amber-600 sm:text-lg ${textAnimClass}`}
                                style={{
                                    fontFamily:
                                        language === "zh"
                                            ? "'Noto Serif SC', serif"
                                            : "'Cormorant Garamond', serif",
                                }}
                            >
                                🅿️ {t.parkingGuide}
                            </p>

                            <p
                                className={`mx-auto mt-1 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base ${textAnimClass}`}
                                style={{
                                    textWrap: "balance",
                                }}
                            >
                                {t.parkingInstruction}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup liên hệ */}
            {showPhone && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
                    onClick={() => setShowPhone(false)}
                    role="presentation"
                >
                    <div
                        className="w-full max-w-sm rounded-3xl border border-blue-200 bg-white p-6 text-slate-900 shadow-2xl"
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
                                className={`mt-5 text-2xl font-bold text-slate-800 ${textAnimClass}`}
                            >
                                {t.contactTitle}
                            </h2>

                            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className={`text-sm text-slate-500 ${textAnimClass}`}>
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
                                    className={`rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 transition hover:bg-slate-200 ${textAnimClass}`}
                                >
                                    {t.close}
                                </button>

                                <a
                                    href={`tel:${PHONE_NUMBER}`}
                                    className={`rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-3 text-center font-semibold text-slate-900 transition hover:from-green-600 hover:to-emerald-700 ${textAnimClass}`}
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
                    <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">

                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-5xl">
                            🎵
                        </div>

                        <h2 className={`mt-5 text-2xl font-bold text-slate-800 ${textAnimClass}`}>
                            {t.guideTitle}
                        </h2>

                        <p className={`mt-4 leading-7 text-slate-600 ${textAnimClass}`}>
                            {t.guideText}
                        </p>

                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={closeMusicGuide}
                                className={`rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 font-bold text-white transition hover:scale-105 ${textAnimClass}`}
                            >
                                {t.guideButton}
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
                "left-[3%] top-[14%] border-blue-500 bg-blue-100/65/60 text-blue-800",
            rotate: "-7deg",
        },
        {
            name: "SQL",
            short: "SQL",
            className:
                "right-[3%] top-[17%] border-amber-500 bg-amber-100/65/60 text-amber-800",
            rotate: "7deg",
        },
        {
            name: "React",
            short: "⚛",
            className:
                "left-[7%] top-[31%] border-cyan-500 bg-cyan-100/65/60 text-cyan-800",
            rotate: "-5deg",
        },
        {
            name: "Node.js",
            short: "JS",
            className:
                "right-[7%] top-[34%] border-emerald-500 bg-emerald-100/65/60 text-emerald-800",
            rotate: "5deg",
        },
        {
            name: "Git",
            short: "Git",
            className:
                "left-[3%] top-[50%] border-orange-500 bg-orange-100/65/60 text-orange-800",
            rotate: "-6deg",
        },
        {
            name: "JavaScript",
            short: "JS",
            className:
                "right-[3%] top-[53%] border-yellow-500 bg-yellow-100/60 text-yellow-800",
            rotate: "6deg",
        },
        {
            name: "TypeScript",
            short: "TS",
            className:
                "left-[9%] top-[70%] border-blue-500 bg-blue-100/65/60 text-blue-800",
            rotate: "-4deg",
        },
        {
            name: "Python",
            short: "PY",
            className:
                "right-[9%] top-[72%] border-indigo-500 bg-indigo-100/65/60 text-indigo-800",
            rotate: "4deg",
        },
        {
            name: "C++",
            short: "C++",
            className:
                "left-[28%] top-[82%] border-sky-500 bg-sky-100/65/60 text-sky-800",
            rotate: "-3deg",
        },
        {
            name: "API",
            short: "API",
            className:
                "right-[28%] top-[83%] border-violet-500 bg-violet-100/60 text-violet-800",
            rotate: "3deg",
        },
    ];

    const mobileTechnologies = [
        {
            name: "AI",
            short: "AI",
            className:
                "left-5 top-[14%] border-blue-400 bg-white/75 text-blue-700",
        },
        {
            name: "SQL",
            short: "SQL",
            className:
                "right-5 top-[20%] border-amber-400 bg-white/75 text-amber-700",
        },
        {
            name: "React",
            short: "⚛",
            className:
                "left-6 top-[33%] border-cyan-400 bg-white/75 text-cyan-700",
        },
        {
            name: "Node",
            short: "JS",
            className:
                "right-6 top-[40%] border-emerald-400 bg-white/75 text-emerald-700",
        },
        {
            name: "Git",
            short: "Git",
            className:
                "left-5 top-[55%] border-orange-400 bg-white/75 text-orange-700",
        },
        {
            name: "TS",
            short: "TS",
            className:
                "right-5 top-[62%] border-blue-400 bg-white/75 text-blue-700",
        },
        {
            name: "Python",
            short: "PY",
            className:
                "left-6 top-[76%] border-indigo-400 bg-white/75 text-indigo-700",
        },
        {
            name: "C++",
            short: "C++",
            className:
                "right-6 top-[83%] border-sky-400 bg-white/75 text-sky-700",
        },
    ];

    const utcMarks = [
        {
            className:
                "left-[22%] top-[22%] h-24 w-24 sm:h-32 sm:w-32",
            rotate: "-8deg",
            opacity: 0.22,
        },
        {
            className:
                "right-[22%] top-[25%] h-20 w-20 sm:h-28 sm:w-28",
            rotate: "8deg",
            opacity: 0.18,
        },
        {
            className:
                "left-[18%] top-[55%] h-20 w-20 sm:h-28 sm:w-28",
            rotate: "-5deg",
            opacity: 0.18,
        },
        {
            className:
                "right-[18%] top-[58%] h-24 w-24 sm:h-32 sm:w-32",
            rotate: "6deg",
            opacity: 0.22,
        },
        {
            className:
                "left-1/2 top-[74%] h-28 w-28 -translate-x-1/2 sm:h-40 sm:w-40",
            rotate: "0deg",
            opacity: 0.18,
        },
    ];

    return (
        <div
            className="pointer-events-none absolute inset-0 z-[1] overflow-hidden opacity-[0.14] select-none"
            aria-hidden="true"
        >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.075)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.075)_1px,transparent_1px)] bg-[size:34px_34px]" />

            <div className="absolute left-[-5%] top-[8%] w-[110%] overflow-hidden whitespace-nowrap font-mono text-[11px] font-black tracking-[0.28em] text-blue-800 opacity-[0.16] sm:text-sm">
                AI • SQL • REACT • NODE.JS • GIT • JAVASCRIPT • TYPESCRIPT • POSTGRESQL • DOCKER
            </div>

            <div className="absolute left-[-5%] top-[47%] w-[110%] overflow-hidden whitespace-nowrap font-mono text-[10px] font-black tracking-[0.26em] text-amber-700 opacity-[0.14] sm:text-xs">
                API • DATABASE • CLOUD • SERVER • CLIENT • NETWORK • SECURITY • FULLSTACK • UTC
            </div>

            <div className="absolute bottom-[5%] left-[-5%] w-[110%] overflow-hidden whitespace-nowrap font-mono text-[10px] font-black tracking-[0.25em] text-blue-800 opacity-[0.12] sm:text-xs">
                01000001 01001001 00100000 01010011 01010001 01001100 00100000 01010010 01000101 01000001 01000011 01010100
            </div>

            {utcMarks.map((item, index) => (
                <div
                    key={`utc-mark-${index}`}
                    className={` absolute ${item.className}`}
                    style={{
                        opacity: item.opacity,
                    }}
                >
                    <div className="h-full w-full rounded-full bg-white/55 p-1 shadow-[0_8px_20px_rgba(37,99,235,0.08)] grayscale-[20%] blur-[0.15px]">
                        <img
                            src="/images/UTC.png"
                            alt=""
                            className="h-full w-full rounded-full object-contain"
                        />
                    </div>
                </div>
            ))}

            <div className="hidden md:block">
                {desktopTechnologies.map((item) => (
                    <div
                        key={item.name}
                        className={` absolute flex min-w-[116px] flex-col items-center rounded-3xl border-2 px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.06)] ${item.className}`}
                        style={{
                            opacity: 0.36,
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
                    className="absolute left-[36%] top-[39%] rounded-3xl border-2 border-blue-500 bg-blue-100/65/60 px-5 py-4 font-mono text-4xl font-black text-blue-800 shadow-sm"
                    style={{
                        opacity: 0.38,
                    }}
                >
                    &lt;/&gt;
                </div>

                <div
                    className="absolute right-[35%] top-[42%] rounded-3xl border-2 border-amber-500 bg-amber-100/65/60 px-5 py-4 font-mono text-3xl font-black text-amber-800 shadow-sm"
                    style={{
                        opacity: 0.38,
                    }}
                >
                    {"{ }"}
                </div>

                <div
                    className="it-watermark-chip absolute left-1/2 top-[61%] flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-3xl border-2 border-indigo-500 bg-indigo-100/65/60 font-mono text-xl font-black text-indigo-800 shadow-sm"
                    style={{
                        opacity: 0.36,
                    }}
                >
                    CPU
                </div>
            </div>

            <div className="md:hidden">
                <div className="absolute left-1/2 top-[8%] h-28 w-28 -translate-x-1/2 opacity-[0.12]">
                    <img
                        src="/images/UTC.png"
                        alt=""
                        className="h-full w-full rounded-full object-contain"
                    />
                </div>

                <div className="absolute left-1/2 top-[27%] h-32 w-32 -translate-x-1/2 rounded-full border border-blue-500/30">
                    <div className="absolute left-1/2 top-0 h-full w-px bg-blue-500/20" />
                    <div className="absolute left-0 top-1/2 h-px w-full bg-blue-500/20" />
                    <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-blue-400 bg-white/80 font-mono text-xl font-black text-blue-700">
                        &lt;/&gt;
                    </div>
                </div>

                {mobileTechnologies.map((item) => (
                    <div
                        key={item.name}
                        className={`absolute flex min-w-[74px] flex-col items-center rounded-2xl border px-2.5 py-2 shadow-[0_8px_22px_rgba(15,23,42,0.08)] backdrop-blur-sm ${item.className}`}
                        style={{
                            opacity: 0.46,
                        }}
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-current/20 bg-white/90 font-mono text-lg font-black">
                            {item.short}
                        </div>

                        <p className="mt-1 whitespace-nowrap font-mono text-[9px] font-black uppercase tracking-[0.06em]">
                            {item.name}
                        </p>
                    </div>
                ))}

                <div
                    className="absolute left-1/2 top-[69%] -translate-x-1/2 rounded-2xl border border-amber-400 bg-white/80 px-4 py-3 font-mono text-[11px] font-black tracking-wider text-amber-700 shadow-sm"
                    style={{
                        opacity: 0.45,
                    }}
                >
                    API • DB • CLOUD
                </div>

                <div className="absolute bottom-[8%] left-1/2 w-[85%] -translate-x-1/2 overflow-hidden whitespace-nowrap text-center font-mono text-[7px] font-bold tracking-[0.18em] text-blue-800 opacity-[0.18]">
                    01001001 • 01010100 • 00100000 • UTC • 2026
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
                <div className="max-w-[220px] rounded-2xl border border-blue-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 items-end gap-1">
                            <span className="w-1.5 rounded-full bg-blue-600" />
                            <span className="w-1.5 rounded-full bg-amber-400" />
                            <span className="w-1.5 rounded-full bg-blue-500" />
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
                className="group flex h-14 w-14 items-center justify-center rounded-full border border-blue-200 bg-white/95 text-blue-700 shadow-[0_14px_35px_rgba(37,99,235,0.18)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-70 sm:h-16 sm:w-16"
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
            code: "de",
            shortLabel: "DE",
            flag: "🇩🇪",
            ariaLabel: "Deutsch",
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
    textAnimClass = "",
}) {
    return (
        <div
            className={`px-1 py-5 text-center sm:px-4 sm:py-7 ${withBorder ? "border-l border-blue-100" : ""}`}
        >
            <p className="font-serif text-3xl font-black tabular-nums text-amber-600 sm:text-5xl">
                {String(value).padStart(2, "0")}
            </p>

            <p className={`mt-2 break-words text-[9px] font-bold uppercase tracking-wide text-slate-600 sm:text-sm ${textAnimClass}`}>
                {label}
            </p>
        </div>
    );
}

function MobileInfoRow({
    icon,
    label,
    value,
    textAnimClass = "",
}) {
    return (
        <div className="flex items-center gap-4 px-4 py-4 sm:flex-col sm:justify-center sm:px-5 sm:py-6 sm:text-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl shadow-sm sm:h-14 sm:w-14 sm:text-3xl">
                {icon}
            </div>

            <div className={`min-w-0 sm:mt-2 ${textAnimClass}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 sm:text-xs">
                    {label}
                </p>

                <p className="mt-1 text-sm font-bold leading-5 text-amber-600 sm:text-base">
                    {value}
                </p>
            </div>
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
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/10 to-transparent" />s

                <div className="relative z-10 flex h-full flex-col items-center px-2 py-5 text-center">
                    {isLeft ? (
                        <>
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center 2xl:h-16 2xl:w-16">
                                <img
                                    src="/images/UTC.png"
                                    alt="UTC"
                                    className="h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(251,191,36,0.35)]"
                                />
                            </div>

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
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center 2xl:h-16 2xl:w-16">
                                <img
                                    src="/images/FIT-UTC.png"
                                    alt="UTC"
                                    className="h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(251,191,36,0.35)]"
                                />
                            </div>

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