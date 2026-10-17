import { useEffect, useMemo, useRef, useState } from "react";

const INVITATION_ID = "graduation-03";

const GRADUATION_DATE = new Date("2026-11-01T11:00:00+07:00");
const GRADUATE_NAME = "TRẦN THỊ DIỄM";
const GRADUATE_IMAGE = "/images/graduation-avatar-3.png";
const PHONE_NUMBER = "0867 039 962";
const PHONE_DISPLAY = "0867 039 962";
const MAP_URL = "https://maps.app.goo.gl/qYL8pSqC1UUVwR6U7";
const MUSIC_URL = "/music/graduation.mp3";
const MUSIC_TITLE = "A LITTLE DREAM OF ME";

const INVITATION_ANIMATIONS = `
  @keyframes flapOpen {
    0% { transform: rotateX(0deg); }
    100% { transform: rotateX(180deg); }
  }

  @keyframes cardSlideUp {
    0% { transform: translateY(0); }
    100% { transform: translateY(-110px); }
  }

  @keyframes envelopeFadeOut {
    0% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1.05); filter: blur(6px); }
  }

  .envelope-flap-opening {
    animation: flapOpen 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    transform-origin: top center;
    backface-visibility: hidden;
    will-change: transform;
  }

  .envelope-card-rising {
    animation: cardSlideUp 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s forwards;
    will-change: transform;
  }

  .envelope-fading {
    animation: envelopeFadeOut 0.6s ease-in-out 1s forwards;
    will-change: transform, opacity, filter;
  }

  @keyframes swayLeft {
    0%, 100% { transform: rotate(0.8deg); }
    50% { transform: rotate(-0.5deg); }
  }

  @keyframes swayRight {
    0%, 100% { transform: rotate(-0.8deg); }
    50% { transform: rotate(0.5deg); }
  }

  .inv-sash-left {
    transform-origin: top center;
    animation: swayLeft 5s ease-in-out infinite;
  }

  .inv-sash-right {
    transform-origin: top center;
    animation: swayRight 5s ease-in-out infinite;
  }

  @keyframes luxuryTextIn {
    0% { opacity: 0; transform: scale(0.98) translateY(2px); filter: blur(4px); }
    100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
  }

  @keyframes luxuryTextOut {
    0% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
    100% { opacity: 0; transform: scale(1.01) translateY(-2px); filter: blur(4px); }
  }

  .inv-text-enter {
    animation: luxuryTextIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    will-change: transform, opacity, filter;
  }

  .inv-text-leave {
    animation: luxuryTextOut 0.2s ease-in forwards;
    will-change: transform, opacity, filter;
    pointer-events: none;
  }

  @keyframes wishFadeInAnim {
    0% { opacity: 0; transform: translateY(8px) scale(0.98); filter: blur(3px); }
    100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
  }

  @keyframes wishFadeOutAnim {
    0% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
    100% { opacity: 0; transform: translateY(-8px) scale(0.98); filter: blur(3px); }
  }

  .wish-enter {
    animation: wishFadeInAnim 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .wish-leave {
    animation: wishFadeOutAnim 0.4s ease-in forwards;
  }

  .liquid-glass-card {
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(14px) saturate(150%);
    -webkit-backdrop-filter: blur(14px) saturate(150%);
    border: 1px solid rgba(255, 255, 255, 0.85);
    box-shadow: 0 18px 45px rgba(30, 64, 175, 0.10), inset 0 1px 1px rgba(255, 255, 255, 0.9);
  }

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
    .inv-text-leave,
    .wish-enter,
    .wish-leave {
      animation: none !important;
    }
  }
`;

