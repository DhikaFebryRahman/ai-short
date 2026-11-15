import type React from "react";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  GripVertical,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import type {
  CameraPreset,
  ClaimItem,
  HighlightRole,
  ProjectData,
  ProjectScene,
  SceneFunction,
  SceneHighlight,
  SceneShot,
} from "../../../shared/types";
import { countWords, parseSeparatedGptInputs } from "../lib/gptParser";

type StoryboardTabProps = {
  readonly project: ProjectData;
  readonly onUpdate: (next: Partial<ProjectData>) => void;
};

const ROLE_OPTIONS: readonly {
  readonly value: HighlightRole;
  readonly label: string;
  readonly pillClass: string;
}[] = [
  { value: "istilah_kunci", label: "Istilah kunci", pillClass: "pill-warning" },
  { value: "aksi", label: "Aksi / arah", pillClass: "pill-cyan" },
  { value: "berhasil", label: "Berhasil", pillClass: "pill-success" },
  { value: "masalah", label: "Masalah", pillClass: "pill-danger" },
];

const CAMERA_OPTIONS: readonly {
  readonly value: CameraPreset;
  readonly label: string;
}[] = [
  { value: "zoom-in", label: "Zoom In Halus" },
  { value: "zoom-out", label: "Zoom Out Halus" },
  { value: "tilt-scan", label: "Tilt & Scan" },
  { value: "pan-left", label: "Geser Kiri" },
  { value: "pan-right", label: "Geser Kanan" },
  { value: "static", label: "Statis" },
];

const reindexScenes = (scenes: readonly ProjectScene[]): ProjectScene[] =>
  scenes.map((scene, idx) => ({
    ...scene,
    id: `scene-${String(idx + 1).padStart(2, "0")}`,
  }));

