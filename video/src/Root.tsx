import React from "react";
import { Composition } from "remotion";
import { BunonDemo, type DemoProps } from "./BunonDemo";
import { FPS, timeline } from "./script";

const defaults: DemoProps = { showCaptions: true, voiceover: false };

/**
 * BunonDemo: the 3-minute preliminary video (captions on).
 * BunonDemoClean: the same with the recorded voice and no burned-in captions.
 */
export const Root: React.FC = () => (
  <>
    <Composition id="BunonDemo" component={BunonDemo} durationInFrames={timeline(FPS).total} fps={FPS} width={1920} height={1080} defaultProps={defaults} />
    <Composition
      id="BunonDemoClean"
      component={BunonDemo}
      durationInFrames={timeline(FPS).total}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ showCaptions: false, voiceover: true }}
    />
  </>
);
