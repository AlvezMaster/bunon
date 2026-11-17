import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { fonts } from "../fonts";
import { useEnterExit } from "./Motion";

const W = 1290; // frame width on screen
const BAR = 46;
const IMG_H = Math.round((W * 900) / 1440);

/**
 * A product screenshot in a browser window: rises in, slowly zooms (Ken Burns), and can put a
 * spotlight on one area (`focus` = [x, y, w, h] as fractions of the screenshot).
 */
export const BrowserShot: React.FC<{
  src: string;
  url: string;
  role: "Buyer" | "Factory";
  dur: number;
  focus?: [number, number, number, number];
  zoom?: "in" | "out";
}> = ({ src, url, role, dur, focus, zoom = "in" }) => {
  const frame = useCurrentFrame();
  const { enter, exit } = useEnterExit(0, dur);
  const t = interpolate(frame, [0, dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.inOut });
  const scale = zoom === "in" ? 1 + t * 0.06 : 1.06 - t * 0.06;
  // Zoom towards the spotlight, if there is one.
  const origin = focus ? `${(focus[0] + focus[2] / 2) * 100}% ${(focus[1] + focus[3] / 2) * 100}%` : "50% 30%";
  const spot = interpolate(frame, [18, 32], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.out });

  return (
    <div
      style={{
        position: "absolute",
        left: (1920 - W) / 2,
        top: 76, // leaves room for a two-line caption (the Bangla line) under the frame
        width: W,
        opacity: enter * (1 - exit),
        transform: `translateY(${interpolate(enter, [0, 1], [60, 0]) - exit * 30}px) scale(${interpolate(enter, [0, 1], [0.96, 1])})`,
        borderRadius: 18,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.35), 0 50px 100px -30px rgba(0,0,0,0.75)",
        background: theme.colors.paper,
      }}
    >
      {/* window bar */}
      <div style={{ height: BAR, display: "flex", alignItems: "center", gap: 14, padding: "0 18px", background: "#1A2142", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <span key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c, opacity: 0.85 }} />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            maxWidth: 640,
            margin: "0 auto",
            height: 28,
            borderRadius: 14,
            background: "rgba(255,255,255,0.07)",
            color: theme.colors.textDim,
            fontFamily: fonts.mono,
            fontSize: 15,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {url}
        </div>
        <span style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 600, color: theme.colors.text, padding: "4px 12px", borderRadius: 12, background: "rgba(163,177,255,0.16)" }}>
          {role}
        </span>
      </div>
      {/* page */}
      <div style={{ position: "relative", width: W, height: IMG_H, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, transform: `scale(${scale})`, transformOrigin: origin }}>
          <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          {focus && (
            <div
              style={{
                position: "absolute",
                left: `${focus[0] * 100}%`,
                top: `${focus[1] * 100}%`,
                width: `${focus[2] * 100}%`,
                height: `${focus[3] * 100}%`,
                borderRadius: 14,
                opacity: spot,
                // Dims everything around the area, and outlines it in the one hero colour.
                boxShadow: `0 0 0 4px ${theme.colors.primary}, 0 0 40px ${theme.colors.glow}, 0 0 0 9999px rgba(11,16,32,${0.32 * spot})`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
