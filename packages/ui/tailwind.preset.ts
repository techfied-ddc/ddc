import type { Config } from 'tailwindcss';

const preset: Partial<Config> = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // Brand gold
        gold: {
          DEFAULT: '#D4AF37',
          bright:  '#F0D67E',
          deep:    '#9A7B1F',
          muted:   '#7A6520',
        },
        // Base palette
        void:    '#0B0B0C', // deepest background
        onyx:    '#111114',
        iron:    '#1A1A1F',
        ash:     '#2A2A30',
        // Text
        chalk:   '#F0EBE0',
        silver:  '#A09688',
        slate:   '#6B6560',
        // Semantic
        success: '#5FA87A',
        warning: '#E8A838',
        danger:  '#C84B4B',
        info:    '#4A8FD4',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.04em' }],
        xs:    ['12px', { lineHeight: '16px' }],
        sm:    ['13px', { lineHeight: '20px' }],
        base:  ['14px', { lineHeight: '22px' }],
        md:    ['15px', { lineHeight: '24px' }],
        lg:    ['16px', { lineHeight: '26px' }],
        xl:    ['18px', { lineHeight: '28px' }],
        '2xl': ['22px', { lineHeight: '30px' }],
        '3xl': ['28px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '44px' }],
        '5xl': ['48px', { lineHeight: '56px' }],
      },
      borderRadius: {
        sm:  '6px',
        DEFAULT: '10px',
        md:  '12px',
        lg:  '16px',
        xl:  '20px',
        '2xl': '24px',
      },
      spacing: {
        // Safe-area insets for PWA
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top':    'env(safe-area-inset-top)',
      },
      boxShadow: {
        glass:  '0 4px 30px rgba(0, 0, 0, 0.4)',
        gold:   '0 0 20px rgba(212, 175, 55, 0.2)',
        'gold-sm': '0 0 10px rgba(212, 175, 55, 0.15)',
      },
      backgroundImage: {
        'gold-radial': 'radial-gradient(ellipse at top, rgba(212,175,55,0.08) 0%, transparent 70%)',
        'void-gradient': 'linear-gradient(180deg, #111114 0%, #0B0B0C 100%)',
      },
      animation: {
        shimmer:  'shimmer 2s linear infinite',
        fadeIn:   'fadeIn 0.3s ease forwards',
        slideUp:  'slideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        pulse:    'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
};

export default preset;
