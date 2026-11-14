import type React from "react";
import { useMemo, useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import type { ProjectData, PromptChecklist } from "../../../shared/types";
import { api } from "../lib/api";
import { buildAgentPromptB } from "../lib/promptBuilder";

type PromptAgentTabProps = {
  readonly project: ProjectData;
  readonly onUpdate: (next: Partial<ProjectData>) => void;
};

const CHECKLIST_ITEMS: readonly {
  readonly key: keyof PromptChecklist;
  readonly label: string;
}[] = [
  { key: "pesan", label: "Pesan (Prompt B sudah dikirim)" },
  { key: "alur", label: "Alur storyboard & narasi sudah dikirim" },
  { key: "voiceover", label: "File voiceover sudah tersedia / dikirim" },
  { key: "referensi", label: "Video referensi (jika ada) sudah dikirim" },
];

export const PromptAgentTab: React.FC<PromptAgentTabProps> = ({
  project,
  onUpdate,
}) => {
  const [copied, setCopied] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const promptText = useMemo(() => buildAgentPromptB(project), [project]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await api.syncToRemotion(project.slug);
      setSyncMessage(
        `Data & aset proyek disinkronkan ke Remotion (durasi ${res.totalDurationSeconds}s).`,
      );
    } catch (err) {
      setSyncMessage(
        err instanceof Error ? err.message : "Gagal menyinkronkan proyek.",
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="stack-md">
      <div className="page-header">
        <div>
          <h1 className="page-title">Prompt untuk Agent</h1>
          <p className="page-subtitle">
            Prompt B disusun otomatis dari naskah, alur scene, path aset, dan
            catatan referensi proyek aktif.
          </p>
        </div>

        <div className="row-wrap">
          <button
            type="button"
            className="btn"
            disabled={syncing}
            onClick={handleSync}
          >
            <RefreshCw size={15} />
            {syncing ? "Menyinkronkan..." : "Sinkronkan ke Remotion"}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleCopy}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Tersalin" : "Salin Prompt B"}
          </button>
        </div>
      </div>

      {syncMessage ? (
        <div className="alert alert-success">{syncMessage}</div>
      ) : null}

      <div className="card stack-sm">
        <div style={{ fontWeight: 700, fontSize: 15 }}>
          Daftar Centang "Sudah Dikirim"
        </div>
        <div className="grid-2">
          {CHECKLIST_ITEMS.map((item) => (
            <label key={item.key} className="row" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={project.promptChecklist[item.key]}
                onChange={(e) =>
                  onUpdate({
                    promptChecklist: {
                      ...project.promptChecklist,
                      [item.key]: e.target.checked,
                    },
                  })
                }
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="card stack-sm">
        <label className="field-label" htmlFor="prompt-b-preview">
          Pratinjau Prompt B
        </label>
        <textarea
          id="prompt-b-preview"
          className="mono"
          rows={22}
          readOnly
          value={promptText}
          style={{ fontSize: 12.5, lineHeight: 1.55 }}
        />
      </div>
    </div>
  );
};

