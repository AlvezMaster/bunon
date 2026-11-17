import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 entrance spring after `delay` frames, and 1→0 exit over the last 10 frames of a `dur`-frame beat. */
export function useEnterExit(delay: number, dur: number, config: keyof typeof theme.spring = "smooth") {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: theme.spring[config] });
  const exit = interpolate(frame, [dur - 11, dur - 1], [0, 1], { ...clamp, easing: theme.ease.in });
  return { enter, exit, frame, fps };
}

/** Fade + rise + scale in; quicker fade + lift out. Wraps any element. */
export const Rise: React.FC<{ delay?: number; dur: number; children: React.ReactNode; style?: React.CSSProperties; distance?: number }> = ({
  delay = 0,
  dur,
  children,
  style,
  distance = 40,
}) => {
  const { enter, exit } = useEnterExit(delay, dur);
  return (
    <div
      style={{
        ...style,
        opacity: enter * (1 - exit),
        transform: `translateY(${interpolate(enter, [0, 1], [distance, 0]) - exit * 24}px) scale(${interpolate(enter, [0, 1], [0.95, 1])})`,
      }}
    >
      {children}
    </div>
  );
};

/** Word-by-word reveal, 3 frames apart. Gap in px (em would resolve against the parent). */
export const WordReveal: React.FC<{ text: string; delay?: number; dur: number; style?: React.CSSProperties; gap?: number; wordStyle?: (i: number, w: string) => React.CSSProperties }> = ({
  text,
  delay = 0,
  dur,
  style,
  gap = 22,
  wordStyle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = interpolate(frame, [dur - 11, dur - 1], [0, 1], { ...clamp, easing: theme.ease.in });
  return (
    <div style={{ display: "flex", flexWrap: "wrap", columnGap: gap, ...style }}>
      {text.split(" ").map((word, i) => {
        const p = spring({ frame: frame - delay - i * 3, fps, config: theme.spring.snappy });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p * (1 - exit),
              transform: `translateY(${interpolate(p, [0, 1], [34, 0]) - exit * 20}px)`,
              ...wordStyle?.(i, word),
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

/** Counts up to `to` on a soft spring; tabular digits so nothing jitters. */
export const Counter: React.FC<{ to: number; delay?: number; format?: "int" | "plain"; prefix?: string; suffix?: string; style?: React.CSSProperties }> = ({
  to,
  delay = 0,
  format = "int",
  prefix = "",
  suffix = "",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = interpolate(spring({ frame: frame - delay, fps, config: { damping: 30, stiffness: 55 } }), [0, 1], [0, to]);
  const shown = format === "int" ? Math.round(v).toLocaleString("en-US") : String(Math.round(v));
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{`${prefix}${shown}${suffix}`}</span>;
};

/** Slow idle motion for anything on screen longer than ~2 s. */
export function useBreathe(period = 22, amount = 0.012) {
  const frame = useCurrentFrame();
  return { scale: 1 + Math.sin(frame / period) * amount, float: Math.sin(frame / 30) * 3 };
}
