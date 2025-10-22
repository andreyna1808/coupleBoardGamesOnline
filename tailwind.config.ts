import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        romantic: {
          light: "#ffe4ec",
          DEFAULT: "#f472b6",
          dark: "#be185d",
        },
      },
      fontFamily: {
        romantic: ["'Poppins'", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
