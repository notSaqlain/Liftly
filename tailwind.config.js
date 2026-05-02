/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // New dark premium palette
        'app-bg':    '#070B14',   // ultra-dark base
        'app-surface': '#0D1526', // card background
        'app-surface-2': '#111E38', // elevated card
        'app-border': 'rgba(255,255,255,0.07)',

        // Brand colors - brighter/more vibrant
        'brand':      '#00E5D1',  // vibrant teal
        'brand-dark': '#00B5A3',
        'brand-light': '#33ECD8',

        // Accent
        'accent-purple': '#7C6EF5',
        'accent-blue':   '#3B82F6',
        'accent-pink':   '#EC4899',

        // Legacy aliases (keep so old code doesn't fully break)
        'liftly-navy':       '#070B14',
        'liftly-teal':       '#00E5D1',
        'liftly-slate':      '#1E293B',
        'liftly-dark':       '#040810',
        'liftly-teal-dark':  '#00B5A3',
        'liftly-teal-light': '#33ECD8',
      },
      boxShadow: {
        'teal':      '0 4px 20px 0 rgba(0,229,209,0.3)',
        'teal-lg':   '0 8px 32px 0 rgba(0,229,209,0.4)',
        'navy':      '0 4px 20px 0 rgba(7,11,20,0.6)',
        'card':      '0 2px 16px 0 rgba(0,0,0,0.3)',
        'card-hover':'0 8px 24px 0 rgba(0,0,0,0.5)',
        'glow-teal': '0 0 24px rgba(0,229,209,0.35)',
        'glow-purple':'0 0 24px rgba(124,110,245,0.35)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      backgroundImage: {
        'liftly-gradient': 'linear-gradient(160deg, #070B14 0%, #0D1835 100%)',
        'teal-gradient':   'linear-gradient(135deg, #00E5D1 0%, #3B82F6 100%)',
        'purple-gradient': 'linear-gradient(135deg, #7C6EF5 0%, #EC4899 100%)',
        'card-gradient':   'linear-gradient(145deg, #0D1526 0%, #111E38 100%)',
        'hero-gradient':   'linear-gradient(160deg, #0D1526 0%, #0a1428 50%, #070B14 100%)',
      },
      animation: {
        'slide-up':    'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down':  'slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in':    'scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'float':       'float 3s ease-in-out infinite',
        'pulse-ring':  'pulse-ring 2s ease-out infinite',
        'shimmer':     'shimmer 1.5s infinite',
        'fade-in':     'fade-in 0.3s ease-out forwards',
        'glow-pulse':  'glow-pulse 2s ease-in-out infinite',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
