import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0f1a",
        panel: "#121826",
        accent: "#38bdf8",
        hot: "#ef4444",
        warm: "#f59e0b",
        cool: "#22c55e",
      },
    },
  },
  plugins: [],
};
export default config;
