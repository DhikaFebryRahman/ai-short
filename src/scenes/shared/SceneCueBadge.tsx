import type React from "react";
import { FONT_FAMILIES } from "../../fonts";
import { LAYOUT, THEME_COLORS } from "../../theme";
import type { CaptionColorKey } from "../../types/video";

export type SceneCueBadgeProps = {
  readonly label: string;
  readonly subLabel?: string;
  readonly accent?: CaptionColorKey;
  readonly opacity?: number;
  readonly translateY?: number;
  readonly top?: number;
  readonly fontSize?: number;
};

const ACCENT_HEX: Record<CaptionColorKey, string> = {
  amber: THEME_COLORS.accents.amber,
  cyan: THEME_COLORS.accents.cyan,
  green: THEME_COLORS.accents.green,
  red: THEME_COLORS.accents.red,
  white: THEME_COLORS.accents.white,
  muted: THEME_COLORS.introText,
};

const ACCENT_GLOW: Record<CaptionColorKey, string> = {
  amber: "rgba(253, 174, 30, 0.34)",
  cyan: "rgba(60, 225, 254, 0.34)",
  green: "rgba(52, 220, 140, 0.34)",
  red: "rgba(255, 107, 107, 0.34)",
  white: "rgba(255, 255, 255, 0.25)",
  muted: "rgba(198, 205, 228, 0.24)",
};

/**
 * Reusable floating glass cue pill anchored cleanly inside the upper safe zone below TopBar.
 */
export const SceneCueBadge: React.FC<SceneCueBadgeProps> = ({
  label,
  subLabel,
  accent = "cyan",
  opacity = 1,
  translateY = 0,
  top = LAYOUT.scene.visualTop + 10,
  fontSize = 21,
}) => {
  if (opacity <= 0.01) {
    return null;
  }

  const color = ACCENT_HEX[accent];
  const glow = ACCENT_GLOW[accent];

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        opacity,
        transform: `translateY(${translateY}px)`,
        pointerEvents: "none",
        zIndex: 8,
      }}
    >
      <div
        style={{
          padding: "9px 24px",
          borderRadius: 999,
          backgroundColor: "rgba(13, 16, 25, 0.78)",
          border: `1.5px solid ${color}`,
          boxShadow: `0 0 24px ${glow}`,
          color,
          fontFamily: FONT_FAMILIES.sans,
          fontWeight: 700,
          fontSize,
          letterSpacing: "0.13em",
          textAlign: "center",
          maxWidth: 920,
        }}
      >
        {label}
      </div>

      {subLabel ? (
        <div
          style={{
            padding: "5px 18px",
            borderRadius: 999,
            backgroundColor: "rgba(14, 22, 50, 0.78)",
            border: "1px solid rgba(198, 205, 228, 0.3)",
            color: THEME_COLORS.introText,
            fontFamily: FONT_FAMILIES.sans,
            fontWeight: 600,
            fontSize: 16,
            letterSpacing: "0.12em",
            textAlign: "center",
          }}
        >
          {subLabel}
        </div>
      ) : null}
    </div>
  );
};
