import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { timeline } from "./script";
import { BgMesh, Grade, Grain, Vignette } from "./components/Layers";
import { Caption, SegmentChip } from "./components/Captions";
import { VisualFor } from "./scenes/Visuals";

// A type (not an interface) so Remotion can treat it as a plain props record.
export type DemoProps = {
  /** Burn the narration in as subtitles (on by default; turn off for a clean version with voice). */
  showCaptions: boolean;
  /** Play public/voiceover.mp3 under the video once it has been recorded. */
  voiceover: boolean;
};

/** The 3-minute demo: five segments from src/script.ts, five-layer stack, captions on top. */
export const BunonDemo: React.FC<DemoProps> = ({ showCaptions, voiceover }) => {
  const { fps } = useVideoConfig();
  const tl = timeline(fps);
  return (
    <AbsoluteFill style={{ background: "#0B1020" }}>
      <BgMesh />
      {tl.lines.map((l, i) => (
        <Sequence key={`v${i}`} from={l.from} durationInFrames={l.duration} name={l.text.slice(0, 40)}>
          <VisualFor v={l.visual} dur={l.duration} />
        </Sequence>
      ))}
      <Grade />
      {tl.segments.map((s, i) => (
        <Sequence key={`s${i}`} from={s.from} durationInFrames={s.duration} name={`Segment ${i + 1}: ${s.label}`}>
          <SegmentChip index={i} label={s.label} dur={s.duration} />
        </Sequence>
      ))}
      {showCaptions &&
        tl.lines.map((l, i) => (
          <Sequence key={`c${i}`} from={l.from} durationInFrames={l.duration} layout="none">
            <Caption text={l.text} dur={l.duration} />
          </Sequence>
        ))}
      <Grain />
      <Vignette />
      {voiceover && <Audio src={staticFile("voiceover.mp3")} />}
    </AbsoluteFill>
  );
};
