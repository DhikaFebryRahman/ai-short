import type { SceneVisualCatalogItem } from "../../src/scenes";
import type { VideoData } from "../../src/types/video";
import type { SpeechSegment } from "../../src/utils/captionDraft";
import type { VideoTimingSummary } from "../../src/utils/duration";

export type EpisodeSummary = {
  readonly slug: string;
  readonly seri: string;
  readonly sceneCount: number;
  readonly voiceoverFile: string | null;
  readonly fallbackVoiceoverDetik: number;
};

export type AssetsResponse = {
  readonly audioFiles: readonly string[];
  readonly referenceFiles: readonly string[];
  readonly visualCatalog: readonly SceneVisualCatalogItem[];
};

export type AudioAnalysisPayload = {
  readonly file: string;
  readonly analysis: {
    readonly durationSeconds: number;
    readonly silences: readonly {
      readonly start: number;
      readonly end: number;
      readonly duration: number;
    }[];
    readonly speechSegments: readonly SpeechSegment[];
  };
  readonly timing: VideoTimingSummary;
};

export type RenderStatusPayload = {
  readonly status:
    | "idle"
    | "bundling"
    | "rendering"
    | "verifying"
    | "done"
    | "error";
  readonly progress: number;
  readonly outputFile: string | null;
  readonly probe: {
    readonly durationSeconds: number;
    readonly nbFrames: number | null;
    readonly width: number;
    readonly height: number;
    readonly fps: string;
    readonly videoCodec: string;
    readonly audioCodec: string | null;
  } | null;
  readonly error: string | null;
  readonly startedAt: string | null;
  readonly finishedAt: string | null;
};

const requestJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init);
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? `HTTP ${response.status}`);
  }
  return body;
};

export const api = {
  getAssets: () => requestJson<AssetsResponse>("/api/assets"),

  listEpisodes: () =>
    requestJson<{
      readonly episodes: readonly EpisodeSummary[];
      readonly activeData: VideoData;
    }>("/api/episodes"),

  getEpisode: (slug: string) =>
    requestJson<{ readonly slug: string; readonly data: VideoData }>(
      `/api/episodes/${encodeURIComponent(slug)}`,
    ),

  createEpisode: (slug: string, data?: VideoData) =>
    requestJson<{ readonly slug: string; readonly data: VideoData }>(
      "/api/episodes",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, data }),
      },
    ),

  saveEpisode: (slug: string, data: VideoData) =>
    requestJson<{
      readonly ok: boolean;
      readonly slug: string;
      readonly data: VideoData;
    }>(`/api/episodes/${encodeURIComponent(slug)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  activateEpisode: (slug: string) =>
    requestJson<{
      readonly ok: boolean;
      readonly slug: string;
      readonly data: VideoData;
    }>(`/api/episodes/${encodeURIComponent(slug)}/activate`, {
      method: "POST",
    }),

  deleteEpisode: (slug: string) =>
    requestJson<{ readonly ok: boolean; readonly slug: string }>(
      `/api/episodes/${encodeURIComponent(slug)}`,
      { method: "DELETE" },
    ),

  uploadAudio: async (file: File): Promise<AudioAnalysisPayload> => {
    const formData = new FormData();
    formData.append("file", file);
    return requestJson<AudioAnalysisPayload>("/api/audio/upload", {
      method: "POST",
      body: formData,
    });
  },

  analyzeAudio: (file: string) =>
    requestJson<AudioAnalysisPayload>("/api/audio/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file }),
    }),

  startRender: (slug: string, data: VideoData, outputName: string) =>
    requestJson<RenderStatusPayload>("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, data, outputName }),
    }),

  getRenderStatus: () =>
    requestJson<RenderStatusPayload>("/api/render/status"),

  cancelRender: () =>
    requestJson<RenderStatusPayload>("/api/render/cancel", {
      method: "POST",
    }),
};

