import type React from "react";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { THEME_COLORS } from "../../theme";

export type Brain3DProps = {
  readonly position?: readonly [number, number, number];
  readonly rotationY?: number;
  readonly rotationX?: number;
  readonly scale?: number;
  /** 0..1 cortical opacity / detail visibility */
  readonly shellOpacity?: number;
  /** 0..1 sensory motes entering cortex & awakening pathways (Scene 3 Shot 1) */
  readonly sensoryInflowProgress?: number;
  /** 0..1 propagating familiar wave inside memory recognition network (Scene 3 Shot 2) */
  readonly familiarPulseProgress?: number;
  /** Continuous phase for gently drifting unresolved activity (Scene 4 Shot 4 / Scene 5 Shot 3) */
  readonly ambientPhase?: number;
  /** 0..1 strength of conflicting dual streams meeting at central hub (Scene 4 Shot 3) */
  readonly conflictIntensity?: number;
  readonly conflictPhase?: number;
};

type LobePiece = {
  readonly pos: readonly [number, number, number];
  readonly rot: readonly [number, number, number];
  readonly radius: number;
  readonly scale: readonly [number, number, number];
};

// Symmetrical hemisphere lobe clusters forming a cohesive elongated brain silhouette
// (+Z = frontal anterior, -Z = occipital posterior, +/-X = right/left hemispheres, +Y = superior)
const HEMISPHERE_LOBES: readonly LobePiece[] = [
  { pos: [0.21, 0.08, 0.34], rot: [0.12, 0.06, -0.06], radius: 0.31, scale: [0.82, 0.88, 1.18] },
  { pos: [0.15, 0.22, 0.16], rot: [0.06, 0, -0.14], radius: 0.28, scale: [0.8, 0.84, 1.08] },
  { pos: [0.24, 0.2, -0.14], rot: [-0.12, 0, -0.1], radius: 0.31, scale: [0.88, 0.9, 1.12] },
  { pos: [0.3, -0.08, 0.02], rot: [0.14, 0.12, 0.08], radius: 0.24, scale: [0.76, 0.68, 1.24] },
  { pos: [0.19, 0.0, -0.4], rot: [-0.16, -0.08, 0], radius: 0.25, scale: [0.84, 0.82, 1.02] },
];

// Deterministic cortical gyri fold splines recessed smoothly onto cortex surface
const GYRI_CONTROL_POINTS: readonly (readonly [number, number, number][])[] = [
  [
    [0.12, 0.3, 0.42],
    [0.3, 0.24, 0.35],
    [0.39, 0.12, 0.24],
    [0.3, -0.02, 0.4],
  ],
  [
    [0.14, 0.36, 0.16],
    [0.36, 0.31, 0.06],
    [0.43, 0.16, -0.08],
    [0.33, 0.02, 0.1],
  ],
  [
    [0.14, 0.32, -0.12],
    [0.38, 0.24, -0.22],
    [0.37, 0.07, -0.35],
    [0.2, -0.05, -0.44],
  ],
  [
    [0.24, -0.04, 0.32],
    [0.44, -0.08, 0.12],
    [0.45, -0.13, -0.08],
    [0.34, -0.12, -0.26],
  ],
  [
    [0.16, 0.14, 0.5],
    [0.31, 0.04, 0.46],
    [0.24, -0.09, 0.31],
  ],
  [
    [0.14, 0.2, -0.38],
    [0.3, 0.1, -0.47],
    [0.22, -0.05, -0.49],
  ],
];

