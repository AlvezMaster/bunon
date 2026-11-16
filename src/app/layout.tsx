import type { Metadata, Viewport } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import StoreHydrator from "@/components/StoreHydrator";
import { LangRoot } from "@/components/Preferences";

// Dark is the default (set on <html> below). This runs before first paint and only switches to light
// for visitors who chose it, so nobody sees a flash (key shared with Preferences.tsx).
// Light is the default for first-time visitors; dark only when the visitor chose it before.
const THEME_INIT = `try{if(localStorage.getItem("bunon-theme")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

export const metadata: Metadata = {
  title: "Bunon · Answer every buyer once",
  description:
    "Bunon checks a garment factory's certificates and licences, then drafts each buyer's compliance questionnaire from that verified evidence. Prototype with fictional demo data.",
};

export const viewport: Viewport = {
  themeColor: "#F7F5F0",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="bg-canvas text-ink antialiased">
        {/* Drifting fog over the background painting (see .atmosphere in globals.css) */}
        <div className="atmosphere" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <StoreHydrator />
        <SmoothScroll>
          <LangRoot>{children}</LangRoot>
        </SmoothScroll>
      </body>
    </html>
  );
}
