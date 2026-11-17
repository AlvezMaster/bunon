import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { fonts } from "../fonts";

/** The current narration line as a subtitle at the bottom. These are also the voice-over script. */
export const Caption: React.FC<{ text: string; dur: number }> = ({ text, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - 2, fps, config: theme.spring.snappy });
  const exit = interpolate(frame, [dur - 8, dur - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.in });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 28, pointerEvents: "none" }}>
      <div
        style={{
          maxWidth: 1760,
          padding: "14px 28px",
          borderRadius: 16,
          background: "rgba(8, 11, 24, 0.78)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: theme.colors.text,
          fontFamily: fonts.body,
          fontSize: 32,
          fontWeight: 500,
          lineHeight: 1.35,
          textAlign: "center",
          whiteSpace: "pre-line", // a "\n" in the script puts the Bangla sentence on its own row
          opacity: enter * (1 - exit),
          transform: `translateY(${interpolate(enter, [0, 1], [16, 0])}px)`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/** Top-left: which of the five official segments this is, so judges can map it to the rubric. */
export const SegmentChip: React.FC<{ index: number; label: string; dur: number }> = ({ index, label, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: theme.spring.snappy });
  const exit = interpolate(frame, [dur - 8, dur - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.in });
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: 34,
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: enter * (1 - exit),
        transform: `translateX(${interpolate(enter, [0, 1], [-24, 0])}px)`,
        fontFamily: fonts.mono,
        fontSize: 18,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: theme.colors.textDim,
      }}
    >
      <span style={{ color: theme.colors.accent }}>{String(index + 1).padStart(2, "0")}</span>
      <span style={{ width: 28, height: 1, background: "rgba(255,255,255,0.25)" }} />
      {label}
    </div>
  );
};