// Conceptual internal neural recognition & signal pathways inside the translucent brain
const SIGNAL_PATHWAY_POINTS: readonly (readonly [number, number, number][])[] = [
  [
    [-0.18, -0.08, -0.18], // Left temporal/hippocampal memory hub
    [-0.22, 0.12, 0.05],
    [-0.14, 0.22, 0.32], // Prefrontal evaluation
    [0.02, 0.18, 0.42],
  ],
  [
    [0.18, -0.08, -0.18], // Right temporal hub
    [0.24, 0.14, 0.06],
    [0.15, 0.24, 0.3],
    [-0.02, 0.18, 0.42],
  ],
  [
    [-0.2, -0.05, -0.15],
    [-0.04, 0.16, -0.08], // Cross-hemispheric corpus callosum bridge
    [0.18, 0.12, 0.04],
    [0.28, -0.02, -0.25],
  ],
  [
    [0.0, 0.15, 0.02], // Central executive junction -> parietal-occipital scan
    [-0.22, 0.24, -0.22],
    [-0.18, 0.04, -0.42],
  ],
  [
    [0.0, 0.15, 0.02],
    [0.22, 0.24, -0.22],
    [0.18, 0.04, -0.42],
  ],
  [
    [-0.36, -0.1, 0.14], // Lateral sensory input branch L -> central junction
    [-0.2, 0.04, 0.16],
    [0.0, 0.15, 0.02],
  ],
  [
    [0.36, -0.1, 0.14], // Lateral sensory input branch R -> central junction
    [0.2, 0.04, 0.16],
    [0.0, 0.15, 0.02],
  ],
];

const EXTERNAL_SENSORY_MOTES = Array.from({ length: 14 }, (_, idx) => {
  const angle = (idx / 14) * Math.PI * 2;
  const elev = ((idx % 5) - 2) * 0.22;
  return {
    startX: Math.cos(angle) * 1.35,
    startY: elev + 0.12,
    startZ: Math.sin(angle) * 1.35,
    endX: Math.cos(angle) * 0.26,
    endY: elev * 0.35 + 0.08,
    endZ: Math.sin(angle) * 0.32,
    isAmber: idx % 3 === 0,
  };
});

/**
 * Detailed anatomical-inspired 3D human brain with folded cerebral hemispheres,
 * striated cerebellum, brainstem, and conceptual illuminated neural signal pathways.
 */
