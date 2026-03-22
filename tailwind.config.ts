import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    { pattern: /^(bg|text|border|ring)-(red|orange|amber|yellow|green|blue|purple|indigo|slate|gray|emerald|rose|teal|cyan|violet)-(50|100|200|300|400|500|600|700|800|900|950)$/ },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#eef5ff',
          100: '#d9e9ff',
          200: '#bcd5ff',
          300: '#8db8ff',
          400: '#5890ff',
          500: '#3366ff',
          600: '#1a45f5',
          700: '#1432e1',
          800: '#172ab6',
          900: '#192a8f',
          950: '#141b57',
        },
      },
      boxShadow: {
        'card':   '0 1px 3px 0 rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.06)',
        'card-lg':'0 4px 16px -2px rgba(0,0,0,.10), 0 2px 8px -2px rgba(0,0,0,.06)',
        'modal':  '0 20px 60px -10px rgba(0,0,0,.25)',
        'glow-p1':'0 0 0 3px rgba(220,38,38,.35)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      animation: {
        'fade-in':     'fadeIn .18s ease-out',
        'slide-up':    'slideUp .22s cubic-bezier(.16,1,.3,1)',
        'slide-right': 'slideRight .25s cubic-bezier(.16,1,.3,1)',
        'scale-in':    'scaleIn .15s cubic-bezier(.16,1,.3,1)',
        'pulse-p1':    'pulseP1 2s ease-in-out infinite',
        'shimmer':     'shimmer 1.6s linear infinite',
        'spin-slow':   'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                   to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideRight:{ from: { opacity: '0', transform: 'translateX(-16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseP1:   {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220,38,38,.6)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(220,38,38,0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
      },
      screens: {
        'xs': '480px',
      },
    },
  },
  plugins: [],
}

export default config
