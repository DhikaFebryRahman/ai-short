import fs from "node:fs/promises";
import path from "node:path";
import type {
  ProjectData,
  ProjectPipelineStatus,
  ProjectScene,
  ProjectSummary,
  RenderRecord,
} from "../../shared/types";
import { probeMedia } from "./ffmpeg";
import { initHyperframesEpisode } from "./hyperframesCli";
import { EPISODES_DIR, resolveEpisodeDir, sanitizeSlug } from "./pathGuard";

const PROJECT_FILE = "project.json";
const AUDIO_EXTS = [".mp3", ".wav", ".m4a"];

const fileExists = async (target: string): Promise<boolean> => {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
};

export const ensureEpisodeFolders = async (slug: string): Promise<string> => {
  const episodeDir = resolveEpisodeDir(slug);
  await fs.mkdir(path.join(episodeDir, "assets", "audio"), { recursive: true });
  await fs.mkdir(path.join(episodeDir, "assets", "reference"), {
    recursive: true,
  });
  await fs.mkdir(path.join(episodeDir, "compositions"), { recursive: true });
  await fs.mkdir(path.join(episodeDir, "renders"), { recursive: true });
  return episodeDir;
};

export const computePipelineStatus = (
  project: ProjectData,
): ProjectPipelineStatus => {
  const hasNaskah =
    Boolean(project.rawGptText?.trim()) ||
    Boolean(project.topicBrief?.trim()) ||
    Boolean(project.rawNaskahText.trim()) ||
    (project.scenes.length > 0 &&
      project.scenes.some((s) => s.narasi.trim().length > 0));
  const hasVoiceover = Boolean(project.voiceover);
  const hasComposition = Boolean(project.hasComposition);
  const hasRender = project.renders.length > 0;
  const hasThumbnail = Boolean(project.thumbnailPath);
  const latestVerified =
    project.renders.length > 0 && project.renders[0].verification.passed;

  return {
    naskah: hasNaskah,
    voiceover: hasVoiceover,
    komposisi: hasComposition,
    render: hasRender,
    thumbnail: hasThumbnail,
    terverifikasi: latestVerified,
  };
};

const discoverSceneStubs = async (
  episodeDir: string,
): Promise<ProjectScene[]> => {
  const compDir = path.join(episodeDir, "compositions");
  try {
    const entries = await fs.readdir(compDir);
    const sceneFiles = entries
      .filter((name) => /^scene-\d+\.html$/i.test(name))
      .sort();
    const indexHtml = (await fileExists(path.join(episodeDir, "index.html")))
      ? await fs.readFile(path.join(episodeDir, "index.html"), "utf-8")
      : "";

    const stubs: ProjectScene[] = [];
    for (const file of sceneFiles) {
      const id = file.replace(/\.html$/i, "");
      const html = await fs.readFile(path.join(compDir, file), "utf-8");
      const titleMatch = html.match(/<title>\s*([^<]+?)\s*<\/title>/i);
      const timingMatch = indexHtml.match(
        new RegExp(
          `id="${id}"[^>]*data-start="([^"]+)"[^>]*data-duration="([^"]+)"`,
          "i",
        ),
      );
      const start = timingMatch ? Number(timingMatch[1]) : undefined;
      const dur = timingMatch ? Number(timingMatch[2]) : undefined;
      const timestamp =
        start !== undefined && dur !== undefined && !Number.isNaN(start)
          ? `${start.toFixed(1)}s–${(start + dur).toFixed(1)}s`
          : undefined;

      stubs.push({
        id,
        judul: titleMatch?.[1]?.trim() || id.toUpperCase(),
        fungsi:
          stubs.length === 0
            ? "hook"
            : stubs.length === sceneFiles.length - 1
              ? "penutup"
              : "inti",
        timestamp,
        narasi: "",
        pemahamanPenonton: "",
        ideVisual: "",
        kataSorot: [],
        chip: "",
        butuh3D: false,
        alasan3D: "",
        kamera: "zoom-in",
        status: "disetujui",
        estimasiDetik: dur,
      });
    }
    return stubs;
  } catch {
    return [];
  }
};

