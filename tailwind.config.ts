import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
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
