import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Scene3DStage } from "../components/Scene3DStage";
import { THEME_COLORS, VIDEO_SPECS } from "../theme";
import type { SceneData } from "../types/video";
import { AmbientField3D } from "./shared/AmbientField3D";
import { CameraRig3D } from "./shared/CameraRig3D";
import { MemoryFragments3D } from "./shared/MemoryFragments3D";
import { Text3DPlaque } from "./shared/Text3DPlaque";

export const Scene06IdentitasChannel: React.FC<{
  readonly scene: SceneData;
}> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Gentle push-in over first 44 frames, then holds cleanly in final brand lock (66f total)
  const pushT = interpolate(frame, [0, 44], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const angle = interpolate(pushT, [0, 1], [-0.16, 0]);
  const dist = interpolate(pushT, [0, 1], [4.15, 3.55]);
  const camPos: [number, number, number] = [
    Math.sin(angle) * dist,
    0.1,
    Math.cos(angle) * dist,
  ];
  const camTarget: [number, number, number] = [0, -0.48, 0];

  // Converged spark from Scene 5 bursts into forming fragments -> resolves into 3D logo
  const assembleT = spring({
    fps,
    frame: Math.max(0, frame - 6),
    config: { damping: 15, stiffness: 95 },
    durationInFrames: 26,
  });

  const particleCollapse = interpolate(frame, [0, 22], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const logoOpacity = interpolate(frame, [8, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sparkFlash = interpolate(frame, [0, 8, 22], [0.95, 0.75, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Scene3DStage width={VIDEO_SPECS.width} height={VIDEO_SPECS.height} fov={52}>
        <color attach="background" args={[THEME_COLORS.background.top]} />
        <fog attach="fog" args={[THEME_COLORS.background.top, 6, 15]} />

        <CameraRig3D position={camPos} target={camTarget} fov={52} />

        <pointLight
          position={[-1.4, 1.4, 2.4]}
          color={THEME_COLORS.accents.amber}
          intensity={1.65}
          distance={8}
        />
        <pointLight
          position={[1.4, -0.4, 2.4]}
          color={THEME_COLORS.accents.cyan}
          intensity={1.45}
          distance={8}
        />

        {/* Lingering small particles from Scene 5 gently drifting behind emblem */}
        <AmbientField3D frame={frame + 180} opacity={0.82} radius={2.2} />

        {/* Orbital particle fragments dispersing behind golden capsule crest */}
        <MemoryFragments3D
          count={16}
          center={[0, 0.08, -1.05]}
          radius={1.05}
          spreadY={0.65}
          orbitAngle={frame * 0.022}
          gatherProgress={particleCollapse}
          collapseToCenter
          opacity={interpolate(frame, [0, 18, 38], [0.9, 0.55, 0.2], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        />

        {/* Initial luminous seed spark carried seamlessly out of Scene 5 */}
        {sparkFlash > 0.01 ? (
          <mesh position={[0, 0.08, 0.25]} scale={0.4 + sparkFlash * 1.1}>
            <sphereGeometry args={[0.14, 18, 18]} />
            <meshBasicMaterial
              color={THEME_COLORS.accents.amber}
              transparent
              opacity={sparkFlash}
            />
          </mesh>
        ) : null}

        {/* Sculpted Golden Capsule Crest behind 3D Typography */}
        <group
          position={[0, 0.08, -0.15]}
          rotation={[0.14, 0, frame * 0.008]}
          scale={assembleT}
        >
          <mesh>
            <torusGeometry args={[0.68, 0.02, 12, 48]} />
            <meshStandardMaterial
              color={THEME_COLORS.accents.amber}
              emissive={THEME_COLORS.accents.amber}
              emissiveIntensity={0.75}
              metalness={0.55}
              roughness={0.25}
              transparent
              opacity={logoOpacity * 0.9}
            />
          </mesh>
          <mesh rotation={[Math.PI * 0.16, 0.2, 0]}>
            <torusGeometry args={[0.8, 0.011, 8, 48]} />
            <meshBasicMaterial
              color={THEME_COLORS.accents.cyan}
              transparent
              opacity={logoOpacity * 0.55}
            />
          </mesh>
        </group>

        {/* Hero 3D Extruded Brand Monument: KAPSUL FAKTA */}
        <Text3DPlaque
          text="KAPSUL FAKTA"
          subtext="SAINS & MISTERI PIKIRAN"
          accentColor={THEME_COLORS.accents.amber}
          position={[0, 0.08, 0.12]}
          scale={0.62 * assembleT}
          width={2.15}
          height={0.72}
          depth={0.18}
          opacity={logoOpacity}
        />
      </Scene3DStage>
    </AbsoluteFill>
  );
};
