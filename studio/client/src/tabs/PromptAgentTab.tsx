import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageSquarePlus,
  Play,
  RefreshCw,
  ShieldCheck,
  Square,
  Trash2,
} from "lucide-react";
import type {
  PreviewStatusResponse,
  ProjectData,
  RevisionNote,
} from "../../../shared/types";
import { api } from "../lib/api";
import {
  buildAgentPromptB,
  buildRenderApprovalPrompt,
  buildRevisionPrompt,
} from "../lib/promptBuilder";

type PromptAgentTabProps = {
  readonly project: ProjectData;
  readonly onUpdate: (next: Partial<ProjectData>) => void;
  readonly onProjectReplaced: (project: ProjectData) => void;
};

export const PromptAgentTab: React.FC<PromptAgentTabProps> = ({
  project,
  onUpdate,
  onProjectReplaced,
}) => {
  const [copiedType, setCopiedType] = useState<
    "brief" | "revise" | "render" | null
  >(null);

  const [preview, setPreview] = useState<PreviewStatusResponse>({
    running: false,
    url: null,
    port: null,
  });
  const [previewBusy, setPreviewBusy] = useState(false);
  const [checkBusy, setCheckBusy] = useState(false);
  const [iframeNonce, setIframeNonce] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [revTarget, setRevTarget] = useState("Scene 01");
  const [revTime, setRevTime] = useState("");
  const [revNote, setRevNote] = useState("");

  useEffect(() => {
    let active = true;
    api
      .previewStatus(project.slug)
      .then((res) => {
        if (active) setPreview(res);
      })
      .catch(() => {
        // Ignore initial poll failure
      });
    return () => {
      active = false;
    };
  }, [project.slug]);

  const targetOptions = useMemo(() => {
    const sceneTargets = project.scenes.map(
      (s) => `${s.id.toUpperCase()}: ${s.judul}`,
    );
    return [
      ...sceneTargets,
      "Top Bar / HUD",
      "Bagian Bawah Layar",
      "Caption Kinetik",
      "Transisi Antar Scene",
      "Audio / BGM / SFX",
      "Thumbnail 9:16",
      "Umum",
    ];
  }, [project.scenes]);

  useEffect(() => {
    if (targetOptions.length > 0 && !targetOptions.includes(revTarget)) {
      setRevTarget(targetOptions[0]);
    }
  }, [targetOptions, revTarget]);

  const briefPrompt = useMemo(() => buildAgentPromptB(project), [project]);
  const revisionPrompt = useMemo(() => buildRevisionPrompt(project), [project]);
  const renderPrompt = useMemo(
    () => buildRenderApprovalPrompt(project),
    [project],
  );

  const copyText = async (
    kind: "brief" | "revise" | "render",
    text: string,
  ) => {
    await navigator.clipboard.writeText(text);
    setCopiedType(kind);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleStartPreview = async () => {
    setPreviewBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await api.previewStart(project.slug);
      setPreview(res);
      setIframeNonce((n) => n + 1);
      setStatusMessage(
        res.url
          ? `Studio Preview aktif di ${res.url}`
          : "Studio Preview HyperFrames dijalankan.",
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal menyalakan Studio Preview.",
      );
    } finally {
      setPreviewBusy(false);
    }
  };

  const handleStopPreview = async () => {
    setPreviewBusy(true);
    setErrorMessage(null);
    try {
      const res = await api.previewStop(project.slug);
      setPreview(res);
      setStatusMessage("Studio Preview dihentikan.");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Gagal menghentikan Studio Preview.",
      );
    } finally {
      setPreviewBusy(false);
    }
  };

  const handleRunCheck = async () => {
    setCheckBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await api.runCheck(project.slug);
      onProjectReplaced(res.project);
      setStatusMessage(
        res.check.ok
          ? `hyperframes check lolos (0 error, ${res.check.lintWarnings + res.check.layoutWarnings + res.check.craftWarnings} warning).`
          : "hyperframes check menemukan error. Periksa detailnya.",
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal menjalankan check.",
      );
    } finally {
      setCheckBusy(false);
    }
  };

  const handleAddRevision = () => {
    const trimmed = revNote.trim();
    if (!trimmed) return;
    const nextItem: RevisionNote = {
      id: `rev-${Date.now()}`,
      target: revTarget,
      timestamp: revTime.trim(),
      note: trimmed,
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    onUpdate({
      revisions: [nextItem, ...(project.revisions ?? [])],
    });
    setRevTime("");
    setRevNote("");
  };

  const toggleRevision = (id: string) => {
    const next = (project.revisions ?? []).map((r) =>
      r.id === id ? { ...r, resolved: !r.resolved } : r,
    );
    onUpdate({ revisions: next });
  };

  const deleteRevision = (id: string) => {
    const next = (project.revisions ?? []).filter((r) => r.id !== id);
    onUpdate({ revisions: next });
  };

  const revisions = project.revisions ?? [];

  return (
    <div className="stack-md">
      <div className="page-header">
        <div>
          <h1 className="page-title">Review &amp; Revisi Agent</h1>
          <p className="page-subtitle">
            Tonton Studio Preview di sebelah kanan sambil mencatat bagian yang
            kurang sesuai di sebelah kiri, lalu salin prompt-nya ke chat agent.
          </p>
        </div>

        <div className="row-wrap">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => copyText("brief", briefPrompt)}
          >
            {copiedType === "brief" ? <Check size={14} /> : <Copy size={14} />}
            {copiedType === "brief"
              ? "Brief Tersalin!"
              : "Salin Brief Episode"}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            disabled={!project.hasComposition || checkBusy}
            onClick={handleRunCheck}
          >
            <ShieldCheck size={14} />
            {checkBusy ? "Mengecek..." : "Jalankan Check"}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => copyText("render", renderPrompt)}
          >
            {copiedType === "render" ? <Check size={14} /> : <Copy size={14} />}
            {copiedType === "render"
              ? "Prompt Render Tersalin!"
              : "Sudah Pas → Salin Prompt Render & Thumbnail"}
          </button>
        </div>
      </div>

      {statusMessage ? (
        <div className="alert alert-success">{statusMessage}</div>
      ) : null}
      {errorMessage ? (
        <div className="alert alert-danger">{errorMessage}</div>
      ) : null}

      <div className="prompt-split">
        {/* Left column: Revision logger + copyable revision prompt */}
        <div className="stack-md">
          <div className="card stack-sm">
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              Catat Bagian yang Kurang Sesuai
            </div>

            <div className="grid-2">
              <div>
                <label className="field-label" htmlFor="rev-target">
                  Bagian / Scene
                </label>
                <select
                  id="rev-target"
                  value={revTarget}
                  onChange={(e) => setRevTarget(e.target.value)}
                >
                  {targetOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="rev-time">
                  Detik di Preview (Opsional)
                </label>
                <input
                  id="rev-time"
                  type="text"
                  placeholder="Contoh: 35s atau 18.5s–20s"
                  value={revTime}
                  onChange={(e) => setRevTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="rev-note">
                Apa yang perlu diperbaiki?
              </label>
              <textarea
                id="rev-note"
                rows={3}
                placeholder="Contoh: Indikator panah tembaga & seng masih sedikit melenceng, geser supaya pas menyentuh kepingannya."
                value={revNote}
                onChange={(e) => setRevNote(e.target.value)}
              />
            </div>

            <div className="row-between">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleAddRevision}
              >
                <MessageSquarePlus size={14} />
                Tambah Catatan
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => copyText("revise", revisionPrompt)}
              >
                {copiedType === "revise" ? (
                  <Check size={14} />
                ) : (
                  <Copy size={14} />
                )}
                {copiedType === "revise"
                  ? "Prompt Revisi Tersalin!"
                  : "Salin Prompt Revisi"}
              </button>
            </div>

            {revisions.length > 0 ? (
              <div className="stack-sm" style={{ marginTop: 4 }}>
                {revisions.map((item) => (
                  <div
                    key={item.id}
                    className="row-between"
                    style={{
                      padding: 10,
                      borderRadius: "var(--radius-control)",
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      opacity: item.resolved ? 0.6 : 1,
                    }}
                  >
                    <label
                      className="row"
                      style={{ cursor: "pointer", flex: 1 }}
                    >
                      <input
                        type="checkbox"
                        checked={item.resolved}
                        onChange={() => toggleRevision(item.id)}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {item.target}
                          {item.timestamp ? ` (${item.timestamp})` : ""}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            textDecoration: item.resolved
                              ? "line-through"
                              : "none",
                          }}
                        >
                          {item.note}
                        </div>
                      </div>
                    </label>
                    <button
                      type="button"
                      className="btn btn-sm"
                      aria-label="Hapus catatan"
                      onClick={() => deleteRevision(item.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="card stack-sm">
            <label
              className="field-label"
              htmlFor="prompt-revise-preview"
              style={{ margin: 0 }}
            >
              Pratinjau Prompt Revisi (Paste ke Chat Agent)
            </label>
            <textarea
              id="prompt-revise-preview"
              className="mono"
              rows={9}
              readOnly
              value={revisionPrompt}
            />
          </div>

          {project.lastCheck ? (
            <div className="card row-wrap" style={{ fontSize: 12 }}>
              <span
                className={`pill ${project.lastCheck.ok ? "pill-success" : "pill-danger"}`}
              >
                <CheckCircle2 size={13} />
                {project.lastCheck.ok ? "Check Lolos" : "Ada Error Check"}
              </span>
              <span className="pill tabular">
                Lint: {project.lastCheck.lintErrors} err /{" "}
                {project.lastCheck.lintWarnings} warn
              </span>
              <span className="pill tabular">
                Contrast err: {project.lastCheck.contrastErrors}
              </span>
              <span className="pill tabular">
                Layout warn: {project.lastCheck.layoutWarnings}
              </span>
              <span className="pill tabular">
                Audio err: {project.lastCheck.audioErrors}
              </span>
            </div>
          ) : null}
        </div>

        {/* Right column: Embedded Live HyperFrames Studio Preview */}
        <div className="card stack-sm" style={{ minHeight: 680 }}>
          <div className="row-between">
            <div className="row-wrap">
              <span
                className={`dot ${preview.running ? "dot-green" : "dot-red"}`}
                aria-hidden="true"
              />
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                Studio Preview
              </span>
              <span className="mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                episodes/{project.slug}/
              </span>
            </div>

            <div className="row-wrap">
              {preview.running ? (
                <>
                  <button
                    type="button"
                    className="btn btn-sm"
                    title="Muat ulang iframe preview"
                    onClick={() => setIframeNonce((n) => n + 1)}
                  >
                    <RefreshCw size={13} />
                  </button>
                  {preview.url ? (
                    <a
                      href={preview.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm"
                    >
                      <ExternalLink size={13} />
                      Tab Baru
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-sm"
                    disabled={previewBusy}
                    onClick={handleStopPreview}
                  >
                    <Square size={12} />
                    Hentikan
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  disabled={!project.hasComposition || previewBusy}
                  onClick={handleStartPreview}
                >
                  <Play size={14} />
                  {previewBusy ? "Menyalakan..." : "Mulai Preview"}
                </button>
              )}
            </div>
          </div>

          {preview.running && preview.url ? (
            <iframe
              key={`${preview.url}-${iframeNonce}`}
              src={preview.url}
              title={`HyperFrames Studio Preview: ${project.title}`}
              style={{
                width: "100%",
                height: 660,
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-control)",
                background: "var(--bg-stage)",
              }}
            />
          ) : (
            <div
              className="stack-sm"
              style={{
                flex: 1,
                minHeight: 580,
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                border: "1px dashed var(--border-strong)",
                borderRadius: "var(--radius-control)",
                padding: 28,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {project.hasComposition
                  ? "Studio Preview belum menyala"
                  : "Komposisi HyperFrames belum dibuat agent"}
              </div>
              <div
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  maxWidth: 380,
                }}
              >
                {project.hasComposition
                  ? "Klik tombol di bawah untuk menampilkan preview video interaktif langsung di sini."
                  : "Setelah kamu tempel GPT & upload VO, klik 'Salin Brief Episode' di kanan atas lalu kirim ke agent."}
              </div>
              {project.hasComposition ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={previewBusy}
                  onClick={handleStartPreview}
                >
                  <Play size={15} />
                  {previewBusy
                    ? "Menyalakan Studio Preview..."
                    : "Nyalakan & Tampilkan Preview"}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
