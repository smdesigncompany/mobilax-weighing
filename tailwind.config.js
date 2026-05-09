/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          500: '#2563eb',
          600: '#1d4ed8',
          900: '#0b1c3a',
        },
        // Industrial palette: deep, almost-black panels and surfaces.
        steel: {
          950: '#070b12',
          900: '#0b111c',
          850: '#0f1623',
          800: '#131c2c',
          700: '#1a2435',
          600: '#243046',
          500: '#33405a',
          400: '#4a5872',
          300: '#6b7894',
          200: '#9aa4bb',
          100: '#c8cedc',
        },
        // Accent: cyan, used sparingly for highlights / focus / active.
        accent: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'panel': '0 1px 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(148,163,184,0.06), 0 12px 32px -16px rgba(0,0,0,0.6)',
        'glow-accent': '0 0 0 1px rgba(34,211,238,0.35), 0 0 24px -4px rgba(34,211,238,0.4)',
      },
      backgroundImage: {
        'grid-faint': 'linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
