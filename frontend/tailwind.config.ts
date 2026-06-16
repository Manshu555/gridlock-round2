import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Premium dark theme
        ink: "#0A0A0A",
        panel: "#111111",
        surface: "#161616",
        elevated: "#1a1a1a",
        accent: "#3b82f6",
        "accent-soft": "#3b82f620",
        hot: "#ef4444",
        warm: "#f59e0b",
        cool: "#22c55e",
        // Status colors
        success: "#22c55e",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      boxShadow: {
        "card": "0 2px 8px -4px rgba(0, 0, 0, 0.5), 0 4px 16px -8px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 4px 16px -8px rgba(59, 130, 246, 0.15), 0 8px 24px -12px rgba(0, 0, 0, 0.4)",
        "nav": "2px 0 16px -4px rgba(0, 0, 0, 0.5)",
        "glow-accent": "0 0 32px -8px rgba(59, 130, 246, 0.3)",
      },
      borderRadius: {
        "card": "16px",
        "nav": "20px",
      },
      backdropBlur: {
        "card": "12px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      transitionTimingFunction: {
        "premium": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
