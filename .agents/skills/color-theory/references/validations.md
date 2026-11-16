# Color Validation & Audit Standards

## 1. Contrast Thresholds (WCAG 2.1 & APCA)
- **Primary Body Text (<18px / <14px bold):** Minimum `4.5:1` contrast ratio (WCAG AA). Recommended `7:1` (WCAG AAA) for mission-critical audit tables and technical metrics.
- **Large Text (>=18px regular or >=14px bold):** Minimum `3:1` contrast ratio.
- **UI Components & Graphical Objects:** Interactive buttons, input boundaries, and focus rings require minimum `3:1` contrast against adjacent background.
- **APCA (Advanced Perceptual Contrast Algorithm):** Target Lc 60 for secondary text, Lc 75 for body copy, Lc 90 for fluent reading.

## 2. Grayscale Hierarchy Test
Convert the interface to 100% grayscale (`filter: grayscale(1)`):
- Does the focal point remain immediately obvious?
- Can you clearly distinguish primary buttons from secondary buttons?
- Are table rows and card elevations distinct without relying on color hue?
- If the hierarchy breaks in monochrome, the value/lightness structure is flawed.

## 3. Color Deficiency Simulation Checklist
Validate every screen under simulated conditions:
- **Protanopia (Red-blind):** Verify conflict states don't blend with neutral dark tones.
- **Deuteranopia (Green-blind):** Verify verified status doesn't match amber warning.
- **Tritanopia (Blue-blind):** Verify blues and greens remain identifiable.
- **Achromatopsia (Total color blindness):** Verify icons and typography carry the state.

## 4. Token Constraint Rules
- Zero arbitrary inline color hex codes (`#123456`) in component JSX.
- Every color reference must resolve to a semantic token defined in the design system.