export const StoryboardTab: React.FC<StoryboardTabProps> = ({
  project,
  onUpdate,
}) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [showGlobalGuide, setShowGlobalGuide] = useState(false);
  const [parseMessage, setParseMessage] = useState<{
    readonly ok: boolean;
    readonly text: string;
  } | null>(null);
  const [newClaimText, setNewClaimText] = useState("");
  const [newWordByScene, setNewWordByScene] = useState<Record<string, string>>(
    {},
  );
  const [newRoleByScene, setNewRoleByScene] = useState<
    Record<string, HighlightRole>
  >({});

  const totalWords = project.scenes.reduce(
    (sum, s) => sum + countWords(s.narasi),
    0,
  );
  const silentOutroSeconds = project.scenes.reduce((sum, s) => {
    const w = countWords(s.narasi);
    return w === 0 ? sum + (s.estimasiDetik ?? 0) : sum;
  }, 0);
  const estimatedSeconds = totalWords / 2.5 + silentOutroSeconds;
  const approvedCount = project.scenes.filter(
    (s) => s.status === "disetujui",
  ).length;
  const rawNaskahWords = countWords(project.rawNaskahText ?? "");
  const rawStoryboardSceneCount = (
    (project.rawStoryboardText ?? "").match(
      /^(?:#{1,4}\s*SCENE\s+\d+|SCENE\s+\d+\s*(?:[—–:-]|$))/gim,
    ) ?? []
  ).length;
  const totalShotCount = project.scenes.reduce(
    (sum, s) => sum + (s.shots?.length ?? 0),
    0,
  );

  const handleAutoSplit = () => {
    const parsed = parseSeparatedGptInputs(
      project.rawNaskahText ?? "",
      project.rawStoryboardText ?? "",
    );
    if (parsed.scenes.length === 0) {
      setParseMessage({
        ok: false,
        text: "Tidak ada bagian scene yang terbaca. Pastikan Naskah atau Storyboard dari GPT sudah ditempel.",
      });
      return;
    }

    onUpdate({
      title: parsed.title || project.title,
      scenes: parsed.scenes,
      claims: parsed.claims.length > 0 ? parsed.claims : project.claims,
      konsepVisualGlobal:
        parsed.konsepVisualGlobal ?? project.konsepVisualGlobal,
      catatanVisual: parsed.catatanVisual ?? project.catatanVisual,
      pesanAgent: parsed.pesanAgent ?? project.pesanAgent,
    });
    const sourceLabel =
      parsed.source === "gabungan"
        ? "dari Naskah + Storyboard"
        : parsed.source === "naskah"
          ? "dari Naskah saja"
          : "dari Storyboard saja";
    const parsedShots = parsed.scenes.reduce(
      (sum, s) => sum + (s.shots?.length ?? 0),
      0,
    );
    setParseMessage({
      ok: true,
      text: `Berhasil memecah ${parsed.scenes.length} scene (${parsedShots} shot, ${sourceLabel}) dan ${parsed.claims.length} klaim verifikasi.`,
    });
  };

  const updateScene = (index: number, patch: Partial<ProjectScene>) => {
    const updated = project.scenes.map((s, i) =>
      i === index ? { ...s, ...patch } : s,
    );
    onUpdate({ scenes: updated });
  };

  const updateShot = (
    sceneIndex: number,
    shotIndex: number,
    patch: Partial<SceneShot>,
  ) => {
    const scene = project.scenes[sceneIndex];
    const currentShots = scene.shots ?? [];
    updateScene(sceneIndex, {
      shots: currentShots.map((sh, i) =>
        i === shotIndex ? { ...sh, ...patch } : sh,
      ),
    });
  };

  const addShot = (sceneIndex: number) => {
    const scene = project.scenes[sceneIndex];
    const currentShots = scene.shots ?? [];
    const nextNum = currentShots.length + 1;
    const nextShot: SceneShot = {
      id: `shot-${sceneIndex + 1}-${nextNum}-${Date.now()}`,
      judul: `Shot ${nextNum}`,
      timestamp: "",
      visual3D: "",
      gerakanKamera: "",
      animasi: "",
      teksDiLayar: "",
      audio: "",
      transisi: "",
    };
    updateScene(sceneIndex, { shots: [...currentShots, nextShot] });
  };

  const removeShot = (sceneIndex: number, shotIndex: number) => {
    const scene = project.scenes[sceneIndex];
    const currentShots = scene.shots ?? [];
    updateScene(sceneIndex, {
      shots: currentShots.filter((_, i) => i !== shotIndex),
    });
  };

  const moveScene = (from: number, to: number) => {
    if (to < 0 || to >= project.scenes.length || from === to) return;
    const copy = [...project.scenes];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    onUpdate({ scenes: reindexScenes(copy) });
  };

  const addEmptyScene = () => {
    const nextIdx = project.scenes.length;
    const nextScene: ProjectScene = {
      id: `scene-${String(nextIdx + 1).padStart(2, "0")}`,
      judul: `Scene ${nextIdx + 1}`,
      fungsi: nextIdx === 0 ? "hook" : "inti",
      narasi: "",
      pemahamanPenonton: "",
      ideVisual: "",
      kataSorot: [],
      chip: `SCENE ${nextIdx + 1}`,
      butuh3D: false,
      alasan3D: "",
      kamera: "zoom-in",
      status: "draf",
    };
    onUpdate({ scenes: [...project.scenes, nextScene] });
  };

  const deleteScene = (index: number) => {
    const filtered = project.scenes.filter((_, i) => i !== index);
    onUpdate({ scenes: reindexScenes(filtered) });
  };

  const addHighlight = (sceneIndex: number, sceneId: string) => {
    const kata = (newWordByScene[sceneId] ?? "").trim();
    if (!kata) return;
    const peran = newRoleByScene[sceneId] ?? "istilah_kunci";
    const scene = project.scenes[sceneIndex];
    const nextItem: SceneHighlight = {
      id: `hl-${Date.now()}`,
      kata,
      peran,
    };
    updateScene(sceneIndex, {
      kataSorot: [...scene.kataSorot, nextItem],
    });
    setNewWordByScene((prev) => ({ ...prev, [sceneId]: "" }));
  };

  const removeHighlight = (sceneIndex: number, hlId: string) => {
    const scene = project.scenes[sceneIndex];
    updateScene(sceneIndex, {
      kataSorot: scene.kataSorot.filter((h) => h.id !== hlId),
    });
  };

  const addClaim = () => {
    if (!newClaimText.trim()) return;
    const item: ClaimItem = {
      id: `claim-${Date.now()}`,
      teks: newClaimText.trim(),
      tercentang: false,
    };
    onUpdate({ claims: [...project.claims, item] });
    setNewClaimText("");
  };

  return (
    <div className="stack-md">
      <div className="page-header">
        <div>
          <h1 className="page-title">Naskah & Storyboard</h1>
          <p className="page-subtitle">
            Tempel hasil dari GPT, pecah otomatis menjadi kartu scene, atur
            urutan, dan setujui tiap scene.
          </p>
        </div>

        <div className="row-wrap">
          <span className="pill tabular">
            Total kata: <strong>{totalWords}</strong>
          </span>
          <span className="pill tabular">
            Estimasi: <strong>{estimatedSeconds.toFixed(1)}s</strong> (2,5
            kata/detik)
          </span>
          <span
            className={`pill tabular ${
              project.scenes.length > 0 &&
              approvedCount === project.scenes.length
                ? "pill-success"
                : "pill-warning"
            }`}
          >
            Disetujui: {approvedCount}/{project.scenes.length}
          </span>
        </div>
      </div>

      {totalWords > 125 ? (
        <div className="alert alert-warning">
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Peringatan jumlah kata:</strong> Total narasi{" "}
            <span className="tabular">{totalWords}</span> kata (melebihi 125
            kata). Pertimbangkan meringkas agar durasi tetap nyaman di bawah 60
            detik.
          </div>
        </div>
      ) : null}

      {estimatedSeconds > 60 ? (
        <div className="alert alert-danger">
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Peringatan durasi:</strong> Estimasi durasi{" "}
            <span className="tabular">{estimatedSeconds.toFixed(1)} detik</span>{" "}
            melebihi batas maksimal 60 detik.
          </div>
        </div>
      ) : null}

      <div className="card stack-md">
        <div className="row-between">
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              Tempel Hasil dari GPT (Terpisah)
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>
              Isi Naskah dan Storyboard/Alur di kolom masing-masing, lalu klik
              Pecah otomatis. Tetap berjalan meski baru salah satu yang diisi.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAutoSplit}
          >
            <Sparkles size={15} />
            Pecah otomatis
          </button>
        </div>

        <div className="grid-2">
          <div className="stack-sm" style={{ gap: 6 }}>
            <div className="row-between">
              <label
                className="field-label"
                htmlFor="gpt-naskah-input"
                style={{ margin: 0 }}
              >
                1. Naskah dari GPT (Narasi Lengkap)
              </label>
              <span className="pill tabular">{rawNaskahWords} kata teks</span>
            </div>
            <textarea
              id="gpt-naskah-input"
              rows={9}
              placeholder="Tempel bagian # NARASI LENGKAP (termasuk **Judul:**, **[Hook]**, **[Inti]**, **[Penutup]** atau paragraf narasi)..."
              value={project.rawNaskahText ?? ""}
              onChange={(e) => onUpdate({ rawNaskahText: e.target.value })}
            />
          </div>

          <div className="stack-sm" style={{ gap: 6 }}>
            <div className="row-between">
              <label
                className="field-label"
                htmlFor="gpt-storyboard-input"
                style={{ margin: 0 }}
              >
                2. Storyboard / Alur dari GPT
              </label>
              <span className="pill tabular">
                {rawStoryboardSceneCount} blok scene
              </span>
            </div>
            <textarea
              id="gpt-storyboard-input"
              rows={9}
              placeholder="Tempel # ALUR PENJELASAN DAN STORYBOARD (# SCENE 1 — ..., ### STORYBOARD VISUAL, **SHOT 1 — ...**, # CATATAN PENTING UNTUK VISUAL, # KLAIM YANG PERLU DIVERIFIKASI)..."
              value={project.rawStoryboardText ?? ""}
              onChange={(e) => onUpdate({ rawStoryboardText: e.target.value })}
            />
          </div>
        </div>

        {parseMessage ? (
          <div
            className={`alert ${
              parseMessage.ok ? "alert-success" : "alert-warning"
            }`}
          >
            {parseMessage.text}
          </div>
        ) : null}
      </div>

      {(project.konsepVisualGlobal ||
        project.catatanVisual ||
        project.pesanAgent ||
        showGlobalGuide) ? (
        <div className="card stack-sm">
          <div className="row-between">
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              Konsep Visual Global & Catatan Produksi
            </div>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setShowGlobalGuide((v) => !v)}
            >
              {showGlobalGuide ? "Sembunyikan" : "Lihat / Ubah"}
            </button>
          </div>
          {!showGlobalGuide ? (
            <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>
              {[
                project.konsepVisualGlobal ? "Konsep visual global terisi" : null,
                project.catatanVisual ? "Catatan penting visual terisi" : null,
                project.pesanAgent ? "Arahan tambahan terisi" : null,
              ]
                .filter(Boolean)
                .join(" • ") || "Belum diisi."}
            </div>
          ) : (
            <div className="stack-sm">
              <div>
                <label className="field-label">Konsep Visual Global</label>
                <textarea
                  rows={4}
                  value={project.konsepVisualGlobal ?? ""}
                  onChange={(e) =>
                    onUpdate({ konsepVisualGlobal: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="field-label">
                  Catatan Penting untuk Visual
                </label>
                <textarea
                  rows={4}
                  value={project.catatanVisual ?? ""}
                  onChange={(e) => onUpdate({ catatanVisual: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label">Arahan Tambahan Agent</label>
                <textarea
                  rows={3}
                  value={project.pesanAgent ?? ""}
                  onChange={(e) => onUpdate({ pesanAgent: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="row-between">
        <div className="row-wrap">
          <h2 style={{ margin: 0, fontSize: 16 }}>
            Kartu Scene ({project.scenes.length})
          </h2>
          {totalShotCount > 0 ? (
            <span className="pill tabular">{totalShotCount} total shot</span>
          ) : null}
        </div>
        <div className="row-wrap">
          {!showGlobalGuide &&
          !project.konsepVisualGlobal &&
          !project.catatanVisual &&
          !project.pesanAgent ? (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setShowGlobalGuide(true)}
            >
              + Konsep Visual Global
            </button>
          ) : null}
          <button type="button" className="btn" onClick={addEmptyScene}>
            <Plus size={15} />
            Tambah Scene
          </button>
        </div>
      </div>

      {project.scenes.length === 0 ? (
        <div className="card">
          Belum ada kartu scene. Tempel hasil GPT di atas lalu klik{" "}
          <strong>Pecah otomatis</strong>, atau klik <strong>Tambah Scene</strong>.
        </div>
      ) : (
        <div className="stack-md">
          {project.scenes.map((scene, index) => {
            const words = countWords(scene.narasi);
            const sceneEst = words > 0 ? words / 2.5 : (scene.estimasiDetik ?? 0);
            const approved = scene.status === "disetujui";
            const shots = scene.shots ?? [];

            return (
              <div
                key={scene.id}
                className="card stack-sm"
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null) {
                    moveScene(dragIndex, index);
                    setDragIndex(null);
                  }
                }}
                style={{
                  borderColor: approved
                    ? "var(--success-border)"
                    : "var(--border-subtle)",
                }}
              >
                <div className="row-between">
                  <div className="row-wrap">
                    <span
                      title="Seret untuk urutkan"
                      style={{
                        color: "var(--text-muted)",
                        display: "inline-flex",
                        cursor: "grab",
                      }}
                    >
                      <GripVertical size={18} />
                    </span>
                    <span className="mono" style={{ color: "var(--accent)", fontWeight: 600 }}>
                      {scene.id.toUpperCase()}
                    </span>
                    <select
                      aria-label={`Fungsi ${scene.id}`}
                      value={scene.fungsi}
                      onChange={(e) =>
                        updateScene(index, {
                          fungsi: e.target.value as SceneFunction,
                        })
                      }
                      style={{ width: "auto" }}
                    >
                      <option value="hook">Hook</option>
                      <option value="inti">Inti</option>
                      <option value="penutup">Penutup</option>
                    </select>
                    <span className="pill tabular">
                      {words} kata • ~{sceneEst.toFixed(1)}s
                    </span>
                    {scene.timestamp ? (
                      <span className="pill mono tabular">
                        {scene.timestamp}
                      </span>
                    ) : null}
                    {shots.length > 0 ? (
                      <span className="pill pill-cyan tabular">
                        {shots.length} shot
                      </span>
                    ) : null}
                  </div>

                  <div className="row-wrap">
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={index === 0}
                      onClick={() => moveScene(index, index - 1)}
                      title="Pindah ke atas"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={index === project.scenes.length - 1}
                      onClick={() => moveScene(index, index + 1)}
                      title="Pindah ke bawah"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${approved ? "pill-success" : ""}`}
                      onClick={() =>
                        updateScene(index, {
                          status: approved ? "draf" : "disetujui",
                        })
                      }
                    >
                      <CheckCircle2 size={13} />
                      {approved ? "Disetujui" : "Draf (Setujui)"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteScene(index)}
                      title="Hapus scene"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="grid-3">
                  <div>
                    <label className="field-label">Judul Scene</label>
                    <input
                      type="text"
                      value={scene.judul}
                      onChange={(e) =>
                        updateScene(index, { judul: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label">Chip Bawah Visual</label>
                    <input
                      type="text"
                      value={scene.chip}
                      onChange={(e) =>
                        updateScene(index, { chip: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label">Preset Kamera</label>
                    <select
                      value={scene.kamera}
                      onChange={(e) =>
                        updateScene(index, {
                          kamera: e.target.value as CameraPreset,
                        })
                      }
                    >
                      {CAMERA_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="field-label">Narasi (ejaan persis)</label>
                  <textarea
                    rows={2}
                    value={scene.narasi}
                    onChange={(e) =>
                      updateScene(index, { narasi: e.target.value })
                    }
                  />
                </div>

                <div className="grid-2">
                  <div>
                    <label className="field-label">
                      Yang Harus Dipahami Penonton
                    </label>
                    <textarea
                      rows={2}
                      value={scene.pemahamanPenonton}
                      onChange={(e) =>
                        updateScene(index, {
                          pemahamanPenonton: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label">Ide Visual</label>
                    <textarea
                      rows={2}
                      value={scene.ideVisual}
                      onChange={(e) =>
                        updateScene(index, { ideVisual: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="stack-sm">
                  <label className="field-label" style={{ margin: 0 }}>
                    Kata Sorot & Peran
                  </label>
                  <div className="row-wrap">
                    {scene.kataSorot.map((hl) => {
                      const roleMeta =
                        ROLE_OPTIONS.find((r) => r.value === hl.peran) ??
                        ROLE_OPTIONS[0];
                      return (
                        <span
                          key={hl.id}
                          className={`pill ${roleMeta.pillClass}`}
                        >
                          <span>"{hl.kata}"</span>
                          <span style={{ opacity: 0.8 }}>
                            ({roleMeta.label})
                          </span>
                          <button
                            type="button"
                            onClick={() => removeHighlight(index, hl.id)}
                            style={{
                              background: "none",
                              border: "none",
                              padding: 0,
                              color: "inherit",
                              display: "inline-flex",
                            }}
                            aria-label={`Hapus sorot ${hl.kata}`}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>

                  <div className="row-wrap">
                    <input
                      type="text"
                      placeholder="Kata/frasa sorot..."
                      value={newWordByScene[scene.id] ?? ""}
                      onChange={(e) =>
                        setNewWordByScene((prev) => ({
                          ...prev,
                          [scene.id]: e.target.value,
                        }))
                      }
                      style={{ maxWidth: 240 }}
                    />
                    <select
                      value={newRoleByScene[scene.id] ?? "istilah_kunci"}
                      onChange={(e) =>
                        setNewRoleByScene((prev) => ({
                          ...prev,
                          [scene.id]: e.target.value as HighlightRole,
                        }))
                      }
                      style={{ maxWidth: 180 }}
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => addHighlight(index, scene.id)}
                    >
                      <Plus size={13} />
                      Tambah Sorot
                    </button>
                  </div>
                </div>

                <div className="grid-2" style={{ alignItems: "end" }}>
                  <label className="row" style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={scene.butuh3D}
                      onChange={(e) =>
                        updateScene(index, { butuh3D: e.target.checked })
                      }
                    />
                    <span>Butuh 3D (@remotion/three)</span>
                  </label>
                  <div>
                    <label className="field-label">Alasan Kebutuhan 3D</label>
                    <input
                      type="text"
                      placeholder="Alasan memakai 3D atau tetap 2D..."
                      value={scene.alasan3D}
                      onChange={(e) =>
                        updateScene(index, { alasan3D: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="stack-sm">
                  <div className="row-between">
                    <label className="field-label" style={{ margin: 0 }}>
                      Rincian Shot Visual ({shots.length})
                    </label>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => addShot(index)}
                    >
                      <Plus size={13} />
                      Tambah Shot
                    </button>
                  </div>

                  {shots.map((shot, sIdx) => (
                    <div
                      key={shot.id}
                      className="stack-sm"
                      style={{
                        padding: 12,
                        borderRadius: "var(--radius-control)",
                        background: "var(--bg-input)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div className="row-between">
                        <div className="row" style={{ flex: 1 }}>
                          <span
                            className="mono"
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "var(--cyan)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            SHOT {sIdx + 1}
                          </span>
                          <input
                            type="text"
                            placeholder="Judul shot..."
                            value={shot.judul}
                            onChange={(e) =>
                              updateShot(index, sIdx, { judul: e.target.value })
                            }
                          />
                          <input
                            type="text"
                            className="mono"
                            placeholder="00:00–00:02.4"
                            value={shot.timestamp}
                            onChange={(e) =>
                              updateShot(index, sIdx, {
                                timestamp: e.target.value,
                              })
                            }
                            style={{ maxWidth: 150 }}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => removeShot(index, sIdx)}
                          title="Hapus shot"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div>
                        <label className="field-label">Visual 3D</label>
                        <textarea
                          rows={2}
                          value={shot.visual3D}
                          onChange={(e) =>
                            updateShot(index, sIdx, { visual3D: e.target.value })
                          }
                        />
                      </div>

                      <div className="grid-2">
                        <div>
                          <label className="field-label">Gerakan Kamera</label>
                          <textarea
                            rows={2}
                            value={shot.gerakanKamera}
                            onChange={(e) =>
                              updateShot(index, sIdx, {
                                gerakanKamera: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="field-label">Animasi</label>
                          <textarea
                            rows={2}
                            value={shot.animasi}
                            onChange={(e) =>
                              updateShot(index, sIdx, { animasi: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid-3">
                        <div>
                          <label className="field-label">Teks di Layar</label>
                          <input
                            type="text"
                            value={shot.teksDiLayar}
                            onChange={(e) =>
                              updateShot(index, sIdx, {
                                teksDiLayar: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="field-label">Audio</label>
                          <input
                            type="text"
                            value={shot.audio}
                            onChange={(e) =>
                              updateShot(index, sIdx, { audio: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="field-label">Transisi</label>
                          <input
                            type="text"
                            value={shot.transisi}
                            onChange={(e) =>
                              updateShot(index, sIdx, {
                                transisi: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card stack-sm">
        <div style={{ fontWeight: 700, fontSize: 15 }}>
          Daftar Klaim yang Perlu Diverifikasi ({project.claims.length})
        </div>
        {project.claims.length === 0 ? (
          <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
            Belum ada klaim fakta. Klaim dari hasil GPT otomatis masuk ke sini
            saat Anda menekan <strong>Pecah otomatis</strong>.
          </div>
        ) : (
          <div className="stack-sm">
            {project.claims.map((claim, idx) => (
              <div key={claim.id} className="row-between">
                <label className="row" style={{ flex: 1, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={claim.tercentang}
                    onChange={(e) => {
                      const next = project.claims.map((c, i) =>
                        i === idx ? { ...c, tercentang: e.target.checked } : c,
                      );
                      onUpdate({ claims: next });
                    }}
                  />
                  <span
                    style={{
                      textDecoration: claim.tercentang ? "line-through" : "none",
                      color: claim.tercentang
                        ? "var(--text-muted)"
                        : "var(--text-primary)",
                    }}
                  >
                    {claim.teks}
                  </span>
                </label>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() =>
                    onUpdate({
                      claims: project.claims.filter((_, i) => i !== idx),
                    })
                  }
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="row">
          <input
            type="text"
            placeholder="Tambah klaim fakta manual untuk dicek..."
            value={newClaimText}
            onChange={(e) => setNewClaimText(e.target.value)}
          />
          <button type="button" className="btn" onClick={addClaim}>
            <Plus size={14} />
            Tambah Klaim
          </button>
        </div>
      </div>
    </div>
  );
};

