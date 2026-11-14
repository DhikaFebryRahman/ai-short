import type {
  MusicMode,
  ProjectData,
  ProjectSummary,
  SettingsStatusResponse,
} from "../../../shared/types";

const jsonRequest = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(body.error || `Permintaan gagal (${res.status})`);
  }
  return body;
};

const uploadFile = async (
  url: string,
  file: File,
): Promise<{ project: ProjectData }> => {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(url, { method: "POST", body: form });
  const body = (await res.json()) as { project?: ProjectData; error?: string };
  if (!res.ok || !body.project) {
    throw new Error(body.error || `Upload gagal (${res.status})`);
  }
  return { project: body.project };
};

export const api = {
  listProjects: () => jsonRequest<{ projects: ProjectSummary[] }>("/api/projects"),
  createProject: (title: string, seri: string) =>
    jsonRequest<{ project: ProjectData }>("/api/projects", {
      method: "POST",
      body: JSON.stringify({ title, seri }),
    }),
  getProject: (slug: string) =>
    jsonRequest<{ project: ProjectData }>(`/api/projects/${slug}`),
  saveProject: (slug: string, project: Partial<ProjectData>) =>
    jsonRequest<{ project: ProjectData }>(`/api/projects/${slug}`, {
      method: "PUT",
      body: JSON.stringify(project),
    }),
  duplicateProject: (slug: string) =>
    jsonRequest<{ project: ProjectData }>(`/api/projects/${slug}/duplicate`, {
      method: "POST",
    }),
  archiveProject: (slug: string, archived: boolean) =>
    jsonRequest<{ project: ProjectData }>(`/api/projects/${slug}/archive`, {
      method: "POST",
      body: JSON.stringify({ archived }),
    }),
  syncToRemotion: (slug: string) =>
    jsonRequest<{ ok: boolean; totalDurationSeconds: number }>(
      `/api/projects/${slug}/sync`,
      { method: "POST" },
    ),
  openFolder: (slug: string, subfolder?: "out" | "audio" | "referensi") =>
    jsonRequest<{ ok: boolean; path: string }>(
      `/api/projects/${slug}/open-folder`,
      {
        method: "POST",
        body: JSON.stringify({ subfolder }),
      },
    ),
  uploadVoiceover: (slug: string, file: File) =>
    uploadFile(`/api/projects/${slug}/assets/voiceover`, file),
  uploadReference: (slug: string, file: File) =>
    uploadFile(`/api/projects/${slug}/assets/reference`, file),
  uploadMusic: (slug: string, file: File) =>
    uploadFile(`/api/projects/${slug}/assets/music/upload`, file),
  generateSyntheticMusic: (slug: string) =>
    jsonRequest<{ project: ProjectData }>(
      `/api/projects/${slug}/assets/music/synthetic`,
      { method: "POST" },
    ),
  updateMusicConfig: (slug: string, mode: MusicMode, volume: number) =>
    jsonRequest<{ project: ProjectData }>(
      `/api/projects/${slug}/assets/music/config`,
      {
        method: "POST",
        body: JSON.stringify({ mode, volume }),
      },
    ),
  startRender: (slug: string) =>
    jsonRequest<{ jobId: string; outputFile: string }>(
      `/api/projects/${slug}/render`,
      { method: "POST" },
    ),
  getSettingsStatus: () =>
    jsonRequest<SettingsStatusResponse>("/api/settings/status"),
};

