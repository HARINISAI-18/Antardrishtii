/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        // ===================================================================
        // ANTARDRISHTII GLOBAL COLOR SYSTEM
        // ===================================================================
        // PRIMARY BRAND COLORS
        brand: {
          navy: '#12355B',     // Deep Navy: Antardrishtii branding, main headings, primary text
          blue: '#2563EB',     // Primary Blue: primary buttons, active nav, active tabs, links
          sky: '#38BDF8',      // Sky Blue: secondary highlights, info accents
          teal: '#0F9D9A',     // Teal: geospatial accents, AOI indicators, map controls
          cyan: '#06B6D4',     // Cyan: analytical accents, water-related UI
        },
        // NEUTRAL SURFACES
        surface: {
          DEFAULT: '#FFFFFF',
          main: '#FFFFFF',
          secondary: '#F1F5F9',
          bg: '#F7FAFC',
          card: '#FFFFFF',
        },
        // NEUTRAL TEXT
        txt: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
        },
        // BORDERS
        borderline: {
          DEFAULT: '#E2E8F0',
          subtle: '#E2E8F0',
          active: '#BFDBFE',
        },
        // SEMANTIC COLORS
        semantic: {
          success: '#16A34A',
          warning: '#F59E0B',
          danger: '#DC2626',
          info: '#2563EB',
          // Analytics specific
          crop: '#16A34A',
          urban: '#6366F1',
          water: '#0891B2',
          disaster: '#F59E0B',
          critical: '#DC2626',
        },
        // Compatibility Aliases
        background: '#F7FAFC',
        primary: {
          DEFAULT: '#12355B',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#090d16',
        },
        action: {
          DEFAULT: '#2563EB',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        earth: {
          DEFAULT: '#16A34A',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          DEFAULT: '#F59E0B',
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        critical: {
          DEFAULT: '#DC2626',
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        }
      },
      borderRadius: {
        'card': '16px',
        'modal': '18px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(18, 53, 91, 0.05), 0 1px 2px -1px rgba(18, 53, 91, 0.03)',
        'card': '0 2px 6px 0 rgba(18, 53, 91, 0.06), 0 1px 3px -1px rgba(18, 53, 91, 0.04)',
        'modal': '0 12px 32px -4px rgba(18, 53, 91, 0.14), 0 4px 8px -2px rgba(18, 53, 91, 0.05)',
        'workstation': '0 1px 3px 0 rgba(18, 53, 91, 0.06), 0 1px 2px -1px rgba(18, 53, 91, 0.04)',
        'workstation-lg': '0 4px 6px -1px rgba(18, 53, 91, 0.08), 0 2px 4px -2px rgba(18, 53, 91, 0.04)',
        'viewfinder': 'inset 0 0 0 1px rgba(18, 53, 91, 0.1)',
      }
    },
  },
  plugins: [],
}
