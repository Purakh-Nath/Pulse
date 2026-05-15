/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Background
        bg: {
          primary: '#F7F7F4',
          secondary: '#EFEDE7',
          dark: '#0F1115',
          'dark-surface': '#171A21',
        },
        // Text
        text: {
          primary: '#111111',
          secondary: '#5E5E5E',
          dark: '#F5F5F5',
        },
        // Accents
        accent: {
          primary: '#6C63FF',
          secondary: '#FF6B6B',
          highlight: '#00C2A8',
          chart1: '#6C63FF',
          chart2: '#FF6B6B',
          chart3: '#00C2A8',
          chart4: '#FFC857',
          chart5: '#7DCE82',
        },
        // Status
        success: '#3DDC97',
        warning: '#FFB84D',
        danger: '#FF5A5F',
        // Borders
        border: {
          DEFAULT: 'rgba(0,0,0,0.08)',
          dark: 'rgba(255,255,255,0.08)',
        },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(108,99,255,0.18)',
        'glow-sm': '0 0 12px rgba(108,99,255,0.12)',
        card: '0 2px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.12)',
        float: '0 16px 64px rgba(0,0,0,0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        shimmer:
          'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.4) 50%, transparent 75%)',
        'shimmer-dark':
          'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.08) 50%, transparent 75%)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
