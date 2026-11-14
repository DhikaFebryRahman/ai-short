import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { BlackSegment, SilenceSegment } from "../../shared/types";

const execFileAsync = promisify(execFile);

export type MediaProbeInfo = {
  readonly durationSeconds: number;
  readonly frameCount: number;
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly videoCodec: string;
  readonly audioCodec: string;
};

const parseFps = (rawRate: string | undefined): number => {
  if (!rawRate) return 0;
  const parts = rawRate.split("/");
  if (parts.length === 2) {
    const num = Number(parts[0]);
    const den = Number(parts[1]);
    return den > 0 ? Number((num / den).toFixed(2)) : 0;
  }
  return Number(rawRate) || 0;
};

/**
 * Probe media metadata using ffprobe.
 */
export const probeMedia = async (filePath: string): Promise<MediaProbeInfo> => {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_format",
    "-show_streams",
    "-of",
    "json",
    filePath,
  ]);

  const parsed = JSON.parse(stdout) as {
    format?: { duration?: string };
    streams?: Array<{
      codec_type?: string;
      codec_name?: string;
      width?: number;
      height?: number;
      nb_frames?: string;
      r_frame_rate?: string;
      avg_frame_rate?: string;
    }>;
  };

  const durationSeconds = Number(parsed.format?.duration ?? 0);
  const videoStream = parsed.streams?.find((s) => s.codec_type === "video");
  const audioStream = parsed.streams?.find((s) => s.codec_type === "audio");
  const fps = parseFps(
    videoStream?.avg_frame_rate ?? videoStream?.r_frame_rate,
  );
  const rawFrames = Number(videoStream?.nb_frames ?? 0);
  const frameCount =
    rawFrames > 0 ? rawFrames : Math.round(durationSeconds * (fps || 30));

  return {
    durationSeconds,
    frameCount,
    width: videoStream?.width ?? 0,
    height: videoStream?.height ?? 0,
    fps,
    videoCodec: videoStream?.codec_name ?? "-",
    audioCodec: audioStream?.codec_name ?? "-",
  };
};

/**
 * Detect pause/silence intervals in voiceover audio via ffmpeg silencedetect.
 */
export const detectSilences = async (
  audioPath: string,
): Promise<SilenceSegment[]> => {
  const { stderr } = await execFileAsync(
    "ffmpeg",
    [
      "-hide_banner",
      "-i",
      audioPath,
      "-af",
      "silencedetect=noise=-35dB:d=0.25",
      "-f",
      "null",
      "-",
    ],
    { maxBuffer: 8 * 1024 * 1024 },
  );

  const silences: SilenceSegment[] = [];
  let pendingStart: number | null = null;

  for (const line of stderr.split("\n")) {
    const startMatch = line.match(/silence_start:\s*([\d.]+)/);
    if (startMatch) {
      pendingStart = Number(startMatch[1]);
      continue;
    }
    const endMatch = line.match(
      /silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)/,
    );
    if (endMatch) {
      const end = Number(endMatch[1]);
      const duration = Number(endMatch[2]);
      const start =
        pendingStart !== null ? pendingStart : Math.max(0, end - duration);
      silences.push({
        start: Number(start.toFixed(2)),
        end: Number(end.toFixed(2)),
        duration: Number(duration.toFixed(2)),
      });
      pendingStart = null;
    }
  }

  return silences;
};

/**
 * Extract normalized amplitude peaks (0..1) from an audio file for waveform display.
 */
