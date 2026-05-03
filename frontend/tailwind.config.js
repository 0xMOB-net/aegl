/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        green: {
          950: '#06160d',
          900: '#0d3321',
          800: '#1a5c3a',
          700: '#1f7046',
          600: '#258553',
          500: '#2ea866',
          100: '#d4f0e0',
          50:  '#edfaf3',
        },
        gold: {
          600: '#d4af00',
          500: '#FCD116',
          400: '#fdd840',
          100: '#fef9d7',
          50:  '#fffde8',
        },
        red: {
          700: '#a80e1e',
          600: '#CE1126',
          500: '#e01229',
          100: '#fde8eb',
        },
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in':    'fadeIn 0.6s ease-out both',
        'fade-in-up': 'fadeInUp 0.7s ease-out both',
        'slide-up':   'slideUp 0.4s ease-out both',
        'float':      'float 7s ease-in-out infinite',
        'float-slow': 'float 10s ease-in-out 2s infinite',
        'pulse-slow': 'pulse 5s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':  'spin 30s linear infinite',
        'shimmer':    'shimmer 2.5s linear infinite',
        'gradient':   'gradientShift 8s ease infinite',
      },
      keyframes: {
        fadeIn:     { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeInUp:   { from: { opacity: '0', transform: 'translateY(28px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp:    { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        float: {
          '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%':     { transform: 'translateY(-18px) rotate(2deg)' },
          '66%':     { transform: 'translateY(-8px) rotate(-1deg)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        gradientShift: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%':     { backgroundPosition: '100% 50%' },
        },
      },
      boxShadow: {
        gold:    '0 4px 30px rgba(252,209,22,0.35)',
        green:   '0 4px 30px rgba(26,92,58,0.3)',
        glass:   '0 8px 40px rgba(0,0,0,0.12)',
        card:    '0 4px 24px rgba(0,0,0,0.06)',
        'card-hover': '0 12px 48px rgba(0,0,0,0.14)',
      },
    },
  },
  plugins: [],
}
