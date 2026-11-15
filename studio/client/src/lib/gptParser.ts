import type {
  CameraPreset,
  ClaimItem,
  HighlightRole,
  ProjectScene,
  SceneFunction,
  SceneHighlight,
  SceneShot,
} from "../../../shared/types";

export type ParsedGptResult = {
  readonly title?: string;
  readonly scenes: ProjectScene[];
  readonly claims: ClaimItem[];
  readonly konsepVisualGlobal?: string;
  readonly catatanVisual?: string;
  readonly pesanAgent?: string;
  readonly source: "gabungan" | "naskah" | "storyboard" | "kosong";
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

const KNOWN_FIELD_LABELS = [
  "Konsep visual global",
  "Fungsi",
  "Timestamp",
  "Durasi",
  "Jumlah kata",
  "Narasi",
  "Pemahaman yang ingin dibangun",
  "Yang harus dipahami penonton",
  "Ide visual",
  "Visual 3D",
  "Visual",
  "Gerakan kamera",
  "Kamera",
  "Animasi",
  "Teks di layar",
  "Kata yang perlu ditonjolkan",
  "Kata sorot",
  "Kebutuhan 3D",
  "Sudut kamera khusus",
  "Audio",
  "Transisi",
] as const;

const KNOWN_FIELD_PATTERN = KNOWN_FIELD_LABELS.map((label) =>
  label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
).join("|");

const SECTION_STOP_NAMES =
  "(?:CATATAN\\s+PENTING\\s+UNTUK\\s+VISUAL|KLAIM\\s+YANG\\s+PERLU\\s+DIVERIFIKASI|PESAN\\s+UNTUK\\s+(?:CLAUDE|AGENT|AI))";

const FIELD_STOP_LOOKAHEAD =
  `(?=\\n\\s*(?:` +
  `(?:\\*\\*[ \\t]*)?(?:${KNOWN_FIELD_PATTERN})[ \\t]*:(?:\\*\\*|\\s|$)` +
  `|\\*\\*[^*\\n]{1,55}:(?:\\*\\*|\\s|$)` +
  `|(?:\\*\\*[ \\t]*)?SHOT\\s+\\d+(?:\\s*[—–:-]|\\*\\*|\\s|$)` +
  `|(?:#{1,4}\\s*)?STORYBOARD\\s+VISUAL\\b` +
  `|(?:#{1,4}\\s*SCENE\\s+\\d+|SCENE\\s+\\d+[ \\t]*(?:[—–:-]|\\n|$))` +
  `|(?:#{1,4}\\s*)?${SECTION_STOP_NAMES}\\b` +
  `|#{1,4}\\s` +
  `|---` +
  `|$))`;

const extractField = (block: string, labels: readonly string[]): string => {
  const escaped = labels.map((l) => l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const joined = escaped.join("|");
  const pattern = new RegExp(
    `(?:^|\\n)[ \\t]*(?:\\*\\*[ \\t]*(?:${joined})(?:[ \\t]*:[ \\t]*\\*\\*|\\*\\*[ \\t]*:)|(?:${joined})[ \\t]*:)[ \\t]*([\\s\\S]*?)${FIELD_STOP_LOOKAHEAD}`,
    "i",
  );
  const match = block.match(pattern);
  return match ? match[1].trim() : "";
};

const extractTopSection = (raw: string, headerPattern: RegExp): string => {
  const match = raw.match(headerPattern);
  return match ? match[1].trim() : "";
};

const extractOnScreenPhrases = (rawText: string): string[] => {
  if (!rawText.trim()) return [];
  const quoted = [...rawText.matchAll(/["“«]([^"”»\n]+)["”»]/g)]
    .map((m) => m[1].trim())
    .filter(Boolean);
  if (quoted.length > 0) return quoted;
  return rawText
    .split("\n")
    .map((l) => stripQuotes(l.replace(/^[-*•]\s*/, "")))
    .filter(Boolean);
};

const inferCameraPreset = (
  cameraText: string,
  idx: number,
  fungsi: SceneFunction,
): CameraPreset => {
  const lower = cameraText.toLowerCase();
  if (/pull-back|zoom-out|menjauh/.test(lower)) return "zoom-out";
  if (/orbit|rotasi|mengelilingi|setengah lingkaran|scan/.test(lower)) {
    return "tilt-scan";
  }
  if (/geser kiri|pan-left|ke kiri/.test(lower)) return "pan-left";
  if (/geser kanan|pan-right|tracking|ke kanan|kiri menuju.*kanan|ke samping/.test(lower)) {
    return "pan-right";
  }
  if (/push-in|zoom-in|mendekat/.test(lower)) return "zoom-in";
  return fungsi === "hook"
    ? "zoom-in"
    : idx % 2 === 0
      ? "tilt-scan"
      : "pan-right";
};

const combineShotTimestamp = (shots: readonly SceneShot[]): string => {
  if (shots.length === 0) return "";
  const firstStart = shots[0].timestamp.split(/[–-]/)[0]?.trim() ?? "";
  const lastParts = shots[shots.length - 1].timestamp.split(/[–-]/);
  const lastEnd = (lastParts[lastParts.length - 1] ?? "").trim();
  if (firstStart && lastEnd && firstStart !== lastEnd) {
    return `${firstStart}–${lastEnd}`;
  }
  return shots[0].timestamp;
};

const parseShots = (
  sceneChunk: string,
  sceneIdx: number,
  headingTitle: string,
  sceneTimestamp: string,
): SceneShot[] => {
  const storyboardSplit = sceneChunk.split(
    /(?:^|\n)\s*(?:#{1,4}\s*)?STORYBOARD\s+VISUAL\b[^\n]*/i,
  );
  const searchRegion =
    storyboardSplit.length > 1 ? storyboardSplit[1] : sceneChunk;

  const shotRegex =
    /(?=^(?:\*\*\s*SHOT\s+\d+[^\n]*|SHOT\s+\d+\s*(?:[—–:-][^\n]*|$)))/gim;
  const shotChunks = searchRegion
    .split(shotRegex)
    .filter((chunk) => /^(?:\*\*\s*)?SHOT\s+\d+/i.test(chunk.trim()));

  if (shotChunks.length > 0) {
    return shotChunks.map((chunk, sIdx) => {
      const firstLine = chunk.split("\n")[0] ?? "";
      const shotTitle = firstLine
        .replace(/^(?:\*\*\s*)?SHOT\s+\d+\s*[—–:-]?\s*/i, "")
        .replace(/\*\*$/, "")
        .trim();

      const rawTeks = extractField(chunk, ["Teks di layar"]);
      const teksPhrases = extractOnScreenPhrases(rawTeks);

      return {
        id: `shot-${sceneIdx + 1}-${sIdx + 1}`,
        judul: shotTitle || `Shot ${sIdx + 1}`,
        timestamp: extractField(chunk, ["Timestamp"]),
        visual3D: extractField(chunk, ["Visual 3D", "Visual"]),
        gerakanKamera: extractField(chunk, ["Gerakan kamera", "Kamera"]),
        animasi: extractField(chunk, ["Animasi"]),
        teksDiLayar: teksPhrases.join(" / "),
        audio: extractField(chunk, ["Audio"]),
        transisi: extractField(chunk, ["Transisi"]),
      };
    });
  }

  // Handle scenes like "SCENE 6 — IDENTITAS CHANNEL" without explicit "SHOT N" headings
  const visual3D = extractField(searchRegion, ["Visual 3D", "Visual"]);
  const gerakanKamera = extractField(searchRegion, ["Gerakan kamera", "Kamera"]);
  const animasi = extractField(searchRegion, ["Animasi"]);
  const rawTeks = extractField(searchRegion, ["Teks di layar"]);
  const audio = extractField(searchRegion, ["Audio"]);
  const transisi = extractField(searchRegion, ["Transisi"]);

  if (visual3D || gerakanKamera || animasi || rawTeks || audio) {
    const teksPhrases = extractOnScreenPhrases(rawTeks);
    return [
      {
        id: `shot-${sceneIdx + 1}-1`,
        judul: headingTitle || `Shot 1`,
        timestamp: sceneTimestamp,
        visual3D,
        gerakanKamera,
        animasi,
        teksDiLayar: teksPhrases.join(" / "),
        audio,
        transisi,
      },
    ];
  }

  return [];
};

const inferHighlightsFromShots = (
  narasi: string,
  shots: readonly SceneShot[],
  sceneIdx: number,
): SceneHighlight[] => {
  if (!narasi.trim() || shots.length === 0) return [];
  const lowerNarasi = narasi.toLowerCase();
  const seen = new Set<string>();
  const results: SceneHighlight[] = [];

  for (const shot of shots) {
    const phrases = shot.teksDiLayar
      .split(/\s*\/\s*/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 3);
    for (const phrase of phrases) {
      const lowerPhrase = phrase.toLowerCase();
      if (lowerNarasi.includes(lowerPhrase) && !seen.has(lowerPhrase)) {
        seen.add(lowerPhrase);
        results.push({
          id: `hl-${sceneIdx + 1}-${results.length + 1}`,
          kata: phrase,
          peran: inferHighlightRole(phrase, shot.judul),
        });
      }
    }
  }
  return results;
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
    /(?:^|\n)\s*(?:#{1,4}\s*)?KLAIM YANG PERLU DIVERIFIKASI\s*:?\s*\n([\s\S]*?)(?=\n\s*(?:---|(?:#{1,4}\s*)?(?:CATATAN PENTING UNTUK VISUAL|PESAN UNTUK\s+(?:CLAUDE|AGENT|AI)|ALUR\s+PENJELASAN\b|SCENE\s+\d+\b)|#{1,4}\s)|$)/i,
  );
  if (!match) return [];
  const rawLines = match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const markerLines = rawLines.filter((line) => /^\d+\.\s+|^[-*•]\s+/.test(line));
  const candidateLines = markerLines.length > 0 ? markerLines : rawLines;

  return candidateLines
    .map((line, idx) => ({
      id: `claim-${idx + 1}`,
      teks: line.replace(/^\d+\.\s+|^[-*•]\s+/, "").trim(),
      tercentang: false,
    }))
    .filter((c) => c.teks.length > 0);
};

const parseNarasiMarkers = (raw: string): ProjectScene[] => {
  const markerRegex =
    /(?:\*\*\[|\[)(Hook|Inti(?:\s*\d+)?|Penutup)(?:\]\*\*|\])\s*\n+([\s\S]*?)(?=(?:\*\*\[|\[)(?:Hook|Inti(?:\s*\d+)?|Penutup)(?:\]\*\*|\])|\n---|\n#{1,4}\s|\n\s*(?:ALUR\s+PENJELASAN\b|SCENE\s+\d+(?:\s*[—–:-]|$))|$)/gi;
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

const isMetadataOrRuleParagraph = (paragraph: string): boolean => {
  const firstLine = paragraph.split("\n")[0]?.trim() ?? "";
  return (
    !firstLine ||
    firstLine.startsWith("#") ||
    /^---+$/.test(firstLine) ||
    /^(?:\*\*)?(Judul|Estimasi\b[^:]*):/i.test(firstLine) ||
    /^NARASI LENGKAP\b/i.test(firstLine) ||
    /^Narasi$/i.test(firstLine)
  );
};

type SingleParseOutput = {
  title?: string;
  scenes: ProjectScene[];
  claims: ClaimItem[];
  konsepVisualGlobal?: string;
  catatanVisual?: string;
  pesanAgent?: string;
  structured: boolean;
};

const parseSingleInput = (
  rawInput: string,
  allowParagraphFallback: boolean,
): SingleParseOutput => {
  const raw = rawInput.replace(/\r\n/g, "\n").trim();
  if (!raw) {
    return { scenes: [], claims: [], structured: false };
  }

  const titleMatch =
    raw.match(/\*\*Judul:\*\*\s*(.+)/i) ?? raw.match(/^Judul:\s*(.+)/im);
  const title = titleMatch ? titleMatch[1].trim() : undefined;
  const claims = parseClaimsSection(raw);

  const topSectionStop =
    "(?=\\n\\s*(?:---|(?:#{1,4}\\s*)?(?:SCENE\\s+\\d+[ \\t]*(?:[—–:-]|\\n|$)|CATATAN\\s+PENTING\\s+UNTUK\\s+VISUAL|KLAIM\\s+YANG\\s+PERLU\\s+DIVERIFIKASI|PESAN\\s+UNTUK\\s+(?:CLAUDE|AGENT|AI)\\b)|#{1,4}\\s)|$)";

  const konsepVisualGlobal =
    extractTopSection(
      raw,
      new RegExp(
        `(?:^|\\n)[ \\t]*(?:\\*\\*|#{1,4}\\s*)?Konsep visual global\\s*:?(?:\\*\\*)?\\s*\\n([\\s\\S]*?)${topSectionStop}`,
        "i",
      ),
    ) || undefined;
  const catatanVisual =
    extractTopSection(
      raw,
      new RegExp(
        `(?:^|\\n)[ \\t]*(?:#{1,4}\\s*)?CATATAN PENTING UNTUK VISUAL\\s*:?\\s*\\n([\\s\\S]*?)${topSectionStop}`,
        "i",
      ),
    ) || undefined;
  const pesanAgent =
    extractTopSection(
      raw,
      new RegExp(
        `(?:^|\\n)[ \\t]*(?:#{1,4}\\s*)?PESAN UNTUK\\s+(?:CLAUDE|AGENT|AI)\\s*:?\\s*\\n([\\s\\S]*?)${topSectionStop}`,
        "i",
      ),
    ) || undefined;

  // Strip trailing non-scene sections before splitting SCENE blocks
  const alurPart =
    raw.split(
      /\n[ \t]*(?:#{1,4}\s*)?(?:CATATAN PENTING UNTUK VISUAL|KLAIM YANG PERLU DIVERIFIKASI|PESAN UNTUK\s+(?:CLAUDE|AGENT|AI))\b/i,
    )[0] ?? raw;
  const sceneSplitRegex =
    /(?=^(?:#{1,4}\s*SCENE\s+\d+[^\n]*|SCENE\s+\d+\s*(?:[—–:-][^\n]*|$)))/gim;
  const sceneChunks = alurPart
    .split(sceneSplitRegex)
    .filter((chunk) => /^(?:#{1,4}\s*)?SCENE\s+\d+/i.test(chunk.trim()));

  if (sceneChunks.length > 0) {
    const globalUses3D = /\b3D\b/i.test(konsepVisualGlobal ?? "");

    const scenes: ProjectScene[] = sceneChunks.map((chunk, idx) => {
      const firstLine = chunk.split("\n")[0] ?? "";
      const headingTitle = firstLine
        .replace(/^(?:#{1,4}\s*)?SCENE\s+\d+\s*[—–:-]?\s*/i, "")
        .trim();

      const headerRegion =
        chunk.split(
          /(?:^|\n)\s*(?:#{1,4}\s*)?STORYBOARD\s+VISUAL\b|(?=^(?:\*\*\s*SHOT\s+\d+[^\n]*|SHOT\s+\d+\s*(?:[—–:-][^\n]*|$)))/im,
        )[0] ?? chunk;

      const fungsiText = extractField(headerRegion, ["Fungsi"]);
      const durasiText = extractField(headerRegion, ["Durasi"]);
      const headerTimestamp = extractField(headerRegion, ["Timestamp"]);
      const narasiRaw = extractField(headerRegion, ["Narasi"]);
      const pemahaman = extractField(headerRegion, [
        "Pemahaman yang ingin dibangun",
        "Yang harus dipahami penonton",
      ]);
      const directIdeVisual = extractField(headerRegion, ["Ide visual"]);
      const highlightRaw = extractField(headerRegion, [
        "Kata yang perlu ditonjolkan",
        "Kata sorot",
      ]);
      const kebutuhan3DRaw = extractField(headerRegion, ["Kebutuhan 3D"]);
      const cameraOverrideRaw = extractField(headerRegion, [
        "Sudut kamera khusus",
      ]);

      const narasi = stripQuotes(narasiRaw);
      const fungsi = inferSceneFunction(
        idx,
        sceneChunks.length,
        headingTitle,
        fungsiText || (/identitas/i.test(headingTitle) ? "penutup" : ""),
      );

      const shots = parseShots(chunk, idx, headingTitle, headerTimestamp);
      const sceneTimestamp = headerTimestamp || combineShotTimestamp(shots);

      const kataSorotFromField = parseHighlights(highlightRaw, idx);
      const kataSorot =
        kataSorotFromField.length > 0
          ? kataSorotFromField
          : inferHighlightsFromShots(narasi, shots, idx);

      const shotSummaryVisual = shots
        .map((s) => {
          const timeTag = s.timestamp ? ` (${s.timestamp})` : "";
          const parts = [s.visual3D, s.animasi ? `Animasi: ${s.animasi}` : ""]
            .filter(Boolean)
            .join(" ");
          return `- ${s.judul}${timeTag}: ${parts}`.trim();
        })
        .join("\n");

      const ideVisual = directIdeVisual || shotSummaryVisual;

      let butuh3D = false;
      let alasan3D = "";
      if (kebutuhan3DRaw) {
        butuh3D = /^\s*(ya|iya|perlu|butuh|true)\b/i.test(kebutuhan3DRaw);
        alasan3D = kebutuhan3DRaw
          .replace(/^\s*(ya|iya|tidak|perlu|butuh|true|false)[.,:\s-]*/i, "")
          .trim();
      } else if (
        shots.some((s) => s.visual3D.length > 0) ||
        globalUses3D ||
        /\b3D\b/i.test(chunk)
      ) {
        butuh3D = true;
        alasan3D =
          shots.length > 0
            ? `Storyboard visual 3D (${shots.length} shot)`
            : "Visual utama menggunakan 3D";
      }

      const durasiMatch = durasiText.match(/([\d.,]+)/);
      const estimasiDetik = durasiMatch
        ? Number(durasiMatch[1].replace(",", "."))
        : Number((countWords(narasi) / 2.5).toFixed(1));

      const firstOnScreen = shots
        .map((s) => s.teksDiLayar.split(/\s*\/\s*/)[0]?.trim() ?? "")
        .find(Boolean);

      const defaultChip =
        firstOnScreen ||
        kataSorot[0]?.kata.toUpperCase() ||
        headingTitle.toUpperCase().slice(0, 28) ||
        `SCENE ${idx + 1}`;

      const combinedCameraText = [
        cameraOverrideRaw,
        ...shots.map((s) => s.gerakanKamera),
      ]
        .filter(Boolean)
        .join(" ");

      return {
        id: `scene-${String(idx + 1).padStart(2, "0")}`,
        judul: headingTitle || `Scene ${idx + 1}`,
        fungsi,
        timestamp: sceneTimestamp || undefined,
        narasi,
        pemahamanPenonton: pemahaman,
        ideVisual,
        kataSorot,
        chip: defaultChip,
        butuh3D,
        alasan3D,
        kamera: inferCameraPreset(combinedCameraText, idx, fungsi),
        status: "draf",
        estimasiDetik,
        shots: shots.length > 0 ? shots : undefined,
      };
    });

    return {
      title,
      scenes,
      claims,
      konsepVisualGlobal,
      catatanVisual,
      pesanAgent,
      structured: true,
    };
  }

  // Fallback 1: **[Hook]** / **[Inti]** / **[Penutup]** blocks
  const markerScenes = parseNarasiMarkers(alurPart);
  if (markerScenes.length > 0) {
    return {
      title,
      scenes: markerScenes,
      claims,
      konsepVisualGlobal,
      catatanVisual,
      pesanAgent,
      structured: true,
    };
  }

  if (!allowParagraphFallback) {
    return {
      title,
      scenes: [],
      claims,
      konsepVisualGlobal,
      catatanVisual,
      pesanAgent,
      structured: false,
    };
  }

  // Fallback 2: split by blank lines into paragraphs (skipping headings & metadata)
  const paragraphs = alurPart
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => !isMetadataOrRuleParagraph(p));

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

  return {
    title,
    scenes: fallbackScenes,
    claims,
    konsepVisualGlobal,
    catatanVisual,
    pesanAgent,
    structured: false,
  };
};

/**
 * Parse a single combined GPT text block.
 */
export const parseGptScript = (raw: string): ParsedGptResult => {
  const parsed = parseSingleInput(raw, true);
  return {
    title: parsed.title,
    scenes: parsed.scenes,
    claims: parsed.claims,
    konsepVisualGlobal: parsed.konsepVisualGlobal,
    catatanVisual: parsed.catatanVisual,
    pesanAgent: parsed.pesanAgent,
    source: parsed.scenes.length > 0 ? "storyboard" : "kosong",
  };
};

/**
 * Parse separated Naskah (narration) and Storyboard (scene visual/flow) texts from GPT
 * and merge them cleanly into scene cards, while still working if only one input is filled.
 */
export const parseSeparatedGptInputs = (
  naskahText: string,
  storyboardText: string,
): ParsedGptResult => {
  const naskahParsed = parseSingleInput(naskahText, true);
  const storyboardParsed = parseSingleInput(
    storyboardText,
    naskahParsed.scenes.length === 0,
  );

  const title = naskahParsed.title ?? storyboardParsed.title;
  const konsepVisualGlobal =
    storyboardParsed.konsepVisualGlobal ?? naskahParsed.konsepVisualGlobal;
  const catatanVisual =
    storyboardParsed.catatanVisual ?? naskahParsed.catatanVisual;
  const pesanAgent = storyboardParsed.pesanAgent ?? naskahParsed.pesanAgent;

  const seenClaims = new Set<string>();
  const claims: ClaimItem[] = [];
  for (const item of [...storyboardParsed.claims, ...naskahParsed.claims]) {
    const key = item.teks.toLowerCase();
    if (!seenClaims.has(key)) {
      seenClaims.add(key);
      claims.push({ ...item, id: `claim-${claims.length + 1}` });
    }
  }

  const hasNaskah = naskahParsed.scenes.length > 0;
  const hasStoryboard = storyboardParsed.scenes.length > 0;

  if (hasNaskah && hasStoryboard) {
    const count = Math.max(
      naskahParsed.scenes.length,
      storyboardParsed.scenes.length,
    );
    const merged: ProjectScene[] = [];

    for (let i = 0; i < count; i += 1) {
      const nScene = naskahParsed.scenes[i];
      const sScene = storyboardParsed.scenes[i];
      const base = sScene ?? nScene;
      const narasi = nScene?.narasi.trim()
        ? nScene.narasi
        : (sScene?.narasi ?? "");
      const fungsi = sScene?.fungsi ?? nScene?.fungsi ?? "inti";

      const kataSorot =
        base.kataSorot.length > 0
          ? base.kataSorot
          : sScene?.shots && narasi.trim()
            ? inferHighlightsFromShots(narasi, sScene.shots, i)
            : [];

      const sameNarasi =
        nScene?.narasi.trim() &&
        sScene?.narasi.trim() &&
        nScene.narasi.trim() === sScene.narasi.trim();

      merged.push({
        ...base,
        id: `scene-${String(i + 1).padStart(2, "0")}`,
        fungsi,
        narasi,
        kataSorot,
        estimasiDetik:
          sameNarasi && sScene?.estimasiDetik
            ? sScene.estimasiDetik
            : nScene?.narasi.trim()
              ? Number((countWords(narasi) / 2.5).toFixed(1))
              : base.estimasiDetik,
      });
    }

    return {
      title,
      scenes: merged,
      claims,
      konsepVisualGlobal,
      catatanVisual,
      pesanAgent,
      source: "gabungan",
    };
  }

  if (hasNaskah) {
    return {
      title,
      scenes: naskahParsed.scenes,
      claims,
      konsepVisualGlobal,
      catatanVisual,
      pesanAgent,
      source: "naskah",
    };
  }

  if (hasStoryboard) {
    return {
      title,
      scenes: storyboardParsed.scenes,
      claims,
      konsepVisualGlobal,
      catatanVisual,
      pesanAgent,
      source: "storyboard",
    };
  }

  return {
    title,
    scenes: [],
    claims,
    konsepVisualGlobal,
    catatanVisual,
    pesanAgent,
    source: "kosong",
  };
};

