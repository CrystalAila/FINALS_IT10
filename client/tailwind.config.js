export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#ff6200',
          dark: '#e55a00',
        },
        brand: {
          DEFAULT: '#ff6200',
          dark: '#ff8a00',
        },
        background: '#faf7f2',
        card: '#ffffff',
        text: '#1f2937',
        muted: '#6b7280',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        border: '#e5e7eb',
      },
      boxShadow: {
        card: '0 18px 60px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
