import { execFile } from "node:child_process";
import path from "node:path";
import { Router } from "express";
import type { ProjectData } from "../../shared/types";
import {
  getHyperframesPreviewStatus,
  runHyperframesCheck,
  startHyperframesPreview,
  stopHyperframesPreview,
} from "../lib/hyperframesCli";
import { resolveEpisodeDir } from "../lib/pathGuard";
import {
  createProject,
  duplicateProject,
  listProjects,
  readProject,
  writeProject,
} from "../lib/projectStore";

export const projectsRouter = Router();

projectsRouter.get("/", async (_req, res) => {
  try {
    const items = await listProjects();
    res.json({ projects: items });
  } catch (err) {
    res.status(500).json({
      error:
        err instanceof Error ? err.message : "Gagal memuat daftar episode.",
    });
  }
});

projectsRouter.post("/", async (req, res) => {
  try {
    const body = req.body as { title?: string; seri?: string };
    const title = body.title?.trim() || "Episode Baru";
    const seri = body.seri?.trim() || "KAPSUL FAKTA";
    const project = await createProject(title, seri);
    res.status(201).json({ project });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Gagal membuat episode.",
    });
  }
});

projectsRouter.get("/:slug", async (req, res) => {
  try {
    const project = await readProject(req.params.slug);
    res.json({ project });
  } catch {
    res.status(404).json({ error: "Episode tidak ditemukan." });
  }
});

projectsRouter.put("/:slug", async (req, res) => {
  try {
    const existing = await readProject(req.params.slug);
    const incoming = req.body as Partial<ProjectData>;
    const merged: ProjectData = {
      ...existing,
      title: incoming.title ?? existing.title,
      seri: incoming.seri ?? existing.seri,
      archived: incoming.archived ?? existing.archived,
      topicBrief: incoming.topicBrief ?? existing.topicBrief,
      rawNaskahText: incoming.rawNaskahText ?? existing.rawNaskahText,
      rawStoryboardText:
        incoming.rawStoryboardText ?? existing.rawStoryboardText,
      rawGptText: incoming.rawGptText ?? existing.rawGptText,
      konsepVisualGlobal:
        incoming.konsepVisualGlobal ?? existing.konsepVisualGlobal,
      catatanVisual: incoming.catatanVisual ?? existing.catatanVisual,
      pesanAgent: incoming.pesanAgent ?? existing.pesanAgent,
      scenes: incoming.scenes ?? existing.scenes,
      claims: incoming.claims ?? existing.claims,
      revisions: incoming.revisions ?? existing.revisions,
      music: incoming.music ?? existing.music,
      promptChecklist: incoming.promptChecklist ?? existing.promptChecklist,
    };
    const saved = await writeProject(merged);
    res.json({ project: saved });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Gagal menyimpan episode.",
    });
  }
});

projectsRouter.post("/:slug/duplicate", async (req, res) => {
  try {
    const project = await duplicateProject(req.params.slug);
    res.status(201).json({ project });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Gagal menduplikat episode.",
    });
  }
});

projectsRouter.post("/:slug/archive", async (req, res) => {
  try {
    const existing = await readProject(req.params.slug);
    const body = req.body as { archived?: boolean };
    const archived =
      typeof body.archived === "boolean" ? body.archived : !existing.archived;
    const saved = await writeProject({ ...existing, archived });
    res.json({ project: saved });
  } catch (err) {
    res.status(400).json({
      error:
        err instanceof Error ? err.message : "Gagal mengubah status arsip.",
    });
  }
});

projectsRouter.get("/:slug/preview/status", async (req, res) => {
  try {
    const episodeDir = resolveEpisodeDir(req.params.slug);
    const status = await getHyperframesPreviewStatus(episodeDir);
    res.json(status);
  } catch (err) {
    res.status(400).json({
      error:
        err instanceof Error ? err.message : "Gagal mengecek status preview.",
    });
  }
});

projectsRouter.post("/:slug/preview/start", async (req, res) => {
  try {
    const episodeDir = resolveEpisodeDir(req.params.slug);
    const status = await startHyperframesPreview(episodeDir);
    res.json(status);
  } catch (err) {
    res.status(400).json({
      error:
        err instanceof Error
          ? err.message
          : "Gagal menjalankan Studio Preview HyperFrames.",
    });
  }
});

projectsRouter.post("/:slug/preview/stop", async (req, res) => {
  try {
    const episodeDir = resolveEpisodeDir(req.params.slug);
    const status = await stopHyperframesPreview(episodeDir);
    res.json(status);
  } catch (err) {
    res.status(400).json({
      error:
        err instanceof Error ? err.message : "Gagal menghentikan preview.",
    });
  }
});

projectsRouter.post("/:slug/check", async (req, res) => {
  try {
    const project = await readProject(req.params.slug);
    const episodeDir = resolveEpisodeDir(req.params.slug);
    const check = await runHyperframesCheck(episodeDir);
    const saved = await writeProject({ ...project, lastCheck: check });
    res.json({ check, project: saved });
  } catch (err) {
    res.status(400).json({
      error:
        err instanceof Error
          ? err.message
          : "Gagal menjalankan `hyperframes check`.",
    });
  }
});

const SUBFOLDER_MAP: Record<string, string> = {
  assets: "assets",
  audio: path.join("assets", "audio"),
  reference: path.join("assets", "reference"),
  renders: "renders",
  compositions: "compositions",
};

projectsRouter.post("/:slug/open-folder", async (req, res) => {
  try {
    const episodeDir = resolveEpisodeDir(req.params.slug);
    const body = req.body as { subfolder?: string };
    const sub = body.subfolder ? SUBFOLDER_MAP[body.subfolder] : undefined;
    const targetDir = sub ? path.join(episodeDir, sub) : episodeDir;

    execFile("xdg-open", [targetDir], (err) => {
      if (err) {
        console.warn("xdg-open warning:", err.message);
      }
    });
    res.json({ ok: true, path: targetDir });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Gagal membuka folder.",
    });
  }
});
