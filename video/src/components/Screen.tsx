import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Callout, Role, ScreenVisual } from "../script";
import { theme } from "../theme";
import { fonts } from "../fonts";
import { PAGE_W, pageHeight, shotFile } from "../shots";

const C = theme.colors;
const WIN_W = 1290;
const BAR = 46;
const VIEW_H = Math.round((WIN_W * 900) / PAGE_W);
const S0 = WIN_W / PAGE_W;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const WIPE = 14; // frames for one page to push the last one out

type Cam = { x: number; y: number; z: number };
const DEFAULT_CAM: NonNullable<ScreenVisual["cam"]> = [
  [0, 720, 450, 1],
  [1, 720, 450, 1.06],
];

/** Eased value between keyframes [t, ...values] at progress p (0–1). */
function keyed<T extends number[]>(keys: Array<[number, ...T]>, p: number): T {
  if (p <= keys[0][0]) return keys[0].slice(1) as unknown as T;
  for (let i = 1; i < keys.length; i++) {
    const [t1, ...b] = keys[i];
    const [t0, ...a] = keys[i - 1];
    if (p <= t1) {
      const k = theme.ease.inOut(Math.min(1, Math.max(0, (p - t0) / Math.max(1e-6, t1 - t0))));
      return a.map((v, j) => v + ((b[j] as number) - v) * k) as unknown as T;
    }
  }
  return keys[keys.length - 1].slice(1) as unknown as T;
}

export function camAt(v: ScreenVisual, p: number): Cam {
  const [x, y, z] = keyed<[number, number, number]>(v.cam?.length ? v.cam : DEFAULT_CAM, p);
  return { x, y, z };
}

/** Where the page sits in the window for a camera: scale and offset, kept inside the page edges. */
function place(cam: Cam, pageH: number) {
  const s = S0 * Math.max(1, cam.z);
  const wp = PAGE_W * s;
  const hp = pageH * s;
  const left = Math.min(0, Math.max(WIN_W - wp, WIN_W / 2 - cam.x * s));
  const top = hp <= VIEW_H ? 0 : Math.min(0, Math.max(VIEW_H - hp, VIEW_H / 2 - cam.y * s));
  return { s, left, top, toScreen: (x: number, y: number) => [left + x * s, top + y * s] as const };
}

/** The screenshot shown at progress p, and when it appeared. */
function frameAt(v: ScreenVisual, p: number) {
  let i = 0;
  v.frames.forEach((f, j) => {
    if (f[0] <= p) i = j;
  });
  return { i, f: v.frames[i] };
}

const Page: React.FC<{ src: string; cam: Cam; style?: React.CSSProperties }> = ({ src, cam, style }) => {
  const H = pageHeight(src);
  const { s, left, top } = place(cam, H);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", ...style }}>
      <Img src={staticFile(shotFile(src))} style={{ position: "absolute", left, top, width: PAGE_W * s, height: H * s, display: "block" }} />
    </div>
  );
};

const ROLE_TINT: Record<Role, string> = { Buyer: "rgba(163,177,255,0.18)", Factory: "rgba(255,154,92,0.18)", Visitor: "rgba(255,255,255,0.1)" };

/**
 * A live-looking product screen: the camera glides and zooms over the real page, a cursor moves and clicks,
 * the page changes after a click, and short labels pop out of the UI. Consecutive screens in a segment share
 * one window: the new page pushes the old one out instead of the whole window leaving.
 */
