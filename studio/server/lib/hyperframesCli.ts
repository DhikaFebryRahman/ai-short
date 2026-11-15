import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import type {
  HyperframesCheckSummary,
  PreviewStatusResponse,
} from "../../shared/types";
import { EPISODES_DIR } from "./pathGuard";

const execFileAsync = promisify(execFile);

const extractJsonFromOutput = (raw: string): Record<string, unknown> | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace <= firstBrace) return null;
  try {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
};

/**
 * Scaffold a new portrait HyperFrames episode under episodes/<slug>/.
 */
export const initHyperframesEpisode = async (slug: string): Promise<void> => {
  try {
    await execFileAsync(
      "npx",
      [
        "hyperframes",
        "init",
        slug,
        "--resolution=portrait",
        "--non-interactive",
        "--skip-skills",
      ],
      {
        cwd: EPISODES_DIR,
        timeout: 60000,
        env: process.env,
      },
    );
  } catch (err) {
    // Allow studio to still manage folder if CLI scaffold returns non-zero when folder pre-exists
    console.warn(
      `hyperframes init warning for ${slug}:`,
      err instanceof Error ? err.message : String(err),
    );
  }
};

const parsePreviewResponse = (
  stdout: string,
  stderr: string,
  slug: string,
): PreviewStatusResponse => {
  const combined = `${stdout}\n${stderr}`;
  const json = extractJsonFromOutput(stdout) ?? extractJsonFromOutput(combined);
  const result = (json?.result ?? json) as Record<string, unknown> | null;

  const rawUrl =
    (typeof result?.studioUrl === "string" && result.studioUrl) ||
    (typeof result?.serverUrl === "string" && result.serverUrl) ||
    (typeof result?.url === "string" && result.url) ||
    combined.match(/https?:\/\/(?:localhost|127\.0\.0\.1):\d+[^\s"']*/)?.[0] ||
    null;

  const rawPort =
    typeof result?.port === "number"
      ? result.port
      : rawUrl
        ? Number(rawUrl.match(/:(\d+)/)?.[1] ?? 0) || null
        : null;

  const state = typeof result?.state === "string" ? result.state : "";
  const running =
    state === "running" || state === "started"
      ? true
      : state === "stopped"
        ? false
        : typeof result?.running === "boolean"
          ? result.running
          : Boolean(rawUrl || /running|started|listening/i.test(combined));

  const normalizedUrl = rawUrl
    ? rawUrl.replace("127.0.0.1", "localhost")
    : null;
  const finalUrl =
    normalizedUrl && !normalizedUrl.includes("#project/")
      ? `${normalizedUrl.replace(/\/$/, "")}/#project/${slug}`
      : normalizedUrl;

  return {
    running,
    url: finalUrl,
    port: rawPort,
    message: typeof json?.message === "string" ? json.message : undefined,
  };
};

export const startHyperframesPreview = async (
  episodeDir: string,
): Promise<PreviewStatusResponse> => {
  const slug = path.basename(episodeDir);
  const { stdout, stderr } = await execFileAsync(
    "npx",
    ["hyperframes", "preview", "--background", "--no-open", "--json"],
    {
      cwd: episodeDir,
      timeout: 30000,
      env: process.env,
    },
  );
  return parsePreviewResponse(stdout, stderr, slug);
};

export const getHyperframesPreviewStatus = async (
  episodeDir: string,
): Promise<PreviewStatusResponse> => {
  const slug = path.basename(episodeDir);
  try {
    const { stdout, stderr } = await execFileAsync(
      "npx",
      ["hyperframes", "preview", "--status", "--json"],
      {
        cwd: episodeDir,
        timeout: 12000,
        env: process.env,
      },
    );
    return parsePreviewResponse(stdout, stderr, slug);
  } catch (err) {
    return {
      running: false,
      url: null,
      port: null,
      message: err instanceof Error ? err.message : undefined,
    };
  }
};

export const stopHyperframesPreview = async (
  episodeDir: string,
): Promise<PreviewStatusResponse> => {
  try {
    await execFileAsync(
      "npx",
      ["hyperframes", "preview", "--stop", "--json"],
      {
        cwd: episodeDir,
        timeout: 12000,
        env: process.env,
      },
    );
  } catch {
    // Stopping an already stopped server is harmless
  }
  return { running: false, url: null, port: null };
};

type CheckSection = {
  ok?: boolean;
  errorCount?: number;
  warningCount?: number;
};

export const runHyperframesCheck = async (
  episodeDir: string,
): Promise<HyperframesCheckSummary> => {
  let rawOut = "";
  try {
    const { stdout } = await execFileAsync(
      "npx",
      ["hyperframes", "check", "--json"],
      {
        cwd: episodeDir,
        timeout: 120000,
        maxBuffer: 12 * 1024 * 1024,
        env: process.env,
      },
    );
    rawOut = stdout;
  } catch (err) {
    const execErr = err as { stdout?: string; stderr?: string; message?: string };
    rawOut = execErr.stdout ?? "";
    if (!rawOut.trim()) {
      throw new Error(
        execErr.stderr?.trim() ||
          execErr.message ||
          "Gagal menjalankan hyperframes check.",
      );
    }
  }

  const parsed = extractJsonFromOutput(rawOut) as {
    lint?: CheckSection;
    runtime?: CheckSection;
    layout?: CheckSection;
    motion?: CheckSection;
    contrast?: CheckSection;
    craft?: CheckSection;
    audio?: CheckSection;
  } | null;

  if (!parsed) {
    throw new Error("Output JSON dari `hyperframes check` tidak terbaca.");
  }

  const lintErrors = parsed.lint?.errorCount ?? 0;
  const runtimeErrors = parsed.runtime?.errorCount ?? 0;
  const motionErrors = parsed.motion?.errorCount ?? 0;
  const contrastErrors = parsed.contrast?.errorCount ?? 0;
  const audioErrors = parsed.audio?.errorCount ?? 0;

  return {
    ok:
      lintErrors === 0 &&
      runtimeErrors === 0 &&
      motionErrors === 0 &&
      contrastErrors === 0 &&
      audioErrors === 0,
    ranAt: new Date().toISOString(),
    lintErrors,
    lintWarnings: parsed.lint?.warningCount ?? 0,
    runtimeErrors,
    layoutWarnings: parsed.layout?.warningCount ?? 0,
    motionErrors,
    contrastErrors,
    craftWarnings: parsed.craft?.warningCount ?? 0,
    audioErrors,
  };
};

