import type React from "react";
import { THEME_COLORS } from "../../theme";

export type AmbientField3DProps = {
  readonly frame: number;
  readonly opacity?: number;
  readonly radius?: number;
};

const AMBIENT_MOTES = Array.from({ length: 32 }, (_, idx) => {
  const angle = (idx / 32) * Math.PI * 2;
  const distFactor = 0.55 + (idx % 5) * 0.22;
  return {
    baseX: Math.cos(angle) * distFactor,
    baseY: ((idx % 9) - 4) * 0.38,
    baseZ: Math.sin(angle) * distFactor - 1.2,
    speed: 0.015 + (idx % 4) * 0.006,
    phase: idx * 0.7,
    size: 0.014 + (idx % 3) * 0.008,
    isAmber: idx % 3 === 0,
  };
});

/**
 * Calm deterministic floating spatial motes (pixel-square cubes) for non-room cosmic scenes.
 */
export const AmbientField3D: React.FC<AmbientField3DProps> = ({
  frame,
  opacity = 0.65,
  radius = 2.6,
}) => {
  if (opacity <= 0.01) {
    return null;
  }

  return (
    <group>
      {AMBIENT_MOTES.map((m, idx) => {
        const yDrift = Math.sin(frame * m.speed + m.phase) * 0.16;
        const xDrift = Math.cos(frame * m.speed * 0.8 + m.phase) * 0.08;
        const color = m.isAmber
          ? THEME_COLORS.accents.amber
          : THEME_COLORS.accents.cyan;

        return (
          <mesh
            key={idx}
            position={[
              m.baseX * radius + xDrift,
              m.baseY + yDrift,
              m.baseZ * (radius * 0.45),
            ]}
          >
            <boxGeometry args={[m.size, m.size, m.size]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={opacity * (0.35 + (idx % 3) * 0.2)}
            />
          </mesh>
        );
      })}
    </group>
  );
};

