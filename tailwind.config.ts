import type { Config } from "tailwindcss";

// Semantic colors are driven by CSS variables (RGB triplets) so light/dark
// themes swap by changing the variables on <html>, not the class names.
const withVar = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: withVar("--bg"),
          soft: withVar("--bg-soft"),
          card: withVar("--bg-card"),
          hover: withVar("--bg-hover"),
        },
        border: {
          DEFAULT: withVar("--border"),
        },
        fg: {
          DEFAULT: withVar("--fg"),
          muted: withVar("--fg-muted"),
          faint: withVar("--fg-faint"),
          subtle: withVar("--fg-subtle"),
        },
        accent: {
          DEFAULT: "#2cc985",
          soft: "#1f9d68",
        },
        up: "#26d07c",
        down: "#ff5c6c",
        warn: "#f59e0b",
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
