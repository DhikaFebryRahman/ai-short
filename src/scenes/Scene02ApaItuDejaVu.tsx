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
import { Character3D } from "./shared/Character3D";
import { MemoryFragments3D } from "./shared/MemoryFragments3D";
import { ModernRoom3D } from "./shared/ModernRoom3D";
import { SceneCueBadge } from "./shared/SceneCueBadge";
import { Text3DPlaque } from "./shared/Text3DPlaque";

// Sequential highlight beacon positions inside ModernRoom3D (door, desk, lamp, window)
const ROOM_SCAN_TARGETS: readonly {
  readonly label: string;
  readonly pos: readonly [number, number, number];
  readonly start: number;
  readonly end: number;
}[] = [
  { pos: [-1.24, 1.15, -2.18], start: 188, end: 214, label: "door" },
  { pos: [0.88, 0.88, -0.68], start: 210, end: 238, label: "desk" },
  { pos: [0.88, 2.02, -0.68], start: 234, end: 262, label: "lamp" },
  { pos: [1.1, 1.62, -2.18], start: 256, end: 282, label: "window" },
];

export const Scene02ApaItuDejaVu: React.FC<{ readonly scene: SceneData }> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Exact Shot split aligned with vo.mp3 pause at 5.92s into Scene 2 (frame 178)
  const shotSplit = 178;
  const isShot1 = frame < shotSplit;

  // --- SHOT 1: Kemunculan Istilah Déjà Vu (frames 0..178) ---
  const gatherSpring = spring({
    fps,
    frame: Math.max(0, frame - 6),
    config: { damping: 16, stiffness: 75 },
    durationInFrames: 42,
  });

  const titleScale = spring({
    fps,
    frame: Math.max(0, frame - 26),
    config: { damping: 14, stiffness: 105 },
  });
  const titleOpacity = interpolate(frame, [24, 40, 170, 178], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleScale = spring({
    fps,
    frame: Math.max(0, frame - 114),
    config: { damping: 15, stiffness: 110 },
  });
  const subtitleOpacity = interpolate(frame, [112, 126, 170, 178], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Shot 1 camera: orbit gently around "DÉJÀ VU" 3D monolith, then push closer
  const orbitT = interpolate(frame, [0, shotSplit], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });
  const s1Angle = interpolate(orbitT, [0, 0.65, 1], [-0.46, 0.24, 0.08]);
  const s1Radius = interpolate(orbitT, [0, 0.6, 1], [3.9, 3.65, 3.05]);
  const s1CamPos: [number, number, number] = [
    Math.sin(s1Angle) * s1Radius,
    interpolate(orbitT, [0, 1], [0.22, 0.05]),
    Math.cos(s1Angle) * s1Radius,
  ];
  const s1Target: [number, number, number] = [0, -0.58, 0];

  // --- SHOT 2: Situasi Terasa Akrab (frames 178..316) ---
  const s2Orbit = interpolate(frame, [shotSplit, 286], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  // Smooth dive into character head at 286..316 to connect into Scene 3 Brain
  const headDive = interpolate(frame, [286, 315], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });

  const orbitAngleS2 = interpolate(s2Orbit, [0, 1], [0.58, -0.55]);
  const baseRadiusS2 = interpolate(s2Orbit, [0, 1], [3.65, 3.35]);
  const charCenterX = -0.32;
  const charCenterZ = -0.35;

  const s2OrbitCam: [number, number, number] = [
    charCenterX + Math.sin(orbitAngleS2) * baseRadiusS2,
    interpolate(s2Orbit, [0, 1], [1.38, 1.26]),
    charCenterZ + Math.cos(orbitAngleS2) * baseRadiusS2,
  ];
  const s2CamPos: [number, number, number] = [
    interpolate(headDive, [0, 1], [s2OrbitCam[0], charCenterX + 0.08]),
    interpolate(headDive, [0, 1], [s2OrbitCam[1], 1.48]),
    interpolate(headDive, [0, 1], [s2OrbitCam[2], charCenterZ + 0.72]),
  ];
  const s2Target: [number, number, number] = [
    interpolate(headDive, [0, 1], [0.06, charCenterX]),
    interpolate(headDive, [0, 1], [0.38, 1.48]),
    interpolate(headDive, [0, 1], [-0.95, charCenterZ]),
  ];
  const s2Fov = interpolate(headDive, [0, 1], [54, 40]);

  // Familiar translucent room echo rises briefly then fades cleanly
  const s2GhostIntensity = interpolate(
    frame,
    [205, 232, 272, 294],
    [0, 0.85, 0.82, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const s2ObjectHighlight = interpolate(
    frame,
    [186, 224, 276, 298],
    [0, 1, 0.9, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Brief cross-dissolve flash between Shot 1 -> Shot 2
  const shotCutFade = interpolate(
    frame,
    [shotSplit - 6, shotSplit, shotSplit + 8],
    [0, 0.35, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Dive spark glow as camera enters character head -> Brain transition
  const brainEntryGlow = interpolate(frame, [292, 315], [0, 0.72], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Active DOM Cue Badges
  const cue1Opacity = interpolate(frame, [10, 24, 102, 114], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cue2Opacity = interpolate(frame, [114, 126, 168, 176], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cue3Opacity = interpolate(frame, [184, 196, 236, 246], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cue4Opacity = interpolate(frame, [246, 258, 302, 312], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const camPos = isShot1 ? s1CamPos : s2CamPos;
  const camTarget = isShot1 ? s1Target : s2Target;
  const camFov = isShot1 ? 52 : s2Fov;

  return (
    <AbsoluteFill>
      <Scene3DStage width={VIDEO_SPECS.width} height={VIDEO_SPECS.height} fov={camFov}>
        <color attach="background" args={[THEME_COLORS.background.top]} />
        <fog attach="fog" args={[THEME_COLORS.background.top, 6.2, 15]} />

        <CameraRig3D position={camPos} target={camTarget} fov={camFov} />

        {isShot1 ? (
          <group>
            <AmbientField3D frame={frame} opacity={0.78} radius={2.4} />

            {/* Subtle orbital depth halo ring behind the 3D title */}
            <mesh position={[0, 0.08, -0.35]} rotation={[0.35, frame * 0.008, 0]}>
              <torusGeometry args={[1.28, 0.012, 8, 48]} />
              <meshBasicMaterial
                color={THEME_COLORS.accents.cyan}
                transparent
                opacity={0.34}
              />
            </mesh>

            {/* Inner assembling fragments snapping toward DÉJÀ VU */}
            <MemoryFragments3D
              count={16}
              center={[0, 0.12, -0.65]}
              radius={1.15}
              spreadY={0.7}
              orbitAngle={frame * 0.025}
              gatherProgress={gatherSpring * 0.85}
              opacity={interpolate(frame, [0, 16, 46, 70], [0.4, 1, 0.85, 0.15], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
            />

            {/* Outer floating photo fragments orbiting strictly behind main 3D term */}
            <MemoryFragments3D
              count={12}
              center={[0, 0.02, -1.38]}
              radius={1.08}
              spreadY={0.85}
              orbitAngle={-frame * 0.018 + 0.5}
              gatherProgress={0}
              opacity={0.75}
            />

            {/* Hero 3D Text Block: DÉJÀ VU */}
            <Text3DPlaque
              text="DÉJÀ VU"
              subtext={frame > 60 ? "ISTILAH PRANCIS" : undefined}
              accentColor={THEME_COLORS.accents.amber}
              position={[0, 0.12, 0.14]}
              scale={0.68 * titleScale}
              width={2.1}
              height={0.74}
              depth={0.16}
              opacity={titleOpacity}
            />

            {/* Secondary 3D Translation Plaque below DÉJÀ VU */}
            <Text3DPlaque
              text="SUDAH PERNAH DILIHAT"
              accentColor={THEME_COLORS.accents.cyan}
              position={[0, -0.42, 0.22]}
              scale={0.54 * subtitleScale}
              width={2.3}
              height={0.46}
              depth={0.1}
              opacity={subtitleOpacity}
            />
          </group>
        ) : (
          <group>
            <pointLight
              position={[0.4, 2.2, 1.5]}
              color="#CFE2FF"
              intensity={1.55}
              distance={7}
            />

            <ModernRoom3D
              doorOpenProgress={0.85}
              ghostIntensity={s2GhostIntensity}
              ghostOffset={[0.16, 0.02, -0.12]}
              objectHighlight={s2ObjectHighlight}
            />

            <Character3D
              position={[charCenterX, 0, charCenterZ]}
              rotationY={0.34}
              headTurnY={interpolate(frame, [182, 224, 268], [-0.28, 0.34, -0.14], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
              surpriseAmount={0.65}
              echoOpacity={s2GhostIntensity * 0.65}
              echoOffset={[0.16, 0.02, -0.12]}
            />

            {/* Sequential luminous highlight rings isolating recognized objects */}
            {ROOM_SCAN_TARGETS.map((item, idx) => {
              const alpha = interpolate(
                frame,
                [item.start, item.start + 8, item.end - 8, item.end],
                [0, 0.9, 0.9, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              );
              if (alpha <= 0.01) {
                return null;
              }
              const pulse = 0.85 + Math.sin(frame * 0.25) * 0.12;
              return (
                <mesh
                  key={item.label}
                  position={item.pos}
                  rotation={[0, orbitAngleS2 * 0.5, 0]}
                  scale={pulse}
                >
                  <torusGeometry args={[0.38, 0.018, 10, 32]} />
                  <meshBasicMaterial
                    color={
                      idx % 2 === 0
                        ? THEME_COLORS.accents.cyan
                        : THEME_COLORS.accents.amber
                    }
                    transparent
                    opacity={alpha}
                  />
                </mesh>
              );
            })}

            {/* Glowing neural sparks awakening at forehead as camera dives into brain */}
            {headDive > 0.05 ? (
              <mesh position={[charCenterX, 1.48, charCenterZ + 0.16]} scale={0.18 + headDive * 0.55}>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshBasicMaterial
                  color={THEME_COLORS.accents.cyan}
                  transparent
                  opacity={headDive * 0.72}
                />
              </mesh>
            ) : null}
          </group>
        )}
      </Scene3DStage>

      {/* Smooth cut glow + transition veil toward Scene 3 Brain */}
      {shotCutFade > 0.005 ? (
        <AbsoluteFill
          style={{
            backgroundColor: THEME_COLORS.background.top,
            opacity: shotCutFade,
            pointerEvents: "none",
          }}
        />
      ) : null}
      {brainEntryGlow > 0.005 ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 50% 44%, rgba(60, 225, 254, 0.35) 0%, ${THEME_COLORS.background.top} 72%)`,
            opacity: brainEntryGlow,
            pointerEvents: "none",
          }}
        />
      ) : null}

      <SceneCueBadge label="DÉJÀ VU" accent="amber" opacity={cue1Opacity} />
      <SceneCueBadge
        label="SUDAH PERNAH DILIHAT"
        accent="cyan"
        opacity={cue2Opacity}
      />
      <SceneCueBadge label="TERASA AKRAB" accent="cyan" opacity={cue3Opacity} />
      <SceneCueBadge
        label="TAPI BELUM TENTU PERNAH"
        accent="amber"
        opacity={cue4Opacity}
      />
    </AbsoluteFill>
  );
};
