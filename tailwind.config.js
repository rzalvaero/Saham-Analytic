/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        gray: {
          750: '#253248',
          850: '#141c2c',
          950: '#070a12',
        },
        brand: {
          dark: '#070a12',
          surface: '#0c101a',
          card: 'rgba(16, 22, 36, 0.85)',
          border: 'rgba(255, 255, 255, 0.08)',
          cyan: '#06b6d4',
          green: '#10b981',
          red: '#ef4444',
          amber: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
}
