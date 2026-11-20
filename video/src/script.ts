/**
 * The narration, one line per caption, in the five segments the AI Builders Congress guide asks for
 * (§9.2 "Vibe to Production in 180 Seconds"). This file drives both the on-screen captions and the
 * visuals, and `npm run script` turns it into VOICEOVER.md for recording.
 *
 * Every number on screen comes from research_notes/ (sources in VOICEOVER.md) or from our own tests.
 * Each segment fills its official slot exactly; inside it, lines get time in proportion to their length.
 */

export type Role = "Buyer" | "Factory" | "Visitor";

/** A label that pops out of the UI at page point (x, y), from line progress `t` until `to`. */
export interface Callout {
  t: number;
  to?: number;
  x: number;
  y: number;
  text: string;
  side?: "left" | "right" | "top" | "bottom";
}

/**
 * A product screen in a browser window. Coordinates are CSS px on the 1440-wide page (see src/shots.ts);
 * times are fractions (0–1) of the line. The camera eases between keyframes; the cursor glides and clicks;
 * `frames` swaps the screenshot (the page after a click).
 */
export interface ScreenVisual {
  kind: "screen";
  url: string;
  role: Role;
  frames: Array<[t: number, src: string, url?: string, role?: Role]>;
  cam?: Array<[t: number, x: number, y: number, zoom: number]>;
  cursor?: Array<[t: number, x: number, y: number]>;
  clicks?: number[];
  callouts?: Callout[];
  /** Dims the rest of the page and outlines this box: [t, x, y, w, h]. */
  spot?: [number, number, number, number, number];
}

export type Visual =
  | { kind: "stat"; value: number; prefix?: string; suffix?: string; format?: "int" | "plain"; label: string; source?: string }
  | { kind: "cards" }
  | { kind: "chips"; title: string; items: string[] }
  | { kind: "headline"; text: string; hero?: string; sub?: string; logo?: boolean }
  | { kind: "flow"; step: number }
  | { kind: "quote" }
  | ScreenVisual
  | { kind: "about" }
  | { kind: "audience" }
  | { kind: "models" }
  | { kind: "checks" }
  | { kind: "results" }
  | { kind: "end" };

export interface Line {
  text: string;
  visual: Visual;
}

export interface Segment {
  id: string;
  label: string;
  seconds: number;
  lines: Line[];
}

export const FPS = 30;

const APP = "bunon-ten.vercel.app";

