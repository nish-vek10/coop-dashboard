/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Switzer", "ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Arial"],
      },
    },
  },
  plugins: [],
};
