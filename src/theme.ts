import type { CaptionColorKey } from "./types/video";

export const VIDEO_SPECS = {
  width: 1080,
  height: 1920,
  fps: 30,
  introSeconds: 1.0,
  outroSeconds: 1.5,
  voiceoverStartSeconds: 1.0,
  maxDurationSeconds: 60,
} as const;

export const THEME_COLORS = {
  background: {
    top: "#0D1019",
    middle: "#0E1632",
    bottom: "#112551",
  },
  glow: {
    amber: "rgba(253, 174, 30, 0.16)",
    amberSoft: "rgba(253, 174, 30, 0.07)",
    blue: "rgba(38, 108, 245, 0.24)",
    blueDeep: "rgba(17, 37, 81, 0.45)",
  },
  particle: "rgba(198, 205, 228, 0.22)",
  introText: "#C6CDE4",
  surface: "rgba(15, 23, 46, 0.72)",
  borderSubtle: "rgba(198, 205, 228, 0.16)",
  trackInactive: "rgba(198, 205, 228, 0.18)",
  accents: {
    amber: "#FDAE1E",
    cyan: "#3CE1FE",
    green: "#34DC8C",
    red: "#F87171",
    white: "#F8FAFC",
    muted: "#C6CDE4",
  } satisfies Record<CaptionColorKey, string>,
  accentGlows: {
    amber: "rgba(253, 174, 30, 0.45)",
    cyan: "rgba(60, 225, 254, 0.45)",
    green: "rgba(52, 220, 140, 0.42)",
    red: "rgba(248, 113, 113, 0.4)",
    white: "rgba(248, 250, 252, 0.28)",
    muted: "rgba(198, 205, 228, 0.2)",
  } satisfies Record<CaptionColorKey, string>,
} as const;

export const SAFE_ZONE = {
  top: 150,
  bottom: 1500,
  horizontalPadding: 72,
  contentWidth: 1080 - 72 * 2,
} as const;

export const LAYOUT = {
  topBar: {
    top: 72,
    height: 68,
    paddingX: 72,
    segmentHeight: 6,
    segmentGap: 10,
    segmentRadius: 999,
  },
  scene: {
    visualTop: 180,
    visualHeight: 740,
    chipTop: 1070,
    captionTop: 1165,
    captionMaxHeight: 330,
  },
} as const;

/**
 * Resolve a semantic color key into hex color and matching glow color.
 */
export const resolveAccentColor = (
  key: CaptionColorKey = "white",
): { readonly color: string; readonly glow: string } => {
  return {
    color: THEME_COLORS.accents[key],
    glow: THEME_COLORS.accentGlows[key],
  };
};
