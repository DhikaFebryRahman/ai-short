import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, "../../..");
export const EPISODES_DIR = path.join(ROOT_DIR, "episodes");

/**
 * Convert a project title or raw slug into a safe directory slug.
 */
export const sanitizeSlug = (raw: string): string => {
  const normalized = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || `episode-${Date.now()}`;
};

/**
 * Resolve an episode directory safely inside EPISODES_DIR.
 */
export const resolveEpisodeDir = (slug: string): string => {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new Error("Slug episode tidak valid.");
  }
  const target = path.resolve(EPISODES_DIR, slug);
  if (!target.startsWith(EPISODES_DIR + path.sep)) {
    throw new Error("Path episode di luar direktori yang diizinkan.");
  }
  return target;
};

/**
 * Validate and sanitize uploaded asset filename so spaces/unicode never break CLI tools.
 */
export const validateUploadFilename = (
  originalName: string,
  allowedExtensions: readonly string[],
): { readonly ok: boolean; readonly error?: string; readonly safeName: string } => {
  const baseName = path.basename(originalName);
  const ext = path.extname(baseName).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return {
      ok: false,
      error: `Format "${ext || "(tanpa ekstensi)"}" tidak didukung. Gunakan: ${allowedExtensions.join(", ")}.`,
      safeName: baseName,
    };
  }
  const stem = baseName.slice(0, baseName.length - ext.length);
  const safeStem =
    stem
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || `asset-${Date.now()}`;
  return { ok: true, safeName: `${safeStem}${ext}` };
};
