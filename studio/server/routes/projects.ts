import { execFile } from "node:child_process";
import path from "node:path";
import { Router } from "express";
import type { ProjectData } from "../../shared/types";
import { resolveProjectDir } from "../lib/pathGuard";
import {
  createProject,
  duplicateProject,
  listProjects,
  readProject,
  writeProject,
} from "../lib/projectStore";
import { syncProjectToRemotion } from "../lib/remotionSync";

export const projectsRouter = Router();

projectsRouter.get("/", async (_req, res) => {
  try {
    const items = await listProjects();
    res.json({ projects: items });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Gagal memuat daftar proyek.",
    });
  }
});

projectsRouter.post("/", async (req, res) => {
  try {
    const body = req.body as { title?: string; seri?: string };
    const title = body.title?.trim() || "Proyek Baru";
    const seri = body.seri?.trim() || "KAPSUL FAKTA";
    const project = await createProject(title, seri);
    res.status(201).json({ project });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Gagal membuat proyek.",
    });
  }
});

projectsRouter.get("/:slug", async (req, res) => {
  try {
    const project = await readProject(req.params.slug);
    res.json({ project });
  } catch {
    res.status(404).json({ error: "Proyek tidak ditemukan." });
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
      rawGptText: incoming.rawGptText ?? existing.rawGptText,
      scenes: incoming.scenes ?? existing.scenes,
      claims: incoming.claims ?? existing.claims,
      music: incoming.music ?? existing.music,
      promptChecklist: incoming.promptChecklist ?? existing.promptChecklist,
    };
    const saved = await writeProject(merged);
    res.json({ project: saved });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Gagal menyimpan proyek.",
    });
  }
});

projectsRouter.post("/:slug/duplicate", async (req, res) => {
  try {
    const project = await duplicateProject(req.params.slug);
    res.status(201).json({ project });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Gagal menduplikat proyek.",
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
      error: err instanceof Error ? err.message : "Gagal mengubah status arsip.",
    });
  }
});

projectsRouter.post("/:slug/sync", async (req, res) => {
  try {
    const project = await readProject(req.params.slug);
    const result = await syncProjectToRemotion(project);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({
      error:
        err instanceof Error
          ? err.message
          : "Gagal menyinkronkan ke Remotion.",
    });
  }
});

projectsRouter.post("/:slug/open-folder", async (req, res) => {
  try {
    const projectDir = resolveProjectDir(req.params.slug);
    const body = req.body as { subfolder?: "out" | "audio" | "referensi" };
    const targetDir = body.subfolder
      ? path.join(projectDir, body.subfolder)
      : projectDir;

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

