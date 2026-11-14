import type React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_FAMILIES } from "../fonts";
import { resolveAccentColor, THEME_COLORS } from "../theme";
import type { CaptionColorKey } from "../types/video";

type ChipProps = {
  readonly label: string;
  readonly warna?: CaptionColorKey;
  readonly delaySeconds?: number;
};

/**
 * Small labeled pill displayed below the scene visual inside the safe zone.
 */
export const Chip: React.FC<ChipProps> = ({
  label,
  warna = "amber",
  delaySeconds = 0.1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { color, glow } = resolveAccentColor(warna);

  const startFrame = Math.round(delaySeconds * fps);
  const endFrame = startFrame + Math.round(0.35 * fps);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 22px",
        borderRadius: 999,
        backgroundColor: THEME_COLORS.surface,
        border: `1.5px solid ${color}`,
        boxShadow: `0 0 18px ${glow}`,
        opacity: interpolate(frame, [startFrame, endFrame], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        scale: interpolate(frame, [startFrame, endFrame], [0.92, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.spring({ damping: 200 }),
          output: "perceptual-scale",
        }),
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: color,
          boxShadow: `0 0 8px ${glow}`,
        }}
      />
      <span
        style={{
          fontFamily: FONT_FAMILIES.sans,
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color,
        }}
      >
        {label}
      </span>
    </div>
  );
};