export const SEGMENTS: Segment[] = [
  {
    id: "problem",
    label: "Problem",
    seconds: 30,
    lines: [
      // About us: who is speaking, before the problem.
      { text: "We're Bunon, a small team in Dhaka, Bangladesh.", visual: { kind: "about" } },
      {
        text: "Bangladesh has about 3,555 export garment factories and three million workers.",
        visual: { kind: "stat", value: 3555, format: "int", label: "export garment factories in Bangladesh", source: "Mapped in Bangladesh, Dec 2024" },
      },
      { text: "Every brand sends its own compliance questionnaire.", visual: { kind: "cards" } },
      {
        text: "One questionnaire alone has 871 questions.",
        visual: { kind: "stat", value: 871, format: "int", label: "questions in one industry questionnaire", source: "SLCP converged assessment, v1.7.1" },
      },
      {
        text: "Most ask the same things: fire safety, wages, child labour.",
        visual: { kind: "chips", title: "The same questions, again and again", items: ["Fire safety", "Wages", "Working hours", "Child labour", "Grievances", "Building safety"] },
      },
      {
        text: "45 percent of surveyed factories spend 5,000 to 20,000 dollars a year on audits.",
        visual: { kind: "stat", value: 45, suffix: "%", format: "plain", label: "of facilities pay $5,000–20,000 a year on audits", source: "WRAP survey, 2023" },
      },
      {
        text: "And new EU rules will bring even more questions.",
        visual: { kind: "chips", title: "And the EU is asking for more", items: ["Due diligence", "Digital Product Passport", "Supplier evidence"] },
      },
    ],
  },
  {
    id: "solution",
    label: "Solution",
    seconds: 30,
    lines: [
      { text: "Bunon lets a factory answer every buyer once.", visual: { kind: "headline", text: "Answer every buyer", hero: "once.", logo: true } },
      // Who it's for: both sides, as on the website's About page.
      { text: "It's built for garment factories, and for the brands that buy from them.", visual: { kind: "audience" } },
      { text: "The factory uploads its documents once: licences, policies, reports.", visual: { kind: "flow", step: 1 } },
      { text: "AI drafts each answer, quoting the exact sentence it used.", visual: { kind: "flow", step: 2 } },
      { text: "A person checks every answer before a buyer sees it.", visual: { kind: "flow", step: 3 } },
      { text: "Approved answers are sealed in a tamper-evident ledger.", visual: { kind: "flow", step: 4 } },
      { text: "So every answer can be traced back to its source sentence.", visual: { kind: "quote" } },
      {
        text: "Bunon checks documents. It does not certify factories.",
        visual: { kind: "headline", text: "Bunon checks documents.", sub: "It does not certify factories." },
      },
    ],
  },
  {
    id: "demo",
    label: "Demo",
    seconds: 60,
    lines: [
      {
        text: "A buyer writes one questionnaire and sends it to all of its factories at once.",
        visual: {
          kind: "screen", url: `${APP}/buyer/questions/new`, role: "Buyer", frames: [[0, "buyer-new"]],
          cam: [[0, 720, 450, 1], [0.3, 720, 330, 1.18], [0.62, 760, 600, 1.12], [1, 900, 760, 1.22]],
          cursor: [[0.12, 1100, 520], [0.34, 960, 280], [0.8, 965, 847]], clicks: [0.86],
          callouts: [{ t: 0.2, to: 0.6, x: 720, y: 243, text: "All its factories at once", side: "top" }],
        },
      },
      {
        text: "Each factory finds it in its inbox, with its own documents already on file.",
        visual: {
          kind: "screen", url: `${APP}/factory/questionnaire`, role: "Factory", frames: [[0, "factory-inbox"]],
          cam: [[0, 720, 420, 1.05], [0.5, 720, 300, 1.22], [1, 760, 300, 1.26]],
          cursor: [[0.15, 1000, 640], [0.4, 908, 190], [0.75, 1060, 302]], clicks: [0.84],
          callouts: [{ t: 0.3, to: 0.72, x: 988, y: 189, text: "Its own documents, on file", side: "right" }],
        },
      },
      {
        text: "One click drafts every answer, and each draft quotes its source sentence.",
        visual: {
          kind: "screen", url: `${APP}/factory/questionnaire/nordlys-2026`, role: "Factory", frames: [[0, "factory-drafts"]],
          cam: [[0, 760, 300, 1.12], [1, 716, 260, 1.3]],
          spot: [0.12, 310, 184, 813, 86],
          callouts: [{ t: 0.35, x: 1100, y: 270, text: "Quotes its source sentence", side: "bottom" }],
        },
      },
      {
        text: "When a draft doesn't hold up, Bunon never guesses. It hands the question to a person.",
        visual: {
          kind: "screen", url: `${APP}/factory/questionnaire/nordlys-2026`, role: "Factory", frames: [[0, "factory-needs-person"]],
          cam: [[0, 716, 300, 1.25], [1, 716, 380, 1.3]],
          spot: [0.1, 310, 317, 813, 97],
          callouts: [{ t: 0.4, x: 1100, y: 414, text: "Sent to a person", side: "bottom" }],
        },
      },
      {
        text: "The factory approves and sends, and the answer is sealed in the ledger.",
        visual: {
          kind: "screen", url: `${APP}/ledger`, role: "Factory", frames: [[0, "ledger"]],
          cam: [[0, 720, 450, 1.02], [0.45, 640, 430, 1.16], [1, 720, 480, 1.24]],
          spot: [0.45, 168, 479, 1103, 88],
          callouts: [{ t: 0.22, x: 407, y: 383, text: "Every entry checked", side: "right" }],
        },
      },
      {
        // Answer memory (src/lib/answer-reuse.ts): Vela's v03 reuses Nodiwear's approved answer to Nordlys's q10.
        text: "When another buyer asks the same thing in other words, the earlier answer is ready to check.",
        visual: {
          kind: "screen", url: `${APP}/factory/questionnaire/vela-2026`, role: "Factory", frames: [[0, "factory-reuse"]],
          cam: [[0, 720, 450, 1.05], [1, 716, 640, 1.22]],
          spot: [0.12, 310, 619, 813, 216],
          callouts: [{ t: 0.35, x: 900, y: 619, text: "Ready from an earlier answer", side: "top" }],
        },
      },
      {
        // Factory MCP connector (src/lib/server/factory-mcp.ts): an agent prepares, a person sends.
        text: "A factory can also connect its own AI agent: it prepares answers, and a person checks and sends them.",
        visual: {
          kind: "screen", url: `${APP}/factory/questionnaire/nordlys-2026`, role: "Factory", frames: [[0, "factory-agent"]],
          cam: [[0, 716, 640, 1.18], [1, 716, 660, 1.26]],
          spot: [0.1, 310, 607, 813, 225],
          callouts: [{ t: 0.3, x: 900, y: 607, text: "Prepared by the factory's AI agent", side: "top" }],
        },
      },
      {
        // The 3-step setup on /factory/agents; "Test connection" calls the MCP endpoint with the new token.
        text: "Setting it up takes three steps, and one click tests the connection.",
        visual: {
          kind: "screen", url: `${APP}/factory/agents`, role: "Factory",
          frames: [[0, "agents-0"], [0.32, "agents-1"], [0.64, "agents-2"]],
          cam: [[0, 720, 520, 1.08], [0.28, 820, 400, 1.22], [0.36, 820, 420, 1.22], [0.55, 800, 900, 1.16], [1, 760, 960, 1.2]],
          cursor: [[0.04, 640, 600], [0.24, 975, 332], [0.4, 975, 345], [0.56, 965, 1026]], clicks: [0.28, 0.61],
          spot: [0.68, 437, 1063, 618, 46],
          callouts: [{ t: 0.36, to: 0.6, x: 1042, y: 381, text: "Token made", side: "right" }, { t: 0.72, x: 1055, y: 1086, text: "Tested for real", side: "right" }],
        },
      },
      {
        text: "The buyer sees every factory's answer side by side, with the source of each one.",
        visual: {
          kind: "screen", url: `${APP}/buyer/questions/nordlys-2026`, role: "Buyer", frames: [[0, "buyer-compare"]],
          cam: [[0, 720, 450, 1.02], [0.45, 660, 260, 1.3], [1, 660, 250, 1.34]],
          cursor: [[0.12, 900, 600], [0.5, 640, 270]],
          callouts: [{ t: 0.28, x: 605, y: 235, text: "The source sentence", side: "right" }, { t: 0.6, x: 736, y: 278, text: "Sealed in the ledger", side: "bottom" }],
        },
      },
      {
        // The new dashboards (src/app/factory/page.tsx, src/app/buyer/page.tsx): one "Next up" card each.
        text: "Each home screen shows only the next job, with one big button.",
        visual: {
          kind: "screen", url: `${APP}/factory`, role: "Factory",
          frames: [[0, "dash-factory"], [0.52, "dash-buyer", `${APP}/buyer`, "Buyer"]],
          cam: [[0, 720, 450, 1], [0.3, 760, 300, 1.18], [0.5, 760, 300, 1.18], [0.6, 720, 450, 1.02], [0.85, 760, 300, 1.18], [1, 760, 300, 1.2]],
          cursor: [[0.1, 1250, 640], [0.3, 1150, 272], [0.62, 1250, 520], [0.85, 1140, 272]],
          callouts: [{ t: 0.24, to: 0.5, x: 1148, y: 294, text: "One big button", side: "bottom" }, { t: 0.78, x: 1137, y: 294, text: "Buyers get one too", side: "bottom" }],
        },
      },
      {
        // The Bangla screen covers the guide's mandatory Bangla/localisation item.
        text: "Factory staff can switch the whole workspace to Bangla with one click.",
        visual: {
          kind: "screen", url: `${APP}/factory`, role: "Factory", frames: [[0, "dash-factory"], [0.42, "dash-factory-bn"]],
          cam: [[0, 990, 140, 1.55], [0.42, 990, 140, 1.55], [1, 720, 420, 1.06]],
          cursor: [[0, 1150, 260], [0.32, 981, 28]], clicks: [0.38],
          callouts: [{ t: 0.55, x: 720, y: 436, text: "বাংলা, with one click", side: "bottom" }],
        },
      },
      {
        text: "Either side can unlink, with a 12-hour undo and 30 days to download its data.",
        visual: {
          kind: "screen", url: `${APP}/buyer/factories`, role: "Buyer", frames: [[0, "buyer-factories"]],
          cam: [[0, 720, 450, 1.02], [1, 720, 380, 1.16]],
        },
      },
      {
        // The Compliance Action Plan (src/app/factory/action-plan/page.tsx), with its labelled demo rule change.
        text: "And when a rule changes, the Compliance Action Plan shows what it affects and drafts the fixes.",
        visual: {
          kind: "screen", url: `${APP}/factory/action-plan`, role: "Factory", frames: [[0, "action-plan-0"], [0.45, "action-plan-1"]],
          cam: [[0, 720, 450, 1.05], [0.35, 600, 600, 1.15], [0.6, 720, 900, 1.1], [0.8, 720, 1196, 1.12], [1, 720, 1450, 1.12]],
          cursor: [[0.1, 1000, 420], [0.36, 429, 644]], clicks: [0.4],
          callouts: [{ t: 0.62, to: 0.8, x: 720, y: 1090, text: "Policy redrafted", side: "top" }, { t: 0.84, x: 720, y: 1400, text: "Fixes for a person to approve", side: "top" }],
        },
      },
    ],
  },
  {
    id: "ai",
    label: "AI approach",
    seconds: 30,
    lines: [
      {
        text: "Drafts are personal: hybrid search covers only that factory's documents, in English and Bangla.",
        visual: {
          kind: "screen", url: `${APP}/factory/documents`, role: "Factory", frames: [[0, "documents-search"]],
          cam: [[0, 720, 450, 1.02], [1, 716, 455, 1.14]],
          spot: [0.12, 310, 216, 813, 477],
          callouts: [{ t: 0.35, x: 900, y: 216, text: "A Bangla question finds the right document", side: "top" }],
        },
      },
      { text: "Qwen, an open-source AI model, drafts the answer, and it can run on the factory's own computer.", visual: { kind: "models" } },
      { text: "Then the checks: the quote must exist word for word, and a second model must agree.", visual: { kind: "checks" } },
      { text: "On our test set, the right document came back in the top four for 16 of 16 questions, with zero wrong answers kept.", visual: { kind: "results" } },
    ],
  },
  {
    id: "impact",
    label: "Impact & next step",
    seconds: 30,
    lines: [
      { text: "Factories answer each question once, not once per brand.", visual: { kind: "headline", text: "Once,", hero: "not once per brand." } },
      {
        // Measured locally with Qwen 3.5 4B (README: about 2.7 s per draft on average).
        text: "An AI draft takes about three seconds, with its source.",
        visual: { kind: "stat", value: 3, prefix: "~", format: "plain", label: "seconds per AI draft, source included", source: "Our test, local Qwen 3.5 4B, Nov 2026" },
      },
      {
        text: "Pilots will measure hours saved, answers with a source, and buyer follow-ups.",
        visual: { kind: "chips", title: "What pilots will measure", items: ["Hours saved per questionnaire", "Answers with a source", "Buyer follow-up questions"] },
      },
      {
        // Prices from src/lib/plans.ts in the app (Starter, Pro, Enterprise); buyers never pay. Shown on the real pricing page.
        text: "Factories pay one plan for every brand: a free first month, then 3,500 taka, or 7,500 for Pro. Buyers join free.",
        visual: {
          kind: "screen", url: `${APP}/pricing`, role: "Visitor", frames: [[0, "pricing"]],
          cam: [[0, 720, 470, 1.02], [0.2, 400, 560, 1.4], [0.45, 720, 560, 1.4], [0.68, 1040, 560, 1.4], [1, 720, 500, 1.06]],
          callouts: [
            { t: 0.14, to: 0.4, x: 344, y: 365, text: "First month free, then ৳3,500", side: "top" },
            { t: 0.42, to: 0.64, x: 720, y: 365, text: "Pro ৳7,500, with AI agents", side: "top" },
            { t: 0.66, to: 0.84, x: 1096, y: 365, text: "Enterprise: a custom quote", side: "top" },
            { t: 0.86, x: 720, y: 300, text: "Buyers: always free", side: "top" },
          ],
        },
      },
      {
        // Planned, not built: said as "Next" so nothing unbuilt is shown as working.
        text: "Next: factory pilots, register checks, iOS and Android apps, and the full SLCP question set.",
        visual: { kind: "chips", title: "Next", items: ["Pilots with Bangladeshi factories", "Official register checks", "iOS and Android apps", "Full SLCP question set"] },
      },
      { text: "Bunon. Answer every buyer once.", visual: { kind: "end" } },
    ],
  },
];

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Recorded voice clips (src/vo.generated.ts, written by `npm run vo`): line index → file and length. */
export type VoClips = Record<number, { file: string; seconds: number }>;
/** The voice starts this long after its line appears, and gets this much quiet after it. */
export const VO_LEAD_S = 0.15;
export const VO_TAIL_S = 0.25;
/** A part whose voice runs long is played up to this much faster (Remotion keeps the pitch). */
export const VO_MAX_RATE = 1.15;

