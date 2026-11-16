"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAnimate, useReducedMotion } from "framer-motion";

type Props = React.ComponentProps<typeof Link> & { href: string; label: string };

/** "#131A33" + 0.4 → "rgba(19, 26, 51, 0.4)" */
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(n)) return `rgba(20, 24, 40, ${alpha})`;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * A link that turns into a page transition: the whole page dims and blurs, a translucent glass pill
 * in the theme's colours lifts off the button, glides to the centre and bursts open to fill the
 * screen, then hands over to the next page. Springs give the move a slight overshoot and the fill an
 * elastic settle. Modified clicks and reduced-motion visitors get a plain link.
 */
export default function MorphLink({ href, label, onClick, children, ...rest }: Props) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [origin, setOrigin] = useState<{ rect: DOMRect; radius: string } | null>(null);
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const backdrop = useRef<HTMLDivElement>(null);
  const running = useRef(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (running.current) return;
    if (reduce) {
      router.push(href);
      return;
    }
    running.current = true;
    router.prefetch(href);
    const el = e.currentTarget;
    setOrigin({ rect: el.getBoundingClientRect(), radius: getComputedStyle(el).borderRadius || "6px" });
  };

  useEffect(() => {
    const pill = scope.current;
    const veil = backdrop.current;
    if (!origin || !pill || !veil) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // A centred frame covering p of the screen.
    const frame = (p: number) => ({ left: (vw * (1 - p)) / 2, top: (vh * (1 - p)) / 2, width: vw * p, height: vh * p });
    const at70 = frame(0.7);
    const at95 = frame(0.95);
    const css = getComputedStyle(document.documentElement);
    const canvas = css.getPropertyValue("--color-canvas").trim() || "#0B1020";
    const surface = css.getPropertyValue("--color-surface").trim() || "#131A33";
    const label = pill.querySelector<HTMLElement>("[data-morph-label]");
    let cancelled = false;
    // Safety net: if animation frames are paused (background tab), still go to the page.
    const fallback = window.setTimeout(() => {
      if (!cancelled) router.push(href);
    }, 1500);

    // One continuous move, timed in three beats over 0.9 s:
    //   A (0–55%)   travel to the centre while growing to 70% of the screen, with a small elastic overshoot;
    //   B (55–92%)  keep growing, 70% → 95%, easing in and out;
    //   C (92–100%) snap the last 5% super fast on an exponential curve.
    const DURATION = 0.9;
    const TIMES = [0, 0.55, 0.92, 1];
    const EASE: Array<[number, number, number, number]> = [
      [0.34, 1.28, 0.64, 1], // A: ease-out with overshoot (elastic)
      [0.45, 0, 0.55, 1], // B: smooth in-out
      [0.95, 0.05, 0.795, 0.035], // C: exponential ease-in
    ];

    (async () => {
      // The page behind dims and goes out of focus while the pill travels.
      void animate(veil, { opacity: 1 }, { duration: 0.45, ease: [0.23, 1, 0.32, 1] });
      // A little motion blur while it moves fastest.
      void animate(pill, { filter: ["blur(0px)", "blur(3px)", "blur(0px)", "blur(0px)"] }, { duration: DURATION, times: [0, 0.25, 0.55, 1] });
      // The label is only there at lift-off; it fades as the pill grows.
      if (label) void animate(label, { opacity: [1, 1, 0], scale: [1, 1.04, 0.9] }, { duration: DURATION * 0.55, times: [0, 0.3, 1] });
      // The glass turns into the next page's background as it fills the screen.
      void animate(pill, { backgroundColor: [withAlpha(surface, 0.35), withAlpha(surface, 0.6), canvas] }, { duration: DURATION, times: [0, 0.55, 1] });
      await animate(
        pill,
        {
          left: [origin.rect.left, at70.left, at95.left, 0],
          top: [origin.rect.top, at70.top, at95.top, 0],
          width: [origin.rect.width, at70.width, at95.width, vw],
          height: [origin.rect.height, at70.height, at95.height, vh],
          borderRadius: [origin.radius, "28px", "16px", "0px"],
        },
        { duration: DURATION, times: TIMES, ease: EASE }
      );
      window.clearTimeout(fallback);
      if (!cancelled) router.push(href);
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, [origin, animate, scope, router, href]);

  const surface =
    typeof window !== "undefined" ? getComputedStyle(document.documentElement).getPropertyValue("--color-surface").trim() || "#131A33" : "#131A33";

  return (
    <>
      <Link href={href} onClick={handleClick} {...rest}>
        {children}
      </Link>
      {origin &&
        createPortal(
          <>
            {/* The whole page dims and blurs */}
            <div
              ref={backdrop}
              aria-hidden="true"
              className="bg-ink/25 dark:bg-black/45"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 99,
                opacity: 0,
                backdropFilter: "blur(14px) saturate(120%)",
                WebkitBackdropFilter: "blur(14px) saturate(120%)",
                pointerEvents: "none",
              }}
            />
            {/* The translucent glass pill, in the theme's own colours */}
            <div
              ref={scope}
              aria-hidden="true"
              className="border border-ink/15"
              style={{
                position: "fixed",
                left: origin.rect.left,
                top: origin.rect.top,
                width: origin.rect.width,
                height: origin.rect.height,
                borderRadius: origin.radius,
                zIndex: 100,
                backgroundColor: withAlpha(surface, 0.35),
                backdropFilter: "blur(20px) saturate(150%)",
                WebkitBackdropFilter: "blur(20px) saturate(150%)",
                boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 24px 60px -20px rgba(0, 0, 0, 0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                pointerEvents: "none",
              }}
            >
              <span data-morph-label className="whitespace-nowrap text-[15px] font-semibold text-ink">
                {label}
              </span>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
