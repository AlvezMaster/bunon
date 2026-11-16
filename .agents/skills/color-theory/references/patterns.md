# Color Patterns & Construction Reference

## 1. Perceptually Uniform Color Spaces (OKLCH)
Traditional HSL and RGB color spaces distort human perceptual lightness: pure yellow (`hsl(60, 100%, 50%)`) appears vastly brighter than pure blue (`hsl(240, 100%, 50%)`), despite having identical numerical lightness (50%).
- **Rule:** Use OKLCH (`oklch(L C H)`) for programmatic palette generation, elevation steps, and harmonious scales.
- `L` (Perceptual Lightness, 0.0 to 1.0): Perceived brightness remains constant across all hues.
- `C` (Chroma, 0.0 to ~0.37): Purity/saturation. Keep neutral surfaces below `0.02` chroma.
- `H` (Hue angle, 0 to 360 deg): Natural color spectrum.

## 2. 60-30-10 Spatial Proportion Law
- **60% Dominant Base:** Void / background canvas (`L: 0.05-0.12` in dark mode, `L: 0.95-0.99` in light mode).
- **30% Structural Secondary:** Card surfaces, navigation bars, structural dividers, containers.
- **10% Kinetic Accent:** Call-to-action buttons, active toggles, critical cryptographic hashes, key alerts.

## 3. Dark Mode Elevation & Atmospheric Lighting
- Never use pure pitch black `#000000` as the canvas; it causes OLED smearing and excessive eye strain against bright text. Use deep tinted voids (e.g., `#0B0F0D` or `oklch(0.12 0.01 150)`).
- As elevation increases (Canvas → Card Surface 1 → Modal Surface 2 → Popover Surface 3), increase perceptual lightness `L` by 4% to 8% per step, or layer subtle translucent white highlights (`rgba(255, 255, 255, 0.04-0.12)`).
- Reduce chroma in dark mode: saturated colors that look vibrant on white screens vibrate violently and cause chromostereopsis against dark backgrounds. Lower chroma by 15-25%.

## 4. Albers' Simultaneous Contrast & Neighbor Interaction
From Josef Albers' *Interaction of Color*: "One and the same color evokes innumerable readings."
- A light neutral placed on a deep moss green background will optically absorb the green's complement, appearing slightly magenta/warm.
- To maintain neutral warmth, tint neutrals with 1-3% of the background hue family rather than using dead gray (`#808080`).

## 5. Semantic Design Tokens Architecture
- **Canvas / Surfaces:** `--bg-void`, `--bg-surface-1`, `--bg-surface-2`, `--bg-surface-elevated`
- **Text & Foreground:** `--text-primary` (high contrast, >7:1), `--text-secondary` (metadata, >4.5:1), `--text-muted` (structural, >3:1)
- **Borders & Grid:** `--border-subtle`, `--border-structural`, `--border-focus`
- **Intents:** `--intent-success` (emerald/verified), `--intent-warning` (amber/drift), `--intent-danger` (crimson/conflict), `--intent-accent` (signature brand)