export const Brain3D: React.FC<Brain3DProps> = ({
  position = [0, 0, 0],
  rotationY = 0,
  rotationX = 0,
  scale = 1,
  shellOpacity = 0.42,
  sensoryInflowProgress = 0,
  familiarPulseProgress = 0,
  ambientPhase = 0,
  conflictIntensity = 0,
  conflictPhase = 0,
}) => {
  const { gyriGeometries, gyriCaps, pathwayCurves, pathwayGeometries } = useMemo(() => {
    const gyri: THREE.TubeGeometry[] = [];
    const caps: [number, number, number][] = [];
    for (const side of [-1, 1] as const) {
      for (const pts of GYRI_CONTROL_POINTS) {
        const vecs = pts.map(([x, y, z]) => new THREE.Vector3(x * side, y, z));
        const curve = new THREE.CatmullRomCurve3(vecs);
        gyri.push(new THREE.TubeGeometry(curve, 18, 0.026, 8, false));
        const first = vecs[0];
        const last = vecs[vecs.length - 1];
        caps.push([first.x, first.y, first.z], [last.x, last.y, last.z]);
      }
    }

    const curves: THREE.CatmullRomCurve3[] = [];
    const tubes: THREE.TubeGeometry[] = [];
    for (const pts of SIGNAL_PATHWAY_POINTS) {
      const vecs = pts.map(([x, y, z]) => new THREE.Vector3(x, y, z));
      const curve = new THREE.CatmullRomCurve3(vecs);
      curves.push(curve);
      tubes.push(new THREE.TubeGeometry(curve, 24, 0.011, 8, false));
    }

    return {
      gyriGeometries: gyri,
      gyriCaps: caps,
      pathwayCurves: curves,
      pathwayGeometries: tubes,
    };
  }, []);

  useEffect(() => {
    return () => {
      gyriGeometries.forEach((g) => g.dispose());
      pathwayGeometries.forEach((g) => g.dispose());
    };
  }, [gyriGeometries, pathwayGeometries]);

  const conflictShake =
    conflictIntensity > 0.05
      ? Math.sin(conflictPhase * 5.2) * 0.018 * conflictIntensity
      : 0;

  return (
    <group
      position={[position[0] + conflictShake, position[1], position[2]]}
      rotation={[rotationX, rotationY, 0]}
      scale={scale}
    >
      {/* Left & Right Semi-Translucent Cerebral Hemispheres */}
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          {HEMISPHERE_LOBES.map((lobe, idx) => (
            <mesh
              key={idx}
              position={[lobe.pos[0] * side, lobe.pos[1], lobe.pos[2]]}
              rotation={[
                lobe.rot[0],
                lobe.rot[1] * side,
                lobe.rot[2] * side,
              ]}
              scale={lobe.scale}
            >
              <sphereGeometry args={[lobe.radius, 22, 18]} />
              <meshStandardMaterial
                color="#4B72B8"
                emissive="#1C356E"
                emissiveIntensity={0.42}
                roughness={0.38}
                metalness={0.12}
                transparent
                opacity={shellOpacity}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Folded Cortical Gyri Ridges + closed rounded end caps */}
      {gyriGeometries.map((geom, idx) => (
        <mesh key={`gyrus-${idx}`} geometry={geom}>
          <meshStandardMaterial
            color="#6E96DE"
            emissive="#25488A"
            emissiveIntensity={0.35 + sensoryInflowProgress * 0.25}
            roughness={0.44}
            transparent
            opacity={Math.min(0.62, shellOpacity + 0.14)}
            depthWrite={false}
          />
        </mesh>
      ))}
      {gyriCaps.map((cap, idx) => (
        <mesh key={`cap-${idx}`} position={cap}>
          <sphereGeometry args={[0.026, 8, 8]} />
          <meshStandardMaterial
            color="#6E96DE"
            emissive="#25488A"
            emissiveIntensity={0.35 + sensoryInflowProgress * 0.25}
            roughness={0.44}
            transparent
            opacity={Math.min(0.62, shellOpacity + 0.14)}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Striated Cerebellum (posterior inferior lobes + horizontal folia rings) */}
      {([-0.15, 0.15] as const).map((cx, idx) => (
        <group key={`cereb-${idx}`} position={[cx, -0.22, -0.34]}>
          <mesh scale={[1.15, 0.78, 0.92]}>
            <sphereGeometry args={[0.16, 18, 14]} />
            <meshStandardMaterial
              color="#395B9E"
              emissive="#1A3263"
              emissiveIntensity={0.4}
              roughness={0.5}
              transparent
              opacity={Math.min(0.8, shellOpacity + 0.24)}
            />
          </mesh>
          {[-0.06, 0, 0.06].map((ry, rIdx) => (
            <mesh key={rIdx} position={[0, ry, -0.02]} rotation={[Math.PI * 0.45, 0, 0]}>
              <torusGeometry args={[0.145 - Math.abs(ry) * 0.45, 0.012, 6, 18]} />
              <meshStandardMaterial
                color="#78A2E8"
                roughness={0.45}
                transparent
                opacity={0.55}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Brainstem (Pons + Medulla descending gracefully) */}
      <group position={[0, -0.32, -0.14]} rotation={[0.32, 0, 0]}>
        <mesh position={[0, 0.08, 0.03]}>
          <sphereGeometry args={[0.11, 14, 12]} />
          <meshStandardMaterial
            color="#4669AE"
            roughness={0.48}
            transparent
            opacity={0.74}
          />
        </mesh>
        <mesh position={[0, -0.1, -0.02]}>
          <cylinderGeometry args={[0.072, 0.052, 0.34, 16]} />
          <meshStandardMaterial
            color="#35528F"
            roughness={0.52}
            transparent
            opacity={0.78}
          />
        </mesh>
      </group>

      {/* Internal Conceptual Limbic / Hippocampal Recognition Core */}
      <mesh position={[0, 0.08, 0.0]} scale={[1.45, 0.75, 1.85]}>
        <torusGeometry args={[0.11, 0.026, 10, 26]} />
        <meshStandardMaterial
          color={THEME_COLORS.accents.amber}
          emissive={THEME_COLORS.accents.amber}
          emissiveIntensity={0.65 + familiarPulseProgress * 0.75}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* Conceptual Neural Pathways & Traveling Synaptic Signal Pulses */}
      {pathwayGeometries.map((geom, idx) => {
        const isAmberBranch = idx === 0 || idx === 2 || idx === 5;
        const pathwayColor = isAmberBranch
          ? THEME_COLORS.accents.amber
          : THEME_COLORS.accents.cyan;
        const baseGlow =
          0.35 +
          sensoryInflowProgress * 0.4 +
          (familiarPulseProgress > 0.05 ? 0.55 : 0) +
          conflictIntensity * 0.45;

        const curve = pathwayCurves[idx];
        const tPulse =
          familiarPulseProgress > 0.01
            ? (familiarPulseProgress + idx * 0.14) % 1
            : (ambientPhase * 0.16 + idx * 0.19) % 1;
        const pulsePt = curve.getPointAt(Math.max(0, Math.min(1, tPulse)));

        return (
          <group key={`path-${idx}`}>
            <mesh geometry={geom}>
              <meshStandardMaterial
                color={pathwayColor}
                emissive={pathwayColor}
                emissiveIntensity={baseGlow}
                transparent
                opacity={0.82}
              />
            </mesh>
            <mesh position={[pulsePt.x, pulsePt.y, pulsePt.z]}>
              <sphereGeometry args={[0.028 + familiarPulseProgress * 0.012, 10, 10]} />
              <meshBasicMaterial color={THEME_COLORS.accents.white} />
            </mesh>
          </group>
        );
      })}

      {/* Expanding Familiar Wave Rings radiating out of recognition hub */}
      {familiarPulseProgress > 0.02 ? (
        <group position={[0, 0.08, 0.05]}>
          {[0, 0.35].map((phaseOffset, idx) => {
            const p = (familiarPulseProgress + phaseOffset) % 1;
            const ringScale = 0.25 + p * 0.95;
            const ringAlpha = (1 - p) * 0.85;
            return (
              <mesh key={idx} scale={ringScale} rotation={[Math.PI * 0.2, 0.2, 0]}>
                <torusGeometry args={[0.55, 0.012, 8, 36]} />
                <meshBasicMaterial
                  color={idx === 0 ? THEME_COLORS.accents.amber : THEME_COLORS.accents.cyan}
                  transparent
                  opacity={ringAlpha}
                />
              </mesh>
            );
          })}
        </group>
      ) : null}

      {/* Dual Conflicting Signals Collision Aura (Scene 4 Shot 3) */}
      {conflictIntensity > 0.05 ? (
        <group position={[0, 0.16, 0.18]}>
          <mesh scale={0.7 + Math.sin(conflictPhase * 4) * 0.12}>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshBasicMaterial
              color={THEME_COLORS.accents.white}
              transparent
              opacity={conflictIntensity * 0.85}
            />
          </mesh>
          <mesh
            rotation={[conflictPhase * 0.7, conflictPhase * 0.4, 0]}
            scale={0.55 + ((conflictPhase * 0.5) % 0.6)}
          >
            <torusGeometry args={[0.38, 0.018, 10, 32]} />
            <meshBasicMaterial
              color={THEME_COLORS.accents.amber}
              transparent
              opacity={conflictIntensity * 0.8}
            />
          </mesh>
          <mesh
            rotation={[-conflictPhase * 0.6, conflictPhase * 0.8, 0.5]}
            scale={0.62 + (((conflictPhase + 0.5) * 0.5) % 0.6)}
          >
            <torusGeometry args={[0.38, 0.018, 10, 32]} />
            <meshBasicMaterial
              color={THEME_COLORS.accents.cyan}
              transparent
              opacity={conflictIntensity * 0.8}
            />
          </mesh>
        </group>
      ) : null}

      {/* Sensory Light Particles streaming into Cortex (Scene 3 Shot 1) */}
      {sensoryInflowProgress > 0.01 ? (
        <group>
          {EXTERNAL_SENSORY_MOTES.map((m, idx) => {
            const localT = Math.max(
              0,
              Math.min(1, sensoryInflowProgress * 1.25 - (idx % 4) * 0.08),
            );
            const x = THREE.MathUtils.lerp(m.startX, m.endX, localT);
            const y = THREE.MathUtils.lerp(m.startY, m.endY, localT);
            const z = THREE.MathUtils.lerp(m.startZ, m.endZ, localT);
            const color = m.isAmber
              ? THEME_COLORS.accents.amber
              : THEME_COLORS.accents.cyan;
            return (
              <mesh key={idx} position={[x, y, z]}>
                <octahedronGeometry args={[0.024, 0]} />
                <meshBasicMaterial
                  color={color}
                  transparent
                  opacity={Math.sin(localT * Math.PI) * 0.95}
                />
              </mesh>
            );
          })}
        </group>
      ) : null}
    </group>
  );
};
