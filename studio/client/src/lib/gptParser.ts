import type {
  ClaimItem,
  HighlightRole,
  ProjectScene,
  SceneFunction,
  SceneHighlight,
} from "../../../shared/types";

export type ParsedGptResult = {
  readonly title?: string;
  readonly scenes: ProjectScene[];
  readonly claims: ClaimItem[];
};

export const countWords = (text: string): number => {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).length;
};

const inferHighlightRole = (word: string, note: string): HighlightRole => {
  const combined = `${word} ${note}`.toLowerCase();
  if (
    /(masalah|keliru|salah|tercampur|menyesatkan|bahaya|risiko|gagal|tidak menjamin|berbeda)/.test(
      combined,
    )
  ) {
    return "masalah";
  }
  if (
    /(berhasil|solusi|akurat|benar|tepat|aman|terbukti|stabil)/.test(combined)
  ) {
    return "berhasil";
  }
  if (
    /(aksi|proses|menyusun|mengubah|memengaruhi|mengingat|arah|sudut|bergerak)/.test(
      combined,
    )
  ) {
    return "aksi";
  }
  return "istilah_kunci";
};

const inferSceneFunction = (
  index: number,
  total: number,
  heading: string,
  fungsiText: string,
): SceneFunction => {
  const combined = `${heading} ${fungsiText}`.toLowerCase();
  if (/hook|pembuka|menarik perhatian/.test(combined) || index === 0) {
    return "hook";
  }
  if (/penutup|kesimpulan|closing|akhir/.test(combined) || index === total - 1) {
    return "penutup";
  }
  return "inti";
};

const stripQuotes = (text: string): string =>
  text.trim().replace(/^["“'«]+|["”'»]+$/g, "").trim();

const extractField = (block: string, labels: readonly string[]): string => {
  const escaped = labels.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(
    `(?:^|\\n)\\s*(?:\\*\\*)?(?:${escaped.join("|")})\\s*:?(?:\\*\\*)?\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:\\*\\*[A-Z0-9]|###\\s|---|$))`,
    "i",
  );
  const match = block.match(pattern);
  return match ? match[1].trim() : "";
};

const parseHighlights = (rawBlock: string, sceneIdx: number): SceneHighlight[] => {
  if (!rawBlock.trim()) return [];
  const lines = rawBlock
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[-*•]/.test(l) || l.includes('"'));

  return lines
    .map((line, i): SceneHighlight | null => {
      const cleaned = line.replace(/^[-*•]\s*/, "").trim();
      const dashParts = cleaned.split(/\s+[—–-]\s+/);
      const rawWord = stripQuotes(dashParts[0] ?? cleaned);
      if (!rawWord) return null;
      const note = dashParts.slice(1).join(" — ").trim();
      return {
        id: `hl-${sceneIdx + 1}-${i + 1}`,
        kata: rawWord,
        peran: inferHighlightRole(rawWord, note),
        catatan: note || undefined,
      };
    })
    .filter((item): item is SceneHighlight => item !== null);
};

const parseClaimsSection = (raw: string): ClaimItem[] => {
  const match = raw.match(
    /#+\s*KLAIM YANG PERLU DIVERIFIKASI([\s\S]*)$/i,
  );
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+|^[-*]\s+/.test(line))
    .map((line, idx) => ({
      id: `claim-${idx + 1}`,
      teks: line.replace(/^\d+\.\s+|^[-*]\s+/, "").trim(),
      tercentang: false,
    }))
    .filter((c) => c.teks.length > 0);
};

