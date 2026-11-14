import { ALL_FORMATS, Input, UrlSource } from "mediabunny";

/**
 * Measure the duration of an audio file in seconds using Mediabunny.
 */
export const getAudioDuration = async (src: string): Promise<number> => {
  const input = new Input({
    formats: ALL_FORMATS,
    source: new UrlSource(src),
  });

  try {
    return await input.computeDuration();
  } finally {
    input.dispose();
  }
};

