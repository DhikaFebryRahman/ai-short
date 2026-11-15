import fs from "node:fs/promises";
import path from "node:path";
import type { HighlightRole, ProjectData } from "../../shared/types";
import {
  PUBLIC_AUDIO_DIR,
  VIDEO_JSON_PATH,
  resolveProjectDir,
} from "./pathGuard";

type CaptionColorKey = "amber" | "cyan" | "green" | "red" | "white" | "muted";

const ROLE_TO_COLOR: Record<HighlightRole, CaptionColorKey> = {
  istilah_kunci: "amber",
  aksi: "cyan",
  berhasil: "green",
  masalah: "red",
};

const normalizeToken = (word: string): string =>
  word.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");

/**
 * Sync the active project's script, scenes, highlights, and audio assets into
 * Remotion's src/data/video.json and public/audio/.
 */
export const syncProjectToRemotion = async (
  project: ProjectData,
): Promise<{ readonly totalDurationSeconds: number }> => {
  const projectDir = resolveProjectDir(project.slug);
  await fs.mkdir(PUBLIC_AUDIO_DIR, { recursive: true });

  let voiceoverPublicPath: string | null = null;
  if (project.voiceover) {
    const srcVo = path.join(projectDir, project.voiceover.relativePath);
    const dstName = `active-vo-${project.voiceover.fileName}`;
    await fs.copyFile(srcVo, path.join(PUBLIC_AUDIO_DIR, dstName));
    voiceoverPublicPath = `audio/${dstName}`;
  }

  let musicPublicPath: string | null = null;
  if (project.music.mode !== "none" && project.music.relativePath && project.music.fileName) {
    const srcMusic = path.join(projectDir, project.music.relativePath);
    const dstName = `active-music-${project.music.fileName}`;
    await fs.copyFile(srcMusic, path.join(PUBLIC_AUDIO_DIR, dstName));
    musicPublicPath = `audio/${dstName}`;
  }

  const estimatedVoFromText = project.scenes.reduce((sum, s) => {
    const words = s.narasi.trim() ? s.narasi.trim().split(/\s+/).length : 0;
    return sum + Math.max(words / 2.5, 1.5);
  }, 0);

  const voiceoverDuration = project.voiceover
    ? project.voiceover.durationSeconds
    : Math.max(estimatedVoFromText, 4);

  const totalDurationSeconds = Math.ceil(voiceoverDuration + 1.0 + 1.5);

  const rawWordCounts = project.scenes.map((s) =>
    s.narasi.trim() ? s.narasi.trim().split(/\s+/).length : 0,
  );
  const totalSpokenWords = rawWordCounts.reduce((a, b) => a + b, 0);
  const hasAnySpoken = totalSpokenWords > 0;
  const hasSilentTrailingOutro =
    project.scenes.length > 1 &&
    rawWordCounts[project.scenes.length - 1] === 0 &&
    hasAnySpoken;

  let cursor = 0;
  const mappedScenes = project.scenes.map((scene, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === project.scenes.length - 1;
    const isLastSpokenBeforeOutro =
      hasSilentTrailingOutro && idx === project.scenes.length - 2;

    const words = scene.narasi.trim() ? scene.narasi.trim().split(/\s+/) : [];
    const startSec = isFirst ? 0 : cursor;

    let voSlice = 0;
    let endSec = totalDurationSeconds;

    if (isLast && hasSilentTrailingOutro) {
      voSlice = 0;
      endSec = totalDurationSeconds;
    } else if (hasAnySpoken) {
      const share = words.length / totalSpokenWords;
      voSlice = voiceoverDuration * share;
      if (isLastSpokenBeforeOutro) {
        endSec = Number((1.0 + voiceoverDuration).toFixed(2));
      } else if (isLast) {
        endSec = totalDurationSeconds;
      } else {
        endSec = Number(
          (startSec + (isFirst ? 1.0 : 0) + voSlice).toFixed(2),
        );
      }
    } else {
      voSlice = voiceoverDuration / Math.max(project.scenes.length, 1);
      endSec = isLast
        ? totalDurationSeconds
        : Number((startSec + (isFirst ? 1.0 : 0) + voSlice).toFixed(2));
    }

    cursor = endSec;

    const speakStart = isFirst ? 1.0 : startSec + 0.1;
    const speakDuration = Math.max(voSlice - 0.15, 0.5);
    const step = words.length > 0 ? speakDuration / words.length : 0.3;

    const highlightPhrases = scene.kataSorot.map((h) => ({
      tokens: h.kata.trim().split(/\s+/).map(normalizeToken).filter(Boolean),
      color: ROLE_TO_COLOR[h.peran],
    }));

    const wordHighlightColors: Array<CaptionColorKey | null> = Array.from(
      { length: words.length },
      () => null,
    );

    for (const phrase of highlightPhrases) {
      if (phrase.tokens.length === 0) continue;
      for (let i = 0; i <= words.length - phrase.tokens.length; i++) {
        const matched = phrase.tokens.every(
          (tok, offset) => normalizeToken(words[i + offset]) === tok,
        );
        if (matched) {
          for (let offset = 0; offset < phrase.tokens.length; offset++) {
            wordHighlightColors[i + offset] = phrase.color;
          }
        }
      }
    }

    const caption = words.map((kata, wIdx) => {
      const hlColor = wordHighlightColors[wIdx];
      return {
        kata,
        jenis: hlColor ? "keyword" : "intro",
        warna: hlColor ?? "muted",
        detik: Number((speakStart + wIdx * step).toFixed(2)),
      };
    });

    return {
      id: scene.id,
      judul: scene.judul,
      mulai: Number(startSec.toFixed(2)),
      selesai: Number(endSec.toFixed(2)),
      chip: scene.chip || scene.judul.toUpperCase(),
      chipWarna:
        scene.kataSorot[0] !== undefined
          ? ROLE_TO_COLOR[scene.kataSorot[0].peran]
          : "amber",
      kamera: scene.kamera,
      butuh3D: scene.butuh3D,
      visual: {
        tipe: "placeholder",
        catatan: scene.ideVisual || scene.pemahamanPenonton,
      },
      caption,
    };
  });

  const videoJson = {
    idKomposisi: "KapsulFakta",
    seri: project.seri || "KAPSUL FAKTA",
    voiceoverFile: voiceoverPublicPath,
    musikFile: musicPublicPath,
    musikVolume: project.music.volume ?? 0.14,
    fallbackVoiceoverDetik: Number(voiceoverDuration.toFixed(2)),
    scenes: mappedScenes,
  };

  await fs.writeFile(
    VIDEO_JSON_PATH,
    JSON.stringify(videoJson, null, 2),
    "utf-8",
  );

  return { totalDurationSeconds };
};

