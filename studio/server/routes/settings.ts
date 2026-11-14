import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { Router } from "express";
import type { ToolCheckItem } from "../../shared/types";
import { PROJECTS_DIR, ROOT_DIR } from "../lib/pathGuard";

const execFileAsync = promisify(execFile);

const checkTool = async (
  id: ToolCheckItem["id"],
  name: string,
  cmd: string,
  args: readonly string[],
  cwd: string,
  fixHint: string,
  pickLine?: (output: string) => string,
): Promise<ToolCheckItem> => {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, [...args], {
      cwd,
      timeout: 8000,
    });
    const combined = `${stdout}\n${stderr}`.trim();
    const firstLine = pickLine
      ? pickLine(combined)
      : combined.split(/\r?\n/)[0]?.trim() || "Terpasang";
    return {
      id,
      name,
      ok: true,
      version: firstLine,
      fixHint,
    };
  } catch {
    return {
      id,
      name,
      ok: false,
      version: null,
      fixHint,
    };
  }
};

export const settingsRouter = Router();

settingsRouter.get("/status", async (_req, res) => {
  const tools = await Promise.all([
    checkTool(
      "node",
      "Node.js",
      "node",
      ["--version"],
      ROOT_DIR,
      "Pasang Node.js v20+ atau v22 LTS dari nodejs.org atau via nvm.",
    ),
    checkTool(
      "npm",
      "npm",
      "npm",
      ["--version"],
      ROOT_DIR,
      "Pasang ulang Node.js agar npm CLI ikut terpasang.",
    ),
    checkTool(
      "ffmpeg",
      "FFmpeg",
      "ffmpeg",
      ["-version"],
      ROOT_DIR,
      "Jalankan: sudo apt update && sudo apt install -y ffmpeg",
    ),
    checkTool(
      "ffprobe",
      "ffprobe",
      "ffprobe",
      ["-version"],
      ROOT_DIR,
      "Biasanya terpasang bersama FFmpeg: sudo apt install -y ffmpeg",
    ),
    checkTool(
      "remotion",
      "Remotion CLI",
      path.join(ROOT_DIR, "node_modules", ".bin", "remotion"),
      ["versions"],
      ROOT_DIR,
      "Jalankan `npm install` di folder root proyek untuk memasang @remotion/cli.",
      (output) => {
        const match = output.match(/On version:\s*([^\r\n]+)/);
        return match ? `@remotion/cli ${match[1].trim()}` : "Terpasang";
      },
    ),
  ]);

  res.json({
    rootDir: ROOT_DIR,
    projectsDir: PROJECTS_DIR,
    tools,
  });
});
