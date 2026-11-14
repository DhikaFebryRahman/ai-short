import type React from "react";
import { useRef, useState } from "react";
import {
  AlertTriangle,
  Film,
  Music,
  Pause,
  Play,
  Upload,
  Volume2,
  Waves,
} from "lucide-react";
import type { MusicMode, ProjectData } from "../../../shared/types";
import { api } from "../lib/api";

type AsetTabProps = {
  readonly project: ProjectData;
  readonly onProjectReplaced: (project: ProjectData) => void;
};

const validateClientFile = (
  file: File,
  allowedExts: readonly string[],
  maxMb: number,
): string | null => {
  if (/\s/.test(file.name)) {
    return `Nama file "${file.name}" mengandung spasi. Ganti nama tanpa spasi sebelum mengunggah.`;
  }
  const lower = file.name.toLowerCase();
  if (!allowedExts.some((ext) => lower.endsWith(ext))) {
    return `Format tidak didukung. Gunakan: ${allowedExts.join(", ").toUpperCase()}.`;
  }
  if (file.size > maxMb * 1024 * 1024) {
    return `Ukuran file melebihi batas ${maxMb} MB.`;
  }
  return null;
};

export const AsetTab: React.FC<AsetTabProps> = ({
  project,
  onProjectReplaced,
}) => {
  const [voDragging, setVoDragging] = useState(false);
  const [refDragging, setRefDragging] = useState(false);
  const [uploadingVo, setUploadingVo] = useState(false);
  const [uploadingRef, setUploadingRef] = useState(false);
  const [musicBusy, setMusicBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingVo, setIsPlayingVo] = useState(false);

  const voInputRef = useRef<HTMLInputElement | null>(null);
  const refInputRef = useRef<HTMLInputElement | null>(null);
  const musicInputRef = useRef<HTMLInputElement | null>(null);
  const voAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleVoiceoverFile = async (file: File) => {
    const errMsg = validateClientFile(file, [".mp3", ".wav", ".m4a"], 100);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    setError(null);
    setUploadingVo(true);
    try {
      const res = await api.uploadVoiceover(project.slug, file);
      onProjectReplaced(res.project);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload voiceover.");
    } finally {
      setUploadingVo(false);
    }
  };

  const handleReferenceFile = async (file: File) => {
    const errMsg = validateClientFile(
      file,
      [".mp4", ".mov", ".webm", ".mkv"],
      250,
    );
    if (errMsg) {
      setError(errMsg);
      return;
    }
    setError(null);
    setUploadingRef(true);
    try {
      const res = await api.uploadReference(project.slug, file);
      onProjectReplaced(res.project);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal upload video referensi.",
      );
    } finally {
      setUploadingRef(false);
    }
  };

  const handleMusicModeChange = async (mode: MusicMode) => {
    setError(null);
    setMusicBusy(true);
    try {
      if (mode === "synthetic") {
        const res = await api.generateSyntheticMusic(project.slug);
        onProjectReplaced(res.project);
      } else {
        const res = await api.updateMusicConfig(
          project.slug,
          mode,
          project.music.volume,
        );
        onProjectReplaced(res.project);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengatur musik latar.",
      );
    } finally {
      setMusicBusy(false);
    }
  };

  const handleMusicFile = async (file: File) => {
    const errMsg = validateClientFile(file, [".mp3", ".wav", ".m4a"], 100);
    if (errMsg) {
      setError(errMsg);
      return;
    }
    setError(null);
    setMusicBusy(true);
    try {
      const res = await api.uploadMusic(project.slug, file);
      onProjectReplaced(res.project);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload musik.");
    } finally {
      setMusicBusy(false);
    }
  };

  const togglePlayVo = () => {
    const el = voAudioRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setIsPlayingVo(true);
    } else {
      el.pause();
      setIsPlayingVo(false);
    }
  };

  const voDuration = project.voiceover?.durationSeconds ?? null;
  const totalVideoSeconds =
    voDuration !== null ? Math.ceil(voDuration + 1.0 + 1.5) : null;

  return (
    <div className="stack-md">
      <div className="page-header">
        <div>
          <h1 className="page-title">Aset</h1>
          <p className="page-subtitle">
            Unggah voiceover, video referensi (opsional), dan pilih musik latar.
            Nama file tidak boleh mengandung spasi.
          </p>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger">
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>{error}</div>
        </div>
      ) : null}

      {/* Voiceover section */}
      <div className="card stack-sm">
        <div className="row-between">
          <div className="row">
            <Waves size={18} color="var(--accent)" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              Voiceover (MP3 / WAV / M4A)
            </span>
          </div>
          <span className="pill">
            Simpan ke <span className="mono">audio/</span>
          </span>
        </div>

        <div
          className={`dropzone ${voDragging ? "dragging" : ""}`}
          onClick={() => voInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setVoDragging(true);
          }}
          onDragLeave={() => setVoDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setVoDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) void handleVoiceoverFile(file);
          }}
        >
          <Upload size={22} color="var(--accent)" />
          <div style={{ fontWeight: 600 }}>
            {uploadingVo
              ? "Mengunggah & mendeteksi jeda dengan FFmpeg..."
              : "Seret file voiceover ke sini atau klik untuk memilih"}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
            Format: MP3, WAV, M4A • Maks 100 MB • Nama file tanpa spasi
          </div>
          <input
            ref={voInputRef}
            type="file"
            accept=".mp3,.wav,.m4a"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleVoiceoverFile(file);
              e.target.value = "";
            }}
          />
        </div>

        {project.voiceover ? (
          <div className="stack-sm">
            <div className="row-between">
              <div className="row-wrap">
                <span className="mono" style={{ fontWeight: 600 }}>
                  {project.voiceover.relativePath}
                </span>
                <span className="pill tabular">
                  Durasi VO: {project.voiceover.durationSeconds.toFixed(2)}s
                </span>
                <span
                  className={`pill tabular ${
                    totalVideoSeconds !== null && totalVideoSeconds > 60
                      ? "pill-danger"
                      : "pill-success"
                  }`}
                >
                  Total Video: {totalVideoSeconds}s (VO + 1s + 1,5s, dibulatkan ke
                  atas)
                </span>
              </div>

              <button type="button" className="btn btn-sm" onClick={togglePlayVo}>
                {isPlayingVo ? <Pause size={14} /> : <Play size={14} />}
                {isPlayingVo ? "Jeda" : "Putar"}
              </button>
            </div>

            {totalVideoSeconds !== null && totalVideoSeconds > 60 ? (
              <div className="alert alert-danger">
                <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Durasi melebihi 60 detik!</strong> Total durasi terhitung{" "}
                  <span className="tabular">{totalVideoSeconds} detik</span>.
                  Perpendek voiceover atau konfirmasi terlebih dahulu sebelum
                  produksi.
                </div>
              </div>
            ) : null}

            <div className="waveform" aria-label="Gelombang suara voiceover">
              {project.voiceover.waveformPeaks.map((peak, i) => (
                <div
                  key={i}
                  className="waveform-bar"
                  style={{ height: `${Math.round(peak * 100)}%` }}
                />
              ))}
            </div>

            <audio
              ref={voAudioRef}
              src={`/projects-media/${project.slug}/${project.voiceover.relativePath}`}
              onEnded={() => setIsPlayingVo(false)}
              controls
              style={{ width: "100%", height: 36 }}
            />

            <div className="stack-sm">
              <div className="field-label" style={{ margin: 0 }}>
                Daftar Jeda Terdeteksi (ffmpeg silencedetect):{" "}
                {project.voiceover.silences.length}
              </div>
              {project.voiceover.silences.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  Tidak ada jeda senyap ≥ 0,25 detik terdeteksi.
                </div>
              ) : (
                <div className="row-wrap">
                  {project.voiceover.silences.map((s, idx) => (
                    <span key={idx} className="pill tabular mono">
                      {s.start.toFixed(2)}s → {s.end.toFixed(2)}s (
                      {s.duration.toFixed(2)}s)
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Reference video section */}
      <div className="card stack-sm">
        <div className="row-between">
          <div className="row">
            <Film size={18} color="var(--cyan)" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              Video Referensi (Opsional)
            </span>
          </div>
          <span className="pill pill-warning">Ikuti gaya, bukan isi</span>
        </div>

        <div
          className={`dropzone ${refDragging ? "dragging" : ""}`}
          onClick={() => refInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setRefDragging(true);
          }}
          onDragLeave={() => setRefDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setRefDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) void handleReferenceFile(file);
          }}
        >
          <Upload size={22} color="var(--cyan)" />
          <div style={{ fontWeight: 600 }}>
            {uploadingRef
              ? "Mengunggah & membuat contact sheet frame..."
              : "Seret video referensi (MP4/MOV/WEBM) ke sini atau klik"}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
            Disalin ke <span className="mono">referensi/</span> • Nama file
            tanpa spasi • Maks 250 MB
          </div>
          <input
            ref={refInputRef}
            type="file"
            accept=".mp4,.mov,.webm,.mkv"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleReferenceFile(file);
              e.target.value = "";
            }}
          />
        </div>

        {project.reference ? (
          <div className="stack-sm">
            <div className="row-between">
              <span className="mono">{project.reference.relativePath}</span>
              <span className="pill pill-warning">Ikuti gaya, bukan isi</span>
            </div>
            {project.reference.contactSheetPath ? (
              <img
                src={`/projects-media/${project.slug}/${project.reference.contactSheetPath}?t=${encodeURIComponent(project.updatedAt)}`}
                alt="Contact sheet video referensi"
                style={{
                  width: "100%",
                  borderRadius: "var(--radius-control)",
                  border: "1px solid var(--border-subtle)",
                }}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Background music section */}
      <div className="card stack-sm">
        <div className="row-between">
          <div className="row">
            <Music size={18} color="var(--accent)" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Musik Latar</span>
          </div>
          <span className="pill tabular">
            Volume: {Math.round((project.music.volume ?? 0.14) * 100)}%
          </span>
        </div>

        <div className="row-wrap">
          <button
            type="button"
            className={`btn btn-sm ${project.music.mode === "none" ? "btn-primary" : ""}`}
            disabled={musicBusy}
            onClick={() => handleMusicModeChange("none")}
          >
            Tidak ada
          </button>
          <button
            type="button"
            className={`btn btn-sm ${project.music.mode === "synthetic" ? "btn-primary" : ""}`}
            disabled={musicBusy}
            onClick={() => handleMusicModeChange("synthetic")}
          >
            Sintetis (Pad Lembut)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${project.music.mode === "upload" ? "btn-primary" : ""}`}
            disabled={musicBusy}
            onClick={() => musicInputRef.current?.click()}
          >
            Unggah Sendiri
          </button>
          <input
            ref={musicInputRef}
            type="file"
            accept=".mp3,.wav,.m4a"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleMusicFile(file);
              e.target.value = "";
            }}
          />
        </div>

        {project.music.mode !== "none" ? (
          <div className="stack-sm">
            <div className="row">
              <Volume2 size={16} color="var(--text-secondary)" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={project.music.volume}
                onChange={async (e) => {
                  const vol = Number(e.target.value);
                  const res = await api.updateMusicConfig(
                    project.slug,
                    project.music.mode,
                    vol,
                  );
                  onProjectReplaced(res.project);
                }}
                style={{ flex: 1 }}
              />
              <span className="mono tabular" style={{ width: 46, textAlign: "right" }}>
                {Math.round(project.music.volume * 100)}%
              </span>
            </div>

            {project.music.relativePath ? (
              <audio
                controls
                src={`/projects-media/${project.slug}/${project.music.relativePath}?t=${encodeURIComponent(project.updatedAt)}`}
                style={{ width: "100%", height: 36 }}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

