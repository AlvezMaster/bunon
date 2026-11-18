import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { timeline, VO_LEAD_S, type ScreenVisual, type TimedLine } from "./script";
import { VO } from "./vo.generated";
import { BgMesh, Grade, Grain, SegmentSweep, Vignette } from "./components/Layers";
import { Caption, SegmentChip } from "./components/Captions";
import { VisualFor } from "./scenes/Visuals";

// A type (not an interface) so Remotion can treat it as a plain props record.
export type DemoProps = {
  /** Burn the narration in as subtitles (on by default; turn off for a clean version with voice). */
  showCaptions: boolean;
  /** Play the recorded voice clips (public/vo/line-NN.wav, listed by `npm run vo`), one per line. */
  voiceover: boolean;
};

type Sfx = { at: number; file: "click" | "pop" | "whoosh"; volume: number };

const isScreen = (l?: TimedLine): l is TimedLine & { visual: ScreenVisual } => l?.visual.kind === "screen";

/** Sound effects, kept sparse: a soft whoosh per segment, a click per cursor click, a quiet pop per label. */
function effects(lines: TimedLine[], segments: Array<{ from: number }>): Sfx[] {
  const out: Sfx[] = segments.map((s) => ({ at: s.from, file: "whoosh", volume: 0.28 }));
  lines.forEach((l) => {
    if (!isScreen(l)) return;
    for (const t of l.visual.clicks ?? []) out.push({ at: l.from + Math.round(t * l.duration) - 1, file: "click", volume: 0.6 });
    for (const c of l.visual.callouts ?? []) out.push({ at: l.from + Math.round(c.t * l.duration), file: "pop", volume: 0.14 });
  });
  return out;
}

/** The 3-minute demo: five segments from src/script.ts, five-layer stack, captions on top. */
export const BunonDemo: React.FC<DemoProps> = ({ showCaptions, voiceover }) => {
  const { fps } = useVideoConfig();
  const tl = timeline(fps, VO);
  const lead = Math.round(VO_LEAD_S * fps);
  const sfx = effects(tl.lines, tl.segments);
  return (
    <AbsoluteFill style={{ background: "#0B1020" }}>
      <BgMesh />
      {tl.segments.map((s, i) => (
        <Sequence key={`g${i}`} from={s.from} durationInFrames={Math.min(80, s.duration)} name={`Sweep ${i + 1}`}>
          <SegmentSweep index={i} />
        </Sequence>
      ))}
      {tl.lines.map((l, i) => {
        const prev = tl.lines[i - 1];
        const next = tl.lines[i + 1];
        const joinPrev = isScreen(l) && isScreen(prev) && prev.segment === l.segment ? prev.visual : undefined;
        const joinNext = isScreen(l) && isScreen(next) && next.segment === l.segment;
        return (
          <Sequence key={`v${i}`} from={l.from} durationInFrames={l.duration} name={l.text.slice(0, 40)}>
            <VisualFor v={l.visual} dur={l.duration} absFrom={l.from} joinPrev={joinPrev} joinNext={joinNext} />
          </Sequence>
        );
      })}
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
      {voiceover &&
        tl.lines.map((l, i) =>
          VO[i] ? (
            <Sequence key={`a${i}`} from={l.from + lead} durationInFrames={l.duration - lead} layout="none" name={`Voice ${i + 1}`}>
              <Audio src={staticFile(`vo/${VO[i].file}`)} playbackRate={l.rate} />
            </Sequence>
          ) : null
        )}
      {sfx.map((e, i) => (
        <Sequence key={`x${i}`} from={Math.max(0, e.at)} durationInFrames={Math.round(fps * 0.9)} layout="none" name={`Sfx ${e.file}`}>
          <Audio src={staticFile(`sfx/${e.file}.wav`)} volume={e.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
