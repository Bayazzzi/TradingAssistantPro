import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0e14",
          soft: "#111823",
          card: "#141c28",
          hover: "#1b2635",
        },
        border: {
          DEFAULT: "#1f2b3a",
        },
        accent: {
          DEFAULT: "#2cc985",
          soft: "#1f9d68",
        },
        up: "#26d07c",
        down: "#ff5c6c",
        warn: "#ffb020",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(44,201,133,0.35)" },
          "100%": { boxShadow: "0 0 0 10px rgba(44,201,133,0)" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        "fade-in": "fade-in 0.25s ease-out",
        "pulse-ring": "pulse-ring 1.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
