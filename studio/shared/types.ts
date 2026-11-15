export type SceneFunction = "hook" | "inti" | "penutup";

export type HighlightRole =
  | "istilah_kunci"
  | "aksi"
  | "berhasil"
  | "masalah";

export type SceneStatus = "draf" | "disetujui";

export type CameraPreset =
  | "static"
  | "zoom-in"
  | "zoom-out"
  | "pan-left"
  | "pan-right"
  | "tilt-scan";

export type SceneHighlight = {
  readonly id: string;
  readonly kata: string;
  readonly peran: HighlightRole;
  readonly catatan?: string;
};

export type SceneShot = {
  readonly id: string;
  readonly judul: string;
  readonly timestamp: string;
  readonly visual3D: string;
  readonly gerakanKamera: string;
  readonly animasi: string;
  readonly teksDiLayar: string;
  readonly audio: string;
  readonly transisi: string;
};

export type ProjectScene = {
  readonly id: string;
  readonly judul: string;
  readonly fungsi: SceneFunction;
  readonly timestamp?: string;
  readonly narasi: string;
  readonly pemahamanPenonton: string;
  readonly ideVisual: string;
  readonly kataSorot: readonly SceneHighlight[];
  readonly chip: string;
  readonly butuh3D: boolean;
  readonly alasan3D: string;
  readonly kamera: CameraPreset;
  readonly status: SceneStatus;
  readonly estimasiDetik?: number;
  readonly shots?: readonly SceneShot[];
};

export type ClaimItem = {
  readonly id: string;
  readonly teks: string;
  readonly tercentang: boolean;
};

export type RevisionNote = {
  readonly id: string;
  readonly target: string;
  readonly timestamp: string;
  readonly note: string;
  readonly resolved: boolean;
  readonly createdAt: string;
};

export type SilenceSegment = {
  readonly start: number;
  readonly end: number;
  readonly duration: number;
};

export type VoiceoverAsset = {
  readonly fileName: string;
  readonly relativePath: string;
  readonly sizeBytes: number;
  readonly durationSeconds: number;
  readonly silences: readonly SilenceSegment[];
  readonly waveformPeaks: readonly number[];
};

export type ReferenceAsset = {
  readonly fileName: string;
  readonly relativePath: string;
  readonly sizeBytes: number;
  readonly durationSeconds: number;
  readonly contactSheetPath: string | null;
};

export type MusicMode = "none" | "synthetic" | "upload";

export type MusicAsset = {
  readonly mode: MusicMode;
  readonly fileName: string | null;
  readonly relativePath: string | null;
  readonly volume: number;
};

export type PromptChecklist = {
  readonly pesan: boolean;
  readonly alur: boolean;
  readonly voiceover: boolean;
  readonly referensi: boolean;
};

export type BlackSegment = {
  readonly start: number;
  readonly end: number;
  readonly duration: number;
};

export type RenderVerification = {
  readonly durationSeconds: number;
  readonly frameCount: number;
  readonly width: number;
  readonly height: number;
  readonly fps: number;
  readonly videoCodec: string;
  readonly audioCodec: string;
  readonly maxVolumeDb: number | null;
  readonly blackFramesDetected: boolean;
  readonly blackSegments: readonly BlackSegment[];
  readonly passed: boolean;
};

export type RenderRecord = {
  readonly id: string;
  readonly fileName: string;
  readonly relativePath: string;
  readonly createdAt: string;
  readonly verification: RenderVerification;
};

export type HyperframesCheckSummary = {
  readonly ok: boolean;
  readonly ranAt: string;
  readonly lintErrors: number;
  readonly lintWarnings: number;
  readonly runtimeErrors: number;
  readonly layoutWarnings: number;
  readonly motionErrors: number;
  readonly contrastErrors: number;
  readonly craftWarnings: number;
  readonly audioErrors: number;
};

export type ProjectPipelineStatus = {
  readonly naskah: boolean;
  readonly voiceover: boolean;
  readonly komposisi: boolean;
  readonly render: boolean;
  readonly thumbnail: boolean;
  readonly terverifikasi: boolean;
};

export type ProjectData = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly seri: string;
  readonly archived: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly topicBrief?: string;
  readonly rawNaskahText: string;
  readonly rawStoryboardText: string;
  readonly rawGptText?: string;
  readonly konsepVisualGlobal?: string;
  readonly catatanVisual?: string;
  readonly pesanAgent?: string;
  readonly scenes: readonly ProjectScene[];
  readonly claims: readonly ClaimItem[];
  readonly revisions?: readonly RevisionNote[];
  readonly voiceover: VoiceoverAsset | null;
  readonly reference: ReferenceAsset | null;
  readonly music: MusicAsset;
  readonly promptChecklist: PromptChecklist;
  readonly hasComposition?: boolean;
  readonly thumbnailPath?: string | null;
  readonly lastCheck?: HyperframesCheckSummary | null;
  readonly renders: readonly RenderRecord[];
};

export type ProjectSummary = {
  readonly slug: string;
  readonly title: string;
  readonly seri: string;
  readonly archived: boolean;
  readonly updatedAt: string;
  readonly sceneCount: number;
  readonly wordCount: number;
  readonly durationSeconds: number | null;
  readonly status: ProjectPipelineStatus;
};

export type ToolCheckItem = {
  readonly id: "node" | "npm" | "ffmpeg" | "ffprobe" | "hyperframes";
  readonly name: string;
  readonly ok: boolean;
  readonly version: string | null;
  readonly fixHint: string;
};

export type SettingsStatusResponse = {
  readonly rootDir: string;
  readonly episodesDir: string;
  readonly tools: readonly ToolCheckItem[];
};

export type PreviewStatusResponse = {
  readonly running: boolean;
  readonly url: string | null;
  readonly port: number | null;
  readonly message?: string;
};
