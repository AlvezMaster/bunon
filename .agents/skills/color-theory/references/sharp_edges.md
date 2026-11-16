# Sharp Edges & Color Pitfalls Reference

## 1. The Pure Hex `#000000` & `#FFFFFF` Trap
- **The Issue:** Pairing pure `#000000` background with pure `#FFFFFF` text yields a 21:1 contrast ratio that induces optical halation (blooming around letterforms) for astigmatic users and causes scrolling black-smear on OLED displays.
- **Remedy:** Use warm bone white (`#F2F0EC` or `#D9C7A3`) against deep charcoal/moss/obsidian (`#0B0F0D` or `#0C0D0E`).

## 2. Chromostereopsis (Visual Vibration)
- **The Issue:** Pairing high-chroma red and blue, or neon cyan on dark red, forces the human eye's lens to rapidly adjust focus between different wavelengths, causing intense eye strain and vibrating edges.
- **Remedy:** Keep accents separated by at least 60 degrees of hue, or desaturate one of the two competing colors significantly.

## 3. Color-Only Status Encoding (Accessibility Failure)
- **The Issue:** 8% of males and 0.5% of females have Red-Green color deficiency (Deuteranopia/Protanopia). A red circle and green circle appear virtually indistinguishable.
- **Remedy:** Every semantic state MUST pair color with redundant cues: an icon (check vs exclamation), explicit text label, or distinct geometric shape.

## 4. The Naive Dark Mode Inversion Disaster
- **The Issue:** Inverting a light theme simply flips hex codes, creating oversaturated neon colors on muddy gray backgrounds that destroy visual hierarchy.
- **Remedy:** Design dark mode from the ground up: reverse the lightness scale, decrease chroma, increase font weight slightly (light text on dark appears optically thinner), and rely on surface elevation rather than heavy drop shadows.

## 5. Border Contrast Disappearance
- **The Issue:** Low-opacity white borders (`rgba(255, 255, 255, 0.05)`) look crisp on 100% brightness Apple Retina displays, but completely disappear on sub-300 nit TN/IPS office monitors.
- **Remedy:** Maintain a minimum 1.5:1 boundary contrast for interactive containers, or supplement with subtle tactile inset highlights.
