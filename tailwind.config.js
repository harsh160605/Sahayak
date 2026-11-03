/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FBFBFA",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#0D9488", // Restrained teal
          hover: "#0F766E",
          light: "#F0FDFA",
          dark: "#115E59"
        },
        navy: {
          900: "#0F172A", // Deep Navy / Charcoal
          800: "#1E293B",
          700: "#334155",
          600: "#475569",
          500: "#64748B"
        },
        warm: {
          50: "#FDFDFD",
          100: "#FBFBFA",
          200: "#F7F7F5",
          300: "#F0EFEA",
          400: "#E5E4DE",
          500: "#D3D2CA"
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Geist Mono', 'monospace'],
        serif: ['Newsreader', 'Georgia', 'serif']
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.02)",
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 2px 4px -1px rgba(15, 23, 42, 0.03)",
        elevated: "0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)"
      }
    },
  },
  plugins: [],
}

