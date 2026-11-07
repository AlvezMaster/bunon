import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bunon (বুনন) — On-Premises Compliance Shield & DPP Forge",
  description: "Autonomous Digital Product Passport factory and compliance fraud shield for Bangladesh's $38.7B RMG export machine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090c15] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
