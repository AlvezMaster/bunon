import { loadFont as loadNewsreader } from "@remotion/google-fonts/Newsreader";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadBangla } from "@remotion/google-fonts/NotoSansBengali";

const bangla = loadBangla("normal", { weights: ["500", "600"], subsets: ["bengali"] }).fontFamily;

/** The site's typefaces, loaded once for every scene. Body text falls back to Noto Sans Bengali for Bangla. */
export const fonts = {
  display: loadNewsreader("normal", { weights: ["500", "600", "700"], subsets: ["latin"] }).fontFamily,
  body: `${loadJakarta("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] }).fontFamily}, ${bangla}`,
  mono: loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily,
};
