import type React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Scene3DStage } from "../components/Scene3DStage";
import { THEME_COLORS, VIDEO_SPECS } from "../theme";
import type { SceneData } from "../types/video";
import { AmbientField3D } from "./shared/AmbientField3D";
import { Brain3D } from "./shared/Brain3D";
import { CameraRig3D } from "./shared/CameraRig3D";
import { Character3D } from "./shared/Character3D";
import { MemoryFragments3D } from "./shared/MemoryFragments3D";
import { ModernRoom3D } from "./shared/ModernRoom3D";
import { SceneCueBadge } from "./shared/SceneCueBadge";

export const Scene05PenutupKesimpulan: React.FC<{
  readonly scene: SceneData;
}> = () => {
  const frame = useCurrentFrame();

  // Three Storyboard Shots synced to vo.mp3 clauses inside Scene 5 (277 frames):
  // Shot 1 (0..88):   Kembali ke Dunia Nyata -> DÉJÀ VU BISA TERJADI PADA ORANG SEHAT
  // Shot 2 (88..188): Bukan Bukti Perjalanan Waktu -> BUKAN BUKTI MOMEN BERULANG
  // Shot 3 (188..277): Kesimpulan Visual -> KEANEHAN DARI SISTEM MEMORI
  const shot1End = 88;
  const shot2End = 188;
  const isRoomShots = frame < shot2End;

  // --- ROOM SHOTS (Shots 1 & 2) ---
  // Calm blink around frame 16..26
  const blinkAmount = interpolate(frame, [14, 19, 23, 28], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Character relaxes from residual surprise, resumes walking toward desk
  const walkResume = interpolate(frame, [30, 56, 108, 128], [0, 0.85, 0.85, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const walkTravel = interpolate(frame, [32, 125], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });
  const charPos: [number, number, number] = [
    interpolate(walkTravel, [0, 1], [-0.42, -0.05]),
    0,
    interpolate(walkTravel, [0, 1], [-0.25, -0.45]),
  ];

  // Shot 1 fades out early echo; Shot 2 temporarily separates echo from reality then removes it cleanly
  const roomGhost =
    frame < shot1End
      ? interpolate(frame, [0, 26], [0.42, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : interpolate(frame, [90, 114, 142, 178], [0, 0.88, 0.82, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  const ghostSep = interpolate(frame, [90, 176], [0.14, 0.36], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Room camera: medium tracking (Shot 1) -> wider pull-back revealing two room layers (Shot 2)
  const roomCamT1 = interpolate(frame, [0, shot1End], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });
  const roomCamT2 = interpolate(frame, [shot1End, shot2End], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const roomCamPos: [number, number, number] = [
    interpolate(roomCamT1, [0, 1], [-0.12, 0.14]) +
      interpolate(roomCamT2, [0, 1], [0, 0.12]),
    interpolate(roomCamT1, [0, 1], [1.4, 1.44]) +
      interpolate(roomCamT2, [0, 1], [0, 0.08]),
    interpolate(roomCamT1, [0, 1], [3.68, 3.85]) +
      interpolate(roomCamT2, [0, 1], [0, 0.45]),
  ];
  const roomTarget: [number, number, number] = [
    interpolate(roomCamT1, [0, 1], [-0.26, 0.02]),
    interpolate(roomCamT1, [0, 1], [0.08, -0.02]) +
      interpolate(roomCamT2, [0, 1], [0, -0.04]),
    -0.8,
  ];
  const roomFov = interpolate(roomCamT2, [0, 1], [54, 58]);

  // --- SHOT 3: Kesimpulan Visual (frames 188..277) ---
  const s3T = interpolate(frame, [shot2End, 276], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const brainCamPos: [number, number, number] = [
    interpolate(s3T, [0, 1], [0.2, 0]),
    0.16,
    interpolate(s3T, [0, 1], [3.2, 4.0]),
  ];
  const brainTarget: [number, number, number] = [0, -0.52, 0];

  // Everything spirals cleanly to one luminous center point for Scene 6 handoff
  const finalCollapse = interpolate(frame, [232, 275], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });
  const brainShrink = 1 - finalCollapse * 0.82;
  const centerSparkScale = interpolate(frame, [244, 276], [0.05, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtle cross-cut fade between Room & Brain
  const cutVeilOpacity = interpolate(
    frame,
    [shot2End - 6, shot2End, shot2End + 8],
    [0, 0.4, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Cue Badges
  const cue1Opacity = interpolate(frame, [8, 20, 78, 88], [0, 1, 1, 0], {
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
    [shot2End + 6, shot2End + 18, 262, 274],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill>
      <Scene3DStage
        width={VIDEO_SPECS.width}
        height={VIDEO_SPECS.height}
        fov={isRoomShots ? roomFov : 52}
      >
        <color attach="background" args={[THEME_COLORS.background.top]} />
        <fog attach="fog" args={[THEME_COLORS.background.top, 6.2, 16]} />

        <CameraRig3D
          position={isRoomShots ? roomCamPos : brainCamPos}
          target={isRoomShots ? roomTarget : brainTarget}
          fov={isRoomShots ? roomFov : 52}
        />

        {isRoomShots ? (
          <group>
            <pointLight
              position={[-0.2, 2.2, 1.5]}
              color="#CFE2FF"
              intensity={1.6}
              distance={7}
            />

            <ModernRoom3D
              doorOpenProgress={0.85}
              ghostIntensity={roomGhost}
              ghostOffset={[ghostSep, 0.02, -ghostSep * 0.45]}
            />

            <Character3D
              position={charPos}
              rotationY={interpolate(walkTravel, [0, 1], [0.24, 0.72])}
              walkPhase={frame * 0.22}
              walkIntensity={walkResume}
              headTurnY={interpolate(frame, [16, 48, 86], [-0.15, 0.28, 0.08], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
              surpriseAmount={interpolate(frame, [0, 32], [0.35, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}
              blinkAmount={blinkAmount}
              echoOpacity={roomGhost * 0.45}
              echoOffset={[ghostSep, 0.02, -ghostSep * 0.45]}
            />
          </group>
        ) : (
          <group>
            <pointLight
              position={[-1.4, 1.4, 2.4]}
              color={THEME_COLORS.accents.cyan}
              intensity={1.5}
              distance={8}
            />
            <pointLight
              position={[1.4, 0.9, 2.0]}
              color={THEME_COLORS.accents.amber}
              intensity={1.3}
              distance={7}
            />

            <AmbientField3D
              frame={frame}
              opacity={0.75 * (1 - finalCollapse * 0.75)}
              radius={2.3 - finalCollapse * 1.4}
            />

            <Brain3D
              position={[0, 0.08, 0]}
              rotationY={interpolate(frame, [shot2End, 276], [0.55, 1.15])}
              scale={0.96 * brainShrink}
              shellOpacity={0.44 * (1 - finalCollapse * 0.65)}
              ambientPhase={frame * 0.1}
            />

            <MemoryFragments3D
              count={14}
              center={[0, 0.08, 0]}
              radius={1.45}
              spreadY={0.75}
              orbitAngle={frame * 0.032}
              gatherProgress={finalCollapse}
              collapseToCenter
              opacity={0.82 * (1 - finalCollapse * 0.6)}
            />

            {/* Converging spark nexus preparing Scene 6 KAPSUL FAKTA reveal */}
            {finalCollapse > 0.05 ? (
              <mesh position={[0, 0.08, 0]} scale={centerSparkScale}>
                <sphereGeometry args={[0.16, 18, 18]} />
                <meshBasicMaterial
                  color={THEME_COLORS.accents.amber}
                  transparent
                  opacity={finalCollapse * 0.92}
                />
              </mesh>
            ) : null}
          </group>
        )}
      </Scene3DStage>

      {cutVeilOpacity > 0.005 ? (
        <AbsoluteFill
          style={{
            backgroundColor: THEME_COLORS.background.top,
            opacity: cutVeilOpacity,
            pointerEvents: "none",
          }}
        />
      ) : null}

      <SceneCueBadge
        label="DÉJÀ VU BISA TERJADI PADA ORANG SEHAT"
        accent="green"
        opacity={cue1Opacity}
        fontSize={19}
      />
      <SceneCueBadge
        label="BUKAN BUKTI MOMEN BERULANG"
        accent="red"
        opacity={cue2Opacity}
      />
      <SceneCueBadge
        label="KEANEHAN DARI SISTEM MEMORI"
        accent="amber"
        opacity={cue3Opacity}
      />
    </AbsoluteFill>
  );
};
