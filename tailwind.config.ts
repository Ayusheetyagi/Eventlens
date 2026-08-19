import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: {
          50: "#fdfaf4",
          100: "#f8f1e3",
          200: "#f2ebdd",
          300: "#e9dcc4",
        },
        sage: {
          100: "#e3ecdd",
          300: "#b7cdae",
          500: "#8fae84",
          700: "#5f7d56",
        },
        sky: {
          100: "#e2edf1",
          300: "#aecbda",
          500: "#86afc2",
          700: "#547d92",
        },
        blush: {
          100: "#f7e6e4",
          300: "#e9bec0",
          500: "#dda0a3",
          700: "#b06f73",
        },
        ink: {
          DEFAULT: "#3e362e",
          soft: "#8b8375",
        },
      },
      boxShadow: {
        clay: "0 8px 24px -8px rgba(62, 54, 46, 0.18), 0 2px 6px -2px rgba(62, 54, 46, 0.1)",
        "clay-sm": "0 4px 14px -6px rgba(62, 54, 46, 0.16)",
      },
      borderRadius: {
        blob: "42% 58% 65% 35% / 45% 40% 60% 55%",
      },
    },
  },
  plugins: [],
};
export default config;
