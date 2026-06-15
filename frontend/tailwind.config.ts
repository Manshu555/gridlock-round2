import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cyberpunk Smart-City palette
        ink: "#05070f", // near-black background
        surface: "#0a1020", // panel base
        panel: "#0a1020",
        grid: "rgba(34,211,238,0.06)",
        neon: {
          cyan: "#22d3ee",
          magenta: "#ff2bd6",
          violet: "#a855f7",
          lime: "#adff2f",
          amber: "#fbbf24",
        },
        // semantic aliases used across components
        accent: "#22d3ee",
        hot: "#ff2bd6",
        warm: "#fbbf24",
        cool: "#adff2f",
      },
      fontFamily: {
        display: ['"Orbitron"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        "glow-cyan": "0 0 12px rgba(34,211,238,0.45), 0 0 2px rgba(34,211,238,0.6)",
        "glow-magenta": "0 0 12px rgba(255,43,214,0.45), 0 0 2px rgba(255,43,214,0.6)",
        "glow-violet": "0 0 12px rgba(168,85,247,0.4)",
        "glow-soft": "0 0 0 1px rgba(34,211,238,0.15), 0 8px 30px rgba(0,0,0,0.5)",
      },
      keyframes: {
        "pulse-glow": {
          "0%,100%": { opacity: "1", filter: "drop-shadow(0 0 6px rgba(34,211,238,0.7))" },
          "50%": { opacity: "0.75", filter: "drop-shadow(0 0 14px rgba(34,211,238,0.95))" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        flicker: {
          "0%,100%": { opacity: "1" },
          "97%": { opacity: "1" },
          "98%": { opacity: "0.6" },
          "99%": { opacity: "1" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2.6s ease-in-out infinite",
        scan: "scan 7s linear infinite",
        flicker: "flicker 4s infinite",
      },
    },
  },
  plugins: [],
};
export default config;
