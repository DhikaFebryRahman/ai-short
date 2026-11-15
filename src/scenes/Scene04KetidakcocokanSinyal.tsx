import type React from "react";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
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
import { Brain3D } from "./shared/Brain3D";
import { CameraRig3D } from "./shared/CameraRig3D";
import { Character3D } from "./shared/Character3D";
import { SceneCueBadge } from "./shared/SceneCueBadge";
import { Text3DPlaque } from "./shared/Text3DPlaque";

/** Compact miniature memory replica of the Scene 1 room on a floating platform (no 18m floor plane). */
const RoomMemoryVignette3D: React.FC<{
  readonly position: readonly [number, number, number];
  readonly scale?: number;
  readonly opacity?: number;
}> = ({ position, scale = 1, opacity = 1 }) => {
  if (opacity <= 0.01) {
    return null;
  }
  return (
    <group position={[position[0], position[1], position[2]]} scale={scale}>
      {/* Floating amber-trimmed slate platform */}
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[1.15, 0.04, 0.95]} />
        <meshStandardMaterial
          color="#162244"
          roughness={0.55}
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0, -0.015, 0]}>
        <boxGeometry args={[1.18, 0.012, 0.98]} />
        <meshBasicMaterial
          color={THEME_COLORS.accents.amber}
          transparent
          opacity={opacity * 0.72}
        />
      </mesh>

      {/* Miniature back wall & doorway */}
      <mesh position={[0, 0.38, -0.4]}>
        <boxGeometry args={[1.08, 0.78, 0.04]} />
        <meshStandardMaterial
          color="#1D2B52"
          transparent
          opacity={opacity * 0.9}
        />
      </mesh>
      {/* Doorway frame */}
      <mesh position={[-0.28, 0.34, -0.37]}>
        <boxGeometry args={[0.24, 0.62, 0.03]} />
        <meshStandardMaterial
          color="#2B447E"
          emissive={THEME_COLORS.accents.cyan}
          emissiveIntensity={0.35}
          transparent
          opacity={opacity}
        />
      </mesh>
      {/* Window pane */}
      <mesh position={[0.26, 0.44, -0.37]}>
        <boxGeometry args={[0.32, 0.32, 0.03]} />
        <meshBasicMaterial
          color={THEME_COLORS.accents.cyan}
          transparent
          opacity={opacity * 0.45}
        />
      </mesh>
      {/* Mini desk & amber pendant lamp */}
      <mesh position={[0.24, 0.2, 0.04]}>
        <boxGeometry args={[0.38, 0.04, 0.22]} />
        <meshStandardMaterial
          color="#634535"
          transparent
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0.24, 0.62, 0.04]}>
        <coneGeometry args={[0.09, 0.07, 14]} />
        <meshStandardMaterial
          color={THEME_COLORS.accents.amber}
          emissive={THEME_COLORS.accents.amber}
          emissiveIntensity={0.85}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Translucent familiar hologram echo silhouette hovering above platform */}
      <mesh position={[0.08, 0.32, 0.06]}>
        <boxGeometry args={[0.56, 0.5, 0.38]} />
        <meshBasicMaterial
          color={THEME_COLORS.accents.amber}
          transparent
          opacity={opacity * 0.16}
          wireframe
        />
      </mesh>
    </group>
  );
};

/** Sculpted 3D glowing question mark centerpiece for Shot 4 ("penyebab belum dipahami"). */
const QuestionMark3D: React.FC<{
  readonly position: readonly [number, number, number];
  readonly rotationY?: number;
  readonly scale?: number;
  readonly opacity?: number;
}> = ({ position, rotationY = 0, scale = 1, opacity = 1 }) => {
  if (opacity <= 0.01) {
    return null;
  }
  return (
    <group
      position={[position[0], position[1], position[2]]}
      rotation={[0, rotationY, 0]}
      scale={scale}
    >
      {/* Upper curved hook */}
      <mesh position={[0, 0.22, 0]} rotation={[0, 0, -Math.PI * 0.35]}>
        <torusGeometry args={[0.22, 0.052, 14, 32, Math.PI * 1.38]} />
        <meshStandardMaterial
          color={THEME_COLORS.accents.cyan}
          emissive={THEME_COLORS.accents.cyan}
          emissiveIntensity={0.72}
          roughness={0.22}
          metalness={0.3}
          transparent
          opacity={opacity}
        />
      </mesh>
      {/* Vertical stem down to dot */}
      <mesh position={[0, -0.06, 0]}>
        <capsuleGeometry args={[0.052, 0.14, 8, 14]} />
        <meshStandardMaterial
          color={THEME_COLORS.accents.cyan}
          emissive={THEME_COLORS.accents.cyan}
          emissiveIntensity={0.72}
          roughness={0.22}
          transparent
          opacity={opacity}
        />
      </mesh>
      {/* Golden amber bottom dot */}
      <mesh position={[0, -0.28, 0]}>
        <sphereGeometry args={[0.064, 16, 16]} />
        <meshStandardMaterial
          color={THEME_COLORS.accents.amber}
          emissive={THEME_COLORS.accents.amber}
          emissiveIntensity={0.95}
          roughness={0.2}
          transparent
          opacity={opacity}
        />
      </mesh>
    </group>
  );
};

