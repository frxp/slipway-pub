export type Theme = 'system' | 'light' | 'dark'

export const themes: Theme[] = ['system', 'light', 'dark']

export function getTheme(): Theme {
  try {
    const saved = localStorage.getItem('theme')
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(theme: Theme) {
  if (theme === 'system') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = theme
  try {
    if (theme === 'system') localStorage.removeItem('theme')
    else localStorage.setItem('theme', theme)
  } catch {
    // Storage can be blocked; the choice then lasts for this page view only.
  }
}