const parseNarasiMarkers = (raw: string): ProjectScene[] => {
  const markerRegex =
    /(?:\*\*\[|\[)(Hook|Inti(?:\s*\d+)?|Penutup)(?:\]\*\*|\])\s*\n+([\s\S]*?)(?=(?:\*\*\[|\[)(?:Hook|Inti(?:\s*\d+)?|Penutup)(?:\]\*\*|\])|\n---|\n#+\s|$)/gi;
  const matches = [...raw.matchAll(markerRegex)];
  if (matches.length === 0) return [];

  return matches.map((m, idx) => {
    const label = m[1].trim();
    const narasi = stripQuotes(m[2].trim());
    const lower = label.toLowerCase();
    const fungsi: SceneFunction = lower.startsWith("hook")
      ? "hook"
      : lower.startsWith("penutup")
        ? "penutup"
        : "inti";

    return {
      id: `scene-${String(idx + 1).padStart(2, "0")}`,
      judul: label,
      fungsi,
      narasi,
      pemahamanPenonton: "",
      ideVisual: "",
      kataSorot: [],
      chip: label.toUpperCase(),
      butuh3D: false,
      alasan3D: "",
      kamera: fungsi === "hook" ? "zoom-in" : "tilt-scan",
      status: "draf",
      estimasiDetik: Number((countWords(narasi) / 2.5).toFixed(1)),
    };
  });
};

/**
 * Parse GPT script output (supports full # NARASI LENGKAP + # ALUR PENJELASAN +
 * # KLAIM YANG PERLU DIVERIFIKASI format as well as simpler [Hook]/[Inti]/[Penutup] or paragraph blocks).
 */
export const parseGptScript = (raw: string): ParsedGptResult => {
  const titleMatch = raw.match(/\*\*Judul:\*\*\s*(.+)/i) ?? raw.match(/^Judul:\s*(.+)/im);
  const title = titleMatch ? titleMatch[1].trim() : undefined;
  const claims = parseClaimsSection(raw);

  // Try structured "### SCENE N — Title" blocks first
  const alurPart =
    raw.split(/#+\s*KLAIM YANG PERLU DIVERIFIKASI/i)[0] ?? raw;
  const sceneSplitRegex = /(?=###\s*SCENE\s+\d+[^\n]*)/gi;
  const sceneChunks = alurPart
    .split(sceneSplitRegex)
    .filter((chunk) => /^###\s*SCENE\s+\d+/i.test(chunk.trim()));

  if (sceneChunks.length > 0) {
    const scenes: ProjectScene[] = sceneChunks.map((chunk, idx) => {
      const firstLine = chunk.split("\n")[0] ?? "";
      const headingTitle = firstLine
        .replace(/^###\s*SCENE\s+\d+\s*[—–:-]?\s*/i, "")
        .trim();

      const fungsiText = extractField(chunk, ["Fungsi"]);
      const durasiText = extractField(chunk, ["Durasi"]);
      const narasiRaw = extractField(chunk, ["Narasi"]);
      const pemahaman = extractField(chunk, [
        "Pemahaman yang ingin dibangun",
        "Yang harus dipahami penonton",
      ]);
      const ideVisual = extractField(chunk, ["Ide visual"]);
      const highlightRaw = extractField(chunk, [
        "Kata yang perlu ditonjolkan",
        "Kata sorot",
      ]);
      const kebutuhan3DRaw = extractField(chunk, ["Kebutuhan 3D"]);

      const narasi = stripQuotes(narasiRaw);
      const kataSorot = parseHighlights(highlightRaw, idx);
      const fungsi = inferSceneFunction(
        idx,
        sceneChunks.length,
        headingTitle,
        fungsiText,
      );

      const butuh3D = /^\s*(ya|iya|perlu|butuh|true)\b/i.test(kebutuhan3DRaw);
      const alasan3D = kebutuhan3DRaw
        .replace(/^\s*(ya|iya|tidak|perlu|butuh|true|false)[.,:\s-]*/i, "")
        .trim();

      const durasiMatch = durasiText.match(/([\d.,]+)/);
      const estimasiDetik = durasiMatch
        ? Number(durasiMatch[1].replace(",", "."))
        : Number((countWords(narasi) / 2.5).toFixed(1));

      const defaultChip =
        kataSorot[0]?.kata.toUpperCase() ||
        headingTitle.toUpperCase().slice(0, 28) ||
        `SCENE ${idx + 1}`;

      return {
        id: `scene-${String(idx + 1).padStart(2, "0")}`,
        judul: headingTitle || `Scene ${idx + 1}`,
        fungsi,
        narasi,
        pemahamanPenonton: pemahaman,
        ideVisual,
        kataSorot,
        chip: defaultChip,
        butuh3D,
        alasan3D,
        kamera: fungsi === "hook" ? "zoom-in" : idx % 2 === 0 ? "tilt-scan" : "pan-right",
        status: "draf",
        estimasiDetik,
      };
    });

    return { title, scenes, claims };
  }

  // Fallback 1: **[Hook]** / **[Inti]** / **[Penutup]** blocks
  const markerScenes = parseNarasiMarkers(raw);
  if (markerScenes.length > 0) {
    return { title, scenes: markerScenes, claims };
  }

  // Fallback 2: split by blank lines into paragraphs
  const paragraphs = raw
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith("#"));

  const fallbackScenes: ProjectScene[] = paragraphs.map((p, idx) => {
    const fungsi: SceneFunction =
      idx === 0 ? "hook" : idx === paragraphs.length - 1 ? "penutup" : "inti";
    return {
      id: `scene-${String(idx + 1).padStart(2, "0")}`,
      judul: `Scene ${idx + 1}`,
      fungsi,
      narasi: stripQuotes(p),
      pemahamanPenonton: "",
      ideVisual: "",
      kataSorot: [],
      chip: `SCENE ${idx + 1}`,
      butuh3D: false,
      alasan3D: "",
      kamera: "zoom-in",
      status: "draf",
      estimasiDetik: Number((countWords(p) / 2.5).toFixed(1)),
    };
  });

  return { title, scenes: fallbackScenes, claims };
};

