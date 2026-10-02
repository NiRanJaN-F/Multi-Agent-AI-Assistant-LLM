/**
 * Tailwind CSS Configuration
 * Synchronized with public/index.html custom theme parameters
 */

tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8ff',
          100: '#d8effe',
          200: '#bae2fd',
          300: '#8acdfb',
          400: '#52b3f6',
          500: '#2b96ef',
          600: '#157ad9',
          700: '#1161b4',
          800: '#135194',
          900: '#15447b',
          950: '#0b1329', // Deep dark backdrop fitting developer aesthetic
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    }
  }
};