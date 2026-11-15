import type React from "react";
import { interpolate } from "remotion";
import { THEME_COLORS } from "../../theme";

export type MemoryFragments3DProps = {
  readonly count?: number;
  readonly center?: readonly [number, number, number];
  readonly radius?: number;
  readonly spreadY?: number;
  readonly orbitAngle?: number;
  /** 0 = orbiting wide ring, 1 = gathered neatly into center target */
  readonly gatherProgress?: number;
  /** Target offset array when gatherProgress approaches 1 */
  readonly collapseToCenter?: boolean;
  readonly jitterPhase?: number;
  readonly jitterAmount?: number;
  readonly opacity?: number;
  readonly highlightIndex?: number;
};

type FragmentSpec = {
  readonly baseAngle: number;
  readonly radiusMul: number;
  readonly heightOffset: number;
  readonly tiltX: number;
  readonly tiltZ: number;
  readonly isAmber: boolean;
  readonly glyphType: number;
  readonly cardScale: number;
  readonly gatherX: number;
  readonly gatherY: number;
  readonly gatherZ: number;
};

const FRAGMENT_BANK: readonly FragmentSpec[] = Array.from(
  { length: 24 },
  (_, idx) => {
    const row = idx % 3;
    const col = Math.floor(idx / 3);
    return {
      baseAngle: (idx / 24) * Math.PI * 2 + (idx % 4) * 0.14,
      radiusMul: 0.72 + (idx % 5) * 0.14,
      heightOffset: ((idx % 7) - 3) * 0.24,
      tiltX: ((idx % 5) - 2) * 0.11,
      tiltZ: ((idx % 3) - 1) * 0.13,
      isAmber: idx % 3 === 0,
      glyphType: idx % 4,
      cardScale: 0.8 + (idx % 4) * 0.12,
      gatherX: (col - 3.5) * 0.34,
      gatherY: (row - 1) * 0.22,
      gatherZ: ((idx % 3) - 1) * 0.08,
    };
  },
);

