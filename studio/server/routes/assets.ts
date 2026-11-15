import fs from "node:fs/promises";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import type { MusicMode } from "../../shared/types";
import {
  detectSilences,
  extractWaveformPeaks,
  generateContactSheet,
  generateSyntheticAmbientPad,
  probeMedia,
} from "../lib/ffmpeg";
import {
  resolveEpisodeDir,
  validateUploadFilename,
} from "../lib/pathGuard";
import {
  ensureEpisodeFolders,
  readProject,
  writeProject,
} from "../lib/projectStore";

const AUDIO_EXTS = [".mp3", ".wav", ".m4a"] as const;
const VIDEO_EXTS = [".mp4", ".mov", ".webm", ".mkv"] as const;
const MAX_AUDIO_BYTES = 100 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_BYTES },
});

export const assetsRouter = Router();

assetsRouter.post(
  "/:slug/assets/voiceover",
  upload.single("file"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "File voiceover tidak ditemukan." });
        return;
      }
      if (file.size > MAX_AUDIO_BYTES) {
        res.status(400).json({
          error: "Ukuran file voiceover melebihi batas 100 MB.",
        });
        return;
      }

      const nameCheck = validateUploadFilename(file.originalname, AUDIO_EXTS);
      if (!nameCheck.ok) {
        res.status(400).json({ error: nameCheck.error });
        return;
      }

      const project = await readProject(String(req.params.slug));
      const episodeDir = await ensureEpisodeFolders(project.slug);
      const ext = path.extname(nameCheck.safeName).toLowerCase();
      const targetName = `vo${ext}`;
      const relativePath = `assets/audio/${targetName}`;
      const absPath = path.join(episodeDir, relativePath);

      await fs.writeFile(absPath, file.buffer);

      const probe = await probeMedia(absPath);
      const [silences, waveformPeaks] = await Promise.all([
        detectSilences(absPath),
        extractWaveformPeaks(absPath, 96),
      ]);

      const updated = await writeProject({
        ...project,
        voiceover: {
          fileName: nameCheck.safeName,
          relativePath,
          sizeBytes: file.size,
          durationSeconds: Number(probe.durationSeconds.toFixed(2)),
          silences,
          waveformPeaks,
        },
      });

      res.json({ project: updated });
    } catch (err) {
      res.status(400).json({
        error:
          err instanceof Error
            ? err.message
            : "Gagal memproses file voiceover.",
      });
    }
  },
);

assetsRouter.post(
  "/:slug/assets/reference",
  upload.single("file"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        res
          .status(400)
          .json({ error: "File video referensi tidak ditemukan." });
        return;
      }
      if (file.size > MAX_VIDEO_BYTES) {
        res.status(400).json({
          error: "Ukuran video referensi melebihi batas 250 MB.",
        });
        return;
      }

      const nameCheck = validateUploadFilename(file.originalname, VIDEO_EXTS);
      if (!nameCheck.ok) {
        res.status(400).json({ error: nameCheck.error });
        return;
      }

      const project = await readProject(String(req.params.slug));
      const episodeDir = await ensureEpisodeFolders(project.slug);
      const relativePath = `assets/reference/${nameCheck.safeName}`;
      const absPath = path.join(episodeDir, relativePath);

      await fs.writeFile(absPath, file.buffer);

      const probe = await probeMedia(absPath);
      const contactSheetRel = "assets/reference/contact-sheet.png";
      const contactSheetAbs = path.join(episodeDir, contactSheetRel);
      await generateContactSheet(absPath, contactSheetAbs, probe.durationSeconds);

      const updated = await writeProject({
        ...project,
        reference: {
          fileName: nameCheck.safeName,
          relativePath,
          sizeBytes: file.size,
          durationSeconds: Number(probe.durationSeconds.toFixed(2)),
          contactSheetPath: contactSheetRel,
        },
      });

      res.json({ project: updated });
    } catch (err) {
      res.status(400).json({
        error:
          err instanceof Error
            ? err.message
            : "Gagal memproses video referensi.",
      });
    }
  },
);

assetsRouter.post(
  "/:slug/assets/music/upload",
  upload.single("file"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "File musik tidak ditemukan." });
        return;
      }
      if (file.size > MAX_AUDIO_BYTES) {
        res.status(400).json({
          error: "Ukuran file musik melebihi batas 100 MB.",
        });
        return;
      }

      const nameCheck = validateUploadFilename(file.originalname, AUDIO_EXTS);
      if (!nameCheck.ok) {
        res.status(400).json({ error: nameCheck.error });
        return;
      }

      const project = await readProject(String(req.params.slug));
      const episodeDir = await ensureEpisodeFolders(project.slug);
      const ext = path.extname(nameCheck.safeName).toLowerCase();
      const targetName = `bgm${ext}`;
      const relativePath = `assets/audio/${targetName}`;
      await fs.writeFile(path.join(episodeDir, relativePath), file.buffer);

      const updated = await writeProject({
        ...project,
        music: {
          mode: "upload",
          fileName: nameCheck.safeName,
          relativePath,
          volume: project.music.volume ?? 0.14,
        },
      });

      res.json({ project: updated });
    } catch (err) {
      res.status(400).json({
        error:
          err instanceof Error ? err.message : "Gagal mengunggah musik latar.",
      });
    }
  },
);

assetsRouter.post("/:slug/assets/music/synthetic", async (req, res) => {
  try {
    const project = await readProject(req.params.slug);
    const episodeDir = await ensureEpisodeFolders(project.slug);

    const targetDuration = project.voiceover
      ? Math.ceil(project.voiceover.durationSeconds + 2.5)
      : Math.max(
          Math.ceil(
            project.scenes.reduce((acc, s) => {
              const words = s.narasi.trim()
                ? s.narasi.trim().split(/\s+/).length
                : 0;
              return acc + words / 2.5;
            }, 0) + 2.5,
          ),
          10,
        );

    const fileName = "bgm.wav";
    const relativePath = `assets/audio/${fileName}`;
    await generateSyntheticAmbientPad(
      targetDuration,
      path.join(episodeDir, relativePath),
    );

    const updated = await writeProject({
      ...project,
      music: {
        mode: "synthetic",
        fileName,
        relativePath,
        volume: project.music.volume ?? 0.14,
      },
    });

    res.json({ project: updated });
  } catch (err) {
    res.status(400).json({
      error:
        err instanceof Error
          ? err.message
          : "Gagal membuat musik sintetis.",
    });
  }
});

assetsRouter.post("/:slug/assets/music/config", async (req, res) => {
  try {
    const project = await readProject(req.params.slug);
    const body = req.body as { mode?: MusicMode; volume?: number };
    const nextMode = body.mode ?? project.music.mode;
    const nextVolume =
      typeof body.volume === "number"
        ? Math.min(1, Math.max(0, body.volume))
        : project.music.volume;

    // Ensure episode dir exists
    resolveEpisodeDir(project.slug);

    const updated = await writeProject({
      ...project,
      music: {
        mode: nextMode,
        fileName: nextMode === "none" ? null : project.music.fileName,
        relativePath: nextMode === "none" ? null : project.music.relativePath,
        volume: Number(nextVolume.toFixed(2)),
      },
    });

    res.json({ project: updated });
  } catch (err) {
    res.status(400).json({
      error:
        err instanceof Error
          ? err.message
          : "Gagal menyimpan pengaturan musik.",
    });
  }
});
