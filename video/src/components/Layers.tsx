import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

// Deterministic "random" numbers, so every render is identical.
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const PARTICLES = Array.from({ length: 46 }, (_, i) => ({
  x: rnd(i) * 1920,
  y: rnd(i + 100) * 1080,
  r: 1.2 + rnd(i + 200) * 2.4,
  speed: 0.25 + rnd(i + 300) * 0.7,
  phase: rnd(i + 400) * 6.28,
  warm: rnd(i + 500) > 0.7,
}));

/**
 * Bottom layer: three slow colour blooms, a faint woven thread grid (Bunon means "weaving") with light running
 * along a few threads, and drifting dust. Never a flat fill.
 */
export const BgMesh: React.FC = () => {
  const frame = useCurrentFrame();
  const d1 = Math.sin(frame / 55) * 90;
  const d2 = Math.cos(frame / 70) * 70;
  const d3 = Math.sin(frame / 83 + 1) * 110;
  return (
    <AbsoluteFill style={{ background: theme.colors.bg, overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 1400, height: 1400, borderRadius: "50%", top: -560 + d2 * 0.4, left: -380 + d1, filter: "blur(60px)", background: `radial-gradient(circle, ${theme.colors.accent}30, transparent 62%)` }} />
      <div style={{ position: "absolute", width: 1100, height: 1100, borderRadius: "50%", bottom: -480, right: -280 - d2, filter: "blur(80px)", background: `radial-gradient(circle, ${theme.colors.primary}26, transparent 65%)` }} />
      <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", top: 120, left: 620 + d3, filter: "blur(90px)", background: "radial-gradient(circle, rgba(120,90,255,0.12), transparent 65%)" }} />
      {/* woven threads */}
      <AbsoluteFill
        style={{
          opacity: 0.07,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(231,234,246,0.9) 0 1px, transparent 1px 72px), repeating-linear-gradient(90deg, rgba(231,234,246,0.9) 0 1px, transparent 1px 72px)",
          backgroundPosition: `${(frame * 0.35) % 72}px ${(frame * 0.2) % 72}px`,
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />
      {[216, 504, 792].map((y, i) => {
        const x = ((frame * (5 + i * 2) + i * 700) % 2600) - 340;
        return (
          <div
            key={y}
            style={{
              position: "absolute",
              top: y + ((frame * 0.2) % 72),
              left: x,
              width: 340,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${i === 1 ? theme.colors.primary : theme.colors.accent}, transparent)`,
              opacity: 0.55,
            }}
          />
        );
      })}
      {PARTICLES.map((pt, i) => {
        const y = (((pt.y - frame * pt.speed) % 1080) + 1080) % 1080;
        const x = pt.x + Math.sin(frame / 60 + pt.phase) * 24;
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame / 18 + pt.phase));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: pt.r * 2,
              height: pt.r * 2,
              borderRadius: "50%",
              background: pt.warm ? theme.colors.primary : theme.colors.text,
              opacity: 0.32 * tw,
              boxShadow: pt.warm ? `0 0 8px ${theme.colors.glow}` : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** A segment change: a light sweep across the frame and the segment number as giant outlined type behind. */
export const SegmentSweep: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [0, 26], [-0.5, 1.5], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.inOut });
  const ghostIn = interpolate(frame, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.out });
  const ghostOut = interpolate(frame, [40, 70], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.in });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          right: 40 + (1 - ghostIn) * -120 + frame * 0.6,
          bottom: -140,
          fontFamily: "Newsreader",
          fontSize: 620,
          fontWeight: 600,
          lineHeight: 1,
          color: "transparent",
          WebkitTextStroke: "2px rgba(231,234,246,0.16)",
          opacity: ghostIn * (1 - ghostOut),
          letterSpacing: "-0.04em",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
      {frame < 28 && (
        <div
          style={{
            position: "absolute",
            top: -200,
            bottom: -200,
            left: `${sweep * 100}%`,
            width: 420,
            transform: "skewX(-18deg)",
            background: "linear-gradient(90deg, transparent, rgba(255,154,92,0.16), rgba(163,177,255,0.28), transparent)",
            mixBlendMode: "screen",
          }}
        />
      )}
    </AbsoluteFill>
  );
};

/** Grade: unifies the light product screenshots with the dark scenes. Above content, below grain. */
export const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: theme.colors.accent, mixBlendMode: "soft-light", opacity: 0.1 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.12), transparent 26%, transparent 70%, rgba(0,0,0,0.28))" }} />
  </AbsoluteFill>
);

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;

/** Film grain that flickers every frame. */
export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        backgroundImage: NOISE,
        backgroundSize: "220px",
        backgroundPosition: `${(frame * 7) % 220}px ${(frame * 13) % 220}px`,
        opacity: 0.06,
        mixBlendMode: "overlay",
      }}
    />
  );
};

/** Top layer. */
export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,0.42) 100%)" }} />
);
