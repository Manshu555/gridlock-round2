import type { Metadata } from "next";

import { Nav } from "@/components/Nav";

import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "GRIDLOCK // Parking Intelligence",
  description:
    "Cyberpunk smart-city command platform — AI parking-violation hotspots, congestion impact, forecasting, and enforcement prioritization.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=JetBrains+Mono:wght@400;600;700&family=Rajdhani:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <div className="flex min-h-screen">
            <Nav />
            <main className="flex-1 p-6 xl:p-8 max-w-[1600px] relative">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