const TRANSLATIONS = {
    vi: {
        locale: "vi-VN",
        back: "Quay lại trang chủ",
        university: "TRƯỜNG ĐẠI HỌC THĂNG LONG",
        universityEnglish: "Thang Long University",
        invitation: "THIỆP MỜI",
        graduationCeremony: "LỄ TỐT NGHIỆP",
        invitationText: "Trân trọng kính mời bạn đến tham dự lễ tốt nghiệp của",
        degree: "Cử nhân Marketing",
        course: "Khóa học 2022 – 2026",
        ceremonyStarted: "Lễ tốt nghiệp đã bắt đầu!",
        countdownTitle: "Đếm ngược đến lễ tốt nghiệp",
        day: "Ngày",
        hour: "Giờ",
        minute: "Phút",
        second: "Giây",
        eventDateLabel: "Ngày tổ chức",
        eventDate: "Chủ Nhật, 01/11/2026",
        eventTimeLabel: "Thời gian",
        eventTime: "11h00",
        locationLabel: "Địa điểm",
        locationLine1: "Vườn Sinh Viên",
        locationLine2: "Trường Đại học Thang Long",
        seeYou: "Hẹn gặp bạn tại buổi lễ!",
        viewMap: "Xem địa điểm",
        contact: "Liên hệ",
        contactTitle: "Liên hệ",
        campusMap: "Sơ đồ trường",
        parkingGuide: "Hướng dẫn gửi xe",
        parkingInstruction:
            "Xe máy đi vào cổng 2 và cổng 3 để gửi xe. Cổng 1 chỉ dành cho ô tô của giảng viên.",
        phoneLabel: "Số điện thoại",
        close: "Đóng",
        callNow: "Gọi ngay",
        footer: "TLU · K35 · Lễ tốt nghiệp",
        musicOn: "Đang phát nhạc",
        musicOff: "Bật nhạc nền",
        musicPlayError: "Trình duyệt không thể phát nhạc.",
        guideTitle: "Chào mừng bạn",
        guideText:
            "Để có trải nghiệm tốt nhất khi xem thiệp mời, hãy mở bằng máy tính, thay đổi ngôn ngữ và nhấn vào biểu tượng 🔊 ở góc dưới bên phải để phát nhạc nền.",
        guideButton: "Đã hiểu",
        openEnvelopeBtn: "Mở thiệp mời",
        clickToOpen: "Nhấn vào đây để mở thiệp",
        rsvpBtn: "Gửi lời chúc",
        rsvpTitle: "Gửi lời chúc mừng",
        rsvpSubtitle: "Hãy cho Diễm biết để đón tiếp bạn chu đáo nhất nhé!",
        rsvpNameLabel: "Họ và tên của bạn",
        rsvpNamePlaceholder: "Vui lòng nhập đúng họ và tên của bạn",
        rsvpAttendingLabel: "Bạn có thể tham dự không?",
        rsvpYes: "Chắc chắn tham dự ✨",
        rsvpMaybe: "Chưa chắc chắn / Có thể đến muộn",
        rsvpNo: "Rất tiếc không thể đến 🥺",
        rsvpWishesLabel: "Lời chúc / Lời nhắn gửi",
        rsvpWishesPlaceholder: "Gửi lời chúc đến Trần Thị Diễm",
        rsvpSubmit: "Gửi",
        rsvpSubmitting: "Đang gửi...",
        rsvpSuccess: "Cảm ơn bạn! Đã gửi thành công 🎉",
        noWishesText: "Hãy là người đầu tiên gửi lời chúc tốt đẹp đến Diễm nhé!",
    },
    en: {
        locale: "en-US",
        back: "Back to Home",
        university: "THANG LONG UNIVERSITY",
        universityEnglish: "HA NOI, VIETNAM",
        invitation: "INVITATION",
        graduationCeremony: "GRADUATION CEREMONY",
        invitationText:
            "You are cordially invited to attend the graduation ceremony of",
        degree: "Bachelor’s Degree in Marketing",
        course: "Academic Cohort 2022 – 2026",
        ceremonyStarted: "The graduation ceremony has begun!",
        countdownTitle: "Countdown to Graduation Ceremony",
        day: "Days",
        hour: "Hours",
        minute: "Minutes",
        second: "Seconds",
        eventDateLabel: "Date",
        eventDate: "Sunday, November 1, 2026",
        eventTimeLabel: "Time",
        eventTime: "11:00 AM",
        locationLabel: "Venue",
        locationLine1: "Student Garden",
        locationLine2: "Thang Long University",
        seeYou: "Looking forward to seeing you at the ceremony!",
        viewMap: "View Location",
        contact: "Contact",
        contactTitle: "Contact",
        campusMap: "Campus Map",
        parkingGuide: "Parking Guide",
        parkingInstruction:
            "Motorcycles please enter through Gate 2 and Gate 3 for parking. Gate 1 is reserved for faculty cars only.",
        phoneLabel: "Phone Number",
        close: "Close",
        callNow: "Call Now",
        footer: "TLU · K35 · Graduation Ceremony",
        musicOn: "Playing Music",
        musicOff: "Play Background Music",
        musicPlayError: "Browser could not play the background music.",
        guideTitle: "Welcome",
        guideText:
            "For the best experience when viewing the invitation, please open it on a computer, select your preferred language, and click the 🔊 icon at the bottom right to play background music.",
        guideButton: "Got It",
        openEnvelopeBtn: "Open Invitation",
        clickToOpen: "Click here to open invitation",
        rsvpBtn: "Send Wishes",
        rsvpTitle: "Send Congratulations",
        rsvpSubtitle: "Please let Diễm know so she can make the best arrangements to welcome you!",
        rsvpNameLabel: "Your Full Name",
        rsvpNamePlaceholder: "Please enter your full name correctly",
        rsvpAttendingLabel: "Can you attend?",
        rsvpYes: "Definitely attending ✨",
        rsvpMaybe: "Not sure / Might arrive late",
        rsvpNo: "Regretfully cannot make it 🥺",
        rsvpWishesLabel: "Wishes / Message",
        rsvpWishesPlaceholder: "Send your wishes to Trần Thị Diễm",
        rsvpSubmit: "Send",
        rsvpSubmitting: "Sending...",
        rsvpSuccess: "Thank you! Sent successfully 🎉",
        noWishesText: "Be the first to send your best wishes to Diễm!",
    },
    de: {
        locale: "de-DE",
        back: "Zurück zur Startseite",
        university: "THANG-LONG-UNIVERSITÄT",
        universityEnglish: "Thang Long University",
        invitation: "EINLADUNG",
        graduationCeremony: "ABSCHLUSSFEIER",
        invitationText:
            "Sie sind herzlich eingeladen zur Abschlussfeier von",
        degree: "Bachelorabschluss in Marketing",
        course: "Studienjahrgang 2022 – 2026",
        ceremonyStarted: "Die Abschlussfeier hat begonnen!",
        countdownTitle: "Countdown zur Abschlussfeier",
        day: "Tage",
        hour: "Stunden",
        minute: "Minuten",
        second: "Sekunden",
        eventDateLabel: "Veranstaltungsdatum",
        eventDate: "Sonntag, 1. November 2026",
        eventTimeLabel: "Uhrzeit",
        eventTime: "11:00 Uhr",
        locationLabel: "Veranstaltungsort",
        locationLine1: "Studentengarten",
        locationLine2: "Thang-Long-Universität",
        seeYou: "Wir freuen uns darauf, Sie bei der Feier zu begrüßen!",
        viewMap: "Standort ansehen",
        contact: "Kontakt",
        contactTitle: "Kontakt",
        campusMap: "Campus-Plan",
        parkingGuide: "Parkhinweise",
        parkingInstruction:
            "Bitte nutzen Sie mit dem Motorrad Tor 2 oder Tor 3 zum Parken. Tor 1 ist ausschließlich für die Autos der Lehrkräfte vorgesehen.",
        phoneLabel: "Telefonnummer",
        close: "Schließen",
        callNow: "Jetzt anrufen",
        footer: "TLU · K35 · Abschlussfeier",
        musicOn: "Musik läuft",
        musicOff: "Hintergrundmusik einschalten",
        musicPlayError: "Der Browser konnte die Musik nicht abspielen.",
        guideTitle: "Herzlich willkommen",
        guideText:
            "Für das beste Erlebnis öffnen Sie die Einladung bitte auf einem Desktop-PC, wählen Sie die passende Sprache und klicken Sie unten rechts auf das 🔊-Symbol, um die Hintergrundmusik abzuspielen.",
        guideButton: "Verstanden",
        openEnvelopeBtn: "Einladung öffnen",
        clickToOpen: "Hier klicken, um die Einladung zu öffnen",
        rsvpBtn: "Glückwünsche senden",
        rsvpTitle: "Glückwünsche übermitteln",
        rsvpSubtitle: "Bitte geben Sie Diễm Bescheid, damit sie Ihren Empfang bestmöglich vorbereiten kann!",
        rsvpNameLabel: "Ihr vollständiger Name",
        rsvpNamePlaceholder: "Bitte geben Sie Ihren vollständigen Namen korrekt ein",
        rsvpAttendingLabel: "Können Sie teilnehmen?",
        rsvpYes: "Nehme sicher teil ✨",
        rsvpMaybe: "Noch unsicher / Komme evtl. später",
        rsvpNo: "Kann leider nicht kommen 🥺",
        rsvpWishesLabel: "Glückwünsche / Nachricht",
        rsvpWishesPlaceholder: "Senden Sie Ihre Glückwünsche an Trần Thị Diễm",
        rsvpSubmit: "Senden",
        rsvpSubmitting: "Wird gesendet...",
        rsvpSuccess: "Vielen Dank! Erfolgreich gesendet 🎉",
        noWishesText: "Senden Sie Diễm als Erste oder Erster Ihre besten Glückwünsche!",
    },
    zh: {
        locale: "zh-CN",
        back: "返回首页",
        university: "升龙大学",
        universityEnglish: "Thang Long University",
        invitation: "邀请函",
        graduationCeremony: "毕业典礼",
        invitationText: "诚挚邀请您出席以下毕业生的毕业典礼：",
        degree: "市场营销学士",
        course: "2022—2026届",
        ceremonyStarted: "毕业典礼已经开始！",
        countdownTitle: "毕业典礼倒计时",
        day: "天",
        hour: "小时",
        minute: "分钟",
        second: "秒",
        eventDateLabel: "举办日期",
        eventDate: "2026年11月1日，星期日",
        eventTimeLabel: "具体时间",
        eventTime: "11:00",
        locationLabel: "典礼地点",
        locationLine1: "学生花园",
        locationLine2: "升龙大学（Thang Long University）",
        seeYou: "期待在毕业典礼上与您相见！",
        viewMap: "查看地图",
        contact: "联系",
        contactTitle: "联系方式",
        campusMap: "校园平面图",
        parkingGuide: "停车指南",
        parkingInstruction:
            "摩托车请从2号门或3号门进入停车。1号门仅供教师汽车通行与停放。",
        phoneLabel: "联系电话",
        close: "关闭",
        callNow: "立即拨打",
        footer: "TLU · K35 · 毕业典礼",
        musicOn: "正在播放背景音乐",
        musicOff: "开启背景音乐",
        musicPlayError: "浏览器无法播放音乐。",
        guideTitle: "欢迎莅临",
        guideText:
            "为了获得最佳观赏体验，请使用电脑端浏览器打开，自由切换语言，并点击右下角的 🔊 图标播放背景音乐。",
        guideButton: "知道了",
        openEnvelopeBtn: "开启邀请函",
        clickToOpen: "点击此处开启邀请函",
        rsvpBtn: "发送祝福",
        rsvpTitle: "发送祝贺",
        rsvpSubtitle: "请告知 Diễm 您的出席安排，以便她更周到地迎接您！",
        rsvpNameLabel: "您的姓名",
        rsvpNamePlaceholder: "请正确填写您的完整姓名",
        rsvpAttendingLabel: "您是否能出席？",
        rsvpYes: "必定参加 ✨",
        rsvpMaybe: "暂不确定 / 可能迟到",
        rsvpNo: "遗憾无法前往 🥺",
        rsvpWishesLabel: "祝福语 / 留言",
        rsvpWishesPlaceholder: "向 Trần Thị Diễm 送上祝福",
        rsvpSubmit: "发送",
        rsvpSubmitting: "正在发送...",
        rsvpSuccess: "非常感谢，已发送成功！🎉",
        noWishesText: "成为第一个向 Diễm 送上美好祝福的人吧！",
    },
};

