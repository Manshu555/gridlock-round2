import type { Metadata } from "next";

import { Nav } from "@/components/Nav";
import { TopNav } from "@/components/TopNav";

import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SENTINEL - Hotspot Detection",
  description:
    "AI-powered parking-violation hotspots, congestion impact, forecasting, and enforcement prioritization.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground overflow-hidden h-screen w-screen flex flex-col font-sans">
        <Providers>
          <TopNav />
          <div className="flex flex-1 mt-16 h-[calc(100vh-64px)] overflow-hidden">
            <Nav />
            <main className="ml-64 flex-1 flex overflow-hidden">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