export const extractWaveformPeaks = async (
  audioPath: string,
  barCount = 96,
): Promise<number[]> => {
  const { stdout } = await execFileAsync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      audioPath,
      "-ac",
      "1",
      "-ar",
      "4000",
      "-f",
      "s16le",
      "-",
    ],
    { encoding: "buffer", maxBuffer: 32 * 1024 * 1024 },
  );

  const sampleCount = Math.floor(stdout.length / 2);
  if (sampleCount === 0) {
    return Array.from({ length: barCount }, () => 0.1);
  }

  const bucketSize = Math.max(1, Math.floor(sampleCount / barCount));
  const peaks: number[] = [];
  let maxPeak = 1;

  for (let b = 0; b < barCount; b++) {
    const startSample = b * bucketSize;
    const endSample = Math.min(sampleCount, startSample + bucketSize);
    let bucketMax = 0;
    for (let s = startSample; s < endSample; s++) {
      const val = Math.abs(stdout.readInt16LE(s * 2));
      if (val > bucketMax) bucketMax = val;
    }
    if (bucketMax > maxPeak) maxPeak = bucketMax;
    peaks.push(bucketMax);
  }

  return peaks.map((p) => Number(Math.max(0.06, p / maxPeak).toFixed(3)));
};

/**
 * Generate a 4x3 frame contact sheet PNG from a reference video.
 */
export const generateContactSheet = async (
  videoPath: string,
  outPngPath: string,
  durationSeconds: number,
): Promise<void> => {
  const targetFrames = 12;
  const safeDuration = Math.max(durationSeconds, 1);
  const fpsFilter = `${targetFrames}/${safeDuration.toFixed(2)}`;

  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      videoPath,
      "-vf",
      `fps=${fpsFilter},scale=320:-1,tile=4x3`,
      "-frames:v",
      "1",
      outPngPath,
    ],
    { maxBuffer: 8 * 1024 * 1024 },
  );
};

/**
 * Generate a soft ambient chord pad WAV file matching the target video duration.
 */
export const generateSyntheticAmbientPad = async (
  durationSeconds: number,
  outWavPath: string,
): Promise<void> => {
  const safeDuration = Math.min(Math.max(Math.ceil(durationSeconds), 3), 65);
  const fadeOutStart = Math.max(safeDuration - 1.5, 0.5).toFixed(2);
  // Warm low-mid sine/harmonic pad (A2 + E3 + A3 + C#4 + E4) softened with lowpass
  const expr =
    "0.18*sin(2*PI*110*t)+0.14*sin(2*PI*164.81*t)+0.11*sin(2*PI*220*t)*(0.75+0.25*sin(2*PI*0.18*t))+0.08*sin(2*PI*277.18*t)+0.06*sin(2*PI*329.63*t)";

  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      `aevalsrc=${expr}:s=44100:d=${safeDuration}`,
      "-af",
      `lowpass=f=900,afade=t=in:st=0:d=1.2,afade=t=out:st=${fadeOutStart}:d=1.4`,
      outWavPath,
    ],
    { maxBuffer: 8 * 1024 * 1024 },
  );
};

/**
 * Analyze rendered MP4 for peak audio level (dB) and unintended black frames.
 */
export const analyzeRenderedMedia = async (
  videoPath: string,
): Promise<{
  readonly maxVolumeDb: number | null;
  readonly blackSegments: BlackSegment[];
}> => {
  const { stderr } = await execFileAsync(
    "ffmpeg",
    [
      "-hide_banner",
      "-i",
      videoPath,
      "-af",
      "volumedetect",
      "-vf",
      "blackdetect=d=0.25:pix_th=0.10",
      "-f",
      "null",
      "-",
    ],
    { maxBuffer: 16 * 1024 * 1024 },
  );

  let maxVolumeDb: number | null = null;
  const volMatch = stderr.match(/max_volume:\s*(-?[\d.]+)\s*dB/);
  if (volMatch) {
    maxVolumeDb = Number(volMatch[1]);
  }

  const blackSegments: BlackSegment[] = [];
  for (const line of stderr.split("\n")) {
    const blackMatch = line.match(
      /black_start:([\d.]+)\s+black_end:([\d.]+)\s+black_duration:([\d.]+)/,
    );
    if (blackMatch) {
      blackSegments.push({
        start: Number(Number(blackMatch[1]).toFixed(2)),
        end: Number(Number(blackMatch[2]).toFixed(2)),
        duration: Number(Number(blackMatch[3]).toFixed(2)),
      });
    }
  }

  return { maxVolumeDb, blackSegments };
};

