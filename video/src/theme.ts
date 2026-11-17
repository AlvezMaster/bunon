// theme.ts: single source of truth for the Bunon demo video.
// Never inline colours, easings or spring configs in components.
// Palette follows the website's dark theme (src/app/globals.css in the app).
import { Easing } from "remotion";

export const theme = {
  colors: {
    bg: "#0B1020", // night canvas
    bgAlt: "#131A33", // raised surface
    primary: "#FF9A5C", // THE hero colour (terracotta accent), max one element per frame
    accent: "#A3B1FF", // brand periwinkle, secondary emphasis
    paper: "#F7F5F0", // light theme canvas, for product screenshots
    text: "#E7EAF6",
    textDim: "#9AA3C7",
    success: "#4ADE80",
    glow: "rgba(255, 154, 92, 0.35)",
  },
  fonts: {
    display: "Newsreader", // serif headlines, as on the site
    body: "Plus Jakarta Sans",
    mono: "JetBrains Mono",
    bangla: "Noto Sans Bengali",
  },
  // Linear is forbidden.
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1), // easeOutExpo: entrances
    inOut: Easing.bezier(0.83, 0, 0.17, 1), // easeInOutQuint: moves, Ken Burns
    in: Easing.bezier(0.7, 0, 0.84, 0), // exits only
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 }, // UI pops, words
    smooth: { damping: 20, stiffness: 90, mass: 1 }, // big elements
    bouncy: { damping: 11, stiffness: 170, mass: 0.7 }, // logo, playful accents
  },
} as const;
