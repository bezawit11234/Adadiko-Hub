import { ref, computed } from 'vue'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'adadiko_theme'

// Shared state across all component instances
const currentTheme = ref<Theme>('light')
let initialized = false

function applyTheme(theme: Theme) {
  currentTheme.value = theme
  if (typeof window === 'undefined') return

  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
  }

  // Update theme-color meta tag if present
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', theme === 'dark' ? '#0B131E' : '#F4F1EC')
}

export function useTheme() {
  if (!initialized && typeof window !== 'undefined') {
    initialized = true
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    if (saved === 'dark' || saved === 'light') {
      applyTheme(saved)
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      applyTheme(prefersDark ? 'dark' : 'light')
    }

    // Listen for system theme changes if user hasn't explicitly set a preference
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
          applyTheme(e.matches ? 'dark' : 'light')
        }
      })
    }
  }

  const isDark = computed(() => currentTheme.value === 'dark')

  function setTheme(theme: Theme) {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    applyTheme(theme)
  }

  function toggleTheme() {
    setTheme(currentTheme.value === 'dark' ? 'light' : 'dark')
  }

  return {
    theme: currentTheme,
    isDark,
    setTheme,
    toggleTheme,
  }
}
