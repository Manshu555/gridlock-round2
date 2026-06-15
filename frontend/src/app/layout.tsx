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
    <html lang="en">
      <body>
        <Providers>
          <div className="flex">
            <Nav />
            <main className="flex-1 p-6 max-w-[1500px]">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
