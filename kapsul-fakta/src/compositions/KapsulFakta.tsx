import { Audio } from "@remotion/media";
import type React from "react";
import {
  AbsoluteFill,
  staticFile,
  useVideoConfig,
  Interactive,
} from "remotion";
import { Background } from "../components/Background";
import { Scene } from "../components/Scene";
import { TopBar } from "../components/TopBar";
import videoDataJson from "../data/video.json";
import { SCENE_VISUALS } from "../scenes";
import { VIDEO_SPECS } from "../theme";
import type { VideoData } from "../types/video";

export type KapsulFaktaProps = {
  readonly data?: VideoData;
};

const defaultVideoData = videoDataJson as unknown as VideoData;

/**
 * Main data-driven Kapsul Fakta composition.
 */
export const KapsulFakta: React.FC<KapsulFaktaProps> = ({
  data = defaultVideoData,
}) => {
  const { fps } = useVideoConfig();
  const voiceoverStartFrame = Math.round(
    VIDEO_SPECS.voiceoverStartSeconds * fps,
  );

  return (
    <>
      <AbsoluteFill>
        <Background />
      
        {data.scenes.map((scene) => {
          const CustomVisual = SCENE_VISUALS[scene.id];
          return (
            <Scene key={scene.id} scene={scene}>
              {CustomVisual ? <CustomVisual scene={scene} /> : undefined}
            </Scene>
          );
        })}
      
        <TopBar seriesLabel={data.seri} scenes={data.scenes} />
      
        {data.voiceoverFile ? (
          <Audio
            src={staticFile(data.voiceoverFile)}
            from={voiceoverStartFrame}
          />
        ) : null}
      
        {data.musikFile ? (
          <Audio
            src={staticFile(data.musikFile)}
            volume={data.musikVolume ?? 0.14}
            loop
          />
        ) : null}
      </AbsoluteFill>
    </>
  );
};

