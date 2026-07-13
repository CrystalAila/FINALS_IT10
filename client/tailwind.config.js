/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FF6B00',
          dark: '#E55F00',
          light: '#FF8A33',
        },
        customer: {
          bg: '#F0FDF4',
          dark: '#14532D',
        },
        login: {
          green: '#166534',
        },
      },
      boxShadow: {
        card: '0 4px 24px rgba(0, 0, 0, 0.06)',
        nav: '0 2px 12px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
