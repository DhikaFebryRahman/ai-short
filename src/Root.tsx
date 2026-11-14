import { type CalculateMetadataFunction, Composition, staticFile } from "remotion";
import {
  KapsulFakta,
  type KapsulFaktaProps,
} from "./compositions/KapsulFakta";
import videoDataJson from "./data/video.json";
import { VIDEO_SPECS } from "./theme";
import type { VideoData } from "./types/video";
import { getAudioDuration } from "./utils/audioDuration";

const videoData = videoDataJson as unknown as VideoData;

/**
 * Compute composition duration automatically from voiceover length:
 * ceil(voiceover + 1.0s intro + 1.5s outro), capped at 60 seconds.
 */
export const calculateKapsulFaktaMetadata: CalculateMetadataFunction<
  KapsulFaktaProps
> = async ({ props }) => {
  const activeData = props.data ?? videoData;

  const voiceoverSeconds = activeData.voiceoverFile
    ? await getAudioDuration(staticFile(activeData.voiceoverFile))
    : activeData.fallbackVoiceoverDetik;

  const totalSeconds = Math.ceil(
    voiceoverSeconds + VIDEO_SPECS.introSeconds + VIDEO_SPECS.outroSeconds,
  );

  if (totalSeconds > VIDEO_SPECS.maxDurationSeconds) {
    throw new Error(
      `Total durasi video ${totalSeconds}s (voiceover ${voiceoverSeconds.toFixed(2)}s + 1.0s pembuka + 1.5s penutup) melebihi batas maksimal ${VIDEO_SPECS.maxDurationSeconds} detik.`,
    );
  }

  return {
    durationInFrames: totalSeconds * VIDEO_SPECS.fps,
    fps: VIDEO_SPECS.fps,
    width: VIDEO_SPECS.width,
    height: VIDEO_SPECS.height,
    props: {
      ...props,
      data: activeData,
    },
  };
};

const initialTotalSeconds = Math.ceil(
  videoData.fallbackVoiceoverDetik +
    VIDEO_SPECS.introSeconds +
    VIDEO_SPECS.outroSeconds,
);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="KapsulFakta"
        component={KapsulFakta}
        durationInFrames={initialTotalSeconds * VIDEO_SPECS.fps}
        fps={VIDEO_SPECS.fps}
        width={VIDEO_SPECS.width}
        height={VIDEO_SPECS.height}
        defaultProps={{}}
        calculateMetadata={calculateKapsulFaktaMetadata}
      />
    </>
  );
};
