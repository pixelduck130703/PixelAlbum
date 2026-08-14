import { useEffect, useState } from "react";
import api from "../services/api";

/*
 * Một Audio duy nhất cho toàn bộ ứng dụng.
 * Không bị tạo lại khi Home -> Detail.
 */
let globalAudio = null;
let globalTrack = null;
let musicLoaded = false;

function getAudio() {
  if (!globalAudio) {
    globalAudio = new Audio();
    globalAudio.loop = true;
    globalAudio.preload = "metadata";
  }

  return globalAudio;
}

function HomeMusicPlayer({ visible = true }) {
  const [track, setTrack] = useState(globalTrack);
  const [playing, setPlaying] = useState(() => {
    return globalAudio
      ? !globalAudio.paused
      : false;
  });

  const [loading, setLoading] = useState(!musicLoaded);

  /*
   * Lấy bài hát.
   * Chỉ gọi API một lần trong vòng đời ứng dụng.
   */
  useEffect(() => {
    let cancelled = false;

    const loadMusic = async () => {
      if (musicLoaded && globalTrack) {
        setTrack(globalTrack);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await api.get("/home-music");

        if (cancelled) return;

        const newTrack =
          response.data?.enabled &&
          response.data?.track?.musicUrl
            ? response.data.track
            : null;

        globalTrack = newTrack;
        musicLoaded = true;

        setTrack(newTrack);

        if (newTrack) {
          const audio = getAudio();

          /*
           * Chỉ gán src nếu thực sự là bài khác.
           * Không gán lại src khi chuyển route.
           */
          const currentUrl = audio.src;
          const newUrl = new URL(
            newTrack.musicUrl,
            window.location.href
          ).href;

          if (currentUrl !== newUrl) {
            audio.src = newTrack.musicUrl;
            audio.load();
          }
        }
      } catch (error) {
        console.error(
          "Lỗi tải nhạc trang chủ:",
          error
        );

        if (!cancelled) {
          setTrack(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMusic();

    return () => {
      cancelled = true;

      /*
       * QUAN TRỌNG:
       * Không pause audio khi component unmount.
       */
    };
  }, []);

  /*
   * Đồng bộ trạng thái nút loa với Audio global.
   */
  useEffect(() => {
    const audio = getAudio();

    const handlePlay = () => {
      setPlaying(true);
    };

    const handlePause = () => {
      setPlaying(false);
    };

    const handleEnded = () => {
      setPlaying(false);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    setPlaying(!audio.paused);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const toggleMusic = async () => {
    if (!track?.musicUrl) return;

    const audio = getAudio();

    if (!audio.src) {
      audio.src = track.musicUrl;
      audio.load();
    }

    if (!audio.paused) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
    } catch (error) {
      console.error(
        "Không thể phát nhạc:",
        error
      );
    }
  };

  if (loading || !track) {
    return null;
  }

  /*
   * Chỉ ẩn giao diện.
   * Audio global vẫn tiếp tục chạy.
   */
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex items-center gap-3">
      {playing && (
        <div className="hidden max-w-[220px] rounded-2xl border border-white/80 border-t-white/95 bg-white/45 px-4 py-3 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),_0_12px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl sm:block">
          <p className="text-xs font-semibold text-slate-500">
            Đang phát
          </p>

          <p className="truncate font-bold text-slate-800">
            {track.name}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={toggleMusic}
        className="flex h-14 w-14 items-center justify-center rounded-full border border-white/80 border-t-white/95 bg-blue-600/90 text-2xl text-white shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),_0_12px_32px_rgba(37,99,235,0.3)] backdrop-blur-2xl transition hover:scale-105 hover:bg-blue-600 active:scale-95"
        title={
          playing
            ? "Tạm dừng nhạc"
            : `Phát: ${track.name}`
        }
        aria-label={
          playing
            ? "Tạm dừng nhạc"
            : "Phát nhạc"
        }
      >
        {playing ? "🔊" : "🔇"}
      </button>
    </div>
  );
}

export default HomeMusicPlayer;