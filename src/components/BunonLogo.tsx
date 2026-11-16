import React, { useId } from "react";

/**
 * The Bunon mark (a stylised ব), redrawn as a vector so it stays crisp at any size.
 * Its gradient comes from --logo-from / --logo-to in globals.css: deep indigo to blue on light
 * backgrounds, a lifted periwinkle on dark ones, so it keeps contrast in both themes.
 */
export default function BunonLogo({ className = "h-7 w-7", title }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="555 540 820 850"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`bunon-g-${id}`} gradientUnits="userSpaceOnUse" x1="600" y1="1380" x2="1360" y2="560">
          <stop offset="0" style={{ stopColor: "var(--logo-from)" }} />
          <stop offset="1" style={{ stopColor: "var(--logo-to)" }} />
        </linearGradient>
      </defs>
      <g fill={`url(#bunon-g-${id})`}>
        <rect x="568" y="553" width="797" height="122" rx="18" />
        <path
          fillRule="evenodd"
          d="M1113 675 L680 885 C600 925 600 1045 680 1080 C850 1140 1000 1250 1100 1365 Q1110 1378 1125 1378 L1225 1378 Q1255 1378 1255 1348 L1255 675 Z M1200 768 L775 985 C900 1040 1010 1110 1113 1197 L1113 855 Z"
        />
      </g>
    </svg>
  );
}
