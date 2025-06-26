/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      minHeight: {
        '12': '3rem',
      },
      maxHeight: {
        '30': '7.5rem',
      },
    },
  },
  plugins: [],
}
