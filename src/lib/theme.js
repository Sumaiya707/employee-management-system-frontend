// Light / dark / system theme. The choice is a display preference only and is
// kept in localStorage; nothing about the login session is stored there.
// index.html applies the same logic before React starts, to avoid a flash.

export const THEME_STORAGE_KEY = 'peopledesk-theme'
export const THEME_CHOICES = ['light', 'dark', 'system']

export function readThemeChoice() {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (THEME_CHOICES.includes(saved)) {
      return saved
    }
  } catch {
    // Storage can be blocked (private mode); fall back to the system setting.
  }
  return 'system'
}

export function saveThemeChoice(choice) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, choice)
  } catch {
    // Not saved; the choice still applies until the page is reloaded.
  }
}

export function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

// Returns "light" or "dark" for a choice.
export function resolveTheme(choice) {
  if (choice === 'system') {
    return systemPrefersDark() ? 'dark' : 'light'
  }
  return choice
}

export function applyTheme(resolved) {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
}
