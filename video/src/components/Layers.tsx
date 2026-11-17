import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";

/** Bottom layer: two slow, blurred colour blooms on the night background. Never a flat fill. */
export const BgMesh: React.FC = () => {
  const frame = useCurrentFrame();
  const d1 = Math.sin(frame / 55) * 50;
  const d2 = Math.cos(frame / 70) * 40;
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      <div
        style={{
          position: "absolute",
          width: 1300,
          height: 1300,
          borderRadius: "50%",
          top: -520,
          left: -340 + d1,
          filter: "blur(60px)",
          background: `radial-gradient(circle, ${theme.colors.accent}26, transparent 62%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          bottom: -460,
          right: -260 - d2,
          filter: "blur(80px)",
          background: `radial-gradient(circle, ${theme.colors.primary}1f, transparent 65%)`,
        }}
      />
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
