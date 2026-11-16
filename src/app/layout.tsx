import type { Metadata, Viewport } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import StoreHydrator from "@/components/StoreHydrator";
import { LangRoot } from "@/components/Preferences";

// Dark is the default (set on <html> below). This runs before first paint and only switches to light
// for visitors who chose it, so nobody sees a flash (key shared with Preferences.tsx).
const THEME_INIT = `try{if(localStorage.getItem("bunon-theme")==="light")delete document.documentElement.dataset.theme}catch(e){}`;

export const metadata: Metadata = {
  title: "Bunon · Answer every buyer once",
  description:
    "Bunon checks a garment factory's certificates and licences, then drafts each buyer's compliance questionnaire from that verified evidence. Prototype with fictional demo data.",
};

export const viewport: Viewport = {
  themeColor: "#0A0E1A",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
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
