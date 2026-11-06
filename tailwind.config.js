
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        panel: "#141414",
        surface: "#222222",
        border: "#303030",
        text: "#F5F5F5",
        muted: "#A3A3A3",
        lime: {
          50: "#F7FFE0",
          100: "#EDFFC2",
          200: "#DBFF85",
          300: "#C8FF33",
          400: "#B7FF00",
          500: "#91CC00",
          600: "#6E9900",
          700: "#4F6E00",
          800: "#344700",
          900: "#202B00",
          950: "#111700"
        },
        orange: "#FF6B00",
        gold: "#FFC857",
        success: "#35D07F",
        danger: "#FF4559"
      }
    }
  },
  plugins: []
};