const FragmentCard: React.FC<{
  readonly spec: FragmentSpec;
  readonly accent: string;
  readonly opacity: number;
  readonly highlightBoost: number;
}> = ({ spec, accent, opacity, highlightBoost }) => {
  const glowIntensity = 0.45 + highlightBoost * 0.65;

  return (
    <group scale={spec.cardScale}>
      {/* Frosted photo memory tile */}
      <mesh>
        <boxGeometry args={[0.38, 0.26, 0.018]} />
        <meshStandardMaterial
          color="#162448"
          emissive={accent}
          emissiveIntensity={0.14 + highlightBoost * 0.22}
          roughness={0.35}
          metalness={0.25}
          transparent
          opacity={opacity * 0.86}
        />
      </mesh>

      {/* Luminous border strip top */}
      <mesh position={[0, 0.124, 0.008]}>
        <boxGeometry args={[0.36, 0.012, 0.012]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={glowIntensity}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Miniature abstract room motif inside snapshot */}
      {spec.glyphType === 0 ? (
        <group position={[0, -0.01, 0.014]}>
          {/* Mini doorway motif */}
          <mesh position={[-0.05, 0, 0]}>
            <planeGeometry args={[0.08, 0.14]} />
            <meshBasicMaterial
              color={accent}
              transparent
              opacity={opacity * 0.55}
            />
          </mesh>
          <mesh position={[0.07, -0.03, 0]}>
            <planeGeometry args={[0.09, 0.06]} />
            <meshBasicMaterial
              color={THEME_COLORS.accents.white}
              transparent
              opacity={opacity * 0.42}
            />
          </mesh>
        </group>
      ) : null}

      {spec.glyphType === 1 ? (
        <group position={[0, 0, 0.014]}>
          {/* Mini pendant lamp + desk motif */}
          <mesh position={[0, 0.05, 0]}>
            <circleGeometry args={[0.035, 16]} />
            <meshBasicMaterial
              color={THEME_COLORS.accents.amber}
              transparent
              opacity={opacity * 0.72}
            />
          </mesh>
          <mesh position={[0, -0.045, 0]}>
            <planeGeometry args={[0.18, 0.025]} />
            <meshBasicMaterial
              color={accent}
              transparent
              opacity={opacity * 0.65}
            />
          </mesh>
        </group>
      ) : null}

      {spec.glyphType === 2 ? (
        <group position={[0, 0, 0.014]}>
          {/* Mini window panes */}
          <mesh>
            <planeGeometry args={[0.14, 0.12]} />
            <meshBasicMaterial
              color={THEME_COLORS.accents.cyan}
              transparent
              opacity={opacity * 0.35}
            />
          </mesh>
          <mesh>
            <planeGeometry args={[0.012, 0.12]} />
            <meshBasicMaterial
              color="#0D1019"
              transparent
              opacity={opacity * 0.8}
            />
          </mesh>
        </group>
      ) : null}

      {spec.glyphType === 3 ? (
        <group position={[0, 0, 0.014]}>
          {/* Mini circular halo artwork motif */}
          <mesh>
            <ringGeometry args={[0.042, 0.06, 20]} />
            <meshBasicMaterial
              color={THEME_COLORS.accents.amber}
              transparent
              opacity={opacity * 0.72}
            />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

/**
 * Reusable swirling collection of 3D snapshot memory fragments.
 */
export const MemoryFragments3D: React.FC<MemoryFragments3DProps> = ({
  count = 18,
  center = [0, 0, 0],
  radius = 1.9,
  spreadY = 1.0,
  orbitAngle = 0,
  gatherProgress = 0,
  collapseToCenter = false,
  jitterPhase = 0,
  jitterAmount = 0,
  opacity = 1,
  highlightIndex = -1,
}) => {
  if (opacity <= 0.01) {
    return null;
  }

  const activeSpecs = FRAGMENT_BANK.slice(0, Math.min(count, FRAGMENT_BANK.length));

  return (
    <group position={[center[0], center[1], center[2]]}>
      {activeSpecs.map((spec, idx) => {
        const theta = spec.baseAngle + orbitAngle;
        const r = radius * spec.radiusMul;
        const orbitX = Math.cos(theta) * r;
        const orbitY = spec.heightOffset * spreadY;
        const orbitZ = Math.sin(theta) * r;

        const targetX = collapseToCenter ? 0 : spec.gatherX;
        const targetY = collapseToCenter ? 0 : spec.gatherY;
        const targetZ = collapseToCenter ? 0 : spec.gatherZ;

        const jx =
          jitterAmount > 0
            ? Math.sin(jitterPhase * 1.9 + idx * 1.3) * jitterAmount
            : 0;
        const jy =
          jitterAmount > 0
            ? Math.cos(jitterPhase * 2.3 + idx * 0.9) * jitterAmount
            : 0;

        const px = interpolate(gatherProgress, [0, 1], [orbitX, targetX]) + jx;
        const py = interpolate(gatherProgress, [0, 1], [orbitY, targetY]) + jy;
        const pz = interpolate(gatherProgress, [0, 1], [orbitZ, targetZ]);

        const rotY = interpolate(
          gatherProgress,
          [0, 1],
          [-theta + Math.PI * 0.5, 0],
        );
        const rotX = interpolate(gatherProgress, [0, 1], [spec.tiltX, 0]);
        const rotZ = interpolate(gatherProgress, [0, 1], [spec.tiltZ, 0]);

        const scaleCollapse = collapseToCenter
          ? Math.max(0.05, 1 - gatherProgress * 0.92)
          : 1 - gatherProgress * 0.28;

        const accent = spec.isAmber
          ? THEME_COLORS.accents.amber
          : THEME_COLORS.accents.cyan;
        const isHighlighted = highlightIndex === idx ? 1 : 0;

        return (
          <group
            key={idx}
            position={[px, py, pz]}
            rotation={[rotX, rotY, rotZ]}
            scale={scaleCollapse}
          >
            <FragmentCard
              spec={spec}
              accent={accent}
              opacity={opacity}
              highlightBoost={isHighlighted}
            />
          </group>
        );
      })}
    </group>
  );
};

