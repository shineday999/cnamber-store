/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          900: 'var(--color-primary-900)',
          700: 'var(--color-primary-700)',
          500: 'var(--color-primary-500)',
          300: 'var(--color-primary-300)',
          100: 'var(--color-primary-100)',
        },
        bg: {
          base: 'var(--color-bg-base)',
          card: 'var(--color-bg-card)',
          elevated: 'var(--color-bg-elevated)',
        },
        accent: {
          700: 'var(--color-accent-700)',
          500: 'var(--color-accent-500)',
          300: 'var(--color-accent-300)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['3.5rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'display-sm': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.005em' }],
      },
      spacing: {
        'section': '6rem',
        'section-lg': '8rem',
      },
      borderRadius: {
        'card': '12px',
      },
      boxShadow: {
        'natural': '0 4px 24px rgba(45, 74, 43, 0.08)',
        'natural-lg': '0 8px 48px rgba(45, 74, 43, 0.12)',
      },
    },
  },
  plugins: [],
};