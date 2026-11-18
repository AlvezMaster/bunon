import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { ScreenVisual, Visual } from "../script";
import { theme } from "../theme";
import { fonts } from "../fonts";
import { Counter, Rise, WordReveal, useBreathe, useEnterExit } from "../components/Motion";
import { Screen } from "../components/Screen";
import { Logo } from "../components/Logo";

const C = theme.colors;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const center: React.CSSProperties = { alignItems: "center", justifyContent: "center", paddingBottom: 110 };
const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 24,
  boxShadow: "0 2px 4px rgba(0,0,0,0.3), 0 30px 60px -24px rgba(0,0,0,0.6)",
};

// ---------------------------------------------------------------------------- small icons (SVG, theme colours)
type IconName = "doc" | "spark" | "person" | "lock" | "store" | "check" | "factory" | "pin";
const Icon: React.FC<{ name: IconName; size?: number; color?: string }> = ({ name, size = 44, color = C.accent }) => {
  const p = { fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {name === "doc" && <path {...p} d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6" />}
      {name === "spark" && <path {...p} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z" />}
      {name === "person" && <path {...p} d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 9.5-4.9M16 18l2 2 4-4" />}
      {name === "lock" && <path {...p} d="M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4M12 15v2" />}
      {name === "store" && <path {...p} d="M3 9l1.5-5h15L21 9M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM5 13v8h14v-8" />}
      {name === "check" && <path {...p} d="M5 12.5l4.5 4.5L19 7.5" />}
      {name === "factory" && <path {...p} d="M3 21V11l5 3v-3l5 3V8l5 3V4h3v17zM7 18h2M12 18h2M17 18h2" />}
      {name === "pin" && <path {...p} d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12.2a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z" />}
    </svg>
  );
};

/** A tick that draws itself. */
const DrawCheck: React.FC<{ p: number; size: number; color: string }> = ({ p, size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={24} strokeDashoffset={24 * (1 - p)} />
  </svg>
);

/** Rings that ripple out from behind an element, on a loop. */
const Rings: React.FC<{ size: number; color?: string; count?: number; period?: number }> = ({ size, color = C.accent, count = 3, period = 54 }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0 }}>
      {Array.from({ length: count }).map((_, i) => {
        const k = ((frame + (i * period) / count) % period) / period;
        const d = size * (0.7 + k * 1.1);
        return <div key={i} style={{ position: "absolute", left: -d / 2, top: -d / 2, width: d, height: d, borderRadius: "50%", border: `1.5px solid ${color}`, opacity: 0.45 * (1 - k) }} />;
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------- About us and who it's for

const About: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame: frame - 2, fps, config: theme.spring.smooth });
  const out = interpolate(frame, [dur - 11, dur - 1], [0, 1], { ...clamp, easing: theme.ease.in });
  const line = interpolate(frame, [18, 48], [0, 1], { ...clamp, easing: theme.ease.out });
  return (
    <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 30 }}>
      <div style={{ opacity: logo * (1 - out), transform: `translateY(${(1 - logo) * 16}px)` }}>
        <Logo size={92} />
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 30 }}>
        <WordReveal text="We're Bunon." delay={6} dur={dur} gap={26} style={{ fontFamily: fonts.display, fontSize: 128, fontWeight: 600, letterSpacing: "-0.035em", color: C.text }} />
        <Rise delay={14} dur={dur} distance={14}>
          <span style={{ fontFamily: fonts.body, fontSize: 76, fontWeight: 500, color: C.primary }}>বুনন</span>
        </Rise>
      </div>
      <div style={{ width: 360 * line, height: 1, background: "rgba(231,234,246,0.28)", opacity: 1 - out }} />
      <Rise delay={22} dur={dur} distance={12}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 12, fontFamily: fonts.body, fontSize: 34, color: C.textDim }}>
          <Icon name="pin" size={28} color={C.textDim} />A small team in Dhaka, Bangladesh
        </span>
      </Rise>
    </AbsoluteFill>
  );
};

