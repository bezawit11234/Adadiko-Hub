import preset, { content } from 'frappe-ui/tailwind'

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [...content, './index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        stone: {
          bg: '#F4F1EC',
          border: '#E7E2D9',
          surface: '#FFFFFF',
          muted: '#EFECE5',
          subtle: '#FAF8F5',
        },
        ink: {
          DEFAULT: '#14283D',
          navy: '#14283D',
          deep: '#0D1C2C',
          muted: '#4C6175',
          light: '#7A8D9F',
        },
        signal: {
          orange: '#F08A3C',
          DEFAULT: '#F08A3C',
          hover: '#DE782B',
          subtle: '#FDF2E9',
        },
        status: {
          green: '#1E8E5A',
          'green-bg': '#EBF7F0',
          red: '#D9383A',
          'red-bg': '#FDF1F1',
          amber: '#DE872A',
          'amber-bg': '#FEF7ED',
          blue: '#2C7BE5',
          'blue-bg': '#EFF6FF',
        },
      },
      fontFamily: {
        heading: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20, 40, 61, 0.04), 0 4px 12px rgba(20, 40, 61, 0.05)',
        card: '0 1px 3px rgba(20, 40, 61, 0.05), 0 10px 24px -4px rgba(20, 40, 61, 0.06)',
        lift: '0 8px 24px rgba(20, 40, 61, 0.08)',
        modal: '0 20px 40px -10px rgba(20, 40, 61, 0.16)',
      },
    },
  },
}
