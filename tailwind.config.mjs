/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Disable default Tailwind colors
        slate: null,
        gray: null,
        zinc: null,
        neutral: null,
        stone: null,
        
        // Base colors
        black: 'var(--color-black)',
        paper: 'var(--color-paper)',
        base: {
          50: 'var(--color-base-50)',
          100: 'var(--color-base-100)',
          150: 'var(--color-base-150)',
          200: 'var(--color-base-200)',
          300: 'var(--color-base-300)',
          400: 'var(--color-base-400)',
          500: 'var(--color-base-500)',
          600: 'var(--color-base-600)',
          700: 'var(--color-base-700)',
          800: 'var(--color-base-800)',
          850: 'var(--color-base-850)',
          900: 'var(--color-base-900)',
          950: 'var(--color-base-950)',
        },
        // Semantic colors for light mode
        light: {
          bg: 'var(--color-light-bg)',
          'bg-2': 'var(--color-light-bg-2)',
          tx: 'var(--color-light-tx)',
          'tx-2': 'var(--color-light-tx-2)',
          'tx-3': 'var(--color-light-tx-3)',
          ui: 'var(--color-light-ui)',
          'ui-2': 'var(--color-light-ui-2)',
          'ui-3': 'var(--color-light-ui-3)',
          re: 'var(--color-light-re)',
          or: 'var(--color-light-or)',
          ye: 'var(--color-light-ye)',
          gr: 'var(--color-light-gr)',
          cy: 'var(--color-light-cy)',
          bl: 'var(--color-light-bl)',
          pu: 'var(--color-light-pu)',
          ma: 'var(--color-light-ma)',
          're-2': 'var(--color-light-re-2)',
          'or-2': 'var(--color-light-or-2)',
          'ye-2': 'var(--color-light-ye-2)',
          'gr-2': 'var(--color-light-gr-2)',
          'cy-2': 'var(--color-light-cy-2)',
          'bl-2': 'var(--color-light-bl-2)',
          'pu-2': 'var(--color-light-pu-2)',
          'ma-2': 'var(--color-light-ma-2)',
        },
        // Semantic colors for dark mode
        dark: {
          bg: 'var(--color-dark-bg)',
          'bg-2': 'var(--color-dark-bg-2)',
          tx: 'var(--color-dark-tx)',
          'tx-2': 'var(--color-dark-tx-2)',
          'tx-3': 'var(--color-dark-tx-3)',
          ui: 'var(--color-dark-ui)',
          'ui-2': 'var(--color-dark-ui-2)',
          'ui-3': 'var(--color-dark-ui-3)',
          re: 'var(--color-dark-re)',
          or: 'var(--color-dark-or)',
          ye: 'var(--color-dark-ye)',
          gr: 'var(--color-dark-gr)',
          cy: 'var(--color-dark-cy)',
          bl: 'var(--color-dark-bl)',
          pu: 'var(--color-dark-pu)',
          ma: 'var(--color-dark-ma)',
          're-2': 'var(--color-dark-re-2)',
          'or-2': 'var(--color-dark-or-2)',
          'ye-2': 'var(--color-dark-ye-2)',
          'gr-2': 'var(--color-dark-gr-2)',
          'cy-2': 'var(--color-dark-cy-2)',
          'bl-2': 'var(--color-dark-bl-2)',
          'pu-2': 'var(--color-dark-pu-2)',
          'ma-2': 'var(--color-dark-ma-2)',
        },
        // Full color scales
        red: {
          50: 'var(--color-red-50)',
          100: 'var(--color-red-100)',
          150: 'var(--color-red-150)',
          200: 'var(--color-red-200)',
          300: 'var(--color-red-300)',
          400: 'var(--color-red-400)',
          500: 'var(--color-red-500)',
          600: 'var(--color-red-600)',
          700: 'var(--color-red-700)',
          800: 'var(--color-red-800)',
          850: 'var(--color-red-850)',
          900: 'var(--color-red-900)',
          950: 'var(--color-red-950)',
        },
        orange: {
          50: 'var(--color-orange-50)',
          100: 'var(--color-orange-100)',
          150: 'var(--color-orange-150)',
          200: 'var(--color-orange-200)',
          300: 'var(--color-orange-300)',
          400: 'var(--color-orange-400)',
          500: 'var(--color-orange-500)',
          600: 'var(--color-orange-600)',
          700: 'var(--color-orange-700)',
          800: 'var(--color-orange-800)',
          850: 'var(--color-orange-850)',
          900: 'var(--color-orange-900)',
          950: 'var(--color-orange-950)',
        },
        yellow: {
          50: 'var(--color-yellow-50)',
          100: 'var(--color-yellow-100)',
          150: 'var(--color-yellow-150)',
          200: 'var(--color-yellow-200)',
          300: 'var(--color-yellow-300)',
          400: 'var(--color-yellow-400)',
          500: 'var(--color-yellow-500)',
          600: 'var(--color-yellow-600)',
          700: 'var(--color-yellow-700)',
          800: 'var(--color-yellow-800)',
          850: 'var(--color-yellow-850)',
          900: 'var(--color-yellow-900)',
          950: 'var(--color-yellow-950)',
        },
        green: {
          50: 'var(--color-green-50)',
          100: 'var(--color-green-100)',
          150: 'var(--color-green-150)',
          200: 'var(--color-green-200)',
          300: 'var(--color-green-300)',
          400: 'var(--color-green-400)',
          500: 'var(--color-green-500)',
          600: 'var(--color-green-600)',
          700: 'var(--color-green-700)',
          800: 'var(--color-green-800)',
          850: 'var(--color-green-850)',
          900: 'var(--color-green-900)',
          950: 'var(--color-green-950)',
        },
        cyan: {
          50: 'var(--color-cyan-50)',
          100: 'var(--color-cyan-100)',
          150: 'var(--color-cyan-150)',
          200: 'var(--color-cyan-200)',
          300: 'var(--color-cyan-300)',
          400: 'var(--color-cyan-400)',
          500: 'var(--color-cyan-500)',
          600: 'var(--color-cyan-600)',
          700: 'var(--color-cyan-700)',
          800: 'var(--color-cyan-800)',
          850: 'var(--color-cyan-850)',
          900: 'var(--color-cyan-900)',
          950: 'var(--color-cyan-950)',
        },
        blue: {
          50: 'var(--color-blue-50)',
          100: 'var(--color-blue-100)',
          150: 'var(--color-blue-150)',
          200: 'var(--color-blue-200)',
          300: 'var(--color-blue-300)',
          400: 'var(--color-blue-400)',
          500: 'var(--color-blue-500)',
          600: 'var(--color-blue-600)',
          700: 'var(--color-blue-700)',
          800: 'var(--color-blue-800)',
          850: 'var(--color-blue-850)',
          900: 'var(--color-blue-900)',
          950: 'var(--color-blue-950)',
        },
        purple: {
          50: 'var(--color-purple-50)',
          100: 'var(--color-purple-100)',
          150: 'var(--color-purple-150)',
          200: 'var(--color-purple-200)',
          300: 'var(--color-purple-300)',
          400: 'var(--color-purple-400)',
          500: 'var(--color-purple-500)',
          600: 'var(--color-purple-600)',
          700: 'var(--color-purple-700)',
          800: 'var(--color-purple-800)',
          850: 'var(--color-purple-850)',
          900: 'var(--color-purple-900)',
          950: 'var(--color-purple-950)',
        },
        magenta: {
          50: 'var(--color-magenta-50)',
          100: 'var(--color-magenta-100)',
          150: 'var(--color-magenta-150)',
          200: 'var(--color-magenta-200)',
          300: 'var(--color-magenta-300)',
          400: 'var(--color-magenta-400)',
          500: 'var(--color-magenta-500)',
          600: 'var(--color-magenta-600)',
          700: 'var(--color-magenta-700)',
          800: 'var(--color-magenta-800)',
          850: 'var(--color-magenta-850)',
          900: 'var(--color-magenta-900)',
          950: 'var(--color-magenta-950)',
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [
    require('@tailwindcss/typography'),
  ],
}; 