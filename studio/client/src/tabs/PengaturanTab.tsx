import type React from "react";
import { useEffect, useState } from "react";
import { Folder, RefreshCw } from "lucide-react";
import type { SettingsStatusResponse } from "../../../shared/types";
import { api } from "../lib/api";

export const PengaturanTab: React.FC = () => {
  const [status, setStatus] = useState<SettingsStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSettingsStatus();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memeriksa alat.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  return (
    <div className="stack-md">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengaturan</h1>
          <p className="page-subtitle">
            Status kesiapan alat sistem dan lokasi folder proyek Kapsul Fakta.
          </p>
        </div>

        <button
          type="button"
          className="btn"
          disabled={loading}
          onClick={loadStatus}
        >
          <RefreshCw size={15} />
          {loading ? "Memeriksa..." : "Periksa Ulang"}
        </button>
      </div>

      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="card stack-sm">
        <div style={{ fontWeight: 700, fontSize: 15 }}>Status Alat</div>
        {!status && loading ? (
          <div style={{ color: "var(--text-secondary)" }}>
            Mengecek Node, npm, FFmpeg, ffprobe, dan Remotion...
          </div>
        ) : status ? (
          <div className="stack-sm">
            {status.tools.map((tool) => (
              <div
                key={tool.id}
                className="stack-sm"
                style={{
                  padding: 12,
                  borderRadius: "var(--radius-control)",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div className="row-between">
                  <div className="row">
                    <span
                      className={`dot ${tool.ok ? "dot-green" : "dot-red"}`}
                      aria-label={tool.ok ? "Tersedia" : "Tidak tersedia"}
                    />
                    <span style={{ fontWeight: 600 }}>{tool.name}</span>
                  </div>
                  <span className="mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {tool.ok ? tool.version : "Belum terpasang"}
                  </span>
                </div>
                {!tool.ok ? (
                  <div className="alert alert-danger" style={{ padding: "8px 10px" }}>
                    <div>
                      <strong>Perbaikan:</strong> {tool.fixHint}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {status ? (
        <div className="card stack-sm">
          <div className="row">
            <Folder size={17} color="var(--accent)" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              Lokasi Folder Proyek
            </span>
          </div>
          <div className="stack-sm">
            <div>
              <div className="field-label">Root Remotion</div>
              <div className="mono" style={{ fontSize: 13 }}>
                {status.rootDir}
              </div>
            </div>
            <div>
              <div className="field-label">Direktori Multi-Proyek</div>
              <div className="mono" style={{ fontSize: 13 }}>
                {status.projectsDir}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

