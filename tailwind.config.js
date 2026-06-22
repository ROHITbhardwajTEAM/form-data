/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "#f0f4fb",
          100: "#dce4f6",
          200: "#bdcdea",
          300: "#93ade0",
          400: "#6488d0",
          500: "#003594",
          600: "#002d82",
          700: "#00256b",
          800: "#001c53",
          900: "#00133c",
        },
        accent: {
          DEFAULT: "#e8a020",
          light: "#fdf3e0",
        },
        surface: "#f4f8fb",
        card: "#ffffff",
      },
      fontFamily: {
        display: ["'Museo Sans'", "Tahoma", "sans-serif"],
        body: ["'Museo Sans'", "Tahoma", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 24px 0 rgba(0,102,153,0.10)",
        strong: "0 8px 40px 0 rgba(0,102,153,0.18)",
      },
    },
  },
  plugins: [],
};
