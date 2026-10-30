import preset, { content } from 'frappe-ui/tailwind'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  presets: [preset],
  content: [...content, './index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        stone: {
          bg: 'var(--color-stone-bg)',
          border: 'var(--color-stone-border)',
          surface: 'var(--color-stone-surface)',
          muted: 'var(--color-stone-muted)',
          subtle: 'var(--color-stone-subtle)',
        },
        ink: {
          DEFAULT: 'var(--color-ink)',
          navy: 'var(--color-ink-navy)',
          deep: 'var(--color-ink-deep)',
          muted: 'var(--color-ink-muted)',
          light: 'var(--color-ink-light)',
        },
        signal: {
          orange: 'var(--color-signal-orange)',
          DEFAULT: 'var(--color-signal-orange)',
          hover: 'var(--color-signal-hover)',
          subtle: 'var(--color-signal-subtle)',
        },
        status: {
          green: 'var(--color-status-green)',
          'green-bg': 'var(--color-status-green-bg)',
          red: 'var(--color-status-red)',
          'red-bg': 'var(--color-status-red-bg)',
          amber: 'var(--color-status-amber)',
          'amber-bg': 'var(--color-status-amber-bg)',
          blue: 'var(--color-status-blue)',
          'blue-bg': 'var(--color-status-blue-bg)',
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
        soft: '0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.05)',
        card: '0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 24px -4px rgba(0, 0, 0, 0.06)',
        lift: '0 8px 24px rgba(0, 0, 0, 0.08)',
        modal: '0 20px 40px -10px rgba(0, 0, 0, 0.25)',
      },
    },
  },
}
