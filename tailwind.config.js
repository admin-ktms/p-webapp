
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
        lime: "#B7FF00",
        orange: "#FF6B00",
        gold: "#FFC857",
        success: "#35D07F",
        danger: "#FF4559"
      }
    }
  },
  plugins: []
};
