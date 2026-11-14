import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, "../../..");
export const PROJECTS_DIR = path.join(ROOT_DIR, "projects");
export const PUBLIC_AUDIO_DIR = path.join(ROOT_DIR, "public", "audio");
export const VIDEO_JSON_PATH = path.join(ROOT_DIR, "src", "data", "video.json");

/**
 * Convert a project title or raw slug into a safe directory slug.
 */
export const sanitizeSlug = (raw: string): string => {
  const normalized = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || `proyek-${Date.now()}`;
};

/**
 * Resolve a project directory safely inside PROJECTS_DIR.
 */
export const resolveProjectDir = (slug: string): string => {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new Error("Slug proyek tidak valid.");
  }
  const target = path.resolve(PROJECTS_DIR, slug);
  if (!target.startsWith(PROJECTS_DIR + path.sep)) {
    throw new Error("Path proyek di luar direktori yang diizinkan.");
  }
  return target;
};

/**
 * Validate uploaded asset filename: extension check, no spaces, safe characters.
 */
export const validateUploadFilename = (
  originalName: string,
  allowedExtensions: readonly string[],
): { readonly ok: boolean; readonly error?: string; readonly safeName: string } => {
  const baseName = path.basename(originalName);
  if (/\s/.test(baseName)) {
    return {
      ok: false,
      error: `Nama file "${baseName}" mengandung spasi. Ganti nama file tanpa spasi terlebih dahulu.`,
      safeName: baseName,
    };
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(baseName)) {
    return {
      ok: false,
      error: `Nama file "${baseName}" hanya boleh berisi huruf, angka, titik, garis bawah (_), atau tanda hubung (-).`,
      safeName: baseName,
    };
  }
  const ext = path.extname(baseName).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return {
      ok: false,
      error: `Format "${ext || "(tanpa ekstensi)"}" tidak didukung. Gunakan: ${allowedExtensions.join(", ")}.`,
      safeName: baseName,
    };
  }
  return { ok: true, safeName: baseName };
};

