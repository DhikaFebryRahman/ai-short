import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_FAMILIES } from "../fonts";
import { Scene3DStage } from "../components/Scene3DStage";
import { LAYOUT, THEME_COLORS, VIDEO_SPECS } from "../theme";
import type { SceneData } from "../types/video";
import { CameraRig3D } from "./shared/CameraRig3D";
import { Character3D } from "./shared/Character3D";
import { ModernRoom3D } from "./shared/ModernRoom3D";

// Deterministic subtle transition motes converging toward screen center at Shot 2 end
const TRANSITION_PARTICLES = Array.from({ length: 24 }, (_, idx) => {
  const angle = (idx / 24) * Math.PI * 2 + (idx % 3) * 0.24;
  const radius = 0.65 + (idx % 4) * 0.32;
  const startY = 0.72 + ((idx * 17) % 10) * 0.14;
  return {
    startX: Math.cos(angle) * radius,
    startY,
    startZ: -0.95 + Math.sin(angle) * 0.65,
    isAmber: idx % 3 === 0,
    size: 0.022 + (idx % 3) * 0.009,
    delay: (idx % 6) * 2,
  };
});

export const Scene01TempatBaru: React.FC<{ readonly scene: SceneData }> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Silence-aligned split inside Scene 1 (0..173 frames):
  // Shot 1 (0..83, 0.00s..2.76s): entering doorway into new modern room
  // Shot 2 (83..173, 2.76s..5.77s): stopping puzzled + déjà vu flash + particle convergence
  const shotSplit = 83;
  const shot2BadgeText = "PERNAH MERASA PERNAH?";

  // 1. Hinged door swings inward at entrance
  const doorOpenSpring = spring({
    fps,
    frame,
    config: { damping: 16, stiffness: 65, mass: 1.1 },
    durationInFrames: 36,
  });
  const doorSettle = interpolate(frame, [45, 78], [0.95, 0.88], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const doorOpenProgress = Math.min(doorOpenSpring, doorSettle);

  // 2. Character path & posture
  const walkProgress = interpolate(frame, [4, 78], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.28, 1),
  });
  const walkIntensity = interpolate(
    frame,
    [0, 10, 68, 82],
    [0.2, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const walkPhase = frame * 0.24;

  // Walk diagonally from back-left doorway [-1.18, 0, -2.28] to mid-left center [-0.42, 0, -0.25]
  // (keeps head cleanly clear of the back wall golden ring artwork at x=-0.12)
  const charPos: [number, number, number] = [
    interpolate(walkProgress, [0, 0.45, 1], [-1.18, -0.84, -0.42]),
    0,
    interpolate(walkProgress, [0, 0.45, 1], [-2.28, -1.25, -0.25]),
  ];

  // Faces into room (+x/+z) during entry, then turns slightly toward camera in Shot 2
  const charRotY = interpolate(
    frame,
    [0, 56, 82, 114],
    [0.42, 0.56, 0.44, 0.24],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.ease),
    },
  );

  // Subtle head scan of unfamiliar room, then double-take in Shot 2
  const enterLookY =
    interpolate(frame, [10, 34, 62, 82], [-0.14, 0.34, -0.18, 0.08], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) +
    interpolate(frame, [84, 102, 126, 152], [0, -0.16, 0.24, -0.06], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const surpriseAmount = spring({
    fps,
    frame: Math.max(0, frame - 82),
    config: { damping: 14, stiffness: 120 },
  });
  const headTiltX = interpolate(frame, [84, 108, 145], [0, -0.08, -0.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 3. Full-screen 9:16 portrait camera choreography
  // Shot 1: Wide interior framing (y=180..1080 hero zone, floor continuously filling caption area)
  // Shot 2: Smooth push-in to three-quarter portrait of face + glowing echoes behind,
  //         then shifts focus rightward toward echoed furniture & converging particles
  const shot1Drift = interpolate(frame, [0, shotSplit], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.32, 0.04, 0.25, 1),
  });
  const shot2Push = interpolate(frame, [shotSplit, 122], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 0.61, 0.36, 1),
  });
  const shot2FocusShift = interpolate(frame, [122, 168], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const camX =
    interpolate(shot1Drift, [0, 1], [-0.78, 0.16]) * (1 - shot2Push) +
    interpolate(shot2FocusShift, [0, 1], [-0.02, 0.36]) * shot2Push;
  const camY =
    interpolate(shot1Drift, [0, 1], [1.48, 1.34]) * (1 - shot2Push) +
    interpolate(shot2FocusShift, [0, 1], [1.18, 1.24]) * shot2Push;
  const camZ =
    interpolate(shot1Drift, [0, 1], [2.25, 4.1]) * (1 - shot2Push) +
    interpolate(shot2FocusShift, [0, 1], [2.82, 2.75]) * shot2Push;

  const targetX =
    interpolate(shot1Drift, [0, 1], [-0.68, -0.02]) * (1 - shot2Push) +
    interpolate(shot2FocusShift, [0, 1], [-0.32, 0.18]) * shot2Push;
  const targetY =
    interpolate(shot1Drift, [0, 1], [0.25, -0.04]) * (1 - shot2Push) +
    interpolate(shot2FocusShift, [0, 1], [0.66, 0.88]) * shot2Push;
  const targetZ =
    interpolate(shot1Drift, [0, 1], [-1.25, -0.82]) * (1 - shot2Push) +
    interpolate(shot2FocusShift, [0, 1], [-0.25, -0.68]) * shot2Push;

  const camFov =
    interpolate(shot1Drift, [0, 1], [55, 58]) * (1 - shot2Push) +
    interpolate(shot2FocusShift, [0, 1], [56, 54]) * shot2Push;

  // 4. Déjà vu double-vision ghost flash + object highlight in Shot 2
  const ghostIntensity = interpolate(
    frame,
    [82, 96, 126, 146, 166],
    [0, 0.88, 1.0, 0.48, 0.08],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const ghostShift = interpolate(frame, [84, 118, 162], [0.06, 0.2, 0.1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const roomObjectHighlight = interpolate(frame, [92, 124, 162], [0, 0.85, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Concentric mental ripple ring at character eye level
  const rippleProgress = interpolate(frame, [86, 152], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const rippleScale = 0.28 + rippleProgress * 2.15;
  const rippleOpacity = interpolate(
    rippleProgress,
    [0, 0.18, 0.72, 1],
    [0, 0.65, 0.26, 0],
  );

  // Brief déjà vu perceptual flash tint in DOM overlay (never jarring full white)
  const flashOpacity = interpolate(
    frame,
    [84, 94, 112, 134],
    [0, 0.16, 0.09, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  // Converging particles transition toward center (frames 134..173)
  const particleAppear = interpolate(frame, [130, 142, 173], [0, 0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const convergeProgress = interpolate(frame, [138, 173], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });

  // On-screen Shot 2 text cue ("PERNAH MERASA PERNAH?")
  const shot2BadgeOpacity = interpolate(
    frame,
    [84, 96, 158, 171],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const shot2BadgeSlide = interpolate(frame, [84, 98], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill>
      {/* Full-bleed edge-to-edge 3D viewport */}
      <Scene3DStage
        width={VIDEO_SPECS.width}
        height={VIDEO_SPECS.height}
        fov={camFov}
      >
        <color attach="background" args={[THEME_COLORS.background.top]} />
        <fog attach="fog" args={[THEME_COLORS.background.top, 6.5, 16]} />

        <CameraRig3D
          position={[camX, camY, camZ]}
          target={[targetX, targetY, targetZ]}
          fov={camFov}
        />

        {/* Extra interior fill light for crisp character portrait read */}
        <pointLight
          position={[-0.4, 2.25, 1.4]}
          color="#CFE2FF"
          intensity={1.65}
          distance={7}
        />

        <ModernRoom3D
          doorOpenProgress={doorOpenProgress}
          ghostIntensity={ghostIntensity}
          ghostOffset={[ghostShift, 0.025, -ghostShift * 0.55]}
          objectHighlight={roomObjectHighlight}
        />

        <Character3D
          position={charPos}
          rotationY={charRotY}
          walkPhase={walkPhase}
          walkIntensity={walkIntensity}
          headTurnY={enterLookY}
          headTiltX={headTiltX}
          surpriseAmount={surpriseAmount}
          echoOpacity={ghostIntensity}
          echoOffset={[ghostShift * 1.15, 0.02, -ghostShift * 0.45]}
        />

        {/* Déjà vu circular perception ripple behind character head */}
        {rippleOpacity > 0.01 ? (
          <mesh
            position={[charPos[0], 1.45, charPos[2] - 0.14]}
            rotation={[0, charRotY, 0]}
            scale={[rippleScale, rippleScale, 1]}
          >
            <ringGeometry args={[0.42, 0.46, 40]} />
            <meshBasicMaterial
              color={THEME_COLORS.accents.cyan}
              transparent
              opacity={rippleOpacity}
            />
          </mesh>
        ) : null}

        {/* Transition particles streaming inward to center at scene end */}
        {particleAppear > 0.01 ? (
          <group>
            {TRANSITION_PARTICLES.map((p, index) => {
              const t = interpolate(
                convergeProgress,
                [p.delay * 0.018, 1],
                [0, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                },
              );
              const px = interpolate(t, [0, 1], [p.startX, 0.06]);
              const py = interpolate(t, [0, 1], [p.startY, 1.08]);
              const pz = interpolate(t, [0, 1], [p.startZ, -0.35]);
              const color = p.isAmber
                ? THEME_COLORS.accents.amber
                : THEME_COLORS.accents.cyan;

              return (
                <mesh key={index} position={[px, py, pz]}>
                  <octahedronGeometry args={[p.size, 0]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={1.35}
                    transparent
                    opacity={particleAppear * (0.45 + t * 0.55)}
                  />
                </mesh>
              );
            })}
          </group>
        ) : null}
      </Scene3DStage>

      {/* Subtle cyan perceptual flash veil during Shot 2 */}
      {flashOpacity > 0.005 ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at 50% 34%, ${THEME_COLORS.accents.cyan} 0%, transparent 62%)`,
            opacity: flashOpacity,
            pointerEvents: "none",
          }}
        />
      ) : null}

      {/* On-screen Shot 2 text cue cleanly below TopBar and above portrait hair */}
      {shot2BadgeOpacity > 0.01 ? (
        <div
          style={{
            position: "absolute",
            top: LAYOUT.scene.visualTop + 10,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: shot2BadgeOpacity,
            transform: `translateY(${shot2BadgeSlide}px)`,
            pointerEvents: "none",
            zIndex: 8,
          }}
        >
          <div
            style={{
              padding: "9px 24px",
              borderRadius: 999,
              backgroundColor: "rgba(13, 16, 25, 0.72)",
              border: `1.5px solid ${THEME_COLORS.accents.cyan}`,
              boxShadow: "0 0 24px rgba(60, 225, 254, 0.34)",
              color: THEME_COLORS.accents.cyan,
              fontFamily: FONT_FAMILIES.sans,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: "0.14em",
            }}
          >
            {shot2BadgeText}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
