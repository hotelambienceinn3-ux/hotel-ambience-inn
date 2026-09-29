/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#972123",
        "primary-container": "#b83a38",
        "primary-fixed": "#ffdad7",
        "on-primary": "#ffffff",
        "on-primary-container": "#ffdfdc",
        "secondary": "#735c00",
        "secondary-container": "#fed65b",
        "secondary-fixed": "#ffe088",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#745c00",
        "surface": "#f9f9ff",
        "surface-bright": "#f9f9ff",
        "surface-dim": "#d7dae3",
        "surface-container": "#ebeef7",
        "surface-container-low": "#f1f3fd",
        "surface-container-lowest": "#ffffff",
        "surface-container-high": "#e5e8f2",
        "surface-container-highest": "#dfe2ec",
        "surface-variant": "#dfe2ec",
        "on-surface": "#181c23",
        "on-surface-variant": "#58413f",
        "inverse-surface": "#2d3138",
        "inverse-on-surface": "#eef0fa",
        "tertiary": "#504f4a",
        "tertiary-container": "#686762",
        "outline": "#8c716e",
        "outline-variant": "#e0bfbc"
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
        serif: ["Playfair Display", "serif"],
        headline: ["Playfair Display", "serif"],
        body: ["Plus Jakarta Sans", "sans-serif"]
      }
    },
  },
  plugins: [],
}
