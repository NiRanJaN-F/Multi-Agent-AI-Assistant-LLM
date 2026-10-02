/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        sidebar: {
          DEFAULT: "#0f172a",
          hover: "#1e293b",
          active: "#334155",
        },
        kpi: {
          revenue: "#10b981",
          users: "#3b82f6",
          orders: "#8b5cf6",
          conversion: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "kpi-value": ["2.25rem", { lineHeight: "2.5rem", fontWeight: "700" }],
        "kpi-label": ["0.875rem", { lineHeight: "1.25rem", fontWeight: "500" }],
        "chart-label": ["0.75rem", { lineHeight: "1rem", fontWeight: "500" }],
      },
      spacing: {
        "sidebar-width": "260px",
        "sidebar-collapsed": "72px",
        "header-height": "64px",
      },
      borderRadius: {
        "kpi-card": "12px",
        "chart-card": "16px",
        "table-card": "12px",
      },
      boxShadow: {
        "kpi": "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)",
        "kpi-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
        "chart": "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
        "sidebar": "4px 0 24px rgba(0, 0, 0, 0.08)",
      },
      transitionDuration: {
        "sidebar": "300ms",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      screens: {
        "sidebar": "1024px",
      },
    },
  },
  plugins: [],
};