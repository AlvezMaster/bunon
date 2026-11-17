import React from "react";
import { theme } from "../theme";

/** The Bunon mark (same paths as the website's BunonLogo), in the video's periwinkle gradient. */
export const Logo: React.FC<{ size: number }> = ({ size }) => (
  <svg viewBox="555 540 820 850" width={size} height={size * (850 / 820)} aria-hidden="true">
    <defs>
      <linearGradient id="bunon-video-logo" gradientUnits="userSpaceOnUse" x1="600" y1="1380" x2="1360" y2="560">
        <stop offset="0" stopColor="#8B97F7" />
        <stop offset="1" stopColor={theme.colors.text} />
      </linearGradient>
    </defs>
    <g fill="url(#bunon-video-logo)">
      <rect x="568" y="553" width="797" height="122" rx="18" />
      <path
        fillRule="evenodd"
        d="M1113 675 L680 885 C600 925 600 1045 680 1080 C850 1140 1000 1250 1100 1365 Q1110 1378 1125 1378 L1225 1378 Q1255 1378 1255 1348 L1255 675 Z M1200 768 L775 985 C900 1040 1010 1110 1113 1197 L1113 855 Z"
      />
    </g>
  </svg>
);
