import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Visual } from "../script";
import { theme } from "../theme";
import { fonts } from "../fonts";
import { Counter, Rise, WordReveal, useBreathe, useEnterExit } from "../components/Motion";
import { BrowserShot } from "../components/BrowserShot";
import { Logo } from "../components/Logo";

const C = theme.colors;
const center: React.CSSProperties = { alignItems: "center", justifyContent: "center", paddingBottom: 110 };
const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 24,
  boxShadow: "0 2px 4px rgba(0,0,0,0.3), 0 30px 60px -24px rgba(0,0,0,0.6)",
};

// ---------------------------------------------------------------------------- small icons (SVG, theme colours)
const Icon: React.FC<{ name: "doc" | "spark" | "person" | "lock" | "store" | "check"; size?: number; color?: string }> = ({ name, size = 44, color = C.accent }) => {
  const p = { fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      {name === "doc" && <path {...p} d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6" />}
      {name === "spark" && <path {...p} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z" />}
      {name === "person" && <path {...p} d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 9.5-4.9M16 18l2 2 4-4" />}
      {name === "lock" && <path {...p} d="M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4M12 15v2" />}
      {name === "store" && <path {...p} d="M3 9l1.5-5h15L21 9M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM5 13v8h14v-8" />}
      {name === "check" && <path {...p} d="M5 12.5l4.5 4.5L19 7.5" />}
    </svg>
  );
};

// ---------------------------------------------------------------------------- kinds

const Stat: React.FC<{ v: Extract<Visual, { kind: "stat" }>; dur: number }> = ({ v, dur }) => {
  const b = useBreathe();
  return (
    <AbsoluteFill style={center}>
      <Rise dur={dur} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ transform: `scale(${b.scale})` }}>
          <Counter
            to={v.value}
            delay={6}
            format={v.format}
            prefix={v.prefix}
            suffix={v.suffix}
            style={{ fontFamily: fonts.display, fontSize: 260, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1, color: C.primary, textShadow: `0 0 80px ${C.glow}` }}
          />
        </div>
        <WordReveal text={v.label} delay={14} dur={dur} gap={14} style={{ fontFamily: fonts.body, fontSize: 48, fontWeight: 500, color: C.text, justifyContent: "center", maxWidth: 1300 }} />
      </Rise>
      {v.source && (
        <div style={{ position: "absolute", right: 72, bottom: 132 }}>
          <Rise dur={dur} delay={24} distance={16}>
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
  const exit = interpolate(frame, [dur - 11, dur - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.in });
  const n = 6;
  return (
    <AbsoluteFill style={center}>
      <div style={{ position: "relative", width: 1500, height: 560 }}>
        {Array.from({ length: n }).map((_, i) => {
          const p = spring({ frame: frame - 4 - i * 5, fps, config: theme.spring.smooth });
          const angle = (i - (n - 1) / 2) * 7;
          const x = (i - (n - 1) / 2) * 200;
          const float = Math.sin((frame + i * 9) / 26) * 4;
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
                transform: `translateY(${interpolate(p, [0, 1], [120, 0]) + float - exit * 30}px) rotate(${angle * p}deg)`,
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

const Chips: React.FC<{ v: Extract<Visual, { kind: "chips" }>; dur: number }> = ({ v, dur }) => (
  <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 54 }}>
    <WordReveal text={v.title} dur={dur} gap={22} style={{ fontFamily: fonts.display, fontSize: 92, fontWeight: 600, letterSpacing: "-0.03em", color: C.text, justifyContent: "center", maxWidth: 1500 }} />
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 20, maxWidth: 1500 }}>
      {v.items.map((item, i) => (
        <Rise key={item} delay={14 + i * 5} dur={dur} distance={30}>
          <span style={{ ...glass, display: "inline-flex", alignItems: "center", gap: 14, borderRadius: 999, padding: "18px 32px", fontFamily: fonts.body, fontSize: 38, fontWeight: 500, color: C.text }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: C.accent }} />
            {item}
          </span>
        </Rise>
      ))}
    </div>
  </AbsoluteFill>
);

const Headline: React.FC<{ v: Extract<Visual, { kind: "headline" }>; dur: number }> = ({ v, dur }) => {
  const b = useBreathe(26, 0.008);
  return (
    <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 34 }}>
      {v.logo && (
        <Rise dur={dur} distance={30}>
          <div style={{ transform: `translateY(${b.float}px)` }}>
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
            return v.hero && i >= heroFrom ? { color: C.primary, fontStyle: "italic", textShadow: `0 0 60px ${C.glow}` } : {};
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

const FLOW: Array<{ icon: "doc" | "spark" | "person" | "lock" | "store"; title: string; sub: string }> = [
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
  const exit = last ? interpolate(frame, [dur - 11, dur - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.in }) : 0;
  return (
    <AbsoluteFill style={{ ...center, opacity: 1 - exit }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {FLOW.slice(0, shown).map((n, i) => {
          // Only the newest node(s) animate; earlier ones were already on screen in the previous line.
          const isNew = i >= step - 1;
          const p = isNew ? spring({ frame: frame - 4 - (i - (step - 1)) * 6, fps, config: theme.spring.smooth }) : 1;
          const active = i === Math.min(step, FLOW.length) - 1 || (last && i === FLOW.length - 1);
          return (
            <React.Fragment key={n.title}>
              {i > 0 && (
                <div style={{ width: 44 * p, height: 2, background: `linear-gradient(90deg, ${C.textDim}, ${C.accent})`, opacity: p }} />
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
                  transform: `translateY(${interpolate(p, [0, 1], [50, 0])}px) scale(${interpolate(p, [0, 1], [0.94, 1])})`,
                  borderColor: active ? "rgba(163,177,255,0.55)" : "rgba(255,255,255,0.12)",
                }}
              >
                <Icon name={n.icon} />
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

const Quote: React.FC<{ dur: number }> = ({ dur }) => (
  <AbsoluteFill style={center}>
    <Rise dur={dur} style={{ ...glass, width: 1300, padding: "48px 56px", display: "flex", flexDirection: "column", gap: 22, background: "rgba(19,26,51,0.9)" }}>
      <span style={{ fontFamily: fonts.mono, fontSize: 18, color: C.textDim, letterSpacing: "0.1em" }}>QUESTION 8 · FROM YOUR BUYER</span>
      <span style={{ fontFamily: fonts.display, fontSize: 52, fontWeight: 600, color: C.text }}>Can workers raise grievances anonymously?</span>
      <Rise dur={dur} delay={12} distance={20}>
        <span style={{ fontFamily: fonts.body, fontSize: 44, fontWeight: 600, color: C.success }}>Yes</span>
      </Rise>
      <Rise dur={dur} delay={20} distance={20}>
        <div style={{ borderLeft: `4px solid ${C.primary}`, paddingLeft: 24, fontFamily: fonts.body, fontStyle: "italic", fontSize: 32, lineHeight: 1.45, color: C.text }}>
          “Workers can raise a grievance anonymously through a locked suggestion box on every floor or through a toll-free hotline run by an outside organisation.”
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

const Models: React.FC<{ dur: number }> = ({ dur }) => (
  <AbsoluteFill style={{ ...center, flexDirection: "row", gap: 40 }}>
    {[
      { where: "Drafting", model: "Qwen 3.5 · 4B", via: "Open model, runs locally", note: "documents can stay in the factory" },
      { where: "Search", model: "Qwen3 · 0.6B", via: "Embeddings plus keywords", note: "English and Bangla questions" },
    ].map((m, i) => (
      <Rise key={m.where} dur={dur} delay={4 + i * 6} style={{ ...glass, width: 640, padding: "44px 48px", display: "flex", flexDirection: "column", gap: 16 }}>
        <span style={{ fontFamily: fonts.mono, fontSize: 18, letterSpacing: "0.1em", color: C.accent, textTransform: "uppercase" }}>{m.where}</span>
        <span style={{ fontFamily: fonts.display, fontSize: 76, fontWeight: 600, letterSpacing: "-0.03em", color: C.text }}>{m.model}</span>
        <span style={{ fontFamily: fonts.body, fontSize: 32, fontWeight: 500, color: C.text }}>{m.via}</span>
        <span style={{ fontFamily: fonts.body, fontSize: 26, color: C.textDim }}>{m.note}</span>
      </Rise>
    ))}
  </AbsoluteFill>
);

const CHECKS = [
  "The quote appears word for word in the document",
  "A second model agrees the question can be answered",
  "A “Yes” never rests on a negative sentence",
  "A person approves before anything is sent",
];

const Checks: React.FC<{ dur: number }> = ({ dur }) => (
  <AbsoluteFill style={{ ...center, flexDirection: "column", alignItems: "flex-start", paddingLeft: 340, gap: 26 }}>
    <WordReveal text="Every draft must pass" dur={dur} gap={22} style={{ fontFamily: fonts.display, fontSize: 84, fontWeight: 600, letterSpacing: "-0.03em", color: C.text, marginBottom: 12 }} />
    {CHECKS.map((c, i) => (
      <Rise key={c} dur={dur} delay={12 + i * 6} distance={24}>
        <span style={{ display: "flex", alignItems: "center", gap: 22, fontFamily: fonts.body, fontSize: 40, fontWeight: 500, color: C.text }}>
          <span style={{ width: 52, height: 52, borderRadius: 26, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(74,222,128,0.14)" }}>
            <Icon name="check" size={32} color={C.success} />
          </span>
          {c}
        </span>
      </Rise>
    ))}
  </AbsoluteFill>
);

const Results: React.FC<{ dur: number }> = ({ dur }) => (
  <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 44 }}>
    <WordReveal text="Measured on our test set" dur={dur} gap={20} style={{ fontFamily: fonts.display, fontSize: 72, fontWeight: 600, letterSpacing: "-0.03em", color: C.text }} />
    <div style={{ display: "flex", gap: 32 }}>
      {[
        { to: 16, suffix: "/16", label: "right document in the top 4", note: "16 reworded questions, 4 in Bangla", hero: true },
        { to: 0, suffix: "", label: "wrong drafts kept", note: "13 labelled questions" },
        { to: 8, suffix: "/10", label: "correct cited answers", note: "Qwen 3.5 4B, 10 answerable questions" },
      ].map((s, i) => (
        <Rise key={s.label} dur={dur} delay={12 + i * 6} style={{ ...glass, width: 470, padding: "40px 44px", display: "flex", flexDirection: "column", gap: 10 }}>
          <Counter
            to={s.to}
            delay={16 + i * 6}
            format="plain"
            suffix={s.suffix}
            style={{ fontFamily: fonts.display, fontSize: 120, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.04em", color: s.hero ? C.primary : C.text }}
          />
          <span style={{ fontFamily: fonts.body, fontSize: 32, fontWeight: 600, color: C.text }}>{s.label}</span>
          <span style={{ fontFamily: fonts.body, fontSize: 22, color: C.textDim }}>{s.note}</span>
        </Rise>
      ))}
    </div>
  </AbsoluteFill>
);

const End: React.FC<{ dur: number }> = ({ dur }) => {
  const { enter } = useEnterExit(0, dur + 100, "bouncy");
  const b = useBreathe(30, 0.01);
  return (
    <AbsoluteFill style={{ ...center, flexDirection: "column", gap: 30 }}>
      <div style={{ transform: `scale(${(0.7 + enter * 0.3) * b.scale})`, opacity: enter, filter: `drop-shadow(0 0 50px ${C.glow})` }}>
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
      <Rise dur={dur + 100} delay={30} distance={20}>
        <span style={{ ...glass, borderRadius: 999, padding: "14px 30px", fontFamily: fonts.mono, fontSize: 28, color: C.text }}>bunon-ten.vercel.app</span>
      </Rise>
    </AbsoluteFill>
  );
};

/** Picks the renderer for one line of the script. */
export const VisualFor: React.FC<{ v: Visual; dur: number }> = ({ v, dur }) => {
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
    case "shot":
      return <BrowserShot src={v.src} url={v.url} role={v.role} focus={v.focus} zoom={v.zoom} dur={dur} />;
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
