/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#008080',
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#008080', // Deep Teal primary
          700: '#006666',
          800: '#004d4d',
          900: '#003333',
          950: '#002020',
        },
        brand: {
          teal: '#008080',
          'teal-dark': '#006666',
          'teal-light': '#009999',
          gold: '#FFA500',
          'gold-dark': '#e69500',
          'gold-light': '#ffb733',
          orange: '#FFA500',
        },
        gold: {
          DEFAULT: '#FFA500',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#FFA500', // Warm Gold / Orange primary
          600: '#e69500',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        ethiopia: {
          green: '#009B4D',
          yellow: '#FFDE00',
          red: '#DA121A',
          darkgreen: '#006B35',
          gold: '#FFA500',
        },
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
        'marquee-slow': 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [],
}
