export type CaptionColorKey =
  | "amber"
  | "cyan"
  | "green"
  | "red"
  | "white"
  | "muted";

export type CaptionWordKind = "intro" | "keyword" | "pengantar" | "kunci";

export type CaptionWord = {
  readonly kata: string;
  readonly jenis: CaptionWordKind;
  readonly warna?: CaptionColorKey;
  readonly detik: number;
};

export type CameraPreset =
  | "static"
  | "zoom-in"
  | "zoom-out"
  | "pan-left"
  | "pan-right"
  | "tilt-scan";

export type SceneVisualMeta = {
  readonly tipe: string;
  readonly catatan?: string;
};

export type SceneData = {
  readonly id: string;
  readonly judul: string;
  readonly mulai: number;
  readonly selesai: number;
  readonly chip?: string;
  readonly chipWarna?: CaptionColorKey;
  readonly kamera?: CameraPreset;
  readonly butuh3D?: boolean;
  readonly caption: readonly CaptionWord[];
  readonly visual?: SceneVisualMeta;
};

export type VideoData = {
  readonly idKomposisi: string;
  readonly seri: string;
  readonly voiceoverFile: string | null;
  readonly musikFile: string | null;
  readonly musikVolume?: number;
  readonly fallbackVoiceoverDetik: number;
  readonly scenes: readonly SceneData[];
};

