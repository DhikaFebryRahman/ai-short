import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { Router, type Response } from "express";
import type { RenderRecord } from "../../shared/types";
import { analyzeRenderedMedia, probeMedia } from "../lib/ffmpeg";
import { stopHyperframesPreview } from "../lib/hyperframesCli";
import { resolveEpisodeDir } from "../lib/pathGuard";
import {
  ensureEpisodeFolders,
  readProject,
  writeProject,
} from "../lib/projectStore";

type RenderJob = {
  readonly id: string;
  readonly slug: string;
  status: "running" | "done" | "error";
  progress: number;
  logs: string[];
  clients: Set<Response>;
  record?: RenderRecord;
  error?: string;
};

const jobs = new Map<string, RenderJob>();

const sendEvent = (res: Response, event: string, payload: unknown): void => {
  res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
};

const broadcast = (job: RenderJob, event: string, payload: unknown): void => {
  for (const client of job.clients) {
    sendEvent(client, event, payload);
  }
};

export const renderRouter = Router();

renderRouter.post("/:slug/render", async (req, res) => {
  try {
    const project = await readProject(req.params.slug);
    const episodeDir = await ensureEpisodeFolders(project.slug);

    try {
      await fs.access(path.join(episodeDir, "index.html"));
    } catch {
      res.status(400).json({
        error:
          "Komposisi HyperFrames (index.html) belum dibuat. Salin prompt ke agent terlebih dahulu untuk membangun scene.",
      });
      return;
    }

    if (project.voiceover) {
      const totalSec = Math.ceil(project.voiceover.durationSeconds + 2.5);
      if (totalSec > 60) {
        res.status(400).json({
          error: `Durasi video (${totalSec} detik) melebihi batas maksimal 60 detik.`,
        });
        return;
      }
    }

    await stopHyperframesPreview(episodeDir);

    const fileName = `${project.slug}.mp4`;
    const relativePath = `renders/${fileName}`;
    const outAbsPath = path.join(episodeDir, relativePath);

    const jobId = `render-${Date.now()}`;
    const job: RenderJob = {
      id: jobId,
      slug: project.slug,
      status: "running",
      progress: 0,
      logs: [
        `Menjalankan: npx hyperframes render --quality delivery --output ${relativePath}`,
      ],
      clients: new Set(),
    };
    jobs.set(jobId, job);

    const child = spawn(
      "npx",
      [
        "hyperframes",
        "render",
        "--quality",
        "delivery",
        "--output",
        relativePath,
      ],
      {
        cwd: episodeDir,
        env: process.env,
      },
    );

    const handleChunk = (chunk: Buffer) => {
      const text = chunk.toString("utf-8");
      for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        job.logs.push(line);
        if (job.logs.length > 400) {
          job.logs.shift();
        }
        const pctMatch = line.match(/(\d{1,3})%/);
        if (pctMatch) {
          const pct = Math.min(99, Number(pctMatch[1]));
          if (pct > job.progress) {
            job.progress = pct;
          }
        }
        broadcast(job, "log", { line, progress: job.progress });
      }
    };

    child.stdout.on("data", handleChunk);
    child.stderr.on("data", handleChunk);

    child.on("close", async (code) => {
      if (code !== 0) {
        job.status = "error";
        job.error = `Proses render HyperFrames berhenti dengan kode ${code}.`;
        broadcast(job, "render_error", { error: job.error });
        return;
      }

      try {
        job.logs.push("Memverifikasi hasil dengan ffprobe & ffmpeg...");
        broadcast(job, "log", {
          line: "Memverifikasi hasil dengan ffprobe & ffmpeg...",
          progress: 99,
        });

        const [probe, mediaCheck] = await Promise.all([
          probeMedia(outAbsPath),
          analyzeRenderedMedia(outAbsPath),
        ]);

        const passed =
          probe.width === 1080 &&
          probe.height === 1920 &&
          Math.round(probe.fps) === 30 &&
          probe.videoCodec === "h264" &&
          probe.audioCodec === "aac" &&
          mediaCheck.blackSegments.length === 0;

        const record: RenderRecord = {
          id: jobId,
          fileName,
          relativePath,
          createdAt: new Date().toISOString(),
          verification: {
            durationSeconds: Number(probe.durationSeconds.toFixed(2)),
            frameCount: probe.frameCount,
            width: probe.width,
            height: probe.height,
            fps: probe.fps,
            videoCodec: probe.videoCodec,
            audioCodec: probe.audioCodec,
            maxVolumeDb: mediaCheck.maxVolumeDb,
            blackFramesDetected: mediaCheck.blackSegments.length > 0,
            blackSegments: mediaCheck.blackSegments,
            passed,
          },
        };

        const latestProject = await readProject(project.slug);
        const filtered = latestProject.renders.filter(
          (r) => r.relativePath !== relativePath,
        );
        const saved = await writeProject({
          ...latestProject,
          renders: [record, ...filtered],
        });

        job.status = "done";
        job.progress = 100;
        job.record = record;
        broadcast(job, "done", { record, project: saved });
      } catch (err) {
        job.status = "error";
        job.error =
          err instanceof Error
            ? err.message
            : "Render selesai tetapi verifikasi ffprobe gagal.";
        broadcast(job, "render_error", { error: job.error });
      }
    });

    res.status(202).json({ jobId, outputFile: relativePath });
  } catch (err) {
    res.status(400).json({
      error:
        err instanceof Error ? err.message : "Gagal memulai proses render.",
    });
  }
});

renderRouter.get("/:slug/render/stream/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job || job.slug !== req.params.slug) {
    res.status(404).json({ error: "Job render tidak ditemukan." });
    return;
  }

  try {
    resolveEpisodeDir(req.params.slug);
  } catch {
    res.status(400).json({ error: "Slug tidak valid." });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  for (const line of job.logs) {
    sendEvent(res, "log", { line, progress: job.progress });
  }

  if (job.status === "done" && job.record) {
    sendEvent(res, "done", { record: job.record });
    res.end();
    return;
  }
  if (job.status === "error") {
    sendEvent(res, "render_error", { error: job.error ?? "Render gagal." });
    res.end();
    return;
  }

  job.clients.add(res);
  req.on("close", () => {
    job.clients.delete(res);
  });
});
