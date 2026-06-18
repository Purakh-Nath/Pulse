/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Surfaces
        bg: {
          DEFAULT:  '#FAFAF8',
          '2':      '#F4F3EF',
          '3':      '#ECEAE4',
          dark:     '#111110',
          'dark-2': '#191918',
          'dark-3': '#222220',
        },

        // Text
        text: {
          DEFAULT:   '#6B6760',
          heading:   '#1A1917',
          muted:     '#9C9A94',
          'dark':    '#A8A49E',
          'dark-h':  '#F5F4F1',
        },

        //  Single accent - warm orange
        accent: {
          DEFAULT: '#E8520A',
          hover:   '#D14508',
          dark:    '#F06428',
          bg:      'rgba(232, 82, 10, 0.08)',
          border:  'rgba(232, 82, 10, 0.24)',
        },

        // Chart palette - warm + neutral
        chart: {
          '1': '#E8520A',   // orange (primary)
          '2': '#1A1917',   // near-black
          '3': '#A8A49E',   // warm gray
          '4': '#CA8A04',   // amber
          '5': '#6B6760',   // mid gray
        },

        // Semantic
        success: '#16A34A',
        warning: '#CA8A04',
        danger:  '#DC2626',

        // Borders
        border: {
          DEFAULT: 'rgba(26, 25, 23, 0.09)',
          strong:  'rgba(26, 25, 23, 0.14)',
          dark:    'rgba(255, 253, 248, 0.08)',
          'dark-strong': 'rgba(255, 253, 248, 0.13)',
        },
      },

      fontFamily: {
        heading: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        body:    ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        // Fluid type scale
        'display': ['clamp(2.5rem, 6vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '600' }],
        'title':   ['clamp(1.75rem, 4vw, 2.5rem)', { lineHeight: '1.2', letterSpacing: '-0.025em', fontWeight: '600' }],
        'heading': ['clamp(1.25rem, 2.5vw, 1.5rem)', { lineHeight: '1.3', letterSpacing: '-0.02em', fontWeight: '600' }],
      },

      letterSpacing: {
        tighter: '-0.03em',
        tight:   '-0.02em',
        snug:    '-0.01em',
        normal:  '0.01em',
        wide:    '0.04em',
        widest:  '0.12em',
      },

      // Shadows - no color tints
      boxShadow: {
        sm:   '0 1px 2px rgba(26, 25, 23, 0.06)',
        DEFAULT: '0 2px 8px rgba(26, 25, 23, 0.07), 0 1px 2px rgba(26, 25, 23, 0.05)',
        md:   '0 4px 16px rgba(26, 25, 23, 0.09), 0 2px 4px rgba(26, 25, 23, 0.05)',
        lg:   '0 8px 32px rgba(26, 25, 23, 0.10), 0 2px 8px rgba(26, 25, 23, 0.06)',
        // Dark mode variants
        'dark-sm':  '0 1px 2px rgba(0, 0, 0, 0.30)',
        'dark':     '0 2px 8px rgba(0, 0, 0, 0.35), 0 1px 2px rgba(0, 0, 0, 0.20)',
        'dark-md':  '0 4px 16px rgba(0, 0, 0, 0.40), 0 2px 4px rgba(0, 0, 0, 0.20)',
        'dark-lg':  '0 8px 32px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.25)',
        // Inset border replacement (replaces border on interactive elements)
        'inset-border': 'inset 0 0 0 1px rgba(26, 25, 23, 0.09)',
        'inset-border-strong': 'inset 0 0 0 1px rgba(26, 25, 23, 0.14)',
        'inset-accent': 'inset 0 0 0 1.5px rgba(232, 82, 10, 0.5)',
      },

      borderRadius: {
        sm:  '6px',
        DEFAULT: '8px',
        md:  '10px',
        lg:  '14px',
        xl:  '18px',
        '2xl': '24px',
      },

      // Animations
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':   'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-dot':  'pulseDot 2s ease-in-out infinite',
        'spin-slow':  'spin 3s linear infinite',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.5', transform: 'scale(0.85)' },
        },
      },

      transitionTimingFunction: {
        // Snappy spring - good for UI interactions
        spring:  'cubic-bezier(0.16, 1, 0.3, 1)',
        // Smooth ease - good for opacity and color
        smooth:  'cubic-bezier(0.4, 0, 0.2, 1)',
        // Quick out - good for exits
        out:     'cubic-bezier(0, 0, 0.2, 1)',
      },

      transitionDuration: {
        fast:    '100ms',
        DEFAULT: '150ms',
        slow:    '250ms',
      },
    },
  },
  plugins: [],
};
