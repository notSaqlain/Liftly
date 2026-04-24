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
        'liftly-navy': '#001540',
        'liftly-teal': '#00ADB5',
        'liftly-slate': '#1E293B',
        'liftly-dark': '#000d2e',
        'liftly-teal-dark': '#008a91',
        'liftly-teal-light': '#33c4cb',
      },
      boxShadow: {
        'teal': '0 4px 20px 0 rgba(0,173,181,0.35)',
        'teal-lg': '0 8px 32px 0 rgba(0,173,181,0.45)',
        'navy': '0 4px 20px 0 rgba(0,21,64,0.25)',
        'card': '0 2px 16px 0 rgba(0,0,0,0.06)',
        'card-hover': '0 8px 24px 0 rgba(0,0,0,0.12)',
        'glow-teal': '0 0 20px rgba(0,173,181,0.4)',
      },
      backgroundImage: {
        'liftly-gradient': 'linear-gradient(135deg, #001540 0%, #002070 100%)',
        'teal-gradient': 'linear-gradient(135deg, #00ADB5 0%, #0066cc 100%)',
        'card-gradient': 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      },
      animation: {
        'slide-up': 'slide-up 0.4s ease-out forwards',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'float': 'float 3s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
    },
  },
  plugins: [],
}
