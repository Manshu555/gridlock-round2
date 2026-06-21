import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        foreground: "#FFFFFF",
        surface: "#0A0A0A",
        border: "#222222",
        muted: "#666666",
        neon: "#FF3B00",
      },
      borderRadius: {
        "DEFAULT": "0px",
        "lg": "0px",
        "xl": "0px",
        "full": "9999px" // keep full for active ping/dots
      },
      spacing: {
        "xs": "0.25rem",
        "sm": "0.5rem",
        "md": "1rem",
        "lg": "1.5rem",
        "xl": "2.5rem",
        "gutter": "1rem",
        "margin-desktop": "2rem",
      },
      fontFamily: {
        sans: ["Geist", "Inter", "sans-serif"],
        mono: ["Geist Mono", "JetBrains Mono", "monospace"],
      },
      fontSize: {
        "headline-lg": ["32px", { lineHeight: "1.2", letterSpacing: "-0.04em", fontWeight: "500" }],
        "headline-md": ["20px", { lineHeight: "1.4", letterSpacing: "-0.02em", fontWeight: "500" }],
        "headline-sm": ["16px", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "500" }],
        "body-lg": ["16px", { lineHeight: "1.6", letterSpacing: "0", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "1.5", letterSpacing: "0", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "1.4", letterSpacing: "0", fontWeight: "400" }],
        "label-md": ["12px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "600" }],
        "label-sm": ["10px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "600" }],
        "display-massive": ["42px", { lineHeight: "1", letterSpacing: "-0.05em", fontWeight: "400" }],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "ping": "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        ping: {
          "75%, 100%": { transform: "scale(2)", opacity: "0" }
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
};
export default config;
