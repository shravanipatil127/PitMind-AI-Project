/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        pit: {
          red: "#E10600",
          redDark: "#A30500",
          black: "#0A0A0C",
          charcoal: "#141417",
          panel: "#1B1B20",
          border: "#2A2A31",
          text: "#F5F5F7",
          muted: "#9A9AA5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(225, 6, 0, 0.35)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.45)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
