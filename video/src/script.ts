/**
 * The narration, one line per caption, in the five segments the AI Builders Congress guide asks for
 * (§9.2 "Vibe to Production in 180 Seconds"). This file drives both the on-screen captions and the
 * visuals, and `npm run script` turns it into VOICEOVER.md for recording.
 *
 * Every number on screen comes from research_notes/ (sources in VOICEOVER.md) or from our own tests.
 * Each segment fills its official slot exactly; inside it, lines get time in proportion to their length.
 */

export type Visual =
  | { kind: "stat"; value: number; prefix?: string; suffix?: string; format?: "int" | "plain"; label: string; source?: string }
  | { kind: "cards" }
  | { kind: "chips"; title: string; items: string[] }
  | { kind: "headline"; text: string; hero?: string; sub?: string; logo?: boolean }
  | { kind: "flow"; step: number }
  | { kind: "quote" }
  | { kind: "shot"; src: string; url: string; role: "Buyer" | "Factory"; focus?: [number, number, number, number]; zoom?: "in" | "out" }
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

export const SEGMENTS: Segment[] = [
  {
    id: "problem",
    label: "Problem",
    seconds: 30,
    lines: [
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
        visual: { kind: "shot", src: "shots/buyer-new.png", url: "bunon-ten.vercel.app/buyer/questions/new", role: "Buyer", zoom: "in" },
      },
      {
        text: "Each factory finds it in its inbox, with its own documents already on file.",
        visual: { kind: "shot", src: "shots/factory-inbox.png", url: "bunon-ten.vercel.app/factory/questionnaire", role: "Factory", zoom: "out" },
      },
      {
        text: "One click drafts every answer, and each draft quotes its source sentence.",
        visual: { kind: "shot", src: "shots/factory-drafts.png", url: "bunon-ten.vercel.app/factory/questionnaire/nordlys-2026", role: "Factory", focus: [0.215, 0.205, 0.565, 0.095], zoom: "in" },
      },
      {
        text: "When a draft doesn't hold up, Bunon never guesses. It hands the question to a person.",
        visual: { kind: "shot", src: "shots/factory-needs-person.png", url: "bunon-ten.vercel.app/factory/questionnaire/nordlys-2026", role: "Factory", focus: [0.215, 0.352, 0.565, 0.108], zoom: "out" },
      },
      {
        text: "The factory approves and sends, and the answer is sealed in the ledger.",
        visual: { kind: "shot", src: "shots/ledger.png", url: "bunon-ten.vercel.app/ledger", role: "Factory", zoom: "in" },
      },
      {
        // Answer memory (src/lib/answer-reuse.ts): Vela's v03 reuses Nodiwear's approved answer to Nordlys's q10.
        text: "When another buyer asks the same thing in other words, the earlier answer is ready to check.",
        visual: { kind: "shot", src: "shots/factory-reuse.png", url: "bunon-ten.vercel.app/factory/questionnaire/vela-2026", role: "Factory", focus: [0.215, 0.688, 0.565, 0.24], zoom: "out" },
      },
      {
        // Factory MCP connector (src/lib/server/factory-mcp.ts): an agent prepares, a person sends.
        text: "A factory can also connect its own AI agent: it prepares answers, and a person checks and sends them.",
        visual: { kind: "shot", src: "shots/factory-agent.png", url: "bunon-ten.vercel.app/factory/questionnaire/nordlys-2026", role: "Factory", focus: [0.215, 0.675, 0.565, 0.25], zoom: "in" },
      },
      {
        text: "The buyer sees every factory's answer side by side, with the source of each one.",
        visual: { kind: "shot", src: "shots/buyer-compare.png", url: "bunon-ten.vercel.app/buyer/questions/nordlys-2026", role: "Buyer", zoom: "out" },
      },
      {
        // The Bangla screen covers the guide's mandatory Bangla/localisation item.
        text: "Factory staff can switch the whole workspace to Bangla with one click.",
        visual: { kind: "shot", src: "shots/factory-bangla.png", url: "bunon-ten.vercel.app/factory", role: "Factory", zoom: "in" },
      },
      {
        text: "Either side can unlink, with a 12-hour undo and 30 days to download its data.",
        visual: { kind: "shot", src: "shots/buyer-factories.png", url: "bunon-ten.vercel.app/buyer/factories", role: "Buyer", zoom: "out" },
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
        visual: { kind: "shot", src: "shots/documents-search.png", url: "bunon-ten.vercel.app/factory/documents", role: "Factory", focus: [0.215, 0.24, 0.565, 0.53], zoom: "in" },
      },
      { text: "Qwen, an open AI model, drafts the answer, and it can run on the factory's own computer.", visual: { kind: "models" } },
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
        // Prices from src/lib/plans.ts in the app (Starter, Pro, Enterprise); buyers never pay.
        text: "Factories pay one plan for every brand: a free first month, then 3,500 taka, or 7,500 for Pro. Buyers join free.",
        visual: { kind: "chips", title: "Who pays", items: ["Starter: 1 month free, then ৳3,500/month", "Pro: ৳7,500/month", "Enterprise: custom quote", "Buyers: always free"] },
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