const AUDIENCE = [
  { icon: "factory" as const, title: "Garment factories", who: "Owners and compliance teams in Bangladesh", gets: "Answer each question once", from: -1 },
  { icon: "store" as const, title: "Brands and buyers", who: "Sourcing and compliance teams, many in the EU", gets: "Every answer with its source · free", from: 1 },
];

const Audience: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const out = interpolate(frame, [dur - 11, dur - 1], [0, 1], { ...clamp, easing: theme.ease.in });
  const hub = spring({ frame: frame - 2, fps, config: theme.spring.bouncy });
  const line = interpolate(frame, [14, 34], [0, 1], { ...clamp, easing: theme.ease.out });
  const CARD_W = 600;
  const GAP = 300;
  const total = CARD_W * 2 + GAP;
  const left = (1920 - total) / 2;
  const y = 500;
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <div style={{ position: "absolute", top: 120, width: "100%", display: "flex", justifyContent: "center" }}>
        <WordReveal text="Who it's for" dur={dur} gap={20} style={{ fontFamily: fonts.mono, fontSize: 26, letterSpacing: "0.16em", textTransform: "uppercase", color: C.accent }} />
      </div>
      {/* threads from the hub to both sides, with light travelling along them */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {[-1, 1].map((d) => {
          const x1 = 960 + d * 70;
          const x2 = 960 + d * (GAP / 2 + 6);
          const xe = x1 + (x2 - x1) * line;
          return (
            <g key={d}>
              <line x1={x1} y1={y} x2={xe} y2={y} stroke={C.primary} strokeWidth={2.5} strokeOpacity={0.7} />
              {[0, 0.5].map((o) => {
                const k = ((frame / 40 + o) % 1) * line;
                return <circle key={o} cx={x1 + (x2 - x1) * k} cy={y} r={5} fill={C.primary} style={{ filter: `drop-shadow(0 0 6px ${C.primary})` }} />;
              })}
            </g>
          );
        })}
      </svg>
      <div style={{ ...glass, position: "absolute", left: 960 - 70, top: y - 70, width: 140, height: 140, borderRadius: 70, background: "rgba(19,26,51,0.95)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${hub})` }}>
        <Rings size={140} color={C.primary} />
        <Logo size={70} />
      </div>
      {AUDIENCE.map((a, i) => {
        const p = spring({ frame: frame - 10 - i * 6, fps, config: theme.spring.smooth });
        const chip = spring({ frame: frame - 26 - i * 6, fps, config: theme.spring.snappy });
        const b = Math.sin((frame + i * 30) / 34) * 5;
        return (
          <div
            key={a.title}
            style={{
              ...glass,
              position: "absolute",
              left: i === 0 ? left : left + CARD_W + GAP,
              top: y - 200,
              width: CARD_W,
              height: 400,
              padding: "40px 44px",
              background: "rgba(19,26,51,0.92)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              opacity: p,
              transform: `perspective(1600px) translateX(${a.from * (1 - p) * 220}px) translateY(${b}px) rotateY(${a.from * -(1 - p) * 28}deg)`,
            }}
          >
            <Icon name={a.icon} size={56} color={i === 0 ? C.primary : C.accent} />
            <span style={{ fontFamily: fonts.display, fontSize: 60, fontWeight: 600, letterSpacing: "-0.03em", color: C.text, lineHeight: 1.05 }}>{a.title}</span>
            <span style={{ fontFamily: fonts.body, fontSize: 28, color: C.textDim, lineHeight: 1.35 }}>{a.who}</span>
            <span
              style={{
                marginTop: "auto",
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 22px",
                borderRadius: 999,
                background: i === 0 ? "rgba(255,154,92,0.14)" : "rgba(163,177,255,0.14)",
                fontFamily: fonts.body,
                fontSize: 26,
                fontWeight: 600,
                color: C.text,
                opacity: chip,
                transform: `scale(${0.7 + 0.3 * chip})`,
              }}
            >
              <DrawCheck p={chip} size={26} color={C.success} />
              {a.gets}
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------- kinds

const Stat: React.FC<{ v: Extract<Visual, { kind: "stat" }>; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [dur - 11, dur - 1], [0, 1], { ...clamp, easing: theme.ease.in });
  const bar = interpolate(frame, [12, 46], [0, 1], { ...clamp, easing: theme.ease.out });
  return (
    <AbsoluteFill style={center}>
      <Rise dur={dur} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <Counter
          to={v.value}
          delay={6}
          format={v.format}
          prefix={v.prefix}
          suffix={v.suffix}
          style={{ fontFamily: fonts.display, fontSize: 250, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1, color: C.primary, textShadow: "0 0 50px rgba(255,154,92,0.18)" }}
        />
        <div style={{ width: 240 * bar, height: 1, background: "rgba(231,234,246,0.35)", opacity: 1 - out }} />
        <WordReveal text={v.label} delay={14} dur={dur} gap={14} style={{ fontFamily: fonts.body, fontSize: 46, fontWeight: 500, color: C.text, justifyContent: "center", maxWidth: 1300 }} />
      </Rise>
      {v.source && (
        <div style={{ position: "absolute", right: 72, bottom: 132 }}>
          <Rise dur={dur} delay={24} distance={12}>
            <span style={{ fontFamily: fonts.mono, fontSize: 18, color: C.textDim, letterSpacing: "0.04em" }}>Source: {v.source}</span>
          </Rise>
        </div>
      )}
    </AbsoluteFill>
  );
};

const Cards: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = interpolate(frame, [dur - 11, dur - 1], [0, 1], { ...clamp, easing: theme.ease.in });
  const n = 6;
  return (
    <AbsoluteFill style={center}>
      <div style={{ position: "relative", width: 1500, height: 560 }}>
        {Array.from({ length: n }).map((_, i) => {
          const p = spring({ frame: frame - 4 - i * 5, fps, config: theme.spring.smooth });
          const angle = (i - (n - 1) / 2) * 5;
          const x = (i - (n - 1) / 2) * 200;
          const float = Math.sin((frame + i * 9) / 30) * 3;
          return (
            <div
              key={i}
              style={{
                ...glass,
                position: "absolute",
                left: 750 - 150 + x,
                top: 70,
                width: 300,
                height: 400,
                padding: 26,
                background: "rgba(19,26,51,0.92)",
                opacity: p * (1 - exit),
                transform: `translateY(${interpolate(p, [0, 1], [90, 0]) + float - exit * 24}px) rotate(${angle * p}deg)`,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <span style={{ fontFamily: fonts.mono, fontSize: 16, color: C.accent, letterSpacing: "0.1em" }}>BUYER {i + 1}</span>
              <span style={{ fontFamily: fonts.display, fontSize: 30, fontWeight: 600, color: C.text, lineHeight: 1.1 }}>Supplier questionnaire</span>
              {["Fire licence?", "Minimum wage?", "Overtime?", "Under 18?", "Grievances?"].map((q) => (
                <div key={q} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${C.textDim}` }} />
                  <span style={{ fontFamily: fonts.body, fontSize: 20, color: C.textDim }}>{q}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Chips: React.FC<{ v: Extract<Visual, { kind: "chips" }>; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const out = interpolate(frame, [dur - 11, dur - 1], [0, 1], { ...clamp, easing: theme.ease.in });
  const line = interpolate(frame, [10, 40], [0, 1], { ...clamp, easing: theme.ease.out });
  return (
    <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 50 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <WordReveal text={v.title} dur={dur} gap={22} style={{ fontFamily: fonts.display, fontSize: 88, fontWeight: 600, letterSpacing: "-0.03em", color: C.text, justifyContent: "center", maxWidth: 1500 }} />
        <div style={{ width: 200 * line, height: 2, borderRadius: 1, background: C.primary, opacity: 1 - out }} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18, maxWidth: 1500 }}>
        {v.items.map((item, i) => (
          <Rise key={item} delay={14 + i * 4} dur={dur} distance={20}>
            <span style={{ ...glass, display: "inline-flex", alignItems: "center", gap: 14, borderRadius: 999, padding: "16px 30px", fontFamily: fonts.body, fontSize: 36, fontWeight: 500, color: C.text }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: C.accent }} />
              {item}
            </span>
          </Rise>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Headline: React.FC<{ v: Extract<Visual, { kind: "headline" }>; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const b = useBreathe(26, 0.008);
  const shimmer = interpolate(frame, [26, 70], [0, 1], { ...clamp, easing: theme.ease.inOut });
  return (
    <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 34 }}>
      {v.logo && (
        <Rise dur={dur} distance={30}>
          <div style={{ position: "relative", transform: `translateY(${b.float}px)` }}>
            <Logo size={150} />
          </div>
        </Rise>
      )}
      <div style={{ transform: `scale(${b.scale})` }}>
        <WordReveal
          text={v.hero ? `${v.text} ${v.hero}` : v.text}
          delay={v.logo ? 10 : 2}
          dur={dur}
          gap={30}
          style={{ fontFamily: fonts.display, fontSize: 132, fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.05, color: C.text, justifyContent: "center", maxWidth: 1600 }}
          wordStyle={(i) => {
            const heroFrom = v.text.split(" ").length;
            if (!v.hero || i < heroFrom) return {};
            // A light sweeps through the hero words.
            return {
              fontStyle: "italic",
              color: "transparent",
              backgroundImage: `linear-gradient(100deg, ${C.primary} 0%, ${C.primary} 40%, #FFE6D2 50%, ${C.primary} 60%, ${C.primary} 100%)`,
              backgroundSize: "300% 100%",
              backgroundPosition: `${100 - shimmer * 100}% 0`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              paddingRight: 8,
            };
          }}
        />
      </div>
      {v.sub && (
        <Rise dur={dur} delay={20} distance={24}>
          <span style={{ fontFamily: fonts.body, fontSize: 52, fontWeight: 500, color: C.textDim }}>{v.sub}</span>
        </Rise>
      )}
    </AbsoluteFill>
  );
};

const FLOW: Array<{ icon: IconName; title: string; sub: string }> = [
  { icon: "doc", title: "Factory documents", sub: "licences, policies, reports" },
  { icon: "spark", title: "AI drafts", sub: "with the exact quote" },
  { icon: "person", title: "A person approves", sub: "nothing sent unchecked" },
  { icon: "lock", title: "Sealed in the ledger", sub: "tamper-evident" },
  { icon: "store", title: "Buyer", sub: "sees answer + source" },
];

const Flow: React.FC<{ step: number; dur: number }> = ({ step, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shown = step >= 4 ? FLOW.length : step;
  const last = step >= 4;
  const exit = last ? interpolate(frame, [dur - 11, dur - 1], [0, 1], { ...clamp, easing: theme.ease.in }) : 0;
  return (
    <AbsoluteFill style={{ ...center, opacity: 1 - exit }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {FLOW.slice(0, shown).map((n, i) => {
          // Only the newest node(s) animate; earlier ones were already on screen in the previous line.
          const isNew = i >= step - 1;
          const p = isNew ? spring({ frame: frame - 4 - (i - (step - 1)) * 6, fps, config: theme.spring.smooth }) : 1;
          const active = i === Math.min(step, FLOW.length) - 1 || (last && i === FLOW.length - 1);
          const glow = active ? 0.5 + Math.sin(frame / 10) * 0.5 : 0;
          return (
            <React.Fragment key={n.title}>
              {i > 0 && (
                <div style={{ position: "relative", width: 44 * p, height: 2, background: `linear-gradient(90deg, ${C.textDim}, ${C.accent})`, opacity: p }}>
                  <div style={{ position: "absolute", top: -3, left: ((frame * 1.6 + i * 11) % 44) - 4, width: 8, height: 8, borderRadius: 4, background: C.primary, boxShadow: `0 0 10px ${C.primary}` }} />
                </div>
              )}
              <div
                style={{
                  ...glass,
                  width: 280,
                  height: 250,
                  padding: 26,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  opacity: p,
                  transform: `translateY(${interpolate(p, [0, 1], [70, 0]) + (active ? Math.sin(frame / 14) * 4 : 0)}px) scale(${interpolate(p, [0, 1], [0.86, 1]) * (active ? 1.04 : 1)})`,
                  borderColor: active ? "rgba(255,154,92,0.65)" : "rgba(255,255,255,0.12)",
                  boxShadow: active ? `0 0 ${30 + glow * 30}px rgba(255,154,92,0.25), 0 30px 60px -24px rgba(0,0,0,0.6)` : glass.boxShadow,
                }}
              >
                <Icon name={n.icon} color={active ? C.primary : C.accent} />
                <span style={{ fontFamily: fonts.display, fontSize: 36, fontWeight: 600, color: C.text, lineHeight: 1.1 }}>{n.title}</span>
                <span style={{ fontFamily: fonts.body, fontSize: 22, color: C.textDim }}>{n.sub}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Quote: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const yes = spring({ frame: frame - 12, fps, config: theme.spring.bouncy });
  const mark = interpolate(frame, [26, 56], [0, 100], { ...clamp, easing: theme.ease.inOut });
  return (
    <AbsoluteFill style={center}>
      <Rise dur={dur} style={{ ...glass, width: 1300, padding: "48px 56px", display: "flex", flexDirection: "column", gap: 22, background: "rgba(19,26,51,0.9)" }}>
        <span style={{ fontFamily: fonts.mono, fontSize: 18, color: C.textDim, letterSpacing: "0.1em" }}>QUESTION 8 · FROM YOUR BUYER</span>
        <span style={{ fontFamily: fonts.display, fontSize: 52, fontWeight: 600, color: C.text }}>Can workers raise grievances anonymously?</span>
        <span style={{ alignSelf: "flex-start", fontFamily: fonts.body, fontSize: 44, fontWeight: 700, color: C.success, opacity: Math.min(1, yes), transform: `scale(${1.8 - 0.8 * yes}) rotate(${(1 - yes) * -10}deg)`, transformOrigin: "left center" }}>Yes</span>
        <Rise dur={dur} delay={20} distance={20}>
          <div style={{ borderLeft: `4px solid ${C.primary}`, paddingLeft: 24, fontFamily: fonts.body, fontStyle: "italic", fontSize: 32, lineHeight: 1.45, color: C.text }}>
            <span
              style={{
                backgroundImage: "linear-gradient(rgba(255,154,92,0.28), rgba(255,154,92,0.28))",
                backgroundRepeat: "no-repeat",
                backgroundSize: `${mark}% 100%`,
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
                padding: "0 4px",
              }}
            >
              “Workers can raise a grievance anonymously through a locked suggestion box on every floor or through a toll-free hotline run by an outside organisation.”
            </span>
          </div>
        </Rise>
        <Rise dur={dur} delay={30} distance={16}>
          <span style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: fonts.body, fontSize: 24, color: C.textDim }}>
            <Icon name="doc" size={28} color={C.textDim} /> Grievance procedure · sealed in the ledger
          </span>
        </Rise>
      </Rise>
    </AbsoluteFill>
  );
};

const Models: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ ...center, flexDirection: "row", gap: 40 }}>
      {[
        { where: "Drafting", model: "Qwen 3.5 · 4B", via: "Open model, runs locally", note: "documents can stay in the factory" },
        { where: "Search", model: "Qwen3 · 0.6B", via: "Embeddings plus keywords", note: "English and Bangla questions" },
      ].map((m, i) => (
        <Rise key={m.where} dur={dur} delay={4 + i * 6} style={{ ...glass, position: "relative", overflow: "hidden", width: 640, padding: "44px 48px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* scan line, like a model at work */}
          <div style={{ position: "absolute", left: 0, right: 0, top: ((frame * 4 + i * 160) % 420) - 40, height: 40, background: "linear-gradient(180deg, transparent, rgba(163,177,255,0.12), transparent)" }} />
          <span style={{ fontFamily: fonts.mono, fontSize: 18, letterSpacing: "0.1em", color: C.accent, textTransform: "uppercase" }}>{m.where}</span>
          <span style={{ fontFamily: fonts.display, fontSize: 76, fontWeight: 600, letterSpacing: "-0.03em", color: C.text }}>{m.model}</span>
          <span style={{ fontFamily: fonts.body, fontSize: 32, fontWeight: 500, color: C.text }}>{m.via}</span>
          <span style={{ fontFamily: fonts.body, fontSize: 26, color: C.textDim }}>{m.note}</span>
        </Rise>
      ))}
    </AbsoluteFill>
  );
};

const CHECKS = [
  "The quote appears word for word in the document",
  "A second model agrees the question can be answered",
  "A “Yes” never rests on a negative sentence",
  "A person approves before anything is sent",
];

const Checks: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ ...center, flexDirection: "column", alignItems: "flex-start", paddingLeft: 340, gap: 26 }}>
      <WordReveal text="Every draft must pass" dur={dur} gap={22} style={{ fontFamily: fonts.display, fontSize: 84, fontWeight: 600, letterSpacing: "-0.03em", color: C.text, marginBottom: 12 }} />
      {CHECKS.map((c, i) => {
        const tick = spring({ frame: frame - 20 - i * 7, fps, config: { damping: 18, stiffness: 120 } });
        return (
          <Rise key={c} dur={dur} delay={12 + i * 7} distance={24}>
            <span style={{ display: "flex", alignItems: "center", gap: 22, fontFamily: fonts.body, fontSize: 40, fontWeight: 500, color: C.text }}>
              <span style={{ width: 52, height: 52, borderRadius: 26, display: "inline-flex", alignItems: "center", justifyContent: "center", background: `rgba(74,222,128,${0.08 + 0.12 * tick})`, boxShadow: `0 0 ${tick * 24}px rgba(74,222,128,0.35)` }}>
                <DrawCheck p={tick} size={32} color={C.success} />
              </span>
              {c}
            </span>
          </Rise>
        );
      })}
    </AbsoluteFill>
  );
};

const Results: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 44 }}>
      <WordReveal text="Measured on our test set" dur={dur} gap={20} style={{ fontFamily: fonts.display, fontSize: 72, fontWeight: 600, letterSpacing: "-0.03em", color: C.text }} />
      <div style={{ display: "flex", gap: 32 }}>
        {[
          { to: 16, suffix: "/16", label: "right document in the top 4", note: "16 reworded questions, 4 in Bangla", hero: true, fill: 1 },
          { to: 0, suffix: "", label: "wrong drafts kept", note: "13 labelled questions", fill: 0 },
          { to: 8, suffix: "/10", label: "correct cited answers", note: "Qwen 3.5 4B, 10 answerable questions", fill: 0.8 },
        ].map((s, i) => {
          const bar = interpolate(frame, [18 + i * 6, 50 + i * 6], [0, s.fill], { ...clamp, easing: theme.ease.out });
          return (
            <Rise key={s.label} dur={dur} delay={12 + i * 6} style={{ ...glass, width: 470, padding: "40px 44px", display: "flex", flexDirection: "column", gap: 10 }}>
              <Counter
                to={s.to}
                delay={16 + i * 6}
                format="plain"
                suffix={s.suffix}
                style={{ fontFamily: fonts.display, fontSize: 120, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.04em", color: s.hero ? C.primary : C.text }}
              />
              <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ width: `${bar * 100}%`, height: "100%", borderRadius: 3, background: s.hero ? C.primary : C.success }} />
              </div>
              <span style={{ fontFamily: fonts.body, fontSize: 32, fontWeight: 600, color: C.text }}>{s.label}</span>
              <span style={{ fontFamily: fonts.body, fontSize: 22, color: C.textDim }}>{s.note}</span>
            </Rise>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const End: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { enter } = useEnterExit(0, dur + 100, "bouncy");
  const b = useBreathe(30, 0.01);
  const url = "bunon-ten.vercel.app";
  const typed = url.slice(0, Math.round(interpolate(frame, [30, 56], [0, url.length], clamp)));
  return (
    <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 30 }}>
      <div style={{ position: "relative", transform: `scale(${(0.7 + enter * 0.3) * b.scale})`, opacity: enter, filter: `drop-shadow(0 0 50px ${C.glow})` }}>
        <Rings size={230} color={C.primary} count={2} period={96} />
        <Logo size={170} />
      </div>
      <WordReveal text="Bunon" delay={8} dur={dur + 100} style={{ fontFamily: fonts.display, fontSize: 150, fontWeight: 600, letterSpacing: "-0.04em", color: C.text, justifyContent: "center" }} />
      <WordReveal
        text="Answer every buyer once."
        delay={16}
        dur={dur + 100}
        gap={16}
        style={{ fontFamily: fonts.display, fontSize: 60, fontStyle: "italic", color: C.textDim, justifyContent: "center" }}
        wordStyle={(i) => (i === 3 ? { color: C.primary } : {})}
      />
      <Rise dur={dur + 100} delay={28} distance={20}>
        <span style={{ ...glass, borderRadius: 999, padding: "14px 30px", fontFamily: fonts.mono, fontSize: 28, color: C.text, display: "inline-flex", minWidth: 380, justifyContent: "center" }}>
          {typed}
          <span style={{ width: 2, background: C.primary, marginLeft: 2, opacity: Math.floor(frame / 8) % 2 ? 1 : 0.2 }} />
        </span>
      </Rise>
      <Rise dur={dur + 100} delay={40} distance={16}>
        <span style={{ fontFamily: fonts.body, fontSize: 26, color: C.textDim }}>A small team in Dhaka, Bangladesh</span>
      </Rise>
    </AbsoluteFill>
  );
};

/** Picks the renderer for one line of the script. Screens get their neighbours so they can share one window. */
export const VisualFor: React.FC<{ v: Visual; dur: number; absFrom: number; joinPrev?: ScreenVisual; joinNext?: boolean }> = ({ v, dur, absFrom, joinPrev, joinNext }) => {
  switch (v.kind) {
    case "stat":
      return <Stat v={v} dur={dur} />;
    case "cards":
      return <Cards dur={dur} />;
    case "chips":
      return <Chips v={v} dur={dur} />;
    case "headline":
      return <Headline v={v} dur={dur} />;
    case "flow":
      return <Flow step={v.step} dur={dur} />;
    case "quote":
      return <Quote dur={dur} />;
    case "screen":
      return <Screen v={v} dur={dur} absFrom={absFrom} joinPrev={joinPrev} joinNext={joinNext} />;
    case "about":
      return <About dur={dur} />;
    case "audience":
      return <Audience dur={dur} />;
    case "models":
      return <Models dur={dur} />;
    case "checks":
      return <Checks dur={dur} />;
    case "results":
      return <Results dur={dur} />;
    case "end":
      return <End dur={dur} />;
  }
};
