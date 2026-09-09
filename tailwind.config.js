/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
        emerald: {
          500: '#10b981',
          600: '#059669',
        },
        blue: {
          500: '#3b82f6',
          600: '#2563eb',
        },
        yellow: {
          500: '#eab308',
          600: '#ca8a04',
        },
        red: {
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
