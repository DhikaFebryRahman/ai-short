import type React from "react";
import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Copy,
  FolderOpen,
  FolderPlus,
  Plus,
} from "lucide-react";
import type { ProjectPipelineStatus, ProjectSummary } from "../../../shared/types";

type ProyekTabProps = {
  readonly projects: readonly ProjectSummary[];
  readonly activeSlug: string | null;
  readonly loading: boolean;
  readonly onSelect: (slug: string) => void;
  readonly onCreate: (title: string, seri: string) => Promise<void>;
  readonly onDuplicate: (slug: string) => Promise<void>;
  readonly onArchiveToggle: (slug: string, archived: boolean) => Promise<void>;
  readonly onOpenFolder: (slug: string) => Promise<void>;
};

const PIPELINE_STEPS: readonly {
  readonly key: keyof ProjectPipelineStatus;
  readonly label: string;
}[] = [
  { key: "naskah", label: "Naskah/Topik" },
  { key: "voiceover", label: "Voiceover" },
  { key: "komposisi", label: "Komposisi" },
  { key: "render", label: "MP4" },
  { key: "thumbnail", label: "Thumbnail 9:16" },
  { key: "terverifikasi", label: "Terverifikasi" },
];

export const ProyekTab: React.FC<ProyekTabProps> = ({
  projects,
  activeSlug,
  loading,
  onSelect,
  onCreate,
  onDuplicate,
  onArchiveToggle,
  onOpenFolder,
}) => {
  const [title, setTitle] = useState("");
  const [seri, setSeri] = useState("Kapsul Fakta");
  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleProjects = projects.filter((p) =>
    showArchived ? p.archived : !p.archived,
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Masukkan judul proyek terlebih dahulu.");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      await onCreate(title.trim(), seri.trim() || "KAPSUL FAKTA");
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat proyek.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="stack-md">
      <div className="page-header">
        <div>
          <h1 className="page-title">Episode</h1>
          <p className="page-subtitle">
            Kelola folder episode HyperFrames terpisah di{" "}
            <span className="mono">episodes/&lt;slug&gt;/</span> ({" "}
            <span className="mono">assets/audio/</span>,{" "}
            <span className="mono">compositions/</span>,{" "}
            <span className="mono">renders/</span>).
          </p>
        </div>

        <button
          type="button"
          className="btn"
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? <FolderOpen size={15} /> : <Archive size={15} />}
          {showArchived ? "Lihat Proyek Aktif" : "Lihat Arsip"}
        </button>
      </div>

      <form className="card stack-sm" onSubmit={handleCreate}>
        <div className="row-between">
          <div style={{ fontWeight: 600 }}>Buat Proyek Baru</div>
          <span className="pill">Folder otomatis dibuat saat simpan</span>
        </div>

        <div className="grid-2">
          <div>
            <label className="field-label" htmlFor="new-project-title">
              Judul Episode
            </label>
            <input
              id="new-project-title"
              type="text"
              placeholder="Contoh: Mengapa Memori Manusia Mengubah Detail"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="new-project-seri">
              Label Seri (TopBar)
            </label>
            <input
              id="new-project-seri"
              type="text"
              value={seri}
              onChange={(e) => setSeri(e.target.value)}
            />
          </div>
        </div>

        {error ? <div className="alert alert-danger">{error}</div> : null}

        <div className="row">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={creating}
          >
            <Plus size={15} />
            {creating ? "Membuat..." : "Buat Proyek"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="card">Memuat daftar proyek...</div>
      ) : visibleProjects.length === 0 ? (
        <div className="card stack-sm" style={{ alignItems: "flex-start" }}>
          <div style={{ fontWeight: 600 }}>
            {showArchived
              ? "Belum ada proyek yang diarsipkan."
              : "Belum ada proyek aktif."}
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            {showArchived
              ? "Proyek yang diarsipkan akan tampil di sini."
              : "Buat proyek baru di atas untuk memulai naskah, storyboard, dan aset."}
          </div>
        </div>
      ) : (
        <div className="stack-sm">
          {visibleProjects.map((project) => {
            const isActive = project.slug === activeSlug;
            return (
              <div
                key={project.slug}
                className="card stack-sm"
                style={{
                  borderColor: isActive
                    ? "var(--accent-border)"
                    : "var(--border-glass)",
                }}
              >
                <div className="row-between">
                  <div className="stack-sm" style={{ gap: 4 }}>
                    <div className="row-wrap">
                      <span style={{ fontWeight: 700, fontSize: 16 }}>
                        {project.title}
                      </span>
                      {isActive ? (
                        <span className="pill pill-accent">Aktif</span>
                      ) : null}
                      {project.archived ? (
                        <span className="pill">Diarsipkan</span>
                      ) : null}
                    </div>
                    <div
                      className="row-wrap"
                      style={{ color: "var(--text-muted)", fontSize: 12 }}
                    >
                      <span className="mono">episodes/{project.slug}/</span>
                      <span>•</span>
                      <span className="tabular">{project.sceneCount} scene</span>
                      {project.durationSeconds !== null ? (
                        <>
                          <span>•</span>
                          <span className="tabular">
                            {project.durationSeconds}s
                          </span>
                        </>
                      ) : null}
                      {project.wordCount > 0 ? (
                        <>
                          <span>•</span>
                          <span className="tabular">
                            {project.wordCount} kata
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="row-wrap">
                    <button
                      type="button"
                      className={`btn btn-sm ${isActive ? "btn-primary" : ""}`}
                      onClick={() => onSelect(project.slug)}
                    >
                      <FolderPlus size={14} />
                      {isActive ? "Sedang Dibuka" : "Pilih Proyek"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => onDuplicate(project.slug)}
                    >
                      <Copy size={14} />
                      Duplikat
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => onOpenFolder(project.slug)}
                    >
                      <FolderOpen size={14} />
                      Folder
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() =>
                        onArchiveToggle(project.slug, !project.archived)
                      }
                    >
                      {project.archived ? (
                        <ArchiveRestore size={14} />
                      ) : (
                        <Archive size={14} />
                      )}
                      {project.archived ? "Pulihkan" : "Arsipkan"}
                    </button>
                  </div>
                </div>

                <div className="row-wrap">
                  {PIPELINE_STEPS.map((step) => {
                    const done = project.status[step.key];
                    return (
                      <span
                        key={step.key}
                        className={`pill ${done ? "pill-success" : ""}`}
                      >
                        <CheckCircle2 size={13} />
                        {step.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

