import { useEffect, useRef, useState } from "react";
import api from "../services/api";

function HomeMusicPlayer() {
  const audioRef = useRef(null);

  const [track, setTrack] = useState(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadHomeMusic = async () => {
      try {
        const response = await api.get("/home-music");

        if (cancelled) return;

        if (
          response.data?.enabled &&
          response.data?.track?.musicUrl
        ) {
          setTrack(response.data.track);
        } else {
          setTrack(null);
        }
      } catch (error) {
        console.error(
          "Lỗi tải nhạc trang chủ:",
          error
        );

        if (!cancelled) {
          setTrack(null);
        }
      }
    };

    loadHomeMusic();

    return () => {
      cancelled = true;
      audioRef.current?.pause();
    };
  }, []);

  const toggleMusic = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      await audio.play();
      setPlaying(true);
    } catch (error) {
      console.error("Không thể phát nhạc:", error);
    }
  };

  if (!track) {
    return null;
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={track.musicUrl}
        loop
        preload="metadata"
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />

      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-3">
        {playing && (
          <div className="hidden max-w-[220px] rounded-2xl bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:block">
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
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-xl transition hover:scale-105 hover:bg-blue-700"
          title={
            playing
              ? "Tạm dừng nhạc"
              : `Phát: ${track.name}`
          }
        >
          {playing ? "🔊" : "🔇"}
        </button>
      </div>
    </>
  );
}

export default HomeMusicPlayer;