const getApiBaseUrl = () => {
    let url = (import.meta.env.VITE_API_URL || "http://localhost:5000").trim();
    if (url.endsWith("/")) {
        url = url.slice(0, -1);
    }
    return url.endsWith("/api") ? url : `${url}/api`;
};

function Invitation3() {
    const [isClientReady, setIsClientReady] = useState(false);
    const [showMusicGuide, setShowMusicGuide] = useState(false);
    const [isOpened, setIsOpened] = useState(false);
    const [isOpening, setIsOpening] = useState(false);

    const [showCampusMap, setShowCampusMap] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showPhone, setShowPhone] = useState(false);
    const [showRsvp, setShowRsvp] = useState(false);
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const [rsvpSuccess, setRsvpSuccess] = useState(false);

    const [rsvpForm, setRsvpForm] = useState({
        name: "",
        attendance: "yes",
        wishes: "",
    });

    const [wishesList, setWishesList] = useState([]);
    const [currentWishIndex, setCurrentWishIndex] = useState(0);
    const [wishVisible, setWishVisible] = useState(true);

    const audioRef = useRef(null);
    const [musicPlaying, setMusicPlaying] = useState(false);
    const [musicLoading, setMusicLoading] = useState(false);
    const [musicError, setMusicError] = useState("");
    const [language, setLanguage] = useState("vi");
    const [contentVisible, setContentVisible] = useState(true);
    const [languageChanging, setLanguageChanging] = useState(false);

    const loadWishes = async () => {
        try {
            const apiBase = getApiBaseUrl();
            const response = await fetch(
                `${apiBase}/admin/graduation-rsvps?invitationId=${encodeURIComponent(INVITATION_ID)}&invitation_id=${encodeURIComponent(INVITATION_ID)}`
            );
            const data = await response.json();
            const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

            // Chỉ lấy chính xác các lời chúc của graduation-03
            const filtered = list.filter((item) => {
                const id = item.invitationId || item.invitation_id;
                return id === INVITATION_ID;
            });

            setWishesList(filtered);
        } catch {
            // Bỏ qua lỗi
        }
    };

    useEffect(() => {
        const hasGuide = sessionStorage.getItem("music-guide-graduation-03");
        if (!hasGuide) {
            setShowMusicGuide(true);
        }
        const savedLang = localStorage.getItem("invitationLanguage");
        if (savedLang && TRANSLATIONS[savedLang]) {
            setLanguage(savedLang);
        }
        setIsClientReady(true);
        loadWishes();
    }, []);

    useEffect(() => {
        if (wishesList.length <= 1) return;

        const interval = setInterval(() => {
            setWishVisible(false);
            setTimeout(() => {
                setCurrentWishIndex((prev) => (prev + 1) % wishesList.length);
                setWishVisible(true);
            }, 400);
        }, 4500);

        return () => clearInterval(interval);
    }, [wishesList.length]);

    const t = TRANSLATIONS[language] || TRANSLATIONS.vi;

    const closeMusicGuide = () => {
        sessionStorage.setItem("music-guide-graduation-03", "1");
        setShowMusicGuide(false);
    };

    const handleRsvpChange = (field, value) => {
        setRsvpForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleRsvpSubmit = async (event) => {
        event.preventDefault();

        const trimmedName = rsvpForm.name.trim();
        const trimmedWishes = rsvpForm.wishes.trim();

        if (!trimmedName) {
            alert(t.rsvpNameLabel || "Vui lòng nhập họ và tên.");
            return;
        }

        if (!trimmedWishes) {
            alert("Vui lòng nhập lời chúc của bạn.");
            return;
        }

        try {
            setRsvpLoading(true);
            const apiBase = getApiBaseUrl();

            const response = await fetch(`${apiBase}/graduation-rsvp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: trimmedName,
                    attendance: rsvpForm.attendance,
                    guests: "alone",
                    wishes: trimmedWishes,
                    invitationId: INVITATION_ID,
                }),
            });

            const contentType = response.headers.get("content-type");
            let data = {};
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            }

            if (!response.ok) {
                throw new Error(data.message || "Không thể gửi xác nhận.");
            }

            setWishesList((prev) => [
                {
                    id: Date.now(),
                    name: trimmedName,
                    wishes: trimmedWishes,
                    attendance: rsvpForm.attendance,
                    invitationId: INVITATION_ID,
                    submittedAt: new Date().toISOString(),
                },
                ...prev,
            ]);
            setCurrentWishIndex(0);

            setRsvpSuccess(true);
            setRsvpForm({
                name: "",
                attendance: "yes",
                wishes: "",
            });
        } catch (error) {
            console.error("Lỗi RSVP:", error);
            alert(error.message || "Đã có lỗi xảy ra khi gửi xác nhận.");
        } finally {
            setRsvpLoading(false);
        }
    };

    const handleOpenEnvelope = () => {
        if (isOpening || isOpened) return;
        setIsOpening(true);

        if (audioRef.current) {
            audioRef.current
                .play()
                .then(() => {
                    setMusicPlaying(true);
                })
                .catch(() => { });
        }

        setTimeout(() => {
            setIsOpened(true);
            setIsOpening(false);
        }, 1600);
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
                setMusicError("");
                await audio.play();
                setMusicPlaying(true);
            } catch {
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

        window.addEventListener("pointerdown", startMusic, { once: true });
        window.addEventListener("touchstart", startMusic, { once: true });
        window.addEventListener("keydown", startMusic, { once: true });
        window.addEventListener("scroll", startMusic, {
            once: true,
            passive: true,
        });

        return removeEvents;
    }, []);

    useEffect(() => {
        if (!isClientReady) return;
        localStorage.setItem("invitationLanguage", language);
        let langAttr = language;
        if (language === "zh") langAttr = "zh-CN";
        if (language === "de") langAttr = "de-DE";
        document.documentElement.lang = langAttr;
    }, [language, isClientReady]);

    useEffect(() => {
        if (!showPhone && !showCampusMap && !showRsvp) return;
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setShowPhone(false);
                setShowCampusMap(false);
                setShowRsvp(false);
            }
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [showPhone, showCampusMap, showRsvp]);

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
        } catch {
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
        if (newLanguage === language || languageChanging) return;

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
        const difference = GRADUATION_DATE.getTime() - currentTime.getTime();

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

    const textAnimClass = contentVisible ? "inv-text-enter" : "inv-text-leave";
    const currentWish = wishesList[currentWishIndex] || null;

    if (!isClientReady) {
        return <div className="fixed inset-0 bg-[#f8fbff] z-[9999]" />;
    }

    return (
        <div className="utc-light-page relative min-h-screen overflow-x-hidden text-slate-900">
            <style>{INVITATION_ANIMATIONS}</style>

            <LanguageSwitcher
                language={language}
                onChange={handleLanguageChange}
                disabled={languageChanging}
            />

            {/* 1. POPUP HƯỚNG DẪN */}
            {showMusicGuide && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 transition-all">
                    <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-sky-100" />
                    <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-200/40 blur-[100px]" />
                    <div className="absolute left-[15%] top-[15%] h-[220px] w-[220px] rounded-full bg-amber-100/50 blur-[80px]" />
                    <div className="absolute bottom-[10%] right-[10%] h-[250px] w-[250px] rounded-full bg-blue-100/60 blur-[90px]" />

                    <div className="liquid-glass-card relative z-10 w-full max-w-md rounded-3xl p-7 text-center">
                        <div className="absolute inset-2 pointer-events-none rounded-2xl border border-amber-300/40" />

                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/80 bg-white/50 p-2 shadow-inner backdrop-blur-md">
                            <img
                                src={GRADUATE_IMAGE}
                                alt="Avatar"
                                className="h-full w-full rounded-full object-cover shadow-sm"
                            />
                        </div>

                        <h2
                            className={`mt-5 font-serif text-2xl font-bold text-blue-900 ${textAnimClass}`}
                        >
                            {t.guideTitle}
                        </h2>

                        <p
                            className={`mt-4 leading-7 text-slate-700 sm:text-base ${textAnimClass}`}
                        >
                            {t.guideText}
                        </p>

                        <div className="mt-6 flex justify-center">
                            <button
                                type="button"
                                onClick={closeMusicGuide}
                                className={`rounded-2xl border border-white/80 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-400 px-8 py-3 text-sm font-bold uppercase tracking-wider text-blue-950 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] active:scale-95 cursor-pointer ${textAnimClass}`}
                            >
                                {t.guideButton}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. PHONG BÌ THƯ MỜI */}
            {!showMusicGuide && !isOpened && (
                <div
                    className={`fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden px-4 transition-all duration-700 ${isOpening ? "envelope-fading" : ""
                        }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-sky-100" />
                    <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-200/40 blur-[100px]" />
                    <div className="absolute left-[15%] top-[15%] h-[220px] w-[220px] rounded-full bg-amber-100/50 blur-[80px]" />
                    <div className="absolute bottom-[10%] right-[10%] h-[250px] w-[250px] rounded-full bg-blue-100/60 blur-[90px]" />

                    <div
                        className={`relative z-10 flex flex-col items-center transition-all duration-700 ${isOpening ? "scale-105 opacity-0" : "scale-100 opacity-100"
                            }`}
                    >
                        <div className="mb-7 text-center">
                            <div className="flex items-center justify-center gap-3">
                                <div className="h-px w-10 bg-gradient-to-r from-transparent to-amber-400 sm:w-16" />
                                <span
                                    className={`text-xs font-semibold uppercase tracking-[0.3em] text-blue-800 sm:text-sm ${textAnimClass}`}
                                >
                                    {t.invitation}
                                </span>
                                <div className="h-px w-10 bg-gradient-to-l from-transparent to-amber-400 sm:w-16" />
                            </div>
                            <div className="mt-3 text-amber-500">✦</div>
                        </div>

                        <div
                            onClick={handleOpenEnvelope}
                            className="group relative cursor-pointer [perspective:1200px]"
                            title={t.clickToOpen}
                        >
                            <div className="absolute -bottom-7 left-1/2 h-8 w-[75%] -translate-x-1/2 rounded-[50%] bg-blue-900/15 blur-xl" />

                            <div className="liquid-glass-card relative h-[225px] w-[320px] overflow-visible rounded-2xl transition-all duration-500 group-hover:-translate-y-2 sm:h-[270px] sm:w-[390px]">
                                <div className="absolute inset-2 rounded-xl border border-amber-300/40" />

                                <div
                                    className={`absolute left-1/2 top-4 z-[5] h-[190px] w-[86%] -translate-x-1/2 rounded-xl bg-gradient-to-b from-white via-white to-blue-50 p-3 shadow-[0_8px_25px_rgba(30,64,175,0.12)] transition-all duration-1000 sm:h-[225px] ${isOpening ? "envelope-card-rising" : "translate-y-0"
                                        }`}
                                >
                                    <div className="flex h-full flex-col items-center justify-center rounded-lg border border-amber-300/60 text-center">
                                        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-amber-300/70 bg-white shadow-sm">
                                            <img
                                                src="/images/TLU.png"
                                                alt="TLU"
                                                className="h-9 w-9 rounded-full object-contain"
                                            />
                                        </div>
                                        <div className="absolute top-3 right-3 text-sm text-amber-400">
                                            ✦
                                        </div>
                                        <p
                                            className={`text-[9px] font-semibold uppercase tracking-[0.25em] text-amber-600 sm:text-[10px] ${textAnimClass}`}
                                        >
                                            {t.invitation}
                                        </p>
                                        <p className="mt-2 px-3 font-serif text-lg font-semibold text-blue-900 sm:text-xl">
                                            {GRADUATE_NAME}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="h-px w-8 bg-amber-300" />
                                            <span className="text-xs text-amber-500">✦</span>
                                            <div className="h-px w-8 bg-amber-300" />
                                        </div>
                                        <p
                                            className={`mt-2 px-2 text-[9px] uppercase tracking-widest text-blue-500 sm:text-[10px] ${textAnimClass}`}
                                        >
                                            {t.graduationCeremony}
                                        </p>
                                    </div>
                                </div>

                                <div
                                    className="absolute inset-0 z-10 rounded-2xl bg-gradient-to-br from-white/40 via-sky-100/30 to-blue-200/40 backdrop-blur-sm"
                                    style={{
                                        clipPath:
                                            "polygon(0 38%, 50% 68%, 100% 38%, 100% 100%, 0 100%)",
                                    }}
                                />

                                <div
                                    className={`absolute left-0 top-0 z-20 h-[125px] w-full rounded-t-2xl border-b border-white/80 bg-white/60 shadow-sm backdrop-blur-md transition-transform duration-1000 [transform-origin:top_center] sm:h-[150px] ${isOpening ? "envelope-flap-opening" : ""
                                        }`}
                                    style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
                                />

                                <div
                                    className={`absolute left-1/2 top-[108px] z-30 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 shadow-[0_8px_20px_rgba(245,158,11,0.35)] transition-all duration-500 sm:top-[125px] sm:h-16 sm:w-16 ${isOpening ? "scale-75 opacity-0" : "group-hover:scale-110"
                                        }`}
                                >
                                    <div className="absolute inset-1 rounded-full border border-white/60" />
                                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white p-0.5 shadow-sm sm:h-12 sm:w-12">
                                        <img
                                            src="/images/TLU.png"
                                            alt="TLU"
                                            className="h-full w-full rounded-full object-contain"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>


                        <button
                            type="button"
                            onClick={handleOpenEnvelope}
                            disabled={isOpening}
                            className={`group mt-4 flex items-center gap-2 rounded-full border border-white/80 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-400 px-7 py-3 text-xs font-bold uppercase tracking-[0.2em] text-blue-950 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(245,158,11,0.35)] active:scale-95 disabled:pointer-events-none cursor-pointer sm:px-8 sm:py-3.5 sm:text-sm ${isOpening ? "scale-90 opacity-0" : ""
                                }`}
                        >
                            <span className="text-base transition-transform duration-300 group-hover:-rotate-6">
                                ✉
                            </span>
                            <span className={textAnimClass}>{t.openEnvelopeBtn}</span>
                            <span className="text-base transition-transform duration-300 group-hover:translate-x-1">
                                →
                            </span>
                        </button>
                    </div>

                    <div className="absolute bottom-5 left-0 right-0 z-10 text-center">
                        <p className="text-[9px] uppercase tracking-[0.3em] text-blue-900/40 sm:text-[10px]">
                            TLU · 2026
                        </p>
                    </div>
                </div>
            )}

            {/* DẢI SÁCH DESKTOP */}
            <div className="inv-sash-left pointer-events-none fixed inset-y-0 left-0 z-20 hidden w-[128px] xl:block 2xl:w-[148px]">
                <GraduationSash side="left" />
            </div>

            <div className="inv-sash-right pointer-events-none fixed inset-y-0 right-0 z-20 hidden w-[128px] xl:block 2xl:w-[148px]">
                <GraduationSash side="right" />
            </div>

            {/* SASH MOBILE */}
            <div className="inv-sash-left pointer-events-none absolute left-0 top-[118px] z-[20] xl:hidden">
                <div className="relative h-[360px] w-[38px] sm:w-[42px]">
                    <div
                        className="absolute inset-x-0 top-0 h-[340px] overflow-hidden bg-gradient-to-b from-blue-950 via-blue-700 to-blue-800 shadow-[0_14px_32px_rgba(30,64,175,0.22)]"
                        style={{
                            clipPath: "polygon(6% 0,94% 0,100% 90%,50% 100%,0 90%)",
                        }}
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.13),transparent_24%,rgba(255,255,255,0.04)_52%,transparent_76%,rgba(0,0,0,0.09))]" />
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,transparent_0px,transparent_18px,rgba(255,255,255,0.035)_19px)]" />
                        <div
                            className="absolute inset-[3px] border border-amber-300/80"
                            style={{
                                clipPath: "polygon(6% 0,94% 0,100% 90%,50% 100%,0 90%)",
                            }}
                        />
                        <div
                            className="absolute inset-[6px] border border-white/20"
                            style={{
                                clipPath: "polygon(6% 0,94% 0,100% 90%,50% 100%,0 90%)",
                            }}
                        />

                        <div className="relative z-10 flex h-full flex-col items-center justify-between px-1 py-4 text-center">
                            <div className="flex flex-col items-center pt-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
                                    <img
                                        src="/images/TLU.png"
                                        alt="TLU"
                                        className="h-6 w-6 rounded-full object-contain"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-1 items-center justify-center py-2">
                                <p className="[writing-mode:vertical-rl] rotate-180 whitespace-noswrap text-[7px] font-black uppercase tracking-[0.14em] text-white">
                                    Trường Đại học Thăng Long
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="inv-sash-right pointer-events-none absolute right-0 top-[148px] z-[20] xl:hidden">
                <div className="relative h-[330px] w-[36px] sm:w-[40px]">
                    <div
                        className="absolute inset-x-0 top-0 h-[306px] overflow-hidden bg-gradient-to-b from-white via-blue-50 to-blue-100 shadow-[0_14px_30px_rgba(30,64,175,0.18)]"
                        style={{
                            clipPath: "polygon(6% 0,94% 0,100% 90%,50% 100%,0 90%)",
                        }}
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.95),transparent_34%,rgba(37,99,235,0.03)_66%,rgba(37,99,235,0.08))]" />
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,transparent_0px,transparent_18px,rgba(37,99,235,0.035)_19px)]" />
                        <div
                            className="absolute inset-[3px] border border-blue-700/80"
                            style={{
                                clipPath: "polygon(6% 0,94% 0,100% 90%,50% 100%,0 90%)",
                            }}
                        />
                        <div
                            className="absolute inset-[6px] border border-amber-300/55"
                            style={{
                                clipPath: "polygon(6% 0,94% 0,100% 90%,50% 100%,0 90%)",
                            }}
                        />
                        <div className="absolute inset-x-0 top-5 flex justify-center">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
                                <img
                                    src="/images/TLU.png"
                                    alt="TLU"
                                    className="h-7 w-7 rounded-full object-contain"
                                />
                            </div>
                        </div>
                        <p className="absolute left-1/2 top-[58px] -translate-x-1/2 [writing-mode:vertical-rl] whitespace-nowrap text-[12px] font-black uppercase tracking-[0.13em] text-blue-900">
                            TLU Graduation
                        </p>
                        <div className="absolute inset-x-0 bottom-[35px] text-center">
                            <p className="text-[6px] font-black uppercase tracking-[0.08em] text-amber-600">
                                CHẤT LƯỢNG
                            </p>
                            <div className="mx-auto my-0.5 h-px w-3 bg-amber-300/60" />
                            <p className="text-[6px] font-black uppercase tracking-[0.08em] text-amber-600">
                                NĂNG ĐỘNG
                            </p>
                            <div className="mx-auto my-0.5 h-px w-3 bg-amber-300/60" />
                            <p className="text-[6px] font-black uppercase tracking-[0.08em] text-amber-600">
                                SÁNG
                            </p>
                            <p className="text-[6px] font-black uppercase tracking-[0.08em] text-amber-600">
                                TẠO
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.15),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_34%)]" />
                <div className="absolute -left-28 top-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl sm:h-[500px] sm:w-[500px]" />
                <div className="absolute -right-24 top-[38%] h-64 w-64 rounded-full bg-amber-300/20 blur-3xl sm:h-[500px] sm:w-[500px]" />
            </div>

            <InformationTechnologyWatermark />

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
            >
                <div className="absolute left-4 top-16 hidden rotate-[-12deg] text-8xl opacity-90 lg:block">
                    🎓
                </div>

                {/* Logo TLU */}
                <section className="text-center">
                    <div className="mx-auto flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
                        <div className="h-full w-full overflow-hidden rounded-full shadow-[0_15px_35px_rgba(37,99,235,0.18)]">
                            <img
                                src="/images/TLU.png"
                                alt="TLU"
                                className="h-full w-full rounded-full object-cover"
                            />
                        </div>
                    </div>

                    <div className={textAnimClass}>
                        <p className="mt-5 text-sm font-bold uppercase tracking-[0.12em] text-amber-600 sm:text-lg sm:tracking-[0.2em]">
                            {language === "vi" ? (
                                <>
                                    {/* Tiếng Việt: Mobile 2 dòng, Desktop 1 dòng */}
                                    <span className="block sm:hidden leading-snug">
                                        TRƯỜNG ĐẠI HỌC THĂNG LONG
                                    </span>
                                    <span className="hidden sm:inline">
                                        {t.university}
                                    </span>
                                </>
                            ) : (
                                /* Các ngôn ngữ khác: Giữ nguyên bình thường */
                                <span>{t.university}</span>
                            )}
                        </p>

                        {t.universityEnglish && (
                            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-slate-500 sm:text-sm sm:tracking-[0.25em]">
                                {t.universityEnglish}
                            </p>
                        )}
                    </div>
                </section>

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

                <section className="liquid-glass-card relative mt-9 w-full max-w-3xl overflow-hidden rounded-3xl p-5 sm:p-7">
                    <div className="relative flex items-center gap-4 sm:gap-5">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-2xl text-white shadow-lg sm:h-16 sm:w-16 sm:text-3xl">
                            🧑‍🏭
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

                <section className="mt-10 w-full max-w-4xl text-center">
                    {countdown.completed ? (
                        <div className="liquid-glass-card mt-5 rounded-3xl border border-amber-400 px-6 py-8">
                            <p className="text-5xl">🎓🎉</p>
                            <p
                                className={`mt-4 text-2xl font-black text-amber-600 ${textAnimClass}`}
                            >
                                {t.ceremonyStarted}
                            </p>
                        </div>
                    ) : (
                        <div className="liquid-glass-card mt-5 grid grid-cols-4 overflow-hidden rounded-3xl">
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

                <section className="liquid-glass-card mt-10 w-full max-w-4xl overflow-hidden rounded-3xl">
                    <div className="divide-y divide-blue-100/60 sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
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
                            value={<>{t.locationLine1}</>}
                            textAnimClass={textAnimClass}
                        />
                    </div>
                </section>

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

                {/* Ô hiển thị lời chúc lướt qua */}
                <section className="liquid-glass-card relative mt-8 w-full max-w-4xl overflow-hidden rounded-3xl p-5 sm:p-7">
                    {/* Thời gian gửi đặt ở góc trên bên trái */}
                    {wishesList.length > 0 &&
                        (currentWish?.submittedAt ||
                            currentWish?.submitted_at ||
                            currentWish?.created_at) && (
                            <div
                                className={`absolute left-4 top-3.5 z-10 flex items-center gap-1.5 font-mono text-[10px] text-slate-400 sm:left-6 sm:top-4 sm:text-xs transition-all ${wishVisible ? "wish-enter" : "wish-leave"
                                    }`}
                            >
                                <span>🕒</span>
                                <span>
                                    {new Intl.DateTimeFormat("vi-VN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        timeZone: "Asia/Ho_Chi_Minh",
                                    }).format(
                                        new Date(
                                            currentWish.submittedAt ||
                                            currentWish.submitted_at ||
                                            currentWish.created_at
                                        )
                                    )}
                                </span>
                            </div>
                        )}

                    <div className="min-h-[85px] flex items-center justify-center pt-3 sm:pt-2">
                        {wishesList.length === 0 ? (
                            <p className="text-center text-xs italic text-slate-500 sm:text-sm">
                                {t.noWishesText}
                            </p>
                        ) : (
                            <div
                                key={`${currentWish?.id}-${currentWishIndex}`}
                                className={`w-full text-center transition-all ${wishVisible ? "wish-enter" : "wish-leave"
                                    }`}
                            >
                                {currentWish?.wishes && String(currentWish.wishes).trim() !== "" ? (
                                    <>
                                        <p className="mx-auto max-w-2xl font-serif text-base italic leading-relaxed text-slate-800 sm:text-xl">
                                            "{currentWish.wishes}"
                                        </p>

                                        <div className="mt-3 flex items-center justify-center gap-2">
                                            <span className="h-px w-6 bg-amber-300" />
                                            <p className="text-xs font-bold tracking-wider text-blue-900 sm:text-sm">
                                                {currentWish?.name}
                                            </p>
                                            <span className="h-px w-6 bg-amber-300" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="h-px w-6 bg-amber-300" />
                                        <p className="text-sm font-bold tracking-wider text-blue-900 sm:text-base">
                                            {currentWish?.name}
                                        </p>
                                        <span className="h-px w-6 bg-amber-300" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* 3 Nút chức năng */}
                <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <a
                        href={MAP_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-[56px] items-center justify-center gap-3 rounded-2xl border border-amber-300 bg-amber-100 px-6 py-4 font-bold text-amber-950 shadow-xl backdrop-blur-md transition hover:-translate-y-1 hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        <span className="text-xl">📍</span>
                        <span className={textAnimClass}>{t.viewMap}</span>
                    </a>

                    <button
                        type="button"
                        onClick={() => setShowCampusMap(true)}
                        className="flex min-h-[56px] items-center justify-center gap-3 rounded-2xl border border-blue-300 bg-blue-100 px-6 py-4 font-bold text-blue-950 shadow-xl backdrop-blur-md transition hover:-translate-y-1 hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        <span className="text-xl">🗺️</span>
                        <span className={textAnimClass}>{t.campusMap}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowPhone(true)}
                        className="flex min-h-[56px] items-center justify-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-100 px-6 py-4 font-bold text-emerald-950 shadow-xl backdrop-blur-md transition hover:-translate-y-1 hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        <span className="text-xl">📞</span>
                        <span className={textAnimClass}>{t.contact}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setRsvpSuccess(false);
                            setShowRsvp(true);
                        }}
                        className="flex min-h-[56px] items-center justify-center gap-3 rounded-2xl border border-pink-300 bg-pink-100 px-6 py-4 font-bold text-pink-950 shadow-xl backdrop-blur-md transition hover:-translate-y-1 hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                        <span className="text-xl">💌</span>
                        <span className={textAnimClass}>{t.rsvpBtn}</span>
                    </button>
                </div>

                <footer className="mt-12 text-center">
                    <p
                        className={`text-xs font-bold uppercase tracking-[0.12em] text-slate-400 sm:tracking-[0.2em] ${textAnimClass}`}
                    >
                        {t.footer}
                    </p>
                    <p className={`text-xs font-bold tracking-[0.15em] text-slate-400 sm:tracking-[0.2em] ${textAnimClass}`}>
                        Designed by <a href="https://www.instagram.com/hugnpxl.jpg/" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-700">
                            hugnpxl.jpg
                        </a>
                    </p>
                </footer>
            </main>

            {/* POPUP SƠ ĐỒ TRƯỜNG */}
            {showCampusMap && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md transition-all"
                    onClick={() => setShowCampusMap(false)}
                >
                    <div
                        className="liquid-glass-card relative inline-block overflow-hidden rounded-3xl p-3 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setShowCampusMap(false)}
                            className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/80 shadow-lg backdrop-blur-md transition hover:bg-red-500 hover:text-white cursor-pointer"
                        >
                            ✕
                        </button>

                        <div className="flex min-h-0 items-center justify-center overflow-auto rounded-2xl bg-white/60 p-1">
                            <img
                                src="/images/campus-map-3.jpg"
                                alt={t.campusMap}
                                className="block h-auto w-auto max-w-full rounded-xl object-contain shadow-md"
                                style={{
                                    maxHeight: "calc(100dvh - 180px)",
                                }}
                            />
                        </div>

                        
                    </div>
                </div>
            )}

            {/* POPUP RSVP XÁC NHẬN THAM DỰ */}
            {showRsvp && (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4 backdrop-blur-md"
                    onClick={() => setShowRsvp(false)}
                >
                    <div
                        className="liquid-glass-card relative my-6 w-full max-w-lg rounded-3xl p-6 shadow-2xl sm:p-8"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <button
                            type="button"
                            onClick={() => setShowRsvp(false)}
                            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-slate-600 shadow-sm transition hover:bg-red-500 hover:text-white cursor-pointer"
                        >
                            ✕
                        </button>

                        {!rsvpSuccess ? (
                            <>
                                <div className="text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 text-3xl shadow-lg sm:h-20 sm:w-20 sm:text-4xl">
                                        💌
                                    </div>

                                    <h2 className="mt-4 text-2xl font-black text-blue-900 sm:text-3xl">
                                        {t.rsvpTitle}
                                    </h2>

                                    <p className="mt-1.5 text-sm leading-6 text-slate-600">
                                        {t.rsvpSubtitle}
                                    </p>
                                </div>

                                <form
                                    onSubmit={handleRsvpSubmit}
                                    className="mt-6 space-y-4 text-left"
                                >
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                            {t.rsvpNameLabel} <span className="text-rose-500">*</span>
                                        </label>

                                        <input
                                            type="text"
                                            value={rsvpForm.name}
                                            onChange={(e) =>
                                                handleRsvpChange("name", e.target.value)
                                            }
                                            placeholder={t.rsvpNamePlaceholder}
                                            maxLength={150}
                                            className="w-full rounded-2xl border border-white/80 bg-white/60 px-4 py-3 text-sm font-semibold text-slate-800 outline-none backdrop-blur-md transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                            {t.rsvpAttendingLabel}
                                        </label>

                                        <div className="space-y-2">
                                            {[
                                                ["yes", t.rsvpYes],
                                                ["maybe", t.rsvpMaybe],
                                                ["no", t.rsvpNo],
                                            ].map(([value, label]) => (
                                                <label
                                                    key={value}
                                                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${rsvpForm.attendance === value
                                                        ? "border-blue-500 bg-blue-50/80"
                                                        : "border-white/80 bg-white/50"
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="attendance"
                                                        value={value}
                                                        checked={rsvpForm.attendance === value}
                                                        onChange={(e) =>
                                                            handleRsvpChange("attendance", e.target.value)
                                                        }
                                                        className="h-4 w-4 accent-blue-600"
                                                    />

                                                    <span className="text-xs font-bold text-slate-700 sm:text-sm">
                                                        {label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                            {t.rsvpWishesLabel} <span className="text-rose-500">*</span>
                                        </label>

                                        <textarea
                                            value={rsvpForm.wishes}
                                            onChange={(e) =>
                                                handleRsvpChange("wishes", e.target.value)
                                            }
                                            placeholder={t.rsvpWishesPlaceholder}
                                            maxLength={1000}
                                            rows={3}
                                            required
                                            className="w-full resize-none rounded-2xl border border-white/80 bg-white/60 p-3.5 text-sm font-normal text-slate-800 outline-none backdrop-blur-md focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={rsvpLoading}
                                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 px-5 py-4 font-bold text-white shadow-xl transition hover:scale-[1.01] active:scale-95 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
                                    >
                                        {rsvpLoading ? (
                                            <>
                                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                                <span>{t.rsvpSubmitting}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>💌</span>
                                                <span>{t.rsvpSubmit}</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="py-8 text-center">
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl shadow-inner sm:h-24 sm:w-24 sm:text-5xl">
                                    🎉
                                </div>

                                <h2 className="mt-5 text-2xl font-black text-green-700">
                                    {t.rsvpSuccess}
                                </h2>

                                <button
                                    type="button"
                                    onClick={() => setShowRsvp(false)}
                                    className="mt-6 rounded-2xl bg-blue-600 px-7 py-3 font-bold text-white shadow-lg transition hover:bg-blue-700 active:scale-95 cursor-pointer"
                                >
                                    {t.close}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* POPUP LIÊN HỆ */}
            {showPhone && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md transition-all"
                    onClick={() => setShowPhone(false)}
                    role="presentation"
                >
                    <div
                        className="liquid-glass-card w-full max-w-sm rounded-3xl p-6 text-slate-900 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="contact-dialog-title"
                    >
                        <div className="text-center">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/80 bg-green-100/80 text-5xl shadow-inner backdrop-blur-md">
                                📞
                            </div>

                            <h2
                                id="contact-dialog-title"
                                className={`mt-5 text-2xl font-bold text-blue-900 ${textAnimClass}`}
                            >
                                {t.contactTitle}
                            </h2>

                            <div className="mt-6 rounded-2xl border border-white/80 bg-white/50 p-4 backdrop-blur-md">
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
                                    className={`rounded-xl border border-white/80 bg-white/60 py-3 font-semibold text-slate-700 transition hover:bg-white/90 cursor-pointer ${textAnimClass}`}
                                >
                                    {t.close}
                                </button>

                                <a
                                    href={`tel:${PHONE_NUMBER}`}
                                    className={`rounded-xl border border-white/80 bg-gradient-to-r from-green-500 to-emerald-600 py-3 text-center font-semibold text-white shadow-md transition hover:brightness-105 ${textAnimClass}`}
                                >
                                    {t.callNow}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InformationTechnologyWatermark() {
    const desktopTechnologies = [

    ];

    return (
        <div
            className="pointer-events-none absolute inset-0 z-[1] overflow-hidden opacity-[0.14] select-none"
            aria-hidden="true"
        >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.075)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.075)_1px,transparent_1px)] bg-[size:34px_34px]" />

            <div className="hidden md:block">
                {desktopTechnologies.map((item) => (
                    <div
                        key={item.name}
                        className={`absolute flex min-w-[116px] flex-col items-center rounded-3xl border-2 backdrop-blur-md px-4 py-3 shadow-sm ${item.className}`}
                        style={{ opacity: 0.36 }}
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-current/30 bg-white/80 font-mono text-2xl font-black shadow-sm">
                            {item.short}
                        </div>
                        <p className="mt-2 whitespace-nowrap font-mono text-sm font-black uppercase tracking-[0.1em]">
                            {item.name}
                        </p>
                    </div>
                ))}
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
        <div className="fixed bottom-4 right-4 z-[400] flex flex-row-reverse items-center gap-2.5 sm:bottom-6 sm:right-6 sm:gap-3">
            <button
                type="button"
                onClick={onToggle}
                disabled={loading}
                className="group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/95 text-blue-700 shadow-[0_8px_25px_rgba(37,99,235,0.2)] backdrop-blur-md transition duration-300 hover:scale-105 active:scale-95 disabled:cursor-wait disabled:opacity-70 cursor-pointer sm:h-16 sm:w-16"
                aria-label={playing ? playingLabel : pausedLabel}
                title={playing ? playingLabel : pausedLabel}
            >
                {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 sm:h-6 sm:w-6 sm:border-[3px]" />
                ) : (
                    <span className="text-xl sm:text-3xl">{playing ? "🔊" : "🔇"}</span>
                )}

                <span className="pointer-events-none absolute bottom-[calc(100%+10px)] hidden whitespace-nowrap rounded-xl bg-blue-700 px-3 py-2 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100 sm:block">
                    {playing ? playingLabel : pausedLabel}
                </span>
            </button>

            {playing && (
                <div className="liquid-glass-card max-w-[170px] rounded-xl px-3 py-2 sm:max-w-[220px] sm:rounded-2xl sm:px-4 sm:py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex h-5 items-end gap-0.5 sm:h-8 sm:gap-1">
                            <span className="w-1 rounded-full bg-blue-600 sm:w-1.5" />
                            <span className="w-1 rounded-full bg-amber-400 sm:w-1.5" />
                            <span className="w-1 rounded-full bg-blue-500 sm:w-1.5" />
                        </div>

                        <div className="min-w-0 text-left">
                            <p className="truncate text-[10px] font-black uppercase tracking-wide text-blue-700 sm:text-xs">
                                {playingLabel}
                            </p>
                            <p className="truncate text-[10px] text-slate-600 sm:text-xs">
                                {title}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function LanguageSwitcher({ language, onChange, disabled = false }) {
    const languages = [
        { code: "vi", shortLabel: "VI", flag: "🇻🇳", ariaLabel: "Tiếng Việt" },
        { code: "en", shortLabel: "EN", flag: "🇬🇧", ariaLabel: "English" },
        { code: "de", shortLabel: "DE", flag: "🇩🇪", ariaLabel: "Deutsch" },
        { code: "zh", shortLabel: "中文", flag: "🇨🇳", ariaLabel: "中文" },
    ];

    return (
        <div className="fixed right-3 top-3 z-[400] flex items-center gap-1 rounded-full border border-white/80 bg-white/40 p-1.5 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 hover:border-white hover:bg-white/50 sm:right-6 sm:top-6">
            {languages.map((item) => {
                const active = language === item.code;

                return (
                    <button
                        key={item.code}
                        type="button"
                        onClick={() => onChange(item.code)}
                        disabled={disabled}
                        className={`relative flex min-h-[38px] items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-all duration-300 disabled:cursor-wait disabled:opacity-70 cursor-pointer sm:text-sm ${active
                            ? "text-white shadow-[0_4px_16px_rgba(37,99,235,0.35)]"
                            : "text-slate-700 hover:bg-white/40 hover:text-blue-900"
                            }`}
                        aria-label={item.ariaLabel}
                        aria-pressed={active}
                    >
                        {active && (
                            <div className="absolute inset-0 -z-10 overflow-hidden rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
                                <span className="absolute -left-1/2 -top-1/2 h-full w-full rotate-12 bg-white/20 blur-sm" />
                            </div>
                        )}

                        <span
                            className="text-sm transition-transform duration-300 active:scale-125"
                            aria-hidden="true"
                        >
                            {item.flag}
                        </span>
                        <span className="tracking-wide">{item.shortLabel}</span>
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
            className={`px-1 py-5 text-center sm:px-4 sm:py-7 ${withBorder ? "border-l border-blue-100/60" : ""
                }`}
        >
            <p className="font-serif text-3xl font-black tabular-nums text-amber-600 sm:text-5xl">
                {String(value).padStart(2, "0")}
            </p>

            <p
                className={`mt-2 break-words text-[9px] font-bold uppercase tracking-wide text-slate-600 sm:text-sm ${textAnimClass}`}
            >
                {label}
            </p>
        </div>
    );
}

function MobileInfoRow({ icon, label, value, textAnimClass = "" }) {
    return (
        <div className="flex items-center gap-4 px-4 py-4 sm:flex-col sm:justify-center sm:px-5 sm:py-6 sm:text-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-blue-50/60 text-2xl shadow-sm backdrop-blur-md sm:h-14 sm:w-14 sm:text-3xl">
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
                    clipPath: "polygon(0 0, 100% 0, 100% 92%, 50% 100%, 0 92%)",
                    fontFamily:
                        "Inter, Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
            >
                <div
                    className="absolute inset-[5px] border-2 border-blue-600/90"
                    style={{
                        clipPath: "polygon(0 0, 100% 0, 100% 92%, 50% 100%, 0 92%)",
                    }}
                />

                <div
                    className="absolute inset-[9px] border border-amber-400/60"
                    style={{
                        clipPath: "polygon(0 0, 100% 0, 100% 92%, 50% 100%, 0 92%)",
                    }}
                />

                <div className="relative z-10 flex h-full flex-col items-center px-2 py-5 text-center">
                    {isLeft ? (
                        <>
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center 2xl:h-16 2xl:w-16">
                                <img
                                    src="/images/TLU.png"
                                    alt="TLU"
                                    className="h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(251,191,36,0.35)]"
                                />
                            </div>

                            <div className="mt-6 flex min-h-0 flex-1 items-center justify-center">
                                <p
                                    className="[writing-mode:vertical-rl] rotate-180 text-[12px] font-black uppercase tracking-[0.18em] text-blue-900 2xl:text-[23px]"
                                    style={{
                                        textRendering: "geometricPrecision",
                                    }}
                                >
                                    THANG LONG UNIVERSITY
                                </p>
                            </div>

                            <div className="mb-12 shrink-0">
                                <div className="mx-auto mb-3 h-px w-11 bg-amber-300" />
                                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-600 2xl:text-xs">
                                    Class
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
                                    src="/images/TLU.png"
                                    alt="TLU"
                                    className="h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(251,191,36,0.35)]"
                                />
                            </div>

                            <div className="mt-7 shrink-0">
                                <p className="mt-2 text-[11px] font-black uppercase leading-[1.45] tracking-wide text-amber-600 2xl:text-[13px]">
                                    MARKETING
                                </p>
                            </div>

                            <div className="mt-5 h-px w-12 shrink-0 bg-amber-300" />

                            <div className="mt-5 shrink-0 text-center">
                                <p className="mt-1 text-4xl font-black leading-none text-blue-900 2xl:text-4xl">
                                    K35 TLU
                                </p>
                            </div>

                            <div className="mt-5 flex min-h-0 flex-1 items-center justify-center">
                                <p
                                    className="[writing-mode:vertical-rl] rotate-180 text-[17px] font-black uppercase tracking-[0.32em] text-amber-600 2xl:text-2xl"
                                    style={{
                                        textRendering: "geometricPrecision",
                                    }}
                                >
                                    Graduation
                                </p>
                            </div>

                            <div className="mb-12 shrink-0">
                                <p className="-rotate-6 text-base font-bold italic leading-5 text-amber-600 2xl:text-lg">
                                    Ứng dụng
                                    <br />
                                    Tiên phong
                                    <br />
                                    Dẫn dầu
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Invitation3;