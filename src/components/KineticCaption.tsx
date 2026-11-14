import type React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_FAMILIES } from "../fonts";
import { resolveAccentColor, THEME_COLORS } from "../theme";
import type { CaptionWord } from "../types/video";

type KineticCaptionProps = {
  readonly words: readonly CaptionWord[];
  readonly sceneStartSeconds?: number;
};

const isKeyword = (jenis: CaptionWord["jenis"]): boolean => {
  return jenis === "keyword" || jenis === "kunci";
};

/**
 * Word-by-word kinetic caption replacing standard subtitles.
 * Intro words use Lora Italic (#C6CDE4); keywords use Poppins Bold with color and glow.
 */
export const KineticCaption: React.FC<KineticCaptionProps> = ({
  words,
  sceneStartSeconds = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "baseline",
        columnGap: 16,
        rowGap: 12,
        width: "100%",
        textAlign: "center",
      }}
    >
      {words.map((word, index) => {
        const wordStartFrame = (word.detik - sceneStartSeconds) * fps;
        const wordEndFrame = wordStartFrame + 0.24 * fps;
        const keyword = isKeyword(word.jenis);
        const accent = resolveAccentColor(
          word.warna ?? (keyword ? "amber" : "muted"),
        );

        const textColor = keyword ? accent.color : THEME_COLORS.introText;
        const textShadow = keyword ? `0 0 22px ${accent.glow}` : "none";

        return (
          <span
            key={`${word.kata}-${word.detik}-${index}`}
            style={{
              display: "inline-block",
              fontFamily: keyword
                ? FONT_FAMILIES.sans
                : FONT_FAMILIES.serifItalic,
              fontStyle: keyword ? "normal" : "italic",
              fontWeight: keyword ? 700 : 500,
              fontSize: keyword ? 58 : 54,
              lineHeight: 1.24,
              color: textColor,
              textShadow,
              opacity: interpolate(
                frame,
                [wordStartFrame, wordEndFrame],
                [0, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(0.16, 1, 0.3, 1),
                },
              ),
              translate: interpolate(
                frame,
                [wordStartFrame, wordEndFrame],
                ["0px 18px", "0px 0px"],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.spring({ damping: 200 }),
                },
              ),
              scale: interpolate(
                frame,
                [wordStartFrame, wordEndFrame],
                [keyword ? 0.88 : 0.96, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.spring({ damping: 200 }),
                  output: "perceptual-scale",
                },
              ),
            }}
          >
            {word.kata}
          </span>
        );
      })}
    </div>
  );
};

