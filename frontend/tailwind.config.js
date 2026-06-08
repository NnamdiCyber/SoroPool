/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#00C6FF', 50: '#E0F8FF', 100: '#B3F0FF', 200: '#80E6FF', 300: '#4DDCFF', 400: '#26D4FF', 500: '#00C6FF', 600: '#009ECC', 700: '#007599', 800: '#004D66', 900: '#002633' },
        surface: { DEFAULT: '#0D1117', 50: '#F6F8FA', 100: '#E1E4E8', 200: '#C8CCD0', 300: '#A9ADB1', 400: '#8B9095', 500: '#6E7378', 600: '#53585D', 700: '#3A3F44', 800: '#24292E', 900: '#0D1117' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