export interface TimedLine extends Line {
  segment: number;
  from: number;
  duration: number;
  /** Voice playback speed for this line (1 = as recorded). */
  rate: number;
}

/**
 * Frame timings: segments back to back, each exactly its official length. Inside a segment, lines get time in
 * proportion to their recorded clip length when every line of the segment has a clip, else to their word count.
 */
export function timeline(fps = FPS, vo: VoClips = {}): { lines: TimedLine[]; segments: Array<{ label: string; from: number; duration: number }>; total: number } {
  const lines: TimedLine[] = [];
  const segments: Array<{ label: string; from: number; duration: number }> = [];
  let at = 0;
  let index = 0;
  SEGMENTS.forEach((seg, s) => {
    const total = Math.round(seg.seconds * fps);
    const first = index;
    index += seg.lines.length;
    const voiced = seg.lines.every((_, i) => vo[first + i]);
    const need = voiced ? seg.lines.reduce((t, _, i) => t + vo[first + i].seconds + VO_LEAD_S + VO_TAIL_S, 0) : 0;
    const rate = need > seg.seconds ? Math.min(VO_MAX_RATE, need / seg.seconds) : 1;
    const weights = seg.lines.map((l, i) => (voiced ? vo[first + i].seconds / rate + VO_LEAD_S + VO_TAIL_S : words(l.text) + 4)); // +4: a little breathing room per line
    const sum = weights.reduce((a, b) => a + b, 0);
    let used = 0;
    seg.lines.forEach((l, i) => {
      const duration = i === seg.lines.length - 1 ? total - used : Math.round((weights[i] / sum) * total);
      lines.push({ ...l, segment: s, from: at + used, duration, rate });
      used += duration;
    });
    segments.push({ label: seg.label, from: at, duration: total });
    at += total;
  });
  return { lines, segments, total: at };
}
