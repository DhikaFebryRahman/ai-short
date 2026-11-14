import type React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME_COLORS, VIDEO_SPECS } from "../theme";

type ParticleSeed = {
  readonly id: number;
  readonly xPercent: number;
  readonly baseY: number;
  readonly size: number;
  readonly speedPxPerSec: number;
  readonly phase: number;
  readonly maxOpacity: number;
  readonly isAmber: boolean;
};

const PARTICLE_COUNT = 24;

const PARTICLE_SEEDS: readonly ParticleSeed[] = Array.from(
  { length: PARTICLE_COUNT },
  (_, i) => {
    // Deterministic pseudo-random distribution via linear congruential steps
    const s1 = ((i * 73 + 19) % 97) / 97;
    const s2 = ((i * 41 + 53) % 89) / 89;
    const s3 = ((i * 29 + 11) % 61) / 61;
    return {
      id: i,
      xPercent: 6 + s1 * 88,
      baseY: 120 + s2 * (VIDEO_SPECS.height - 240),
      size: 4 + (i % 3) * 2,
      speedPxPerSec: 12 + s3 * 18,
      phase: s2 * Math.PI * 2,
      maxOpacity: 0.14 + s3 * 0.16,
      isAmber: i % 7 === 0,
    };
  },
);

/**
 * Full-screen calm deep-blue gradient backdrop with subtle ambient glows
 * and deterministic drifting pixel-square particles.
 */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${THEME_COLORS.background.top} 0%, ${THEME_COLORS.background.middle} 52%, ${THEME_COLORS.background.bottom} 100%)`,
        overflow: "hidden",
      }}
    >
      {/* Dim amber glow at top-left */}
      <div
        style={{
          position: "absolute",
          top: -180,
          left: -180,
          width: 780,
          height: 780,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${THEME_COLORS.glow.amber} 0%, ${THEME_COLORS.glow.amberSoft} 42%, transparent 72%)`,
          opacity: interpolate(Math.sin(t * 0.45), [-1, 1], [0.78, 1]),
        }}
      />

      {/* Soft blue glow at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: -260,
          left: "50%",
          width: 1120,
          height: 900,
          translate: "-50% 0px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${THEME_COLORS.glow.blue} 0%, ${THEME_COLORS.glow.blueDeep} 45%, transparent 74%)`,
          opacity: interpolate(Math.cos(t * 0.35), [-1, 1], [0.8, 1]),
        }}
      />

      {/* Deterministic drifting square pixel particles */}
      {PARTICLE_SEEDS.map((p) => {
        const travel = (t * p.speedPxPerSec) % VIDEO_SPECS.height;
        const rawY = p.baseY - travel;
        const y = rawY < -20 ? rawY + VIDEO_SPECS.height + 20 : rawY;
        const driftX = Math.sin(t * 0.6 + p.phase) * 14;
        const twinkle = interpolate(
          Math.sin(t * 1.1 + p.phase),
          [-1, 1],
          [0.35, 1],
        );

        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.xPercent}%`,
              top: 0,
              width: p.size,
              height: p.size,
              translate: `${driftX.toFixed(2)}px ${y.toFixed(2)}px`,
              backgroundColor: p.isAmber
                ? THEME_COLORS.accents.amber
                : THEME_COLORS.particle,
              opacity: p.maxOpacity * twinkle,
              borderRadius: 1,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