export const Screen: React.FC<{ v: ScreenVisual; dur: number; absFrom: number; joinPrev?: ScreenVisual; joinNext?: boolean }> = ({ v, dur, absFrom, joinPrev, joinNext }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = Math.min(1, frame / Math.max(1, dur - 1));
  const g = absFrom + frame; // global frame: idle motion stays continuous across joined screens
  const cam = camAt(v, p);
  const cur = frameAt(v, p);
  const src = cur.f[1];
  const url = cur.f[2] ?? v.url;
  const role = cur.f[3] ?? v.role;
  const swapAt = Math.round(cur.f[0] * dur);
  const sinceSwap = frame - swapAt;
  const prevSrc = cur.i > 0 ? v.frames[cur.i - 1][1] : null;
  const { toScreen, s } = place(cam, pageHeight(src));

  // Window in / out (skipped when the neighbouring line is a screen too).
  const enter = joinPrev ? 1 : spring({ frame, fps, config: theme.spring.smooth });
  const exit = joinNext ? 0 : interpolate(frame, [dur - 10, dur - 1], [0, 1], { ...clamp, easing: theme.ease.in });
  const rotX = (1 - enter) * 16 + 1.4 + Math.sin(g / 95) * 0.7;
  const rotY = Math.sin(g / 120) * 1.5;
  const lift = (1 - enter) * 140 + Math.sin(g / 70) * 4 - exit * 30;
  const wipe = joinPrev ? interpolate(frame, [0, WIPE], [0, 1], { ...clamp, easing: theme.ease.out }) : 1;

  // URL types itself whenever it changes.
  const urlStart = cur.i > 0 && cur.f[2] ? swapAt : joinPrev && joinPrev.url === url ? -999 : 0;
  const typed = url.slice(0, Math.round(interpolate(frame - urlStart, [2, 18], [0, url.length], clamp)));

  return (
    <div style={{ position: "absolute", inset: 0, perspective: 2400 }}>
      {/* focal bloom behind the window */}
      <div
        style={{
          position: "absolute",
          left: 960 - 760,
          top: 500 - 420,
          width: 1520,
          height: 840,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${role === "Buyer" ? "rgba(163,177,255,0.28)" : "rgba(255,154,92,0.24)"}, transparent 65%)`,
          filter: "blur(30px)",
          opacity: enter * (1 - exit) * (0.75 + Math.sin(g / 40) * 0.25),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: (1920 - WIN_W) / 2,
          top: 74,
          width: WIN_W,
          opacity: enter * (1 - exit),
          transform: `translateY(${lift}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${(0.9 + 0.1 * enter) * (1 - exit * 0.04)})`,
          transformOrigin: "50% 60%",
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.35), 0 60px 120px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
          background: C.paper,
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
              color: C.textDim,
              fontFamily: fonts.mono,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth={2.4} strokeLinecap="round">
              <path d="M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            {typed}
            <span style={{ width: 1.5, height: 15, background: C.textDim, opacity: typed.length < url.length ? 1 : 0 }} />
          </div>
          <span style={{ fontFamily: fonts.body, fontSize: 15, fontWeight: 600, color: C.text, padding: "4px 12px", borderRadius: 12, background: ROLE_TINT[role] }}>{role}</span>
        </div>

        {/* page */}
        <div style={{ position: "relative", width: WIN_W, height: VIEW_H, overflow: "hidden", background: C.paper }}>
          {joinPrev && wipe < 1 && (
            <Page
              src={joinPrev.frames[joinPrev.frames.length - 1][1]}
              cam={camAt(joinPrev, 1)}
              style={{ transform: `translateX(${-wipe * 160}px)`, opacity: 1 - wipe * 0.5 }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: wipe < 1 ? `inset(0 0 0 ${(1 - wipe) * 100}%)` : undefined,
              transform: wipe < 1 ? `translateX(${(1 - wipe) * 60}px)` : undefined,
              boxShadow: wipe < 1 ? "-30px 0 60px rgba(0,0,0,0.25)" : undefined,
            }}
          >
            {prevSrc && sinceSwap < 6 && <Page src={prevSrc} cam={cam} />}
            <Page src={src} cam={cam} style={{ opacity: prevSrc ? interpolate(sinceSwap, [0, 5], [0, 1], clamp) : 1 }} />
            {v.spot && <Spot spot={v.spot} p={p} frame={frame} dur={dur} toScreen={toScreen} s={s} />}
            {(v.callouts ?? []).map((c, i) => (
              <CalloutPill key={i} c={c} frame={frame} dur={dur} fps={fps} toScreen={toScreen} />
            ))}
            {v.cursor && <Cursor v={v} p={p} frame={frame} dur={dur} toScreen={toScreen} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const Spot: React.FC<{ spot: NonNullable<ScreenVisual["spot"]>; p: number; frame: number; dur: number; toScreen: (x: number, y: number) => readonly [number, number]; s: number }> = ({ spot, frame, dur, toScreen, s }) => {
  const [t, x, y, w, h] = spot;
  const k = interpolate(frame, [t * dur, t * dur + 14], [0, 1], { ...clamp, easing: theme.ease.out });
  const [sx, sy] = toScreen(x, y);
  const pulse = 0.5 + Math.sin(frame / 9) * 0.5;
  return (
    <div
      style={{
        position: "absolute",
        left: sx - 6,
        top: sy - 6,
        width: w * s + 12,
        height: h * s + 12,
        borderRadius: 14,
        opacity: k,
        boxShadow: `0 0 0 3px ${C.primary}, 0 0 ${24 + pulse * 22}px ${C.glow}, 0 0 0 9999px rgba(11,16,32,${0.34 * k})`,
      }}
    />
  );
};

const CalloutPill: React.FC<{ c: Callout; frame: number; dur: number; fps: number; toScreen: (x: number, y: number) => readonly [number, number] }> = ({ c, frame, dur, fps, toScreen }) => {
  const start = Math.round(c.t * dur);
  if (frame < start) return null;
  const e = spring({ frame: frame - start, fps, config: theme.spring.bouncy });
  const out = c.to !== undefined ? interpolate(frame, [c.to * dur, c.to * dur + 8], [0, 1], { ...clamp, easing: theme.ease.in }) : 0;
  if (out >= 1) return null;
  const [ax, ay] = toScreen(c.x, c.y);
  const side = c.side ?? "right";
  const w = Math.round(c.text.length * 11.6 + 64);
  const h = 50;
  const GAP = 30;
  let x = side === "right" ? ax + GAP : side === "left" ? ax - GAP - w : ax - w / 2;
  let y = side === "top" ? ay - GAP - h : side === "bottom" ? ay + GAP : ay - h / 2;
  if (side === "right" && x + w > WIN_W - 16) x = ax - GAP - w; // flip when it would leave the window
  x = Math.min(WIN_W - w - 16, Math.max(16, x));
  y = Math.min(VIEW_H - h - 16, Math.max(16, y));
  const ring = (frame - start) % 36;
  const from = { x: ax - (x + w / 2), y: ay - (y + h / 2) };
  return (
    <>
      <svg style={{ position: "absolute", left: 0, top: 0, width: WIN_W, height: VIEW_H, overflow: "visible", opacity: e * (1 - out) }}>
        <line
          x1={ax}
          y1={ay}
          x2={ax + (x + w / 2 - ax) * Math.min(1, e)}
          y2={ay + (y + h / 2 - ay) * Math.min(1, e)}
          stroke={C.primary}
          strokeWidth={2}
          strokeDasharray="4 5"
        />
        <circle cx={ax} cy={ay} r={7} fill={C.primary} stroke="#fff" strokeWidth={2.5} />
        <circle cx={ax} cy={ay} r={7 + ring * 0.9} fill="none" stroke={C.primary} strokeWidth={2} opacity={1 - ring / 36} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          height: h,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 22px 0 16px",
          borderRadius: 999,
          background: "rgba(11,16,32,0.92)",
          border: "1px solid rgba(255,255,255,0.16)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.3), 0 18px 40px -12px rgba(0,0,0,0.6)",
          color: "#fff",
          fontFamily: fonts.body,
          fontSize: 22,
          fontWeight: 600,
          whiteSpace: "nowrap",
          opacity: Math.min(1, e) * (1 - out),
          transform: `translate(${from.x * (1 - e)}px, ${from.y * (1 - e)}px) scale(${0.4 + 0.6 * e})`,
        }}
      >
        <span style={{ width: 22, height: 22, borderRadius: 11, background: C.primary, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#0B1020" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        {c.text}
      </div>
    </>
  );
};

const Cursor: React.FC<{ v: ScreenVisual; p: number; frame: number; dur: number; toScreen: (x: number, y: number) => readonly [number, number] }> = ({ v, p, frame, dur, toScreen }) => {
  const keys = v.cursor!;
  const startF = keys[0][0] * dur;
  const [x, y] = keyed<[number, number]>(keys, p);
  const [sx, sy] = toScreen(x, y);
  const show = interpolate(frame, [startF, startF + 6], [0, 1], clamp);
  let press = 0;
  const ripples: React.ReactNode[] = [];
  for (const t of v.clicks ?? []) {
    const fc = t * dur;
    const age = frame - fc;
    if (age > -3 && age < 6) press = Math.max(press, 1 - Math.abs(age) / 5);
    if (age >= 0 && age <= 20) {
      const [cx, cy] = toScreen(...keyed<[number, number]>(keys, Math.min(1, fc / Math.max(1, dur - 1))));
      ripples.push(
        <div
          key={t}
          style={{
            position: "absolute",
            left: cx - (8 + age * 2.6),
            top: cy - (8 + age * 2.6),
            width: 2 * (8 + age * 2.6),
            height: 2 * (8 + age * 2.6),
            borderRadius: "50%",
            border: `3px solid ${C.primary}`,
            background: `rgba(255,154,92,${0.18 * (1 - age / 20)})`,
            opacity: 1 - age / 20,
          }}
        />
      );
    }
  }
  return (
    <>
      {ripples}
      <svg
        width={34}
        height={34}
        viewBox="0 0 24 28"
        style={{
          position: "absolute",
          left: sx - 3,
          top: sy - 2,
          opacity: show,
          transform: `scale(${1 - press * 0.18})`,
          transformOrigin: "3px 2px",
          filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.35))",
        }}
      >
        <path d="M3 2 L3 22 L8.5 16.8 L12.4 25.2 L16 23.6 L12.1 15.4 L19.6 15.4 Z" fill="#fff" stroke="#0B1020" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </>
  );
};
