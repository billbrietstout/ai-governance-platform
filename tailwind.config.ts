import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-dm-mono)", "ui-monospace", "monospace"]
      },
      colors: {
        // CoSAI layer tokens — mirror :root in app/globals.css
        "layer-1-bg": "var(--layer-1-bg)",
        "layer-1-border": "var(--layer-1-border)",
        "layer-1-text": "var(--layer-1-text)",
        "layer-1-accent": "var(--layer-1-accent)",
        "layer-2-bg": "var(--layer-2-bg)",
        "layer-2-border": "var(--layer-2-border)",
        "layer-2-text": "var(--layer-2-text)",
        "layer-2-accent": "var(--layer-2-accent)",
        "layer-3-bg": "var(--layer-3-bg)",
        "layer-3-border": "var(--layer-3-border)",
        "layer-3-text": "var(--layer-3-text)",
        "layer-3-accent": "var(--layer-3-accent)",
        "layer-4-bg": "var(--layer-4-bg)",
        "layer-4-border": "var(--layer-4-border)",
        "layer-4-text": "var(--layer-4-text)",
        "layer-4-accent": "var(--layer-4-accent)",
        "layer-5-bg": "var(--layer-5-bg)",
        "layer-5-border": "var(--layer-5-border)",
        "layer-5-text": "var(--layer-5-text)",
        "layer-5-accent": "var(--layer-5-accent)",
        navy: {
          50: "#eef3ff",
          100: "#dbe7ff",
          200: "#bcd2ff",
          300: "#8fb4ff",
          400: "#5b8cff",
          500: "#3367ff",
          600: "#1f4af5",
          700: "#1838d1",
          800: "#182fa9",
          900: "#182a86",
          950: "#0e174d"
        },
        slatePro: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5d9e2",
          300: "#b0b8c9",
          400: "#8591ab",
          500: "#667492",
          600: "#505c77",
          700: "#424a62",
          800: "#383f52",
          900: "#313747",
          950: "#1f2330"
        }
      }
    }
  },
  plugins: []
};

export default config;
