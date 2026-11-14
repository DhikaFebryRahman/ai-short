import fs from "node:fs/promises";
import path from "node:path";
import type {
  ProjectData,
  ProjectPipelineStatus,
  ProjectSummary,
} from "../../shared/types";
import { PROJECTS_DIR, resolveProjectDir, sanitizeSlug } from "./pathGuard";

const PROJECT_FILE = "project.json";

export const ensureProjectFolders = async (slug: string): Promise<string> => {
  const projectDir = resolveProjectDir(slug);
  await fs.mkdir(path.join(projectDir, "audio"), { recursive: true });
  await fs.mkdir(path.join(projectDir, "referensi"), { recursive: true });
  await fs.mkdir(path.join(projectDir, "out"), { recursive: true });
  return projectDir;
};

export const computePipelineStatus = (
  project: ProjectData,
): ProjectPipelineStatus => {
  const hasNaskah =
    project.scenes.length > 0 &&
    project.scenes.every((s) => s.narasi.trim().length > 0);
  const hasVoiceover = Boolean(project.voiceover);
  const allApproved =
    project.scenes.length > 0 &&
    project.scenes.every((s) => s.status === "disetujui");
  const hasRender = project.renders.length > 0;
  const latestVerified =
    project.renders.length > 0 && project.renders[0].verification.passed;

  return {
    naskah: hasNaskah,
    voiceover: hasVoiceover,
    sceneDisetujui: allApproved,
    render: hasRender,
    terverifikasi: latestVerified,
  };
};

export const readProject = async (slug: string): Promise<ProjectData> => {
  const projectDir = resolveProjectDir(slug);
  const raw = await fs.readFile(path.join(projectDir, PROJECT_FILE), "utf-8");
  return JSON.parse(raw) as ProjectData;
};

export const writeProject = async (
  project: ProjectData,
): Promise<ProjectData> => {
  const projectDir = await ensureProjectFolders(project.slug);
  const updated: ProjectData = {
    ...project,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(
    path.join(projectDir, PROJECT_FILE),
    JSON.stringify(updated, null, 2),
    "utf-8",
  );
  return updated;
};

export const listProjects = async (): Promise<ProjectSummary[]> => {
  await fs.mkdir(PROJECTS_DIR, { recursive: true });
  const entries = await fs.readdir(PROJECTS_DIR, { withFileTypes: true });
  const summaries: ProjectSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      const data = await readProject(entry.name);
      const wordCount = data.scenes.reduce((acc, s) => {
        const trimmed = s.narasi.trim();
        return acc + (trimmed ? trimmed.split(/\s+/).length : 0);
      }, 0);
      summaries.push({
        slug: data.slug,
        title: data.title,
        seri: data.seri,
        archived: data.archived,
        updatedAt: data.updatedAt,
        sceneCount: data.scenes.length,
        wordCount,
        status: computePipelineStatus(data),
      });
    } catch {
      // Skip folders without valid project.json
    }
  }

  summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return summaries;
};

export const createUniqueSlug = async (title: string): Promise<string> => {
  await fs.mkdir(PROJECTS_DIR, { recursive: true });
  const base = sanitizeSlug(title);
  let candidate = base;
  let counter = 2;

  while (true) {
    try {
      await fs.access(path.join(PROJECTS_DIR, candidate));
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
  const now = new Date().toISOString();
  const project: ProjectData = {
    id: slug,
    slug,
    title: title.trim() || "Proyek Baru",
    seri: seri.trim() || "KAPSUL FAKTA",
    archived: false,
    createdAt: now,
    updatedAt: now,
    rawGptText: "",
    scenes: [],
    claims: [],
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
    renders: [],
  };

  return writeProject(project);
};

export const duplicateProject = async (
  sourceSlug: string,
): Promise<ProjectData> => {
  const source = await readProject(sourceSlug);
  const sourceDir = resolveProjectDir(sourceSlug);
  const newTitle = `${source.title} (Salinan)`;
  const newSlug = await createUniqueSlug(newTitle);
  const targetDir = await ensureProjectFolders(newSlug);

  // Copy audio and referensi files
  for (const sub of ["audio", "referensi"]) {
    const srcSub = path.join(sourceDir, sub);
    const dstSub = path.join(targetDir, sub);
    const files = await fs.readdir(srcSub);
    for (const file of files) {
      const stat = await fs.stat(path.join(srcSub, file));
      if (stat.isFile()) {
        await fs.copyFile(path.join(srcSub, file), path.join(dstSub, file));
      }
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
    renders: [],
  };

  return writeProject(cloned);
};