export const Scene04KetidakcocokanSinyal: React.FC<{
  readonly scene: SceneData;
}> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 4 Storyboard Shots aligned with vo.mp3 sentences inside Scene 4 (454 frames):
  // Shot 1 (0..108):   "Akibatnya, otak memberi kesan 'ini pernah terjadi'" -> TERASA PERNAH
  // Shot 2 (108..208): "padahal kita sadar situasinya sebenarnya baru." -> FAMILIAR vs SEBENARNYA BARU
  // Shot 3 (208..356): "Para peneliti menduga ketidakcocokan sinyal ini ikut memunculkan déjà vu" -> KETIDAKCOCOKAN SINYAL
  // Shot 4 (356..454): "meski penyebab pastinya belum sepenuhnya dipahami." -> PENYEBAB PASTI MASIH DITELITI + 3D "?"
  const shot1End = 108;
  const shot2End = 208;
  const shot3End = 356;

  // Dual lateral stream tubes calibrated strictly inside 9:16 portrait width
  const { leftArcCurve, leftArcGeom, rightArcCurve, rightArcGeom } = useMemo(() => {
    const left = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.62, -0.02, 0.08),
      new THREE.Vector3(-0.32, 0.24, 0.2),
      new THREE.Vector3(-0.04, 0.14, 0.18),
    ]);
    const right = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.64, -0.04, 0.08),
      new THREE.Vector3(0.32, 0.24, 0.2),
      new THREE.Vector3(0.04, 0.14, 0.18),
    ]);
    return {
      leftArcCurve: left,
      leftArcGeom: new THREE.TubeGeometry(left, 24, 0.014, 8, false),
      rightArcCurve: right,
      rightArcGeom: new THREE.TubeGeometry(right, 24, 0.014, 8, false),
    };
  }, []);

  useEffect(() => {
    return () => {
      leftArcGeom.dispose();
      rightArcGeom.dispose();
    };
  }, [leftArcGeom, rightArcGeom]);

  // --- CAMERA RIG ACROSS 4 SHOTS (hero centered y=240..1000) ---
  let camPos: [number, number, number] = [0, 0.15, 3.85];
  let camTarget: [number, number, number] = [0, -0.54, 0];
  let camFov = 52;

  if (frame < shot1End) {
    // Shot 1: glide from left room vignette toward brain on right
    const t = interpolate(frame, [0, shot1End], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.ease),
    });
    camPos = [
      interpolate(t, [0, 1], [-0.32, 0.14]),
      0.16,
      interpolate(t, [0, 1], [4.05, 3.9]),
    ];
    camTarget = [
      interpolate(t, [0, 1], [-0.14, 0.02]),
      -0.52,
      0,
    ];
  } else if (frame < shot2End) {
    // Shot 2: pan left -> right -> settle centered on Brain bridging both sides
    const pan = interpolate(frame, [shot1End, 145, 178, shot2End], [-0.28, 0.28, 0.06, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });
    const zoom = interpolate(frame, [shot1End, shot2End], [4.2, 4.35], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    camPos = [pan * 0.75, 0.16, zoom];
    camTarget = [pan * 0.45, -0.54, 0];
  } else if (frame < shot3End) {
    // Shot 3: close-up orbital push-in onto conflicting dual signal hub in Brain
    const t3 = interpolate(frame, [shot2End, shot3End], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });
    const orbit = interpolate(t3, [0, 1], [-0.24, 0.32]);
    const dist = interpolate(t3, [0, 0.5, 1], [3.85, 3.4, 3.55]);
    camPos = [Math.sin(orbit) * dist, 0.2, Math.cos(orbit) * dist];
    camTarget = [0, -0.44, 0.04];
    camFov = 52;
  } else {
    // Shot 4: pull smoothly back from Brain to reveal floating 3D "?"
    const t4 = interpolate(frame, [shot3End, 425], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    camPos = [0, 0.16, interpolate(t4, [0, 1], [3.4, 4.2])];
    camTarget = [0, interpolate(t4, [0, 1], [-0.46, -0.56]), 0];
    camFov = 52;
  }

  // --- SHOTS VISIBILITY & ANIMATION ---
  const showVignetteLeft = frame < shot2End;
  const vignetteScale = frame < shot1End ? 0.68 : 0.58;
  const vignetteX = frame < shot1End ? -0.54 : -0.58;
  const vignetteY = frame < shot1End ? -0.02 : -0.04;

  const brainX = frame < shot1End ? interpolate(frame, [0, shot1End], [0.38, 0.22]) : 0;
  const brainY = frame >= shot3End ? 0.16 : 0.12;
  const brainZ = frame >= shot3End ? -0.35 : 0;
  const brainScale =
    frame < shot1End
      ? 0.74
      : frame < shot2End
        ? 0.6
        : frame < shot3End
          ? 0.94
          : 0.9;

  const showCharRight = frame >= shot1End && frame < shot2End;
  const s1PulseT = interpolate(frame, [10, 82], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const s1PulsePos = leftArcCurve.getPointAt(Math.max(0, Math.min(1, s1PulseT)));

  const s1PlaqueScale = spring({
    fps,
    frame: Math.max(0, frame - 38),
    config: { damping: 14, stiffness: 105 },
  });
  const s1PlaqueOpacity = interpolate(frame, [36, 48, 98, 108], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Shot 2 & 3 streams
  const showStreams = frame >= shot1End && frame < shot3End;
  const streamTravel =
    frame < shot2End
      ? ((frame - shot1End) / 36) % 1
      : ((frame - shot2End) / 32) % 1;
  const leftStreamOrb = leftArcCurve.getPointAt(Math.max(0, Math.min(1, streamTravel)));
  const rightStreamOrb = rightArcCurve.getPointAt(
    Math.max(0, Math.min(1, streamTravel)),
  );

  // Shot 3 collision intensity
  const conflictIntensity =
    frame >= shot2End && frame < shot3End
      ? interpolate(frame, [shot2End + 18, shot2End + 46, shot3End - 12, shot3End], [0, 1, 1, 0.15], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

  // Shot 3 convergent 3D plaques flying from left & right sides
  const s3StreamJoin = interpolate(frame, [shot2End + 4, shot2End + 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const s3BadgeFade = interpolate(
    frame,
    [shot2End + 2, shot2End + 18, shot3End - 22, shot3End],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Shot 4 3D Question Mark buildup & dissolve
  const qScale = spring({
    fps,
    frame: Math.max(0, frame - shot3End - 8),
    config: { damping: 13, stiffness: 100 },
  });
  const qOpacity = interpolate(
    frame,
    [shot3End + 6, shot3End + 22, 434, 452],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // End return-to-reality light fade (438..454)
  const realityFade = interpolate(frame, [438, 453], [0, 0.65], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // DOM Cue Badges
  const cue1Opacity = interpolate(frame, [8, 20, 96, 108], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cue2Opacity = interpolate(
    frame,
    [shot1End + 6, shot1End + 18, shot2End - 10, shot2End],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const cue3Opacity = interpolate(
    frame,
    [shot2End + 6, shot2End + 18, shot3End - 12, shot3End],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const cue4Opacity = interpolate(
    frame,
    [shot3End + 8, shot3End + 20, 440, 452],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill>
      <Scene3DStage width={VIDEO_SPECS.width} height={VIDEO_SPECS.height} fov={camFov}>
        <color attach="background" args={[THEME_COLORS.background.top]} />
        <fog attach="fog" args={[THEME_COLORS.background.top, 6, 15]} />

        <CameraRig3D position={camPos} target={camTarget} fov={camFov} />

        <pointLight
          position={[-1.2, 1.4, 2.5]}
          color={THEME_COLORS.accents.amber}
          intensity={1.45}
          distance={8}
        />
        <pointLight
          position={[1.4, 1.2, 2.5]}
          color={THEME_COLORS.accents.cyan}
          intensity={1.45}
          distance={8}
        />

        <AmbientField3D frame={frame} opacity={0.68} radius={2.4} />

        {/* Left compact room memory vignette (Shots 1 & 2) */}
        {showVignetteLeft ? (
          <RoomMemoryVignette3D
            position={[vignetteX, vignetteY, 0]}
            scale={vignetteScale}
            opacity={1}
          />
        ) : null}

        {/* Right conscious Character realizing room is actually new (Shot 2) */}
        {showCharRight ? (
          <group position={[0.64, -0.34, 0]} scale={0.5}>
            <mesh position={[0, -0.02, 0]}>
              <cylinderGeometry args={[0.42, 0.45, 0.04, 24]} />
              <meshStandardMaterial color="#162448" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.38, 0.43, 28]} />
              <meshBasicMaterial color={THEME_COLORS.accents.cyan} />
            </mesh>
            <Character3D
              position={[0, 0, 0]}
              rotationY={-0.32}
              headTurnY={-0.18}
              surpriseAmount={0.55}
            />
          </group>
        ) : null}

        {/* Shot 1 incoming signal arc & "INI PERNAH TERJADI" plaque */}
        {frame < shot1End ? (
          <group>
            <mesh geometry={leftArcGeom}>
              <meshBasicMaterial
                color={THEME_COLORS.accents.amber}
                transparent
                opacity={0.78}
              />
            </mesh>
            <mesh position={[s1PulsePos.x, s1PulsePos.y, s1PulsePos.z]}>
              <sphereGeometry args={[0.048, 12, 12]} />
              <meshBasicMaterial color={THEME_COLORS.accents.amber} />
            </mesh>
            <Text3DPlaque
              text="INI PERNAH TERJADI"
              accentColor={THEME_COLORS.accents.amber}
              position={[0, -0.4, 0.35]}
              scale={0.46 * s1PlaqueScale}
              width={2.05}
              height={0.5}
              depth={0.1}
              opacity={s1PlaqueOpacity}
            />
          </group>
        ) : null}

        {/* Dual Opposing Signal Streams (Shots 2 & 3) */}
        {showStreams ? (
          <group>
            <mesh geometry={leftArcGeom}>
              <meshBasicMaterial
                color={THEME_COLORS.accents.amber}
                transparent
                opacity={0.78}
              />
            </mesh>
            <mesh position={[leftStreamOrb.x, leftStreamOrb.y, leftStreamOrb.z]}>
              <sphereGeometry args={[0.048, 12, 12]} />
              <meshBasicMaterial color={THEME_COLORS.accents.amber} />
            </mesh>

            <mesh geometry={rightArcGeom}>
              <meshBasicMaterial
                color={THEME_COLORS.accents.cyan}
                transparent
                opacity={0.78}
              />
            </mesh>
            <mesh position={[rightStreamOrb.x, rightStreamOrb.y, rightStreamOrb.z]}>
              <sphereGeometry args={[0.048, 12, 12]} />
              <meshBasicMaterial color={THEME_COLORS.accents.cyan} />
            </mesh>
          </group>
        ) : null}

        {/* Shot 3 opposing 3D labels colliding toward brain hub */}
        {frame >= shot2End && frame < shot3End ? (
          <group>
            <Text3DPlaque
              text="FAMILIAR"
              accentColor={THEME_COLORS.accents.amber}
              position={[
                interpolate(s3StreamJoin, [0, 1], [-0.52, -0.32]),
                0.56,
                0.54,
              ]}
              scale={0.33}
              width={1.55}
              height={0.44}
              depth={0.08}
              opacity={s3BadgeFade}
            />
            <Text3DPlaque
              text="SITUASI BARU"
              accentColor={THEME_COLORS.accents.cyan}
              position={[
                interpolate(s3StreamJoin, [0, 1], [0.52, 0.3]),
                -0.44,
                0.54,
              ]}
              scale={0.33}
              width={1.75}
              height={0.44}
              depth={0.08}
              opacity={s3BadgeFade}
            />
          </group>
        ) : null}

        {/* Central 3D Human Brain across all 4 shots (3/4 oblique view for crisp brain silhouette) */}
        <Brain3D
          position={[brainX, brainY, brainZ]}
          rotationY={
            frame < shot2End
              ? 0.72
              : frame < shot3End
                ? interpolate(frame, [shot2End, shot3End], [0.65, -0.55])
                : interpolate(frame, [shot3End, 454], [0.68, 1.08])
          }
          scale={brainScale}
          shellOpacity={0.44}
          familiarPulseProgress={frame < shot1End ? (frame * 0.022) % 1 : 0}
          ambientPhase={frame * 0.08}
          conflictIntensity={conflictIntensity}
          conflictPhase={frame * 0.18}
        />

        {/* Shot 4 Sculpted 3D Question Mark hovering before brain */}
        {frame >= shot3End ? (
          <QuestionMark3D
            position={[0, 0.08, 0.78]}
            rotationY={Math.sin(frame * 0.04) * 0.25}
            scale={0.95 * qScale}
            opacity={qOpacity}
          />
        ) : null}
      </Scene3DStage>

      {/* Smooth bright fade toward real room Scene 5 */}
      {realityFade > 0.005 ? (
        <AbsoluteFill
          style={{
            backgroundColor: THEME_COLORS.background.top,
            opacity: realityFade,
            pointerEvents: "none",
          }}
        />
      ) : null}

      <SceneCueBadge
        label="TERASA PERNAH"
        accent="amber"
        opacity={cue1Opacity}
      />
      <SceneCueBadge
        label="FAMILIAR  ⚡  SEBENARNYA BARU"
        accent="green"
        opacity={cue2Opacity}
      />
      <SceneCueBadge
        label="KETIDAKCOCOKAN SINYAL"
        accent="red"
        opacity={cue3Opacity}
      />
      <SceneCueBadge
        label="PENYEBAB PASTI MASIH DITELITI"
        accent="cyan"
        opacity={cue4Opacity}
      />
    </AbsoluteFill>
  );
};