const discoverFilesystemState = async (
  episodeDir: string,
  base: ProjectData,
): Promise<ProjectData> => {
  const [hasIndex, compScenes] = await Promise.all([
    fileExists(path.join(episodeDir, "index.html")),
    discoverSceneStubs(episodeDir),
  ]);
  const hasComposition = hasIndex && compScenes.length > 0;

  let voiceover = base.voiceover;
  if (!voiceover) {
    const audioDir = path.join(episodeDir, "assets", "audio");
    try {
      const files = await fs.readdir(audioDir);
      const voFile =
        files.find((f) => /^vo\.(mp3|wav|m4a)$/i.test(f)) ??
        files.find(
          (f) =>
            AUDIO_EXTS.includes(path.extname(f).toLowerCase()) &&
            !/^bgm/i.test(f),
        );
      if (voFile) {
        const absVo = path.join(audioDir, voFile);
        const stat = await fs.stat(absVo);
        const probe = await probeMedia(absVo).catch(() => null);
        voiceover = {
          fileName: voFile,
          relativePath: `assets/audio/${voFile}`,
          sizeBytes: stat.size,
          durationSeconds: Number((probe?.durationSeconds ?? 0).toFixed(2)),
          silences: [],
          waveformPeaks: [],
        };
      }
    } catch {
      // No audio directory yet
    }
  }

  let music = base.music;
  if (music.mode === "none" && !music.relativePath) {
    const audioDir = path.join(episodeDir, "assets", "audio");
    try {
      const files = await fs.readdir(audioDir);
      const bgmFile = files.find((f) => /^bgm\.(mp3|wav|m4a)$/i.test(f));
      if (bgmFile) {
        music = {
          mode: "synthetic",
          fileName: bgmFile,
          relativePath: `assets/audio/${bgmFile}`,
          volume: 0.14,
        };
      }
    } catch {
      // Ignore
    }
  }

  let renders = [...base.renders];
  let thumbnailPath = base.thumbnailPath ?? null;
  const rendersDir = path.join(episodeDir, "renders");
  try {
    const renderFiles = (await fs.readdir(rendersDir)).sort();
    const thumbFile =
      renderFiles.find((f) => /-thumbnail\.png$/i.test(f)) ??
      renderFiles.find((f) => /\.png$/i.test(f));
    if (thumbFile) {
      thumbnailPath = `renders/${thumbFile}`;
    }

    const knownPaths = new Set(renders.map((r) => r.relativePath));
    for (const file of renderFiles) {
      if (!/\.mp4$/i.test(file)) continue;
      const rel = `renders/${file}`;
      if (knownPaths.has(rel)) continue;
      const absMp4 = path.join(rendersDir, file);
      const stat = await fs.stat(absMp4);
      const probe = await probeMedia(absMp4).catch(() => null);
      if (!probe) continue;
      const record: RenderRecord = {
        id: `discovered-${file}`,
        fileName: file,
        relativePath: rel,
        createdAt: stat.mtime.toISOString(),
        verification: {
          durationSeconds: Number(probe.durationSeconds.toFixed(2)),
          frameCount: probe.frameCount,
          width: probe.width,
          height: probe.height,
          fps: probe.fps,
          videoCodec: probe.videoCodec,
          audioCodec: probe.audioCodec,
          maxVolumeDb: null,
          blackFramesDetected: false,
          blackSegments: [],
          passed:
            probe.width === 1080 &&
            probe.height === 1920 &&
            Math.round(probe.fps) === 30 &&
            probe.videoCodec === "h264" &&
            probe.audioCodec === "aac",
        },
      };
      renders = [record, ...renders];
    }
  } catch {
    // No renders directory yet
  }

  return {
    ...base,
    scenes: base.scenes.length > 0 ? base.scenes : compScenes,
    voiceover,
    music,
    hasComposition,
    thumbnailPath,
    renders,
  };
};

const buildSkeletonProject = async (
  slug: string,
  episodeDir: string,
): Promise<ProjectData> => {
  let title = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  let createdAt = new Date().toISOString();

  try {
    const metaRaw = await fs.readFile(
      path.join(episodeDir, "meta.json"),
      "utf-8",
    );
    const meta = JSON.parse(metaRaw) as { name?: string; createdAt?: string };
    if (meta.name?.trim()) title = meta.name.trim();
    if (meta.createdAt) createdAt = meta.createdAt;
  } catch {
    const stat = await fs.stat(episodeDir);
    createdAt = stat.mtime.toISOString();
  }

  return {
    id: slug,
    slug,
    title,
    seri: "KAPSUL FAKTA",
    archived: false,
    createdAt,
    updatedAt: createdAt,
    topicBrief: "",
    rawNaskahText: "",
    rawStoryboardText: "",
    scenes: [],
    claims: [],
    revisions: [],
    voiceover: null,
    reference: null,
    music: {
      mode: "none",
      fileName: null,
      relativePath: null,
      volume: 0.14,
    },
    promptChecklist: {
      pesan: false,
      alur: false,
      voiceover: false,
      referensi: false,
    },
    hasComposition: false,
    thumbnailPath: null,
    lastCheck: null,
    renders: [],
  };
};

export const readProject = async (slug: string): Promise<ProjectData> => {
  const episodeDir = resolveEpisodeDir(slug);
  const projectFile = path.join(episodeDir, PROJECT_FILE);
  let base: ProjectData;

  if (await fileExists(projectFile)) {
    const raw = await fs.readFile(projectFile, "utf-8");
    base = JSON.parse(raw) as ProjectData;
  } else {
    const isHyperframes =
      (await fileExists(path.join(episodeDir, "hyperframes.json"))) ||
      (await fileExists(path.join(episodeDir, "index.html")));
    if (!isHyperframes) {
      throw new Error("Episode tidak ditemukan.");
    }
    base = await buildSkeletonProject(slug, episodeDir);
  }

  return discoverFilesystemState(episodeDir, base);
};

