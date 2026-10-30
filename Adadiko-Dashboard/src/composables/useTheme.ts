import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'adadiko_theme'
const currentTheme = ref<Theme>('light')

function applyTheme(theme: Theme) {
  currentTheme.value = theme
  if (typeof window !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }
}

export function useTheme() {
  const initTheme = () => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    if (stored === 'dark' || stored === 'light') {
      applyTheme(stored)
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      applyTheme(prefersDark ? 'dark' : 'light')
    }
  }

  const setTheme = (theme: Theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    }
    applyTheme(theme)
  }

  const toggleTheme = () => {
    setTheme(currentTheme.value === 'dark' ? 'light' : 'dark')
  }

  return {
    currentTheme,
    initTheme,
    setTheme,
    toggleTheme,
  }
}
