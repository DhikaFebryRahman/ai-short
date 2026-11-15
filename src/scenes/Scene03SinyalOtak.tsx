import type React from "react";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Scene3DStage } from "../components/Scene3DStage";
import { THEME_COLORS, VIDEO_SPECS } from "../theme";
import type { SceneData } from "../types/video";
import { AmbientField3D } from "./shared/AmbientField3D";
import { Brain3D } from "./shared/Brain3D";
import { CameraRig3D } from "./shared/CameraRig3D";
import { MemoryFragments3D } from "./shared/MemoryFragments3D";
import { SceneCueBadge } from "./shared/SceneCueBadge";

export const Scene03SinyalOtak: React.FC<{ readonly scene: SceneData }> = () => {
  const frame = useCurrentFrame();

  // Three Storyboard Shots aligned cleanly with vo.mp3 clauses in Scene 3 (244f total):
  // Shot 1 (0..108): Sistem Pengenalan Memori
  // Shot 2 (108..164): Sinyal Familiar
  // Shot 3 (164..244): Sumber Ingatan Tidak Jelas -> pulls back to dual signals
  const probeArc = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.22, 0.08, 0.05),
      new THREE.Vector3(0.24, 0.24, 0.26),
      new THREE.Vector3(0.62, 0.04, 0.1),
    ]);
    return {
      curve,
      geom: new THREE.TubeGeometry(curve, 24, 0.014, 8, false),
    };
  }, []);

  useEffect(() => {
    return () => {
      probeArc.geom.dispose();
    };
  }, [probeArc]);

  // Phase 1: push-in to whole 3D brain (0..108)
  const s1T = interpolate(frame, [0, 108], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });
  // Phase 2: track across glowing neural branches (108..164)
  const s2T = interpolate(frame, [108, 164], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });
  // Phase 3: follow pulse to vague memory fragments -> pull slightly out (164..244)
  const s3T = interpolate(frame, [164, 214], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const s3PullOut = interpolate(frame, [218, 243], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Smooth continuous camera choreography across all 3 shots (calibrated 9:16 margins)
  const camX =
    interpolate(s1T, [0, 1], [-0.32, -0.1]) * (1 - s2T) +
    interpolate(s2T, [0, 1], [-0.1, 0.22]) * s2T * (1 - s3T) +
    interpolate(s3PullOut, [0, 1], [0.35, 0.18]) * s3T;

  const camY =
    interpolate(s1T, [0, 1], [0.22, 0.18]) * (1 - s2T) +
    interpolate(s2T, [0, 1], [0.18, 0.14]) * s2T * (1 - s3T) +
    interpolate(s3PullOut, [0, 1], [0.12, 0.16]) * s3T;

  const camZ =
    interpolate(s1T, [0, 1], [4.1, 3.05]) * (1 - s2T) +
    interpolate(s2T, [0, 1], [3.05, 2.85]) * s2T * (1 - s3T) +
    interpolate(s3PullOut, [0, 1], [3.45, 3.85]) * s3T;

  const targetX =
    interpolate(s1T, [0, 1], [-0.05, 0]) * (1 - s2T) +
    interpolate(s2T, [0, 1], [0, 0.06]) * s2T * (1 - s3T) +
    interpolate(s3PullOut, [0, 1], [0.2, 0.1]) * s3T;

  const targetY =
    interpolate(s1T, [0, 1], [-0.56, -0.4]) * (1 - s2T) +
    interpolate(s2T, [0, 1], [-0.4, -0.36]) * s2T * (1 - s3T) +
    interpolate(s3PullOut, [0, 1], [-0.46, -0.5]) * s3T;

  const targetZ =
    interpolate(s1T, [0, 1], [0, 0.04]) * (1 - s2T) +
    interpolate(s2T, [0, 1], [0.04, 0.08]) * s2T * (1 - s3T) +
    interpolate(s3PullOut, [0, 1], [0.08, -0.04]) * s3T;

  // 3/4 lateral rotation reads clearly as anatomical C-shaped cerebral lobes + cerebellum
  const brainRotY = interpolate(frame, [0, 244], [0.55, 1.25], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sensoryInflow = interpolate(frame, [8, 96], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const familiarPulse = interpolate(frame, [102, 178], [0, 2.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Search probe beam connecting brain to memory cluster in Shot 3
  const probeOpacity = interpolate(frame, [158, 172, 224, 240], [0, 0.85, 0.75, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const probeHeadT = interpolate(frame, [162, 212], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const probeHeadPos = probeArc.curve.getPointAt(Math.max(0, Math.min(1, probeHeadT)));

  // Hazy vague fragments that shimmer lightly and fade without locking an image
  const fragOpacity = interpolate(
    frame,
    [152, 172, 206, 238],
    [0, 0.62, 0.55, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const fragJitter = interpolate(frame, [175, 225], [0.015, 0.055], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fragDisperse = interpolate(frame, [206, 240], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Emerging two streams hint at very end (transition to Scene 4)
  const dualSplitHint = interpolate(frame, [220, 243], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // DOM cue badges
  const cue1Opacity = interpolate(frame, [10, 22, 100, 108], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cue2Opacity = interpolate(frame, [108, 118, 156, 164], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cue3Opacity = interpolate(frame, [164, 174, 232, 242], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Scene3DStage width={VIDEO_SPECS.width} height={VIDEO_SPECS.height} fov={52}>
        <color attach="background" args={[THEME_COLORS.background.top]} />
        <fog attach="fog" args={[THEME_COLORS.background.top, 5.8, 14]} />

        <CameraRig3D
          position={[camX, camY, camZ]}
          target={[targetX, targetY, targetZ]}
          fov={52}
        />

        <pointLight
          position={[-1.4, 1.5, 2.4]}
          color={THEME_COLORS.accents.cyan}
          intensity={1.5}
          distance={8}
        />
        <pointLight
          position={[1.6, 0.8, 1.8]}
          color={THEME_COLORS.accents.amber}
          intensity={1.35}
          distance={7}
        />

        <AmbientField3D frame={frame} opacity={0.72} radius={2.3} />

        {/* Anatomical-inspired 3D Brain with conceptual internal pathways */}
        <Brain3D
          position={[interpolate(s3T, [0, 1], [-0.08, -0.36]), 0.04, -0.08]}
          rotationY={brainRotY}
          rotationX={0.08}
          scale={0.94}
          shellOpacity={0.44}
          sensoryInflowProgress={sensoryInflow}
          familiarPulseProgress={familiarPulse % 1}
          ambientPhase={frame * 0.08}
        />

        {/* Neural search arc extending out toward vague memory vault */}
        {probeOpacity > 0.01 ? (
          <group>
            <mesh geometry={probeArc.geom}>
              <meshBasicMaterial
                color={THEME_COLORS.accents.amber}
                transparent
                opacity={probeOpacity * 0.72}
              />
            </mesh>
            <mesh position={[probeHeadPos.x, probeHeadPos.y, probeHeadPos.z]}>
              <sphereGeometry args={[0.045, 12, 12]} />
              <meshBasicMaterial color={THEME_COLORS.accents.white} />
            </mesh>
          </group>
        ) : null}

        {/* Vague memory fragment cluster failing to lock a specific source */}
        {fragOpacity > 0.01 ? (
          <MemoryFragments3D
            count={10}
            center={[0.62, 0.04, 0.1]}
            radius={0.42 + fragDisperse * 0.28}
            spreadY={0.48 + fragDisperse * 0.24}
            orbitAngle={frame * 0.014}
            gatherProgress={0}
            jitterPhase={frame * 0.35}
            jitterAmount={fragJitter}
            opacity={fragOpacity}
            highlightIndex={Math.floor(frame / 10) % 5}
          />
        ) : null}

        {/* Emerging dual signal preview sparks at end transition */}
        {dualSplitHint > 0.02 ? (
          <group>
            <mesh position={[-0.55 * dualSplitHint, -0.1, 0.45]}>
              <sphereGeometry args={[0.055, 12, 12]} />
              <meshBasicMaterial
                color={THEME_COLORS.accents.amber}
                transparent
                opacity={dualSplitHint * 0.85}
              />
            </mesh>
            <mesh position={[0.55 * dualSplitHint, -0.1, 0.45]}>
              <sphereGeometry args={[0.055, 12, 12]} />
              <meshBasicMaterial
                color={THEME_COLORS.accents.cyan}
                transparent
                opacity={dualSplitHint * 0.85}
              />
            </mesh>
          </group>
        ) : null}
      </Scene3DStage>

      <SceneCueBadge
        label="SISTEM PENGENALAN MEMORI"
        accent="amber"
        opacity={cue1Opacity}
      />
      <SceneCueBadge
        label="SINYAL FAMILIAR"
        accent="cyan"
        opacity={cue2Opacity}
      />
      <SceneCueBadge
        label="SUMBER INGATAN TIDAK JELAS"
        accent="red"
        opacity={cue3Opacity}
      />
    </AbsoluteFill>
  );
};