export const writeProject = async (
  project: ProjectData,
): Promise<ProjectData> => {
  const episodeDir = await ensureEpisodeFolders(project.slug);
  const updated: ProjectData = {
    ...project,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(
    path.join(episodeDir, PROJECT_FILE),
    JSON.stringify(updated, null, 2),
    "utf-8",
  );
  return discoverFilesystemState(episodeDir, updated);
};

export const listProjects = async (): Promise<ProjectSummary[]> => {
  await fs.mkdir(EPISODES_DIR, { recursive: true });
  const entries = await fs.readdir(EPISODES_DIR, { withFileTypes: true });
  const summaries: ProjectSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "assets" || entry.name.startsWith(".")) continue;
    try {
      const data = await readProject(entry.name);
      const wordCount = data.scenes.reduce((acc, s) => {
        const trimmed = s.narasi.trim();
        return acc + (trimmed ? trimmed.split(/\s+/).length : 0);
      }, 0);
      const durationSeconds =
        data.renders[0]?.verification.durationSeconds ??
        (data.voiceover ? Math.ceil(data.voiceover.durationSeconds + 2.5) : null);

      summaries.push({
        slug: data.slug,
        title: data.title,
        seri: data.seri,
        archived: data.archived,
        updatedAt: data.updatedAt,
        sceneCount: data.scenes.length,
        wordCount,
        durationSeconds,
        status: computePipelineStatus(data),
      });
    } catch {
      // Skip non-episode folders (e.g. shared assets)
    }
  }

  summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return summaries;
};

export const createUniqueSlug = async (title: string): Promise<string> => {
  await fs.mkdir(EPISODES_DIR, { recursive: true });
  const base = sanitizeSlug(title);
  let candidate = base;
  let counter = 2;

  while (true) {
    try {
      await fs.access(path.join(EPISODES_DIR, candidate));
      candidate = `${base}-${counter}`;
      counter += 1;
    } catch {
      return candidate;
    }
  }
};

export const createProject = async (
  title: string,
  seri = "KAPSUL FAKTA",
): Promise<ProjectData> => {
  const slug = await createUniqueSlug(title);
  await initHyperframesEpisode(slug);
  await ensureEpisodeFolders(slug);

  const now = new Date().toISOString();
  const project: ProjectData = {
    id: slug,
    slug,
    title: title.trim() || "Episode Baru",
    seri: seri.trim() || "KAPSUL FAKTA",
    archived: false,
    createdAt: now,
    updatedAt: now,
    topicBrief: "",
    rawNaskahText: "",
    rawStoryboardText: "",
    scenes: [],
    claims: [],
    revisions: [],
    voiceover: null,
    reference: null,
    music: {
      mode: "synthetic",
      fileName: null,
      relativePath: null,
      volume: 0.14,
    },
    promptChecklist: {
      pesan: false,
      alur: false,
      voiceover: false,
      referensi: false,
    },
    hasComposition: false,
    thumbnailPath: null,
    lastCheck: null,
    renders: [],
  };

  return writeProject(project);
};

export const duplicateProject = async (
  sourceSlug: string,
): Promise<ProjectData> => {
  const source = await readProject(sourceSlug);
  const sourceDir = resolveEpisodeDir(sourceSlug);
  const newTitle = `${source.title} (Salinan)`;
  const newSlug = await createUniqueSlug(newTitle);
  const targetDir = await ensureEpisodeFolders(newSlug);

  for (const relSub of [
    path.join("assets", "audio"),
    path.join("assets", "reference"),
    "compositions",
  ]) {
    const srcSub = path.join(sourceDir, relSub);
    const dstSub = path.join(targetDir, relSub);
    try {
      const files = await fs.readdir(srcSub);
      for (const file of files) {
        const stat = await fs.stat(path.join(srcSub, file));
        if (stat.isFile()) {
          await fs.copyFile(path.join(srcSub, file), path.join(dstSub, file));
        }
      }
    } catch {
      // Optional folder
    }
  }

  for (const rootFile of ["hyperframes.json", "index.html"]) {
    const src = path.join(sourceDir, rootFile);
    if (await fileExists(src)) {
      await fs.copyFile(src, path.join(targetDir, rootFile));
    }
  }

  const now = new Date().toISOString();
  const cloned: ProjectData = {
    ...source,
    id: newSlug,
    slug: newSlug,
    title: newTitle,
    archived: false,
    createdAt: now,
    updatedAt: now,
    thumbnailPath: null,
    lastCheck: null,
    renders: [],
  };

  return writeProject(cloned);
};
