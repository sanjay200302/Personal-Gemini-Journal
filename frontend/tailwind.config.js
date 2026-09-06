/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ground: "var(--color-ground, #0a0b14)",
        surface: "var(--color-surface, #111220)",
        card: "var(--color-card, #181929)",
        "card-hover": "var(--color-card-hover, #1e1f33)",
        border: "var(--color-border, #252640)",
        violet: {
          DEFAULT: "#7c6af7",
          light: "#a49af9",
          dim: "#4e3fc8",
          glow: "rgba(124, 106, 247, 0.15)",
        },
        amber: {
          DEFAULT: "#f4a05a",
          light: "#f7c08a",
        },
        rose: {
          DEFAULT: "#e879a0",
        },
        green: {
          DEFAULT: "#4ade80",
        },
        ink: {
          DEFAULT: "var(--color-ink, #e2ddd4)",
          dim: "var(--color-ink-dim, #b4b0a7)",
        },
        muted: {
          DEFAULT: "var(--color-muted, #5e5e80)",
          light: "var(--color-muted-light, #8888aa)",
        },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Outfit", "system-ui", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        wave: {
          "0%, 100%": { height: "4px" },
          "50%": { height: "20px" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease forwards",
        "pulse-ring": "pulse-ring 2s ease infinite",
        wave: "wave 0.5s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};
