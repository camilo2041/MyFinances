import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f5f4f9",
        surface: "#ffffff",
        ink: "#1c1b2e",
        "ink-soft": "#55536e",
        "ink-mute": "#918fa8",
        line: "#e6e4ef",
        "line-soft": "#f0eef6",
        navy: {
          DEFAULT: "#201d3d",
          dark: "#17142e",
          mid: "#4b4680",
        },
        indigo: {
          50: "#eef1ff",
          100: "#e0e4ff",
          200: "#c7cdfb",
          300: "#a9b0f5",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#372f9e",
        },
        credit: "#4338ca",
        debit: "#c0392b",
        gold: "#4f46e5",
        teal: { DEFAULT: "#372f9e", dark: "#2a2374" },
        lime: "#6366f1",
        tint: {
          navy: "#eef1fb",
          credit: "#e8eaff",
          debit: "#fbefed",
          gold: "#eef1ff",
          teal: "#e6e5f7",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
