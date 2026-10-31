/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        gujarati: ['"Noto Sans Gujarati"', 'sans-serif'],
        heading: ['"Noto Sans Gujarati"', 'serif'],
      },
      colors: {
        baps: {
          gold: '#C59B27',
          goldLight: '#F3E5AB',
          goldDark: '#8A6818',
          maroon: '#800000',
          maroonDark: '#5E0000',
          blue: '#1E3A8A',
          blueLight: '#3B82F6',
          cream: '#FFFDF5',
          creamDark: '#F7F3E3',
        }
      }
    },
  },
  plugins: [],
}
