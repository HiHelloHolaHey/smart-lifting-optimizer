/** @type {import('tailwindcss').Config} */
const withAlpha = (varName) => `rgb(var(${varName}) / <alpha-value>)`;

export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Direct semantic tokens from premium-color-theme-guide.md
        bg: withAlpha('--rgb-bg'),
        surface: withAlpha('--rgb-surface'),
        raised: withAlpha('--rgb-raised'),
        border: withAlpha('--rgb-border'),
        text: withAlpha('--rgb-text'),
        'text-muted': withAlpha('--rgb-text-muted'),
        accent: withAlpha('--rgb-accent'),
        'on-accent': withAlpha('--rgb-on-accent'),
        ai: withAlpha('--rgb-ai'),
        'ai-tint': withAlpha('--rgb-ai-tint'),
        success: withAlpha('--rgb-success'),
        warning: withAlpha('--rgb-warning'),
        danger: withAlpha('--rgb-danger'),

        // Avoid pure black (#000000) and pure white (#FFFFFF) anywhere
        white: withAlpha('--rgb-text'),
        black: withAlpha('--rgb-bg'),

        // Map existing utility classes seamlessly to the Premium Palette
        'electric-indigo': withAlpha('--rgb-accent'),
        slate: {
          50: withAlpha('--rgb-text'),
          100: withAlpha('--rgb-text'),
          200: withAlpha('--rgb-text'),
          300: withAlpha('--rgb-text-muted'),
          400: withAlpha('--rgb-text-muted'),
          500: withAlpha('--rgb-text-muted'),
          600: withAlpha('--rgb-border'),
          700: withAlpha('--rgb-border'),
          800: withAlpha('--rgb-raised'),
          900: withAlpha('--rgb-surface'),
          950: withAlpha('--rgb-bg'),
        },
        indigo: {
          100: withAlpha('--rgb-text'),
          200: withAlpha('--rgb-text-muted'),
          300: withAlpha('--rgb-accent'),
          400: withAlpha('--rgb-accent'),
          500: withAlpha('--rgb-accent'),
          600: withAlpha('--rgb-accent'),
          700: withAlpha('--rgb-accent'),
          800: withAlpha('--rgb-raised'),
          900: withAlpha('--rgb-surface'),
          950: withAlpha('--rgb-bg'),
        },
        cyan: {
          200: withAlpha('--rgb-ai'),
          300: withAlpha('--rgb-ai'),
          400: withAlpha('--rgb-ai'),
          500: withAlpha('--rgb-ai'),
          900: withAlpha('--rgb-ai-tint'),
        },
        emerald: {
          200: withAlpha('--rgb-success'),
          300: withAlpha('--rgb-success'),
          400: withAlpha('--rgb-success'),
          500: withAlpha('--rgb-success'),
          900: withAlpha('--rgb-surface'),
        },
        green: {
          300: withAlpha('--rgb-success'),
          400: withAlpha('--rgb-success'),
          500: withAlpha('--rgb-success'),
        },
        amber: {
          200: withAlpha('--rgb-warning'),
          300: withAlpha('--rgb-warning'),
          400: withAlpha('--rgb-warning'),
          500: withAlpha('--rgb-warning'),
        },
        yellow: {
          300: withAlpha('--rgb-warning'),
          400: withAlpha('--rgb-warning'),
          500: withAlpha('--rgb-warning'),
        },
        red: {
          200: withAlpha('--rgb-danger'),
          300: withAlpha('--rgb-danger'),
          400: withAlpha('--rgb-danger'),
          500: withAlpha('--rgb-danger'),
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))'
      }
    },
  },
  plugins: [],
}
