// Page height (CSS px at 1440 wide) of each screenshot in public/shots/. Viewport shots are 900 tall; the
// full-page ones come from scripts/capture-new.mjs (targets.json, aspect × 1440).
const FULL: Record<string, number> = {
  "agents-0": 1232,
  "agents-1": 1440,
  "agents-2": 1486,
  "account-0": 1139,
  "account-1": 1159,
  pricing: 963,
};

export const PAGE_W = 1440;
export const pageHeight = (src: string) => FULL[src] ?? 900;
export const shotFile = (src: string) => `shots/${src}.png`;
