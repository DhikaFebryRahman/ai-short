import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FolderOpen,
  Image as ImageIcon,
  Lock,
  Play,
  ShieldCheck,
} from "lucide-react";
import type { ProjectData, RenderRecord } from "../../../shared/types";
import { api } from "../lib/api";

type RenderHasilTabProps = {
  readonly project: ProjectData;
  readonly onProjectReplaced: (project: ProjectData) => void;
};

export const RenderHasilTab: React.FC<RenderHasilTabProps> = ({
  project,
  onProjectReplaced,
}) => {
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedRenderId, setSelectedRenderId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    api
      .previewStatus(project.slug)
      .then((res) => setPreviewUrl(res.running ? res.url : null))
      .catch(() => setPreviewUrl(null));

    return () => {
      eventSourceRef.current?.close();
    };
  }, [project.slug]);

  const hasComposition = Boolean(project.hasComposition);
  const hasVoiceover = Boolean(project.voiceover);
  const totalSec = project.voiceover
    ? Math.ceil(project.voiceover.durationSeconds + 2.5)
    : 0;
  const underLimit = !hasVoiceover || totalSec <= 60;
  const canRender = hasComposition && underLimit && !rendering;

  const activeRecord: RenderRecord | undefined =
    project.renders.find((r) => r.id === selectedRenderId) ?? project.renders[0];

  const handleStartRender = async () => {
    setError(null);
    setRendering(true);
    setProgress(0);
    setLogs([]);

    try {
      const { jobId } = await api.startRender(project.slug);
      const es = new EventSource(
        `/api/projects/${project.slug}/render/stream/${jobId}`,
      );
      eventSourceRef.current = es;

      es.addEventListener("log", (ev) => {
        const payload = JSON.parse((ev as MessageEvent).data) as {
          line: string;
          progress: number;
        };
        setProgress(payload.progress);
        setLogs((prev) => [...prev, payload.line]);
      });

      es.addEventListener("done", async (ev) => {
        const payload = JSON.parse((ev as MessageEvent).data) as {
          record: RenderRecord;
          project?: ProjectData;
        };
        setProgress(100);
        setRendering(false);
        setSelectedRenderId(payload.record.id);
        if (payload.project) {
          onProjectReplaced(payload.project);
        } else {
          const refreshed = await api.getProject(project.slug);
          onProjectReplaced(refreshed.project);
        }
        es.close();
      });

      es.addEventListener("render_error", (ev) => {
        const payload = JSON.parse((ev as MessageEvent).data) as {
          error: string;
        };
        setError(payload.error);
        setRendering(false);
        es.close();
      });

      es.onerror = () => {
        if (rendering) {
          setError("Koneksi streaming log terputus.");
          setRendering(false);
        }
        es.close();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memulai render.");
      setRendering(false);
    }
  };

  return (
    <div className="stack-md">
      <div className="page-header">
        <div>
          <h1 className="page-title">Render &amp; Hasil</h1>
          <p className="page-subtitle">
            Eksekusi{" "}
            <span className="mono">
              npx hyperframes render --quality delivery
            </span>{" "}
            dan lihat hasil MP4 serta thumbnail 9:16 di{" "}
            <span className="mono">episodes/{project.slug}/renders/</span>.
          </p>
        </div>

        <div className="row-wrap">
          <span className="pill">
            <Lock size={13} />
            1080×1920
          </span>
          <span className="pill">
            <Lock size={13} />
            30 fps
          </span>
          {previewUrl ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm"
            >
              <ExternalLink size={14} />
              Studio Preview
            </a>
          ) : null}
          <button
            type="button"
            className="btn"
            onClick={() => api.openFolder(project.slug, "renders")}
          >
            <FolderOpen size={15} />
            Buka <span className="mono">renders/</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canRender}
            onClick={handleStartRender}
          >
            <Play size={15} />
            {rendering ? `Merender (${progress}%)...` : "Render MP4"}
          </button>
        </div>
      </div>

      {/* Pre-render readiness checklist */}
      <div className="card row-wrap">
        <span
          className={`pill ${hasComposition ? "pill-success" : "pill-warning"}`}
        >
          <CheckCircle2 size={13} />
          Komposisi HyperFrames{" "}
          {hasComposition ? "siap" : "belum dibuat oleh agent"}
        </span>
        <span
          className={`pill ${hasVoiceover ? "pill-success" : "pill-warning"}`}
        >
          <CheckCircle2 size={13} />
          Voiceover {hasVoiceover ? "tersedia" : "belum ada"}
        </span>
        {hasVoiceover ? (
          <span
            className={`pill tabular ${underLimit ? "pill-success" : "pill-danger"}`}
          >
            Durasi terhitung: {totalSec}s (maks 60s)
          </span>
        ) : null}
        <span
          className={`pill ${project.thumbnailPath ? "pill-success" : ""}`}
        >
          <ImageIcon size={13} />
          Thumbnail 9:16 {project.thumbnailPath ? "tersedia" : "belum dibuat"}
        </span>
      </div>

      {error ? (
        <div className="alert alert-danger">
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>{error}</div>
        </div>
      ) : null}

      {rendering || logs.length > 0 ? (
        <div className="card stack-sm">
          <div className="row-between">
            <span style={{ fontWeight: 600 }}>Progres &amp; Log Render</span>
            <span className="mono tabular" style={{ color: "var(--accent)" }}>
              {progress}%
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: "var(--bg-input)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "var(--accent)",
              }}
            />
          </div>
          <div className="log-box">
            {logs.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      ) : null}

      {activeRecord ? (
        <div className="grid-2" style={{ alignItems: "start" }}>
          <div className="card stack-sm">
            <div className="row-between">
              <span style={{ fontWeight: 700 }}>Pemutar Hasil Render</span>
              <span
                className="mono"
                style={{ fontSize: 12, color: "var(--text-secondary)" }}
              >
                {activeRecord.fileName}
              </span>
            </div>
            <video
              key={activeRecord.id}
              controls
              src={`/episodes-media/${project.slug}/${activeRecord.relativePath}?t=${encodeURIComponent(activeRecord.createdAt)}`}
              style={{
                width: "100%",
                maxHeight: 540,
                borderRadius: "var(--radius-control)",
                background: "#000",
              }}
            />
          </div>

          <div className="stack-md">
            <div className="card stack-sm">
              <div className="row-between">
                <div className="row">
                  <ShieldCheck size={18} color="var(--success)" />
                  <span style={{ fontWeight: 700 }}>
                    Verifikasi Otomatis (ffprobe &amp; ffmpeg)
                  </span>
                </div>
                <span
                  className={`pill ${
                    activeRecord.verification.passed
                      ? "pill-success"
                      : "pill-danger"
                  }`}
                >
                  {activeRecord.verification.passed ? "LULUS" : "PERLU CEK"}
                </span>
              </div>

              <div className="stack-sm">
                <div className="row-between">
                  <span style={{ color: "var(--text-secondary)" }}>Durasi</span>
                  <span className="mono tabular">
                    {activeRecord.verification.durationSeconds}s
                  </span>
                </div>
                <div className="row-between">
                  <span style={{ color: "var(--text-secondary)" }}>
                    Jumlah Frame
                  </span>
                  <span className="mono tabular">
                    {activeRecord.verification.frameCount}
                  </span>
                </div>
                <div className="row-between">
                  <span style={{ color: "var(--text-secondary)" }}>
                    Resolusi &amp; FPS
                  </span>
                  <span className="mono tabular">
                    {activeRecord.verification.width}×
                    {activeRecord.verification.height} @{" "}
                    {activeRecord.verification.fps} fps
                  </span>
                </div>
                <div className="row-between">
                  <span style={{ color: "var(--text-secondary)" }}>
                    Codec Video
                  </span>
                  <span className="mono">
                    {activeRecord.verification.videoCodec}
                  </span>
                </div>
                <div className="row-between">
                  <span style={{ color: "var(--text-secondary)" }}>
                    Codec Audio
                  </span>
                  <span className="mono">
                    {activeRecord.verification.audioCodec}
                  </span>
                </div>
                <div className="row-between">
                  <span style={{ color: "var(--text-secondary)" }}>
                    Level Suara Maksimum
                  </span>
                  <span className="mono tabular">
                    {activeRecord.verification.maxVolumeDb !== null
                      ? `${activeRecord.verification.maxVolumeDb} dB`
                      : "Terdeteksi di render CLI"}
                  </span>
                </div>
                <div className="row-between">
                  <span style={{ color: "var(--text-secondary)" }}>
                    Deteksi Layar Hitam
                  </span>
                  <span
                    className={`pill ${
                      activeRecord.verification.blackFramesDetected
                        ? "pill-danger"
                        : "pill-success"
                    }`}
                  >
                    {activeRecord.verification.blackFramesDetected
                      ? `${activeRecord.verification.blackSegments.length} segmen hitam`
                      : "Bersih (0 layar hitam)"}
                  </span>
                </div>
              </div>
            </div>

            {project.thumbnailPath ? (
              <div className="card stack-sm">
                <div className="row-between">
                  <span style={{ fontWeight: 700 }}>
                    Thumbnail YouTube Shorts (9:16)
                  </span>
                  <span className="mono" style={{ fontSize: 12 }}>
                    {project.thumbnailPath}
                  </span>
                </div>
                <img
                  src={`/episodes-media/${project.slug}/${project.thumbnailPath}?t=${encodeURIComponent(project.updatedAt)}`}
                  alt="Thumbnail YouTube Shorts 9:16"
                  style={{
                    width: "100%",
                    maxHeight: 380,
                    objectFit: "contain",
                    borderRadius: "var(--radius-control)",
                    border: "1px solid var(--border-subtle)",
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="card">
          Belum ada hasil render MP4 untuk episode ini. Pastikan komposisi
          HyperFrames sudah dibangun agent, lalu klik <strong>Render MP4</strong>{" "}
          atau minta agent merender penuh.
        </div>
      )}

      {project.renders.length > 0 ? (
        <div className="card stack-sm">
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            Riwayat Hasil Render ({project.renders.length})
          </div>
          <div className="stack-sm">
            {project.renders.map((rec) => {
              const selected = rec.id === activeRecord?.id;
              return (
                <div key={rec.id} className="row-between">
                  <div className="row-wrap">
                    <span className="mono">{rec.fileName}</span>
                    <span className="pill tabular">
                      {rec.verification.durationSeconds}s •{" "}
                      {rec.verification.width}×{rec.verification.height}
                    </span>
                    <span
                      className={`pill ${
                        rec.verification.passed ? "pill-success" : "pill-danger"
                      }`}
                    >
                      {rec.verification.passed ? "Terverifikasi" : "Perlu Cek"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`btn btn-sm ${selected ? "btn-primary" : ""}`}
                    onClick={() => setSelectedRenderId(rec.id)}
                  >
                    {selected ? "Sedang Diputar" : "Putar Versi Ini"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
