/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#1a1a1a",
        darkCard: "#2b2b2b",
        darkItem: "#333333",
      }
    },
  },
  plugins: [],
}
