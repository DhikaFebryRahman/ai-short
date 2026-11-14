import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_FAMILIES } from "../fonts";
import { LAYOUT, SAFE_ZONE, THEME_COLORS } from "../theme";
import type { CameraPreset, SceneData } from "../types/video";
import { Chip } from "./Chip";
import { KineticCaption } from "./KineticCaption";

type SceneProps = {
  readonly scene: SceneData;
  readonly children?: React.ReactNode;
};

type CameraStyle = {
  readonly scale: number;
  readonly translate: string;
  readonly rotate: string;
};

const getCameraStyle = (
  preset: CameraPreset,
  frame: number,
  durationInFrames: number,
): CameraStyle => {
  const safeDuration = Math.max(durationInFrames, 2);
  const ease = Easing.inOut(Easing.ease);

  switch (preset) {
    case "zoom-in":
      return {
        scale: interpolate(frame, [0, safeDuration], [0.97, 1.04], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
          output: "perceptual-scale",
        }),
        translate: "0px 0px",
        rotate: "0deg",
      };
    case "zoom-out":
      return {
        scale: interpolate(frame, [0, safeDuration], [1.05, 0.98], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
          output: "perceptual-scale",
        }),
        translate: "0px 0px",
        rotate: "0deg",
      };
    case "pan-left":
      return {
        scale: 1.02,
        translate: interpolate(
          frame,
          [0, safeDuration],
          ["24px 0px", "-24px 0px"],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          },
        ),
        rotate: "0deg",
      };
    case "pan-right":
      return {
        scale: 1.02,
        translate: interpolate(
          frame,
          [0, safeDuration],
          ["-24px 0px", "24px 0px"],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          },
        ),
        rotate: "0deg",
      };
    case "tilt-scan":
      return {
        scale: interpolate(frame, [0, safeDuration], [0.99, 1.03], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
          output: "perceptual-scale",
        }),
        translate: interpolate(
          frame,
          [0, safeDuration],
          ["0px 10px", "0px -10px"],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          },
        ),
        rotate: interpolate(
          frame,
          [0, safeDuration],
          ["-1.2deg", "1.2deg"],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          },
        ),
      };
    case "static":
    default:
      return {
        scale: 1,
        translate: "0px 0px",
        rotate: "0deg",
      };
  }
};

const DefaultVisualPlaceholder: React.FC<{ readonly scene: SceneData }> = ({
  scene,
}) => {
  return (
    <div
      style={{
        width: 560,
        height: 560,
        borderRadius: 40,
        backgroundColor: THEME_COLORS.surface,
        border: `1.5px solid ${THEME_COLORS.borderSubtle}`,
        boxShadow: `0 24px 80px rgba(0, 0, 0, 0.35), 0 0 60px ${THEME_COLORS.glow.blue}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        textAlign: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILIES.sans,
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: THEME_COLORS.accents.cyan,
        }}
      >
        {scene.id}
      </div>
      <div
        style={{
          fontFamily: FONT_FAMILIES.sans,
          fontSize: 36,
          fontWeight: 700,
          color: THEME_COLORS.accents.white,
        }}
      >
        {scene.judul}
      </div>
      {scene.visual?.catatan ? (
        <div
          style={{
            fontFamily: FONT_FAMILIES.serifItalic,
            fontStyle: "italic",
            fontSize: 24,
            color: THEME_COLORS.introText,
            lineHeight: 1.4,
          }}
        >
          {scene.visual.catatan}
        </div>
      ) : null}
    </div>
  );
};

const SceneContent: React.FC<
  SceneProps & { readonly durationInFrames: number }
> = ({ scene, durationInFrames, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeFrames = Math.max(Math.round(0.25 * fps), 1);
  const fadeIn = interpolate(frame, [0, fadeFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const fadeOut = interpolate(
    frame,
    [Math.max(durationInFrames - fadeFrames, 0), durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.4, 0, 1, 1),
    },
  );
  const sceneOpacity = Math.min(fadeIn, fadeOut);
  const cameraStyle = getCameraStyle(
    scene.kamera ?? "static",
    frame,
    durationInFrames,
  );

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      {/* Visual center stage (strictly inside y 150-1500 safe zone) */}
      <div
        style={{
          position: "absolute",
          top: LAYOUT.scene.visualTop,
          left: SAFE_ZONE.horizontalPadding,
          width: SAFE_ZONE.contentWidth,
          height: LAYOUT.scene.visualHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            scale: cameraStyle.scale,
            translate: cameraStyle.translate,
            rotate: cameraStyle.rotate,
          }}
        >
          {children ?? <DefaultVisualPlaceholder scene={scene} />}
        </div>
      </div>

      {/* Small labeled chip below visual */}
      {scene.chip ? (
        <div
          style={{
            position: "absolute",
            top: LAYOUT.scene.chipTop,
            left: SAFE_ZONE.horizontalPadding,
            width: SAFE_ZONE.contentWidth,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Chip label={scene.chip} warna={scene.chipWarna ?? "amber"} />
        </div>
      ) : null}

      {/* Word-by-word kinetic caption inside safe zone */}
      <div
        style={{
          position: "absolute",
          top: LAYOUT.scene.captionTop,
          left: SAFE_ZONE.horizontalPadding,
          width: SAFE_ZONE.contentWidth,
          maxHeight: LAYOUT.scene.captionMaxHeight,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <KineticCaption
          words={scene.caption}
          sceneStartSeconds={scene.mulai}
        />
      </div>
    </AbsoluteFill>
  );
};

/**
 * Reusable timed scene wrapper handling Sequence boundaries, safe-zone layout,
 * smooth camera motion, chip badge, and word-by-word kinetic captions.
 */
export const Scene: React.FC<SceneProps> = ({ scene, children }) => {
  const { fps } = useVideoConfig();
  const startFrame = Math.round(scene.mulai * fps);
  const endFrame = Math.round(scene.selesai * fps);
  const durationInFrames = Math.max(endFrame - startFrame, 1);

  return (
    <Sequence
      name={scene.judul || scene.id}
      from={startFrame}
      durationInFrames={durationInFrames}
    >
      <SceneContent scene={scene} durationInFrames={durationInFrames}>
        {children}
      </SceneContent>
    </Sequence>
  );
};

