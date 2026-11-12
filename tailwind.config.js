/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf7', 100: '#d1fae9', 200: '#a7f3d6', 300: '#6ee7bd', 400: '#34d39f',
          500: '#10b985', 600: '#05966b', 700: '#047858', 800: '#065f47', 900: '#064e3b',
        },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgba(15,23,42,.04), 0 1px 3px rgba(15,23,42,.06)' },
    },
  },
  plugins: [],
};
