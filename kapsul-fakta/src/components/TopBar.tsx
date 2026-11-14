import type React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_FAMILIES } from "../fonts";
import { LAYOUT, THEME_COLORS } from "../theme";
import type { SceneData } from "../types/video";

type TopBarProps = {
  readonly seriesLabel: string;
  readonly scenes: readonly SceneData[];
};

const padTwo = (value: number): string => String(value).padStart(2, "0");

/**
 * Top progress bar with one amber-filling segment per scene,
 * wide-spaced uppercase series label on the left, and "01 / NN" counter on the right.
 */
export const TopBar: React.FC<TopBarProps> = ({ seriesLabel, scenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;

  const totalScenes = Math.max(scenes.length, 1);
  const foundIndex = scenes.findIndex(
    (scene) => currentSec >= scene.mulai && currentSec < scene.selesai,
  );

  const activeIndex =
    foundIndex !== -1
      ? foundIndex
      : scenes.length > 0 && currentSec >= scenes[scenes.length - 1].selesai
        ? scenes.length - 1
        : 0;

  return (
    <div
      style={{
        position: "absolute",
        top: LAYOUT.topBar.top,
        left: LAYOUT.topBar.paddingX,
        right: LAYOUT.topBar.paddingX,
        height: LAYOUT.topBar.height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        zIndex: 20,
      }}
    >
      {/* Segmented progress track */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: LAYOUT.topBar.segmentGap,
          width: "100%",
        }}
      >
        {scenes.map((scene, index) => {
          const sceneDuration = Math.max(scene.selesai - scene.mulai, 0.001);
          const progress = interpolate(
            currentSec,
            [scene.mulai, scene.mulai + sceneDuration],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          return (
            <div
              key={scene.id || index}
              style={{
                flex: 1,
                height: LAYOUT.topBar.segmentHeight,
                borderRadius: LAYOUT.topBar.segmentRadius,
                backgroundColor: THEME_COLORS.trackInactive,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(progress * 100).toFixed(2)}%`,
                  height: "100%",
                  borderRadius: LAYOUT.topBar.segmentRadius,
                  backgroundColor: THEME_COLORS.accents.amber,
                  boxShadow: `0 0 10px ${THEME_COLORS.accentGlows.amber}`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Series label & scene counter */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILIES.sans,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: THEME_COLORS.introText,
            opacity: 0.9,
          }}
        >
          {seriesLabel}
        </span>

        <span
          style={{
            fontFamily: FONT_FAMILIES.sans,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: THEME_COLORS.accents.amber,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {padTwo(activeIndex + 1)} / {padTwo(totalScenes)}
        </span>
      </div>
    </div>
  );
};

