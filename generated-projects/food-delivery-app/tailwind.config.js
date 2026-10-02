// tailwind.config.js
module.exports = {
  darkMode: 'class', // Enable dark mode via a class on the <html> element
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f5faff',
          100: '#e0f3ff',
          200: '#b8e0ff',
          300: '#8fcdff',
          400: '#66baff',
          500: '#3da7ff',
          600: '#2a8bd4',
          700: '#1b6eaa',
          800: '#0d5270',
          900: '#032d3b',
        },
        secondary: {
          50:  '#fff5f5',
          100: '#ffe0e0',
          200: '#ffb8b8',
          300: '#ff8f8f',
          400: '#ff6666',
          500: '#ff3d3d',
          600: '#d42a2a',
          700: '#aa1b1b',
          800: '#70170d',
          900: '#3b0d0d',
        },
        accent: {
          50:  '#f5fff5',
          100: '#e0ffe0',
          200: '#b8ffb8',
          300: '#8fff8f',
          400: '#66ff66',
          500: '#3dff3d',
          600: '#2ad42a',
          700: '#1baa1b',
          800: '#107010',
          900: '#0d3b0d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};