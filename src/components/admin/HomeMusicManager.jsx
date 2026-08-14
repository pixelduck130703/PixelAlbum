import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";

function HomeMusicManager({
  open = false,
  onClose,
}) {
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  const [tracks, setTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] =
    useState("");

  const [name, setName] = useState("");
  const [musicFile, setMusicFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingSelection, setSavingSelection] =
    useState(false);

  const [previewTrackId, setPreviewTrackId] =
    useState(null);

  const loadMusic = async () => {
    try {
      setLoading(true);

      const response = await api.get("/admin/music");

      setTracks(
        Array.isArray(response.data?.tracks)
          ? response.data.tracks
          : []
      );

      setSelectedTrackId(
        response.data?.selectedTrackId
          ? String(response.data.selectedTrackId)
          : ""
      );
    } catch (error) {
      console.error("Lỗi tải danh sách nhạc:", error);

      toast.error(
        error.response?.data?.message ||
        "Không thể tải danh sách nhạc."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    loadMusic();

    return () => {
      audioRef.current?.pause();
      setPreviewTrackId(null);
    };
  }, [open]);

  if (!open) return null;

  const resetAddForm = () => {
    setName("");
    setMusicFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
    }

    setPreviewTrackId(null);
  };

  const handleClose = () => {
    if (uploading || savingSelection) return;

    stopPreview();
    resetAddForm();
    onClose?.();
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    const normalizedName = name.trim();

    if (!normalizedName) {
      toast.error("Vui lòng nhập tên bài hát.");
      return;
    }

    if (!musicFile) {
      toast.error("Vui lòng chọn file nhạc.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("name", normalizedName);
      formData.append("music", musicFile);

      await api.post("/admin/music", formData);

      toast.success("Đã thêm bài hát.");

      resetAddForm();
      await loadMusic();
    } catch (error) {
      console.error("Lỗi thêm bài hát:", error);

      toast.error(
        error.response?.data?.message ||
        "Không thể thêm bài hát."
      );
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async (track) => {
    const audio = audioRef.current;

    if (!audio) return;

    if (previewTrackId === track.id) {
      audio.pause();
      setPreviewTrackId(null);
      return;
    }

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.src = track.musicUrl;

      await audio.play();

      setPreviewTrackId(track.id);
    } catch (error) {
      console.error("Không thể phát thử:", error);
      toast.error("Không thể phát thử bài hát.");
    }
  };

  const handleRename = async (track) => {
    const nextName = window.prompt(
      "Nhập tên mới:",
      track.name
    );

    if (nextName === null) return;

    const normalizedName = nextName.trim();

    if (!normalizedName) {
      toast.error("Tên bài hát không được để trống.");
      return;
    }

    try {
      await api.put(`/admin/music/${track.id}`, {
        name: normalizedName,
      });

      toast.success("Đã đổi tên bài hát.");
      await loadMusic();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể đổi tên bài hát."
      );
    }
  };

  const handleDelete = async (track) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa bài "${track.name}" không?`
    );

    if (!confirmed) return;

    try {
      if (previewTrackId === track.id) {
        stopPreview();
      }

      await api.delete(`/admin/music/${track.id}`);

      toast.success("Đã xóa bài hát.");
      await loadMusic();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể xóa bài hát."
      );
    }
  };

  const handleSaveSelection = async () => {
    try {
      setSavingSelection(true);

      await api.put("/admin/home-music", {
        trackId: selectedTrackId || null,
      });

      toast.success(
        selectedTrackId
          ? "Đã cập nhật nhạc nền trang chủ."
          : "Đã tắt nhạc nền trang chủ."
      );

      onClose?.();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Không thể lưu lựa chọn."
      );
    } finally {
      setSavingSelection(false);
    }
  };

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-slate-950/60
        p-3
        backdrop-blur-sm
        sm:p-4
      "
      onClick={handleClose}
    >
      <div
        className="
          flex max-h-[92dvh] w-full max-w-3xl
          flex-col overflow-hidden
          rounded-3xl
          bg-white
          shadow-2xl
        "
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* HEADER */}
        <div
          className="
            shrink-0
            bg-gradient-to-r
            from-violet-600
            via-purple-600
            to-fuchsia-600
            px-5 py-5
            text-white
            sm:px-6
          "
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="
        flex h-11 w-11 shrink-0
        items-center justify-center
        rounded-2xl
        bg-white/15
        text-2xl
        backdrop-blur-sm
      "
              >
                🎵
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold sm:text-2xl">
                  Quản lý nhạc trang chủ
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={uploading || savingSelection}
              className="
      flex h-10 w-10 shrink-0
      items-center justify-center
      rounded-full
      bg-white/15
      text-xl
      backdrop-blur-sm
      transition
      hover:bg-white/25
      active:scale-95
      disabled:opacity-50
    "
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div
          className="
            min-h-0 flex-1
            overflow-y-auto
            p-4
            sm:p-6
          "
        >
          {/* THÊM BÀI HÁT */}
          <form
            onSubmit={handleUpload}
            className="
              rounded-2xl
              border border-violet-200
              bg-violet-50
              p-4
            "
          >
            <h3 className="font-bold text-slate-800">
              Thêm bài hát
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  className="
                    mb-2 block
                    text-sm font-semibold
                    text-slate-700
                  "
                >
                  Tên bài hát
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  disabled={uploading}
                  placeholder="Nhập tên bài hát"
                  className="
                    h-12 w-full
                    rounded-xl
                    border border-slate-300
                    bg-white
                    px-4
                    outline-none
                    transition
                    focus:border-violet-500
                    focus:ring-4
                    focus:ring-violet-100
                  "
                />
              </div>

              <div>
                <label
                  className="
                    mb-2 block
                    text-sm font-semibold
                    text-slate-700
                  "
                >
                  File nhạc
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.wav,.flac,.m4a,audio/*"
                  onChange={(event) =>
                    setMusicFile(
                      event.target.files?.[0] || null
                    )
                  }
                  disabled={uploading}
                  className="
                    block h-12 w-full
                    rounded-xl
                    border border-slate-300
                    bg-white
                    text-sm
                    text-slate-600

                    file:mr-3
                    file:h-full
                    file:border-0
                    file:bg-violet-600
                    file:px-4
                    file:font-semibold
                    file:text-white
                    hover:file:bg-violet-700
                  "
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="
                mt-4
                flex min-h-[46px] w-full
                items-center justify-center
                gap-2
                rounded-xl
                bg-violet-600
                px-5
                font-semibold
                text-white
                transition
                hover:bg-violet-700
                disabled:opacity-60
              "
            >
              {uploading && (
                <span
                  className="
                    h-5 w-5
                    animate-spin
                    rounded-full
                    border-2
                    border-white/40
                    border-t-white
                  "
                />
              )}

              {uploading
                ? "Đang tải lên..."
                : "Thêm bài hát"}
            </button>
          </form>

          {/* CHỌN NHẠC HOME */}
          <div
            className="
              mt-6
              rounded-2xl
              border border-fuchsia-200
              bg-fuchsia-50
              p-4
            "
          >
            <label
              htmlFor="selected-home-music"
              className="
                mb-2 block
                font-bold
                text-slate-800
              "
            >
              Nhạc phát trên trang Home
            </label>

            <select
              id="selected-home-music"
              value={selectedTrackId}
              onChange={(event) =>
                setSelectedTrackId(
                  event.target.value
                )
              }
              className="
                h-12 w-full
                rounded-xl
                border border-slate-300
                bg-white
                px-4
                outline-none
                transition
                focus:border-fuchsia-500
                focus:ring-4
                focus:ring-fuchsia-100
              "
            >
              <option value="">
                Không phát nhạc
              </option>

              {tracks.map((track) => (
                <option
                  key={track.id}
                  value={track.id}
                >
                  {track.name}
                </option>
              ))}
            </select>
          </div>

          {/* DANH SÁCH */}
          <div className="mt-6">
            <h3 className="font-bold text-slate-800">
              Danh sách bài hát
            </h3>

            {loading ? (
              <div className="py-10 text-center text-slate-500">
                Đang tải danh sách...
              </div>
            ) : tracks.length === 0 ? (
              <div
                className="
                  mt-3
                  rounded-2xl
                  bg-slate-50
                  p-8
                  text-center
                  text-slate-500
                "
              >
                Chưa có bài hát nào.
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className="
                      flex flex-col
                      gap-3
                      rounded-2xl
                      border border-slate-200
                      p-4
                      transition
                      hover:border-violet-200
                      hover:bg-violet-50/30
                      sm:flex-row
                      sm:items-center
                    "
                  >
                    <div
                      className="
                        flex min-w-0 flex-1
                        items-center gap-3
                      "
                    >
                      <div
                        className="
                          flex h-11 w-11
                          shrink-0
                          items-center justify-center
                          rounded-xl
                          bg-purple-100
                          text-xl
                        "
                      >
                        🎵
                      </div>

                      <p
                        className="
                          truncate
                          font-semibold
                          text-slate-800
                        "
                      >
                        {track.name}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* NGHE */}
                      <button
                        type="button"
                        onClick={() =>
                          handlePreview(track)
                        }
                        className="
                          rounded-xl
                          bg-violet-50
                          px-3 py-2
                          text-sm
                          font-semibold
                          text-violet-700
                          transition
                          hover:bg-violet-100
                        "
                      >
                        {previewTrackId === track.id
                          ? "⏸"
                          : "▶"}
                      </button>

                      {/* SỬA */}
                      <button
                        type="button"
                        onClick={() =>
                          handleRename(track)
                        }
                        className="
                          rounded-xl
                          bg-fuchsia-50
                          px-3 py-2
                          text-sm
                          font-semibold
                          text-fuchsia-700
                          transition
                          hover:bg-fuchsia-100
                        "
                      >
                        ✏️
                      </button>

                      {/* XÓA */}
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(track)
                        }
                        className="
                          rounded-xl
                          bg-rose-50
                          px-3 py-2
                          text-sm
                          font-semibold
                          text-rose-600
                          transition
                          hover:bg-rose-100
                        "
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <audio
            ref={audioRef}
            onEnded={() =>
              setPreviewTrackId(null)
            }
          />
        </div>

        {/* FOOTER */}
        <div
          className="
            shrink-0
            border-t border-slate-200
            bg-white
            p-4
            sm:px-6
          "
        >
          <div
            className="
              flex flex-col-reverse
              gap-3
              sm:flex-row
              sm:justify-end
            "
          >
            {/* HỦY */}
            <button
              type="button"
              onClick={handleClose}
              disabled={
                uploading || savingSelection
              }
              className="
                min-h-[48px]
                rounded-xl
                bg-slate-100
                px-6
                font-semibold
                text-slate-700
                transition
                hover:bg-slate-200
                disabled:opacity-50
              "
            >
              Hủy
            </button>

            {/* LƯU */}
            <button
              type="button"
              onClick={handleSaveSelection}
              disabled={
                savingSelection || uploading
              }
              className="
                flex min-h-[48px]
                items-center justify-center
                gap-2
                rounded-xl
                bg-purple-600
                px-6
                font-semibold
                text-white
                transition
                hover:bg-purple-700
                disabled:opacity-60
              "
            >
              {savingSelection
                ? "Đang lưu..."
                : "Lưu lựa chọn"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeMusicManager;