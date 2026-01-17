/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'poll-dark': '#0f172a',
        'poll-card': '#1e293b',
        'poll-accent': '#eab308', 
        'poll-accent-hover': '#ca8a04',
        'poll-bg': '#000000',
      },
      transitionTimingFunction: {
        'ios': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      animation: {
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        'pulse-glow': 'pulseGlow 2s infinite',
        'bounce-subtle': 'bounceSubtle 2s infinite',
      },
      keyframes: {
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(234, 179, 8, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(234, 179, 8, 0.6)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        }
      }
    }
  },
  plugins: [],
}