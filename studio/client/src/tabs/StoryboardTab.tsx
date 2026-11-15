import type React from "react";
import { AlertTriangle } from "lucide-react";
import type { ProjectData } from "../../../shared/types";
import { countWords, parseGptScript } from "../lib/gptParser";

type StoryboardTabProps = {
  readonly project: ProjectData;
  readonly onUpdate: (next: Partial<ProjectData>) => void;
};

export const StoryboardTab: React.FC<StoryboardTabProps> = ({
  project,
  onUpdate,
}) => {
  const combinedValue =
    project.rawGptText ??
    [project.rawNaskahText, project.rawStoryboardText]
      .filter((part) => Boolean(part?.trim()))
      .join("\n\n");

  const parsedScenes = project.scenes;
  const narasiWords = parsedScenes.reduce(
    (sum, s) => sum + countWords(s.narasi),
    0,
  );
  const totalWords =
    narasiWords > 0 ? narasiWords : countWords(combinedValue);
  const silentOutroSeconds = parsedScenes.reduce((sum, s) => {
    const w = countWords(s.narasi);
    return w === 0 ? sum + (s.estimasiDetik ?? 0) : sum;
  }, 0);
  const estimatedSeconds = totalWords / 2.5 + silentOutroSeconds;

  const handleGptTextChange = (value: string) => {
    const parsed = parseGptScript(value);
    onUpdate({
      rawGptText: value,
      rawNaskahText: "",
      rawStoryboardText: "",
      scenes: parsed.scenes,
      claims: parsed.claims,
      konsepVisualGlobal: parsed.konsepVisualGlobal ?? "",
      catatanVisual: parsed.catatanVisual ?? "",
      pesanAgent: parsed.pesanAgent ?? "",
    });
  };

  return (
    <div className="stack-md">
      <div className="page-header">
        <div>
          <h1 className="page-title">Naskah &amp; Storyboard</h1>
          <p className="page-subtitle">
            Tempel seluruh hasil naskah dan storyboard dari GPT ke dalam satu
            kotak di bawah ini.
          </p>
        </div>

        <div className="row-wrap">
          <span className="pill tabular">
            Kata: <strong>{totalWords}</strong>
          </span>
          <span className="pill tabular">
            Estimasi: <strong>{estimatedSeconds.toFixed(1)}s</strong>
          </span>
          <span className="pill tabular">
            Scene terbaca: <strong>{parsedScenes.length}</strong>
          </span>
        </div>
      </div>

      {narasiWords > 125 ? (
        <div className="alert alert-warning">
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Peringatan jumlah kata:</strong> Narasi{" "}
            <span className="tabular">{narasiWords}</span> kata (melebihi 125
            kata). Pertimbangkan meringkas agar durasi tetap nyaman di bawah 60
            detik.
          </div>
        </div>
      ) : null}

      {narasiWords > 0 && estimatedSeconds > 60 ? (
        <div className="alert alert-danger">
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Peringatan durasi:</strong> Estimasi durasi{" "}
            <span className="tabular">{estimatedSeconds.toFixed(1)} detik</span>{" "}
            melebihi batas maksimal 60 detik.
          </div>
        </div>
      ) : null}

      <div className="card stack-sm">
        <div className="row-between">
          <label
            className="field-label"
            htmlFor="gpt-combined-input"
            style={{ margin: 0, fontSize: 15, fontWeight: 700 }}
          >
            Tempel Naskah & Storyboard
          </label>
          <span className="pill">1 kotak gabungan (Narasi + Storyboard)</span>
        </div>

        <textarea
          id="gpt-combined-input"
          rows={22}
          placeholder={`Tempel langsung seluruh output dari GPT di sini...\n\nContoh:\n# NARASI LENGKAP\n...\n\n# STORYBOARD LENGKAP\n## SCENE 1 — ...\n## SCENE 2 — ...`}
          value={combinedValue}
          onChange={(e) => handleGptTextChange(e.target.value)}
        />
      </div>
    </div>
  );
};
