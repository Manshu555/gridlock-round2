import type { Metadata } from "next";

import { Nav } from "@/components/Nav";

import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Gridlock — Parking Intelligence",
  description:
    "AI-powered parking-violation hotspots, congestion impact, forecasting, and enforcement prioritization.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        <Providers>
          <div className="flex min-h-screen">
            <Nav />
            <main className="flex-1 p-8 max-w-[1600px] mx-auto">
              <div className="animate-fade-in">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
