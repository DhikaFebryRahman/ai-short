import type React from "react";
import { useRef, useState } from "react";
import { AlertTriangle, Pause, Play, Upload, Waves } from "lucide-react";
import type { ProjectData } from "../../../shared/types";
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
  const [uploadingVo, setUploadingVo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingVo, setIsPlayingVo] = useState(false);

  const voInputRef = useRef<HTMLInputElement | null>(null);
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
          <h1 className="page-title">Aset Voiceover</h1>
          <p className="page-subtitle">
            Unggah file suara voiceover. BGM dan SFX ditangani otomatis oleh
            agent via HyperFrames (<span className="mono">media-use</span> /
            sintesis lokal).
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
            Simpan ke <span className="mono">assets/audio/</span>
          </span>
        </div>

        <button
          type="button"
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
          <Upload size={22} color="var(--accent)" aria-hidden="true" />
          <div style={{ fontWeight: 600 }}>
            {uploadingVo
              ? "Mengunggah & mendeteksi jeda dengan FFmpeg..."
              : "Seret file voiceover ke sini atau klik untuk memilih"}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
            Format: MP3, WAV, M4A • Maks 100 MB • Otomatis disimpan sebagai{" "}
            <span className="mono">vo.*</span>
          </div>
        </button>

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
                  <strong>Durasi melebihi 60 detik!</strong> Total durasi
                  terhitung <span className="tabular">{totalVideoSeconds} detik</span>
                  . Perpendek voiceover atau konfirmasi terlebih dahulu sebelum
                  produksi.
                </div>
              </div>
            ) : null}

            {project.voiceover.waveformPeaks.length > 0 ? (
              <div className="waveform" aria-label="Gelombang suara voiceover">
                {project.voiceover.waveformPeaks.map((peak, i) => (
                  <div
                    key={i}
                    className="waveform-bar"
                    style={{ height: `${Math.round(peak * 100)}%` }}
                  />
                ))}
              </div>
            ) : null}

            <audio
              ref={voAudioRef}
              src={`/episodes-media/${project.slug}/${project.voiceover.relativePath}?t=${encodeURIComponent(project.updatedAt)}`}
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
                  Tidak ada jeda senyap ≥ 0,25 detik terdeteksi (atau VO diambil
                  otomatis dari folder).
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
    </div>
  );
};
